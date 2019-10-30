import Victor from 'victor';

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
    
}

export class Collision extends Victor{
    private constructor(readonly time: number, direction: Victor){
        super(direction.x, direction.y);
    }

    static circleToCircle(a: Circle, b: Circle, time: number = Date.now()){
        const vA = a.clone();
        const vB = b.clone();
        const startTime = a.time > b.time ? a.time : b.time;
        if(vA.time < startTime) vA.move(startTime);
        if(vB.time < startTime) vB.move(startTime);

        const r = (vA.diameter + vB.diameter) / 2;
        const vC = new Victor(vB.x, vB.y).subtract(vA);
        if(vC.lengthSq() < r * r) return new Collision(startTime, vC.normalize());
        const vD = vB.movedAt(time).subtract(vA.movedAt(time));
        const sP = vD.lengthSq();
        const sQ = vC.dot(vD);
        const sR = vC.lengthSq();

        const inRoot = sQ * sQ - sP * (sR - r * r);
        if(!inRoot || inRoot < 0) return null;
        const t = (Math.sqrt(inRoot) - sQ) / sP;
        if(t < 0 || 1 < t) return null;
        const collosionTime = startTime + (time - startTime) * t;
        
        const direction = vB.move(collosionTime).subtract(vA.move(collosionTime)).normalize();
        return new Collision(collosionTime, direction);
    }
}
