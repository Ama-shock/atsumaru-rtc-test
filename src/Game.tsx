import React, {Component, CSSProperties} from 'react';
import Victor from 'victor';
import Field from './Field';
import { Circle, Collision } from './Objects';

export default class Game extends Component<{}>{
    fieldSize = {width: 240, height: 480};
    point = new Victor(0, 0);
    state = {
        self: new Circle(60),
        dist: new Circle(60),
        pack: new Circle(30)
    };
    packSpeed: Victor = new Victor(0, 0);

    constructor(props: {}){
        super(props);
        this.frame();
    }

    private async frame(){
        const r = this.state.self.diameter / 2;
        const minX = r;
        const maxX = this.fieldSize.width - r;
        const minY = r;// + this.fieldSize.height / 2;
        const maxY = this.fieldSize.height - r;
        
        this.state.self.x = this.fieldSize.width / 2;
        this.state.self.y = maxY;
        this.state.dist.x = this.fieldSize.width / 2;
        this.state.dist.y = r;
        this.state.pack.x = this.fieldSize.width / 2;
        this.state.pack.y = this.fieldSize.height / 2;
        while(await new Promise(r=>requestAnimationFrame(r))){
            const t = Date.now();
            const v = this.point.clone();
            if(v.x < minX) v.x = minX;
            if(v.x > maxX) v.x = maxX;
            if(v.y < minY) v.y = minY;
            if(v.y > maxY) v.y = maxY;
            this.state.self.setNextPos(v, t);

            const collision = Collision.circleToCircle(this.state.pack, this.state.self);
            if(collision){
                console.log(collision);
                this.state.pack.move(collision.time);

                const r = (this.state.pack.diameter + this.state.self.diameter) / 2;
                const distanceSq = this.state.pack.distanceSq(this.state.self);
                const overlay = r * r - distanceSq;
                if(overlay > 0){
                    this.state.pack.subtract(collision.clone().multiplyScalar(Math.sqrt(overlay)));
                }
                
                const boundForce = collision.clone().multiplyScalar(collision.dot(this.state.pack.speed) * -1.2);
                const additionalForce = collision.clone().multiplyScalar(collision.dot(this.state.self.speed) * 0.8);
                this.state.pack.speed.add(boundForce).add(additionalForce);
            }

            this.state.self.move(t);
            this.state.pack.move(t);
            this.state.pack.speed.multiplyScalar(0.99);

            this.state.pack.x += this.fieldSize.width;
            this.state.pack.y += this.fieldSize.height;
            this.state.pack.x %= this.fieldSize.width;
            this.state.pack.y %= this.fieldSize.height;
            this.setState({});
        }
    }

    readonly styles: CSSProperties = {
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
    };

    render(){
        return (
            <div style={this.styles}>
                <Field
                    size={this.fieldSize}
                    point={this.point}
                    circles={this.state}
                    />
            </div>
        );
    }


}