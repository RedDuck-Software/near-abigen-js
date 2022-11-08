export type PrimitiveType = 'string' | 'number' | 'boolean' | 'void';

export type ComplexType = {
  [key: string]: PrimitiveType | ComplexType;
};

export const isPrimitive = (type: PrimitiveType | ComplexType) => {
  if (typeof 0 === type || typeof '' === type || typeof false === type || type === 'void') return true;
  return false;
};

export type NearFunctionArg = {
    name: string;
    isArray: boolean,
    type: PrimitiveType | ComplexType;
}
type NearFunctionBase = {
  name: string;
  args: Array<NearFunctionArg>;
};

export type NearFunctionView = {
  returnType?: {
    type: PrimitiveType | ComplexType;
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
