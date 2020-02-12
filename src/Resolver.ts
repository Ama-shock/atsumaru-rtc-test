export default class Resolver<T>{
    readonly resolve!: (result: T)=>void;
    readonly reject!: (exception: Error)=>void;
    readonly promise = new Promise<T>((res, rej)=>{
        (this as any).resolve = res;
        (this as any).reject = rej;
    });

    constructor(timeout?: number){
        if(timeout) setTimeout(()=>this.reject(new Error('Timeout Resolver.')), timeout);
    }
}