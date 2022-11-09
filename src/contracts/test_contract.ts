import { NearBindgen, near, call, view, Vector, NearPromise, assert } from 'near-sdk-js';


export type SomeInnerType = {
    val1: string,
    val2: number,
}

export type SomeType = {
    someVal?: string[],
    someValNested: SomeInnerType[]
}

@NearBindgen({})
export class TestContract {
    @call({ privateFunction: false, payableFunction: true })
    test_call_method({ }: SomeInnerType) {
        return {
            someVal: '',
            someValNested: {
                val2: 123,
                val1: ''
            }
        }
    }

    @view({})
    test_view_method({  }: SomeType): string {
        return 'some view result'
    }
}