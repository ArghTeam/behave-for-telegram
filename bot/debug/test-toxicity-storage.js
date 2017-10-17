"use strict";

const toxicityStorage = require('../modules/toxicity_storage');
const co = require('co');

let userId = 1234;
let chatId = -5555;

co(function *(){
  console.log(yield toxicityStorage.get(userId, chatId));
  console.log(yield toxicityStorage.increment(userId, chatId));
  yield toxicityStorage.redisClient.quit();
});
