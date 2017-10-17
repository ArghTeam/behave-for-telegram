"use strict";

const redis = require('redis');
const client = redis.createClient();


client.on("error", function (err) {
  console.log("Error");
  console.error(err);
});


client.set("chat:1:1", "7", redis.print);
let a = client.get("chat:1:1", redis.print);
console.log('A ', a);

client.quit();