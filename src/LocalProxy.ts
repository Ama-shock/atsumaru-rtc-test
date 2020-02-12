import SignalingProxy, {Signal} from "./SignalingProxy";

export default class LocalProxy<Msg> extends SignalingProxy<Msg>{
    readonly uid = Math.floor(Math.random() * 100) +'_'+ this.now;

    get now(): number {
        return Date.now();
    }
    
    private load(key: string): Signal[]{
        return localStorage[key] ? JSON.parse(localStorage[key]) : [];
    }
    async save(key: string, description: RTCSessionDescriptionInit | null): Promise<void> {
        const stored = this.load(key);
        const updated = stored.filter(s=>{
            if(s.uid == this.uid) return false;
            return this.now < s.timestamp + this.timeoutSec * 1000;
        });
        updated.push({
            uid: this.uid,
            description: description,
            timestamp: this.now
        });
        localStorage[key] = JSON.stringify(updated);
    }

    private lastOffered = 0;
    async requestOffer(sdp: RTCSessionDescriptionInit | null): Promise<void> {
        this.lastOffered = sdp ? this.now : 0;
        return this.save('OfferList', sdp);
    }

    async pickAnswer(): Promise<Signal | null> {
        if(!this.lastOffered) return null;
        return this.load('AnswerList:'+ this.uid).find(signal=>{
            if(!signal.description) return false;
            return this.lastOffered < signal.timestamp;
        }) || null;
    }

    async gatherOffered(): Promise<Signal[]> {
        const threshold = this.now - this.timeoutSec * 1000;
        return this.load('OfferList').filter(s=>s.uid != this.uid && s.timestamp > threshold);
    }

    async requestAnswer(uid: string, sdp: RTCSessionDescriptionInit): Promise<void> {
        return this.save('AnswerList:'+ uid, sdp);
    }

}