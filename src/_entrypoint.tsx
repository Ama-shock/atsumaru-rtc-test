import './style.scss';
import React from 'react';
import Dom from 'react-dom';
import Game from './Game';

self.addEventListener('load', ()=>{
    const main = document.createElement('main');
    document.body.append(main);
    Dom.render(<Game />, main);
});
