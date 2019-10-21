import React, {Component, CSSProperties, MouseEvent, TouchEvent} from 'react';
import Victor from 'victor';

import { Circle } from './Objects';

export type Positions = {
    point : Victor;
    self : Victor;
    dist : Victor;
    pack : Victor;
};

export type FieldStatus = {
    size : [number, number];
    position : [number, number];
};

export default class Field extends Component<Positions & FieldStatus>{

    readonly movePoint = (ev: MouseEvent|TouchEvent)=>{
        const element = ev.target as HTMLDivElement;
        const rect = element.getBoundingClientRect();
        const point = 'touches' in ev ? ev.touches[0] : ev;
        this.props.point.x = point.clientX - rect.left;
        this.props.point.y = point.clientY - rect.top;
    }

    render(){
        const divStyle: CSSProperties = {
            backgroundColor: 'blue',
            position: 'absolute',
            width: this.props.size[0] + 'px',
            height: this.props.size[1] + 'px',
            left: this.props.position[0] + 'px',
            top: this.props.position[1] + 'px'
        };

        return (
            <div style={divStyle} onMouseMove={this.movePoint} onTouchMove={this.movePoint}>
                <Circle color='aquamarine' diameter={60} position={this.props.self} />
                <Circle color='rosybrown' diameter={60} position={this.props.dist} />
                <Circle color='yellow' diameter={30} position={this.props.pack} />
            </div>
        );
    }
}