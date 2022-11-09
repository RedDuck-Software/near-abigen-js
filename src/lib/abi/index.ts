export type PrimitiveType = 'string' | 'number' | 'boolean' | 'void';

export type NearFunctionType = {
    name: string,
    isArray?: boolean,
    isOptional?: boolean,
    type: PrimitiveType | NearFunctionArg,
}

export type NearFunctionArg = {
    [name: string]: NearFunctionType;
}

type NearFunctionBase = {
  name: string;
  args: NearFunctionArg;
};

export type NearFunctionView = {
  returnType?: {
    type: NearFunctionArg;
    isArray: boolean
  } 
} & NearFunctionBase;

export type NearFunctionCall = {
  isPayable: boolean;
} & NearFunctionBase;

export type NearContractAbi = {
  contractName: string;
  methods: {
    view: Array<NearFunctionView>;
    call: Array<NearFunctionCall>;
  };
  byteCode: string;
};

export const parseAbi = (abiJson: string) => {
  return JSON.parse(abiJson) as NearContractAbi;
};
