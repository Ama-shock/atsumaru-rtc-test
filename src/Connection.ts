import rpg from 'rpgatsumaru-wrapper';
import {WebRTCServer, WebRTCClient, MessageController, MessageControllerConstructor} from 'typed-messaging';

type Position = {
    type: 'pack'|'self'
    position: [number, number],
    timestamp: number
};

interface SyncPositionSchema{
    sync: (pos: Position[])=>Position[];
}

class SyncPositionController implements MessageController<SyncPositionSchema>{
    constructor(private connect: Connection){}
    async sync(pos: Position[]) {
        this.connect.listener && this.connect.listener(pos);
        return this.connect.consume();
    }
}

type SharedSaves = {
    offer: RTCSessionDescription;
};

class Connection {
    readonly ready = this.init();
    async init(){
        await rpg.signal.syncClock();
        
    }

    private positionStack: Position[] = [];
    stack(pos: Position){
        this.positionStack.push(pos);
    }
    consume(){
        const stack = this.positionStack;
        this.positionStack = [];
        return stack;
    }
    listener?: (pos: Position[])=>void;

    server?: WebRTCServer<SyncPositionSchema, this>;
    startServer(){

        this.server = new WebRTCServer<SyncPositionSchema, this>(SyncPositionController, this);
    }

    private isStandby = false;
    async standby(){
        this.isStandby = true;
        while(this.isStandby){
            const startAt = rpg.signal.now;
            const json = JSON.stringify({
                state: 'standby',
                deadline: startAt + 15000
            });
            await rpg.signal.sendGlobal(json);
            await new Promise(r=>setTimeout(r, 5000));
            const receiveds = await rpg.signal.getPrivate();
            const ids = receiveds.filter(r=>r.createdAt > startAt).map(r=>r.senderId);
            const saves = await rpg.storage.getOthersShared<SharedSaves>(ids);
            Object.values(saves).map(async share=>{
                const answer = await this.server!.offer(share.offer);
                
            });

        }
    }
    async stop(){
        this.isStandby = false;
        const json = JSON.stringify({
            state: 'stop'
        });
        await rpg.signal.sendGlobal(json);
    }
}