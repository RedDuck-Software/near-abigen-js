import { NearBindgen, near, call, view, Vector, NearPromise, assert } from 'near-sdk-js';

export type SomeType = {
    someType: string,
    someTypeNested: {
        type: string,
        typ1:number
    }
}

@NearBindgen({})
export class TestContract {
    @call({privateFunction:false, payableFunction: true})
    test_call_method({ account_id  }: { account_id : { some_nest: string[] } }) : SomeType {
        return {
            someType: '',
            someTypeNested:{
                typ1: 123,
                type: ''
            }
        }
    }


    @view({})
    test_view_method({ account_id  }: { account_id: string[] }): string {
        return 'some view result'
    }
}