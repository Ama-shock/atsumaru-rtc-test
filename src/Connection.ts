import rpg from 'rpgatsumaru-wrapper';
import DataChannel from './WebRTC';

type SnapShot = {
    id: number;
    timestamp: number;
    pack?: { x: number, y: number, dx: number, dy: number };
    striker: { x: number, y: number };
};

interface SyncSchema{
    data: SnapShot[];
    latest: number;
    omission: number[];
}

class Connection {
    readonly ready = this.init();
    async init(){
        await rpg.signal.syncClock();
        
    }

    readonly localStack: SyncSchema = {
        data: [],
        latest: 0,
        omission: []
    };
    readonly remoteStack: SyncSchema = {
        data: [],
        latest: 0,
        omission: []
    };

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