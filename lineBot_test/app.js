var linebot = require('linebot');
var express = require('express');
var getJSON = require('get-json');
var getKey = require('./config');
var lastUserID;

var bot = linebot({
  channelId: getKey.channelId,
  channelSecret: getKey.channelSecret,
  channelAccessToken: getKey.channelAccessToken
});

bot.on('message', function(event) {
   console.log(event); //把收到訊息的 event 印出來看看
 });
bot.on('message', function(event) {
	lastUserID = event.source.userId;	
  	if(event.message.type = 'text') {
    	var msg = event.message.text;
    	event.reply(msg).then(function(data) {
      	// success 
      	console.log(msg);
    }).catch(function(error) {
      	// error 
      	console.log('error');
    });
  }
});

// setInterval(function(){
//     var userId = lastUserID;
//     var sendMsg = "hello chen";
//     bot.push(userId,sendMsg);
//     console.log('send: '+sendMsg);
// },5000);



const app = express();
const linebotParser = bot.parser();
app.post('/', linebotParser);

//因為 express 預設走 port 3000，而 heroku 上預設卻不是，要透過下列程式轉換
var server = app.listen(process.env.PORT || 8080, function() {
  var port = server.address().port;
  console.log("App now running on port", port);
});



