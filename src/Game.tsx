import React, {Component, CSSProperties} from 'react';
import Victor from 'victor';
import Field from './Field';
import { Area, Circle, Pack } from './Objects';
import LocalProxy from './LocalProxy';
import DataChannel from './WebRTC';
(async()=>{
    try{
        const proxy = new LocalProxy<string>();
        Object.defineProperty(self, 'proxy', {value: proxy});
        const channel = await proxy.matching();
        Object.defineProperty(self, 'channel', {value: channel});
        console.log('matched');
    }catch(err){
        console.error(err);
    }
})();

const StrikerDiameter = 120;

export default class Game extends Component<{}>{
    fieldArea: Area = {
        min: {x: 0, y: 0},
        max: {x: 480, y: 960}
    };
    point = new Victor(0, 0);
    state = {
        self: new Circle(StrikerDiameter),
        dist: new Circle(StrikerDiameter),
        pack: new Pack(this.fieldArea)
    };
    packSpeed: Victor = new Victor(0, 0);

    constructor(props: {}){
        super(props);

        const r = this.state.self.diameter / 2;
        this.state.self.x = this.fieldArea.max.x / 2;
        this.state.self.y = this.fieldArea.max.y - r;
        this.state.dist.x = this.fieldArea.max.x / 2;
        this.state.dist.y = r;
        this.state.pack.x = this.fieldArea.max.x / 2;
        this.state.pack.y = this.fieldArea.max.y / 2;

        this.frame();
    }

    private async setNextPos(time: number){
        const v = new Circle(this.state.self.diameter);
        v.x = this.point.x;
        v.y = this.point.y;
        v.intoField({
            min: {
                x: 0,
                y: this.fieldArea.max.y / 2
            },
            max: {
                x: this.fieldArea.max.x,
                y: this.fieldArea.max.y
            }
        });
        this.state.self.setNextPos(v, time);
    }

    private async frame(){
        while(await new Promise(r=>requestAnimationFrame(r))){
            const t = Date.now();
            this.setNextPos(t);

            this.state.pack.moveWith(t, this.state.self);

            this.state.self.move(t);

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
        const size = {
            width: this.fieldArea.max.x - this.fieldArea.min.x,
            height: this.fieldArea.max.y - this.fieldArea.min.y
        };

        return (
            <div style={this.styles}>
                <Field
                    size={size}
                    point={this.point}
                    circles={this.state}
                    />
            </div>
        );
    }
}