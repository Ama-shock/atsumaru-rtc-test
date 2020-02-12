import Victor from 'victor';
import { Collision } from './Collision';

type Position = {
    x: number,
    y: number
};

export type Area = {
    min: Position,
    max: Position
};

export class Circle extends Victor{
    speed: Victor = new Victor(0, 0);
    time: number = Date.now();
    constructor(readonly diameter: number){
        super(0, 0);
    }

    clone(){
        const circle = new Circle(this.diameter);
        circle.x = this.x;
        circle.y = this.y;
        circle.time = this.time;
        circle.speed = this.speed.clone();
        return circle;
    }
    
    move(time: number = Date.now()){
        this.add(this.movedAt(time));
        this.time = time;
        return this;
    }
    
    movedAt(time: number){
        return this.speed.clone().multiplyScalar((time - this.time) / 1000);
    }

    setNextPos(pos: Victor, time: number = Date.now()){
        const diff = (time - this.time) || 1;
        this.speed = pos.clone().subtract(this).divideScalar(diff / 1000);
    }

    intoField(area: Area){
        const r = this.diameter / 2;
        if(this.x < area.min.x + r) this.x = area.min.x + r;
        if(this.y < area.min.y + r) this.y = area.min.y + r;
        if(this.x > area.max.x - r) this.x = area.max.x - r;
        if(this.y > area.max.y - r) this.y = area.max.y - r;
    }
}


const PackDiameter = 60;
export class Pack extends Circle{

    constructor(readonly movableArea: Area){
        super(PackDiameter);
    }

    clone(){
        const pack = new Pack(this.movableArea);
        pack.x = this.x;
        pack.y = this.y;
        pack.time = this.time;
        pack.speed = this.speed.clone();
        return pack;
    }

    moveWith(t: number, striker: Circle){
        while(this.time < t){
            const collisionSelf = Collision.circleToCircle(this, striker, t);
            const collisionWall = Collision.circleToWall(this, this.movableArea, t);
            const collisionSelfAt = collisionSelf ? collisionSelf.time : Infinity;
            const collisionWallAt = collisionWall ? collisionWall.time : Infinity;
            const collision = collisionSelfAt < collisionWallAt ? collisionSelf : collisionWall;
            if(!collision) break;
            this.move(Math.max(collision.time, this.time + 1));
            
            const boundForce = collision.clone().multiplyScalar(collision.dot(this.speed) * -1.5);
            this.speed.add(boundForce);

            if(collisionSelfAt < collisionWallAt){
                const additionalForce = collision.clone().multiplyScalar(collision.dot(striker.speed));
                this.speed.add(additionalForce);
            }

            this.intoField(this.movableArea);

            const overlay = Collision.getOverlay(this, striker);
            if(overlay) this.add(overlay);

            // console.log(collisionSelfAt < collisionWallAt ? 'strike' : 'wall', collision, this, striker);
        }
        this.move(t);

        this.intoField(this.movableArea);
    }
    
    intoField(area: Area){
        const r = this.diameter / 2;
        if(this.x < area.min.x + r) this.x = area.min.x + r;
        if(this.x > area.max.x - r) this.x = area.max.x - r;
        
        // only in develop
        if(this.y < this.movableArea.min.y && this.speed.y < 0) this.speed.y *= -1;
        if(this.y > this.movableArea.max.y && this.speed.y > 0) this.speed.y *= -1;
    }
}
