var linebot = require('linebot');
var express = require('express');
var getJSON = require('get-json');
var getKey = require('./config.js');
var http = require('http');
var request = require('request');
var md5 = require('md5');
var cal = require('./interest.js');
var mysql = require('mysql');
var db = require('./DB_query.js');
var nlp = require('./nlp.js');
const Heroku = require('heroku-client');
const heroku = new Heroku({ token: "c0a7c816-7f14-470b-91c9-90857176ab61" });

//create bot
var bot = linebot({
  channelId: getKey.config.channelId,
  channelSecret: getKey.config.channelSecret,
  channelAccessToken: getKey.config.channelAccessToken
  
});

//bot main
bot.on('message',function(event){

  if (event.message.type = 'text') {
      var msg = event.message.text;
      var userID = event.source.userId;
      nlp.NLP(msg, afterRequest, userID, event);
  
  }
  
  function afterRequest(replymsg, e){

      e.reply(replymsg).then(function(data) {
        // success 
        console.log("string reply success");
      }).catch(function(error) {
        // error 
        console.log('error');
      });
  }

});

const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

var server = app.listen(process.env.PORT || 8001, function() {
  var port = server.address().port;
  console.log("App now running on port", port);
});



