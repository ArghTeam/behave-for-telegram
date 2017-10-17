"use strict";

const co = require('co')
const emoji = require('node-emoji')
const conversationAI = require('./conversation_ai')

// Main list of emojies
const EMOJIES = [
  ':innocent:',
  ':smiley:',
  ':blush:',
  ':slightly_smiling_face:',
  ':neutral_face:',
  ':confused:',
  ':unamused:',
  ':angry:',
  ':rage:',
  ':hankey:',
  ':skull:'
]
const EMOJIES_AMOUNT = EMOJIES.length - 1;


//Add few more emojies from this list depending on score
const ADDITIONAL_EMOJIES = [
  ['😐', '😕', '👎', '😠', '😒', '😨', '😳'],
  ['😡', '😖', '😫', '😱', '😵', '😷', '👿', '🙀']

];
const ADDITIONAL_EMOJIES_AMOUNT = ADDITIONAL_EMOJIES.length;
const MAX_ADDITIONAL_EMOJIES = 4;



const getScore = text =>
  conversationAI.getToxicityScore(text)

/*
  Select few (or zero) emojies of possible ADDITIONAL_EMOJIES

  1. Detect index of ADDITIONAL_EMOJIES by score
  2. Detect how many emojies in given string
  3. Get random number (N) betweet 0 and number of possible add emojies
  4. Fetch N emojies from string in random order
*/
const getFewAdditionalEmojies = (score) =>{
  let index = parseInt(score * ADDITIONAL_EMOJIES_AMOUNT);
  let emojies = ADDITIONAL_EMOJIES[index].slice(0); // clone array of emojies
  let n = Math.round(Math.random() * MAX_ADDITIONAL_EMOJIES);
  if (!n) return '';

  let str = '';
  for (let i = 0; i < n; i++) {
    let rnd = Math.round(Math.random() * (emojies.length-1));
    let e = emojies[rnd];
    emojies.splice(rnd, 1); // remove selected emoji from array
    str += e;
  }
  return str;
}

const mainEmoji = score =>
  emoji.get(EMOJIES[parseInt(score * EMOJIES_AMOUNT)])

/*
  Get emoji result by given text
  @param text: String

  @return Promise of String
*/
exports.emojiByText = text =>
  co(function *(){
    let score = yield getScore(text);
    let e = mainEmoji(score); // + getFewAdditionalEmojies(score);
    return `${e} (${score.toFixed(3)})`;
  })

/*
  Get emoji and toxicity params by given text
  @param text: String

  @return Promise of Object { emoji: String, toxicity: Float }
*/
exports.emojiWithToxicityByText = text =>
  co(function *(){
    let score = yield getScore(text);
    return {
      emoji: `${mainEmoji(score)} (${score.toFixed(3)})`,
      toxicity: score
    };
  })

exports.getFewAdditionalEmojies = getFewAdditionalEmojies;