import { NearContractAbi, NearFunctionArg, NearFunctionCall, NearFunctionType, NearFunctionView, PrimitiveType } from "lib/abi";
import { writeFile } from "../utils";
import path from "path";
import {ClassDeclaration, MethodDeclarationStructure, OptionalKind, Project, SourceFile, ts, Type} from "ts-morph"

const stringTypeToObject = <TReturn extends object = object>(strObj: string) => {
    return new Function('return ' + strObj + ';')() as TReturn;
}

type CallDecoratorArgs = {
    privateFunction?: boolean;
    payableFunction?: boolean;
}

const parseNearFunctionCall = (file: SourceFile, methods: OptionalKind<MethodDeclarationStructure>[] | undefined, classDeclaration: ClassDeclaration): NearFunctionCall[] => {
    return methods?.map(method => {
        const fnName = method.name;
        const fnArgs = classDeclaration.getMethodOrThrow(method.name).getParameters()?.map(p => toObjectType(p.getType(), file));

        console.log('fnArgs: ', JSON.stringify(fnArgs))
        const decorator = method.decorators?.find(d => d.name === 'call')

        if (!decorator?.arguments)
            throw 'Missing call decorator';

        const decoratorObject = stringTypeToObject<CallDecoratorArgs>((decorator.arguments as string[])[0].toString() ?? '');

        console.log(decoratorObject)

        return {
            name: fnName,
            isPayable: Boolean(decoratorObject.payableFunction),
            args: fnArgs?.reduce((prev, curr) => ({ ...prev, ...curr })) ?? {}
        }
    }) ?? []
}


const parseNearFunctionView = (file: SourceFile, methods: OptionalKind<MethodDeclarationStructure>[] | undefined, classDeclaration: ClassDeclaration): NearFunctionView[] => {
    return methods?.map(method => {
        const fnName = method.name;
        const methodsD = classDeclaration.getMethodOrThrow(method.name);
        const fnArgs = methodsD.getParameters()?.map(p => toObjectType(p.getType(), file));
        const returnType = methodsD?.getReturnType();

        return {
            name: fnName,
            args: fnArgs?.reduce((prev, curr) => ({ ...prev, ...curr })) ?? {},
            returnType: toObjectType(returnType),
        }
    }) ?? []
}

export const parseTsFile = async ({ tsFilePath, abisOutputPath }: { tsFilePath: string, abisOutputPath: string }) => {
    const project = new Project({});

    project.addSourceFilesAtPaths(tsFilePath);

    const file = project.getSourceFileOrThrow(tsFilePath)

    const classDeclarations = file.getClasses();

    const contractsAbis: NearContractAbi[] = []

    for (const classDeclaration of classDeclarations) {
        const classStructure = classDeclaration.getStructure();

        const hasNearBindgen = classStructure?.decorators?.some(({ name }) => name === "NearBindgen");
        if (!hasNearBindgen) return;

        const { name, methods } = classStructure;

        const viewMethods = methods?.filter(m => m.decorators?.find(d => d.name === 'view'));
        const callMethods = methods?.filter(m => m.decorators?.find(d => d.name === 'call'));

        const callMethodsParsed = parseNearFunctionCall(file, callMethods, classDeclaration);
        const viewMethodsParsed = parseNearFunctionView(file, viewMethods, classDeclaration);

        console.log(JSON.stringify({ callMethodsParsed, viewMethodsParsed }));

        const abi = {
            contractName: name,
            methods: {
                call: callMethodsParsed,
                view: viewMethodsParsed
            }
        } as NearContractAbi

        if (contractsAbis.find(abi => abi.contractName === abi.contractName))
            throw `Duplicated contract name: ${abi.contractName}`;

        contractsAbis.push(abi);
    }

    contractsAbis.forEach(abi => {
        const abiPath = path.join(abisOutputPath, `${abi.contractName}.abi.json`);
        writeFile(abiPath, JSON.stringify(abi, undefined, 4));
    })
}

const toObjectType = (_type: string | Type<ts.Type>, file?: SourceFile): NearFunctionArg | NearFunctionType => {
    let type: Type<ts.Type>;

    if (typeof _type === 'string') {
        if (!file) throw 'file is not passed';
        type = file?.getTypeAliasOrThrow(_type as string).getType();
    } else {
        type = _type
    }

    const isArray = type.isArray();

    if (!type.isObject() || (isArray && !type.getArrayElementTypeOrThrow().isObject())) {
        return {
            isArray,
            isOptional: false,
            type: (isArray ? type.getArrayElementTypeOrThrow().getText() : type.getText()) as PrimitiveType,
        }
    }

    const properties = type.getProperties();

    return properties.reduce((prev, curr) => {
        let type: Type<ts.Type> = curr.getValueDeclarationOrThrow().getType();

        const isArray = type.isArray();
        const isOptional = curr.isOptional();

        if (isArray) {
            type = type.getArrayElementTypeOrThrow();
        }


        let returnType: NearFunctionArg | PrimitiveType | NearFunctionType;

        if (type.isObject()) {
            returnType = toObjectType(type, file)
        }
        else {
            returnType = type.getText() as PrimitiveType;
        }

        return {
            ...prev,
            [curr.getName()]: {
                isArray,
                isOptional,
                type: returnType
            }
        };
    }, {})
}