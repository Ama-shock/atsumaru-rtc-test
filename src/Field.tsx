import React, {Component, CSSProperties, MouseEvent, TouchEvent} from 'react';
import Victor from 'victor';
import { Circle } from './Objects';

export type CirclesProps = {
    self : Circle;
    dist : Circle;
    pack : Circle;
};

export type FieldProps = {
    size : {width: number, height: number};
    point : Victor;
    circles: CirclesProps;
}

export default class Field extends Component<FieldProps>{

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
            position: 'relative',
            width: this.props.size.width + 'px',
            height: this.props.size.height + 'px'
        };

        return (
            <div style={divStyle} onMouseMove={this.movePoint} onTouchMove={this.movePoint}>
                {this.renderCircle(this.props.circles.self, 'aquamarine')}
                {this.renderCircle(this.props.circles.dist, 'rosybrown')}
                {this.renderCircle(this.props.circles.pack, 'yellow')}
            </div>
        );
    }

    private renderCircle(obj : Circle, color: string){
        return (
            <span style={{
                position: "absolute",
                overflow: 'hidden',
                pointerEvents: 'none',
                transform: 'translate(-50%, -50%)',
                borderRadius: '50%',
                backgroundColor: color,
                left: Math.round(obj.x) + 'px',
                top: Math.round(obj.y) + 'px',
                width: obj.diameter + 'px',
                height: obj.diameter + 'px', 
            }}></span>
        );
    }
}