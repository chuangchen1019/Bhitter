var linebot = require('linebot');
var express = require('express');
var getJSON = require('get-json');
var lastUserID;

var bot = linebot({
  channelId: 1558428648,
  channelSecret: "3b0a38b06a0ae341ddae1fa952411401",
  channelAccessToken: "xbsnEadBcnDdBNg8bvvJLAzMYmqHYAuuEHRsk79qqG9f4dwtZq9Uw53XkKGtZU+ctFFlIz4ms45eZu6bgI8vusa9XMJSvm6RckHMcVGhGF2gG2a/iSK2lfRY2FY5EM2+36mOd5oSWGNC7Tw22yX6CgdB04t89/1O/w1cDnyilFU="
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



