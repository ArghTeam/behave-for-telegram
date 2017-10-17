"use strict";


/*
  Store info about toxic messages of user in each group on Telegram
  Use Redis to store number of toxic message of given user in given chat
  Use Redist TTL to get rid of old toxic messages
*/


const co = require('co');
const redisClient = require('redis').createClient();
const wrapper = require('co-redis');
const redisCo = wrapper(redisClient);

const TELEGRAM_TOXICITY_STORAGE = 3600 * 24; // Store redis key with toxic messages count for 24 hours
// const TELEGRAM_TOXICITY_STORAGE = 60 * 10; // 10 minutes


// Redis key by userId and chatId
const userChatKey = (userId, chatId) =>
  `c${chatId}:${userId}`

exports.redisClient = redisCo;


exports.get = (userId, chatId) =>
  redisCo.get(userChatKey(userId, chatId));

exports.delete = (userId, chatId) =>
  redisCo.del(userChatKey(userId, chatId));

exports.increment = (userId, chatId) =>
  co(function* () {
    let key = userChatKey(userId, chatId);
    let count = yield redisCo.incr(key);
    yield redisCo.expire(key, TELEGRAM_TOXICITY_STORAGE);
    return count;
  });