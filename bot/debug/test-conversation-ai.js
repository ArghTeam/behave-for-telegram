"use strict";

const co = require('co');
const { analyze } = require('../modules/conversation_ai');
const util = require('util');

let texts = [
  'This is why you should NEVER have a Bow and Arrow in  a multiplayer FPS. EVERY SINGLE ONE in EVERY GAME THAT FEATURES IT is broken. No exceptions',
  'Hey dummy, what\'s up?',
  'You are all morons!',
  'What the fuck is going on?'
];


let run = () =>
  co(function *(){
    for (let text of texts) {
      let result = yield analyze(text);
      console.log(text);
      console.log(util.inspect(result, false, null));
    }
  })

run().then(() =>{
  console.log('DONE');
}).catch(err =>{
  console.error(err);
});