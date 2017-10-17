"use strict";

const { emojiByText, getFewAdditionalEmojies } = require('../modules/emojies');

emojiByText('Hello everybody!').then(emoji =>{
  console.log(emoji);
}).catch(err =>{
  console.error(err);
});

// for (let i = 0; i < 20; i++) {
//   console.log(`TRY ${i}:`);
//   console.log(getFewAdditionalEmojies(0.3));
//   console.log(getFewAdditionalEmojies(0.8));
// }