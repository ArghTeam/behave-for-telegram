"use strict";

const TELEGRAM_TOKEN = process.env.TELEGRAM_TOKEN;
const TELEGRAM_API = `https://api.telegram.org/bot${TELEGRAM_TOKEN}`;
const TELEGRAM_MIN_TOXICITY_ABUSE = 0.79999;
const TELEGRAM_MIN_TOXICITY_WARNING = 0.49999;
const TELEGRAM_MAX_TOXIC_MESSAGES_TO_KICK = 5;
const TELEGRAM_MAX_WARNINGS = 3; // each 3 warnings add +1 to toxic counter
const TELEGRAM_BOT_NAME = 'BehaveBot';

const co = require('co');
const request = require('request');
const { emojiByText, emojiWithToxicityByText } = require('./emojies');
const toxicityStorage = require('./toxicity_storage');
const telegramHelp = require('../config/telegram_help');


const sendTelegramRequest = (action, data) =>
  new Promise((resolve, reject) =>{
    let options = {
      uri: `${TELEGRAM_API}/${action}`,
      formData: data
    };
    request.post(options, (err, httpResponse, body) =>{
      if (err) return reject(err);
      resolve(body);
    });
  })

const sendMessage = data =>
  sendTelegramRequest('sendMessage', data);

const kickChatMember = data =>
  sendTelegramRequest('kickChatMember', data);

const getTypeOfMessage = message => {
  let type = message.chat.type;
  if ('group' === type || 'supergroup' === type) return 'group';
  return type;
}

const forPrivateMessage = message =>
  co(function *(){
    let text = message.text;
    let chatId = message.chat.id;
    let emoji = yield emojiByText(text);
    let result = yield sendMessage({ chat_id: chatId, reply_to_message_id: message.message_id, text: emoji });
    return result;
  });

const userFullNameByMessage = message =>{
  if (!message.from) return '';
  let fullName = message.from.first_name;
  if (message.from.last_name) fullName += ' ' + message.from.last_name;
  return fullName;
};

const tryToKickUser = (message, emoji) =>
  co(function *(){
    let chatId = message.chat.id;
    let userId = message.from.id;
    let count = yield toxicityStorage.increment(userId, chatId);

    let kick = count >= TELEGRAM_MAX_TOXIC_MESSAGES_TO_KICK;

    let answer
    if (!kick) {
      answer = `${emoji}\nIt's your ${count}/${TELEGRAM_MAX_TOXIC_MESSAGES_TO_KICK} penalty points.\nYou'll be banned from this group after ${TELEGRAM_MAX_TOXIC_MESSAGES_TO_KICK - count} more!`; 
    } else {
      answer = `${emoji}\nIt's your last penalty point.\nYou are banned from this group!`; 
    }
    let result = yield sendMessage({ chat_id: chatId, reply_to_message_id: message.message_id, text: answer });

    if (kick) {
      // kick user from chat group
      let kickResult = yield kickChatMember({ chat_id: chatId, user_id: message.from.id });
      if (typeof(kickResult) === 'string') {
        kickResult = JSON.parse(kickResult);
      } else {
        kickResult = {};
      }

      if (kickResult.ok) {
        yield sendMessage({ chat_id: chatId, text: `${userFullNameByMessage(message)} was banned from this group for being too toxi.` });
        yield toxicityStorage.delete(userId, chatId); // remove from storage to prevent immediatelly kick again if user was invited to the same group
        yield toxicityStorage.delete(userId, chatId + ':warn'); // remove warnings counter too
      } else {
        if (kickResult.description.indexOf('kick administrators') > 0 || kickResult.description.indexOf('USER_ADMIN_INVALID') > 0) {
          yield sendMessage({ chat_id: chatId, text: `I can't ban admins. ${userFullNameByMessage(message)}, please behave!` })
        }
      }
    }

    return result;
  })

const warnChatUser = (message, emoji) =>
  co(function *(){
    let chatId = message.chat.id + ':warn';
    let userId = message.from.id;
    let count = yield toxicityStorage.increment(userId, chatId);
    let result;

    // If there is not yet a lot of warnings - just warn user
    if (count < TELEGRAM_MAX_WARNINGS) {
      let answer = `${emoji}\nIt's your ${count}/${TELEGRAM_MAX_WARNINGS} warnings.\nYou'll get one penalty point after ${TELEGRAM_MAX_WARNINGS - count} more warnings!`;
      result = yield sendMessage({ chat_id: chatId, reply_to_message_id: message.message_id, text: answer });

    // Otherwise add +1 to kick and kick if there is enough toxic counter
    } else {
      yield toxicityStorage.delete(userId, chatId); // nulify warning counter
      result = yield tryToKickUser(message, emoji);
    }

    return result;
  });

const forGroupMessage = message =>
  co(function *(){
    let text = message.text;
    let result;
    let emojiWithToxicity = yield emojiWithToxicityByText(text);
    let { toxicity, emoji } = emojiWithToxicity;

    // inform about emoji if it's more then TELEGRAM_MIN_TOXICITY_WARNING
    if (toxicity < TELEGRAM_MIN_TOXICITY_WARNING) return {};

    if (toxicity > TELEGRAM_MIN_TOXICITY_ABUSE) {
      result = yield tryToKickUser(message, emoji);
    } else {
      result = yield warnChatUser(message, emoji);
    }

    return result;
  })

const answerForCommand = message =>
  co(function *(){
    let chatId = message.chat.id;
    let text = message.text;
    let type = getTypeOfMessage(message);
    let entity = message.entities[0];
    let command = text.substr(entity.offset, entity.length);
    command = command.replace(`@${TELEGRAM_BOT_NAME}`, ''); // remove bot name from command
    let result = {};
    if ('/help' === command || '/start' === command) {
      let answer = telegramHelp[type].trim();
      result = yield sendMessage({ chat_id: chatId, text: answer });
    }
    return result;
  })


exports.TELEGRAM_TOKEN = TELEGRAM_TOKEN;

exports.answerForMessage = message =>
  co(function *(){
    // if message is undefined or there is no 'chat'
    if (!message || !message.chat) return {};

    // console.log(message);
    
    if (message.entities && 'bot_command' === message.entities[0].type) {
      let result = yield answerForCommand(message);
      return result;
    }

    let type = getTypeOfMessage(message);
    let result = ('group' === type) ? yield forGroupMessage(message) : yield forPrivateMessage(message);
    return result;
  })