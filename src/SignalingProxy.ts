import DataChannel from './WebRTC';

export type Signal = {
    uid: string;
    description: RTCSessionDescriptionInit|null;
    timestamp: number;
};

export default abstract class SignalingProxy<Msg>{
    readonly timeoutSec = 120;
    abstract get now(): number;
    abstract requestOffer(sdp: RTCSessionDescriptionInit|null): Promise<void>;
    abstract pickAnswer(): Promise<Signal|null>;

    abstract gatherOffered(): Promise<Signal[]>;
    abstract requestAnswer(uid: string, sdp: RTCSessionDescriptionInit): Promise<void>;

    async matching(){
        return new Promise<DataChannel<Msg>>(async (resolve, reject)=>{
            let resolved = false;
            const offerer = new Offerer(this);
            const answerer = new Answerer(this, (ch: DataChannel<Msg>)=>{
                offerer.close();
                resolved = true;
                resolve(ch);
            });
            try{
                while(true){
                    await answerer.postAnswer();
                    if(resolved) return;
                    const ch = await offerer.postOffer();
                    if(ch){
                        answerer.close();
                        resolved = true;
                        resolve(ch);
                    }
                    if(resolved) return;
                    await new Promise(r=>requestAnimationFrame(r));
                }
            }catch(err){
                reject(err);
            }
        });
    }
}


class Offerer<Msg>{
    private readonly timeoutMs: number;
    constructor(readonly signalingProxy: SignalingProxy<Msg>){
        this.timeoutMs = this.signalingProxy.timeoutSec * 1000;
    }

    close(){
        if(this.channel){
            this.channel.ready.catch(err=>console.log('Abort Offerer.', err));
            this.channel.close();
            delete this.channel;
        }
        return this.signalingProxy.requestOffer(null);
    }
    
    private channel?: DataChannel<Msg>;
    private offerAt: number = 0;

    async postOffer(): Promise<DataChannel<Msg>|null>{
        if(this.offerAt && this.signalingProxy.now - this.offerAt > this.timeoutMs){
            await this.close();
        }
        if(!this.channel){
            this.channel = new DataChannel<Msg>();
            const offer = await this.channel.createOffer();
            await this.signalingProxy.requestOffer(offer);
            this.offerAt = this.signalingProxy.now;
        }

        const answer = await this.signalingProxy.pickAnswer();
        if(!answer) return null;
        if(!answer.description) return null;
        await this.channel.setAnswer(answer.description);
        try{
            await new Promise(async (res, rej)=>{
                setTimeout(rej, 30 * 1000);
                await this.channel?.ready;
                await this.signalingProxy.requestOffer(null);
                res();
            });
        }catch(err){
            await this.close();
            return null;
        }
        
        return this.channel;
    }

}

class Answerer<Msg>{
    private readonly timeoutMs: number;
    constructor(readonly signalingProxy: SignalingProxy<Msg>, readonly onconnect: (ch:DataChannel<Msg>)=>void){
        this.timeoutMs = this.signalingProxy.timeoutSec * 1000;
    }

    private offer?: Signal;
    private channel?: DataChannel<Msg>;
    close(){
        try{
            this.channel?.close();
        }catch(err){
            console.log('Abort Answerer.', err);
        }
        delete this.channel;
        delete this.offer;
    }
    async postAnswer(): Promise<void>{
        if(this.offer && this.offer.timestamp + this.timeoutMs < this.signalingProxy.now) this.close();
        else if(this.channel?.closed) this.close();
        const offers = await this.signalingProxy.gatherOffered();
        if(this.channel && this.offer?.description){
            const current = offers.find(o=>o.uid == this.offer?.uid);
            if(current?.description?.sdp != this.offer.description.sdp) this.close();
        }
        if(!offers.length) return;
        if(!this.channel){
            this.offer = offers.find(o=>o.description);
            if(!this.offer?.description) return;
            this.channel = new DataChannel<Msg>();
            this.channel.ready.then(this.listener);
            const answer = await this.channel.negotiate(this.offer.description);
            await this.signalingProxy.requestAnswer(this.offer.uid, answer);
        }
    }

    private readonly listener = (channel: DataChannel<Msg>)=>{
        if(this.channel != channel) return;
        if(channel.closed) return;
        this.onconnect(channel);
        delete this.channel;
        delete this.offer;
    };

}