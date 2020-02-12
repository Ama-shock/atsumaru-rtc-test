import Victor from 'victor';
import {Area, Circle} from './Objects';

export class Collision extends Victor{
    private constructor(readonly time: number, direction: Victor){
        super(direction.x, direction.y);
    }

    static circleToWall(circle: Circle, area: Area, time: number = Date.now()){
        const min = area.min.x + circle.diameter / 2;
        const max = area.max.x - circle.diameter / 2;
        if(circle.x < min) return new Collision(circle.time, new Victor(-1, 0));
        if(circle.x > max) return new Collision(circle.time, new Victor(1, 0));
        
        const moved = circle.movedAt(time).x + circle.x;
        if(moved == circle.x) return null;
        if(moved < min){
            const rate = (min - circle.x) / (moved - circle.x);
            const t = rate * (time - circle.time) + circle.time;
            return new Collision(t, new Victor(-1, 0));
        }
        if(moved > max){
            const rate = (max - circle.x) / (moved - circle.x);
            const t = rate * (time - circle.time) + circle.time;
            return new Collision(t, new Victor(1, 0));
        }
        return null;
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

    static getOverlay(a: Circle, b: Circle){
        const r = (a.diameter + b.diameter) / 2;
        const distance = a.distance(b);
        if(distance >= r) return null;
        const rate = (r - distance) / distance;
        const vec = new Victor(
            (a.x - b.x) * rate,
            (a.y - b.y) * rate,
        );
        return vec.add(vec.normalize().multiplyScalar(r / 5));
    }
}
