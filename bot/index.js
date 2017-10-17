"use strict";

const co = require('co');
const restify = require('restify');

const { answerForMessage, TELEGRAM_TOKEN } = require('./modules/telegram');

const PORT = process.env.port || process.env.PORT || 3978;

// Setup Restify Server
let server = restify.createServer();
server.listen(PORT, function () {
  console.log('%s listening to %s', server.name, server.url); 
});

server.post(`/api/telegram/${TELEGRAM_TOKEN}`, (req, res) =>{
  return co(function *(){
    let { message } = req.params;
    yield answerForMessage(message);
    res.json({ success: true });
  });
});
