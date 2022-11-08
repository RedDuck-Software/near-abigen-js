import { NearContractAbi, NearFunctionArg, NearFunctionCall, NearFunctionView } from "lib/abi";
import { MethodDeclarationStructure, OptionalKind, Project, SourceFile, ts, Type, TypeAliasDeclaration } from "ts-morph"
// TODO: jsonrepair is temp solution. Should build


const parseNearFunctionCall = (file: SourceFile, methods: OptionalKind<MethodDeclarationStructure>[] | undefined): NearFunctionCall[] => {
    return methods?.map(method => {
        const fnName = method.name;
        const fnArgs = method.parameters?.map(p => toObjectType(file.getTypeAliasOrThrow('SomeType').getType()));

        return {
            name: fnName,
            isPayable: false, // TODO
            args: fnArgs?.map(arg => Object.entries(arg).reduce((prev, cur) => {
                return [
                    ...prev,
                    {
                        name: cur[0],
                        isArray: false, // todo
                        type: cur[1]
                    }]

            }, [] as NearFunctionArg[]))?.reduce((p, c) => ([...p, ...c]), []) ?? []
        }
    }) ?? []
}


const parseNearFunctionView = (file: SourceFile, methods: OptionalKind<MethodDeclarationStructure>[] | undefined): NearFunctionView[] => {
    return methods?.map(method => {
        const fnName = method.name;
        const fnArgs = method.parameters?.map(p => toObjectType(file.getTypeAliasOrThrow('SomeType').getType()));

        return {
            name: fnName,
            // returnType: {}, // TODO
            args: fnArgs?.map(arg => Object.entries(arg).reduce((prev, cur) => {
                return [
                    ...prev,
                    {
                        name: cur[0],
                        isArray: false, // todo
                        type: cur[1]
                    }]

            }, [] as NearFunctionArg[]))?.reduce((p, c) => ([...p, ...c]), []) ?? []
        }
    }) ?? []
}

export const parseTsFile = async (tsFilePath: string) => {
    const project = new Project({});

    project.addSourceFilesAtPaths(tsFilePath);

    const file = project.getSourceFileOrThrow(tsFilePath)

    const classDeclarations = file.getClasses();

    const contractsAbis: NearContractAbi[] = []

    for (const classDeclaration of classDeclarations) {
        const classStructure = classDeclaration.getStructure();

        const hasNearBindgen = classStructure?.decorators?.some(({ name }) => name === "NearBindgen");
        if (!hasNearBindgen) return;

        const { properties, name, methods } = classStructure;

        // console.log(`Generating abis for class ${name}`, JSON.stringify(methods) );

        const viewMethods = methods?.filter(m => m.decorators?.find(d => d.name === 'view'));
        const callMethods = methods?.filter(m => m.decorators?.find(d => d.name === 'call'));

        const callMethodsParsed = parseNearFunctionCall(file, callMethods);
        const viewMethodsParsed = parseNearFunctionView(file, viewMethods);

        console.log(JSON.stringify({ callMethodsParsed, viewMethodsParsed }));


        const abi = {
            contractName: name,
            methods: {
                call: callMethodsParsed,
                view: viewMethodsParsed
            }
        } as NearContractAbi

        console.log('contract abi: ', JSON.stringify(abi));
    }
}

const toObjectType = (type: Type<ts.Type>): object => {
    const properties = type.getProperties();

    // if(!properties.length){
    //     console.log('length is 0')
    //     return type.getName()
    // }

    const t = properties.reduce((prev, curr) => {
        const type = curr.getValueDeclarationOrThrow()?.getType();
        // console.log('t', v.getName() ,t?.getType().isPr.getText());

        if (type.isObject()) {
            console.log('t is object', curr.getName())
            return {
                ...prev,
                [curr.getName()]: toObjectType(type)
            };
        }
        else
            return {
                ...prev,
                ...{ [curr.getName()]: type.getText() }
            };
    }, {})

    // console.log(t);
    return t;
}