class GatherIceError extends Error{
    readonly code: number;
    readonly phase: number;
    readonly host: string;
    readonly url: string;

    constructor(ev: RTCPeerConnectionIceErrorEvent){
        super(ev.errorText);
        this.name = this.constructor.name;
        this.code = ev.errorCode;
        this.phase = ev.eventPhase;
        this.host = ev.hostCandidate;
        this.url = ev.url;
    }
}

function gatherIceCandidate(peer: RTCPeerConnection){
    const trace = { stack: '' };
    Error.captureStackTrace(trace, gatherIceCandidate);
    return new Promise((res, rej)=>{
        const onGather = (ev: RTCPeerConnectionIceEvent)=>{
            if(peer.iceGatheringState != 'complete') return;
            peer.removeEventListener('icecandidate', onGather);
            peer.removeEventListener('icecandidateerror', onError);
            res();
        };
        const onError = (ev: RTCPeerConnectionIceErrorEvent)=>{
            peer.removeEventListener('icecandidate', onGather);
            peer.removeEventListener('icecandidateerror', onError);
            const err = new GatherIceError(ev);
            Error.captureStackTrace(err, gatherIceCandidate);
            rej(err);
        };
        peer.addEventListener('icecandidate', onGather);
        peer.addEventListener('icecandidateerror', onError);
    });
}

const defaultConfig = {
    iceServers: [
        {"urls": "stun:stun.l.google.com:19302"},
        {"urls": "stun:stun1.l.google.com:19302"},
        {"urls": "stun:stun2.l.google.com:19302"},
        {"urls": "stun:stun3.l.google.com:19302"},
        {"urls": "stun:stun4.l.google.com:19302"}
    ]
};

import Resolver from './Resolver';
export default class DataChannel<Msg>{
    onMassage?: (req: Msg)=>Promise<void>;
    onClose?: ()=>void;

    readonly peer: RTCPeerConnection;
    private resolver = new Resolver<this>();
    get ready(){return this.resolver.promise;}
    private _channel?: RTCDataChannel;
    get opened(): boolean{
        if(!this._channel) return false;
        return this._channel.readyState == 'open';
    }
    get closed(): boolean{
        if(!this._channel) return false;
        if(this._channel.readyState == 'closing') return true;
        if(this._channel.readyState == 'closed') return true;
        return false;
    }

    constructor(config?: RTCConfiguration){
        const c: RTCConfiguration = Object.assign({}, defaultConfig);
        if(config) Object.assign(c, config);
        this.peer = new RTCPeerConnection(c);
    }

    async createOffer(option?: RTCOfferOptions){
        if(this.peer.localDescription) throw new Error('Already offered.');
        this._channel = this.peer.createDataChannel(this.constructor.name);
        const offer = await this.peer.createOffer(option);
        await this.peer.setLocalDescription(offer);
        await gatherIceCandidate(this.peer);
        return this.peer.localDescription!;
    }

    async negotiate(offer: RTCSessionDescriptionInit, option?: RTCAnswerOptions){
        if(this.peer.localDescription) throw new Error('Already offered.');
        await this.peer.setRemoteDescription(offer);
        const answer = await this.peer.createAnswer(option);
        await this.peer.setLocalDescription(answer);
        await gatherIceCandidate(this.peer);
        this.peer.addEventListener('datachannel', this.channelCatcher);
        return this.peer.localDescription!;
    }

    async setAnswer(answer: RTCSessionDescriptionInit){
        if(this.peer.remoteDescription) throw new Error('Already negotiated.');
        if(!this._channel) throw new Error('Channel not Found.');
        await this.peer.setRemoteDescription(answer);
        this._channel.addEventListener('message', this.listenMessage);
        this._channel.addEventListener('close', this.listenClose);
        this._channel.addEventListener('open', ()=>this.resolver.resolve(this), {once: true});
    }

    async post(msg: Msg){
        if(!this.peer.remoteDescription) throw new Error('no negotiated.');
        await this.ready;
        this._channel!.send(JSON.stringify(msg));
    }

    private readonly channelCatcher = async (ev: RTCDataChannelEvent)=>{
        if(this.closed) return this.close();
        if(this._channel) return;
        this._channel = ev.channel;
        this._channel.addEventListener('message', this.listenMessage);
        this._channel.addEventListener('close', this.listenClose);
        this.resolver.resolve(this);
        console.log(`Get ready of WebRtc Data Channel.`, this._channel.label);
    }
    
    private readonly listenMessage = async (ev: MessageEvent)=>{
        if(!ev.data) return;
        if(ev.data == 'close') return this.close();
        
        const msg = JSON.parse(ev.data) as Msg;
        if(this.onMassage) await this.onMassage(msg);
    };

    private readonly listenClose = (ev: Event)=>this.close();
    private _closed = false;
    close(){
        if(this._closed) return;
        this._closed = true;
        this.resolver.reject(new Error('Close before Connection.'));
        console.log(`Closing WebRtc Data Channel.`, this);
        if(this._channel){
            if(this.opened) this._channel.send("close");
            this._channel.close();
            this._channel.removeEventListener('message', this.listenMessage);
            this._channel.removeEventListener('close', this.listenClose);
        }
        this.peer.close();
        this.peer.removeEventListener('datachannel', this.channelCatcher);
        if(this.onClose) this.onClose();
    }
}
