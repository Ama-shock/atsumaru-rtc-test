import React, {Component, CSSProperties} from 'react';
import Victor from 'victor';

type BaseProperty = {
    color: string;
    position : Victor;
};

export abstract class Draw<P> extends Component<P & BaseProperty>{
    abstract baseStyle: CSSProperties;

    get styles(){
        return Object.assign({
            backgroundColor: this.props.color,
            left: this.props.position.x + 'px',
            top: this.props.position.y + 'px',
            position: "absolute",
            overflow: 'hidden',
            pointerEvents: 'none'
        }, this.baseStyle);
    }

    render(){
        return (
            <span style={this.styles}></span>
        );
    }
}

export class Circle extends Draw<{diameter: number}>{

    static baseStyle: CSSProperties = {
        position: "absolute",
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        overflow: 'hidden',
        pointerEvents: 'none'
    };

    render(){
        const styles = Object.assign({
            backgroundColor: this.props.color,
            width: this.props.diameter + 'px',
            height: this.props.diameter + 'px',
            left: this.props.position.x + 'px',
            top: this.props.position.y + 'px'
        }, Circle.baseStyle);
        return (
            <span style={styles}></span>
        );
    }
}