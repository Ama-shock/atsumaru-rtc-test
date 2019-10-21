import React, {Component} from 'react';
import Victor from 'victor';
import Field, {Positions, FieldStatus} from './Field';

export default class Game extends Component<{}, Positions>{
    state: Positions = {
        point: new Victor(0, 0),
        self: new Victor(0, 0),
        dist: new Victor(0, 0),
        pack: new Victor(100, 100)
    };

    packSpeed: Victor = new Victor(0, 0);
    constructor(props: {}){
        super(props);
        this.frame();
    }

    private async frame(){
        while(await new Promise(r=>requestAnimationFrame(r))){

            this.setState({
                self: this.state.point.clone()
            });
        }
    }


    render(){
        return (
            <Field
                point={this.state.point}
                size={[240, 480]}
                position={[50, 50]}
                self={this.state.self}
                dist={this.state.dist}
                pack={this.state.pack}
                />
        );
    }


}