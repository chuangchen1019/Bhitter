var express = require('express');
var getJSON = require('get-json');
var getKey = require('./config.js');
var http = require('http');
var request = require('request');
var md5 = require('md5');
var cal = require('./interest.js');
var mysql = require('mysql');
var db = require('./DB_query.js');
var HashMap = require('hashmap');

//final result var declaration
var finalCardInfo = "";
var finalRateInfo = "";
var finalCalInfo ="";
var messageControlFlag = 0;
var userPrincipal = 0;
//information register
var lastInfo = "";
var map = new HashMap();

var bank_name_list = ["","",""];
var card_name_list = ["","",""];


function NLP(msg, callback, userID, event){

  //console.log("nlp connect seccess!");
  //console.log("userID in nlp:"+userID);

  if(msg == "回到原點" || msg == "不用了" || msg == "算了"){
    map.set(userID, "");
    callback("謝謝您使用Bhitter💰", event);
    return;
  }

  var text = map.get(userID) == undefined ? msg : map.get(userID)+" "+msg;

  console.log("userID:"+userID+", msg:"+text);

	//Turn json to string
	var rq = JSON.stringify({
           
      "data" : {
                "input_type" : 1,
                "text" : text,
                },    
      "data_type" : "stt"});

  //get Timestamp
  var hrTime = new Date().getTime();

  //set sign 
  var sign = md5(getKey.olami.appSecret + "api=nli" + "appkey="+getKey.olami.appKey + "timestamp="+hrTime + getKey.olami.appSecret);


  //create url
  var url = getKey.olami.apiURL + "?appkey=" + getKey.olami.appKey + "&api=nli&timestamp=" + hrTime + "&sign=" + sign + "&rq=" + rq;
  console.log(url);
  url = encodeURI(url);

  //post url to api

  request.post({
    headers: {'content-type' : 'application/x-www-form-urlencoded'},
    url:url,
    body:rq
  },function(error, response, b){
     
        var res = JSON.parse(b);
        var getNLI = res.data.nli[0].desc_obj;
        var type = res.data.nli[0].type;
        console.log(getNLI.result);
        if (getNLI.result[0] != '{') {
          
          if (map.get(userID) != undefined && map.get(userID) != "") {
              if (getNLI.result == "Read Time Out") {
                    getNLI.result = "Bhitter 剛剛不小心恍神了！";
              }
              let askArr = map.get(userID).split(" ");
              if (askArr.length > 0) {
                  getNLI.result += `\n目前在${askArr[0]}👉🏻👉🏻請繼續輸入資料🤩\n\n若要結束或重新查詢👉🏻輸入「回到原點」`;
              }
          }
          else {
              if (getNLI.result == "Read Time Out") {
                  getNLI.result = "Bhitter 現在小忙碌，稍等一下再試～";
              } 
              else if(type != "chat"){
                getNLI.result = `Bhitter是你最可靠的行動理財小助理！\n✦ 查詢利率\n✦ 算利息\n✦ 查詢優惠\n⚡️手刀輸入你想要知道的資訊吧⚡️`;
              }
          }
         
          callback(getNLI.result, event);
          return;
        }

        olamiResult = JSON.parse(getNLI.result);
        map.set(userID,text);

        if ( olamiResult.mod == "2") {
          
          //judge user intention
          judge(olamiResult);

          //callback db result
          setTimeout(function () {

            if(messageControlFlag == 1){
                callback(finalCardInfo, event);
                messageControlFlag = 0;
            }
            else if(messageControlFlag == 2){
                callback(finalRateInfo, event);
                messageControlFlag = 0;
            }
            else if(messageControlFlag == 3){ 
                callback(finalCalInfo, event);
                messageControlFlag = 0;
            }
            else{
                console.log("Finalmessage is null");
                callback(finalCalInfo, event);
                messageControlFlag = 0;
            }
            map.set(userID,"");  

          }, 1000);
        }
        else{
          //return message
          callback(olamiResult.reply, event);
          messageControlFlag = 0;
        }
  });
}

function judge(dbMessage){

  //bank : b1,b2,b3
  //card : c1,c2,c3
  //type : search, 

  console.log(dbMessage);
	var intention = dbMessage.semantic.type;

  list_init();
  bank_name_list = [dbMessage.semantic.b1,dbMessage.semantic.b2,dbMessage.semantic.b3];
  card_name_list = [dbMessage.semantic.c1,dbMessage.semantic.c2,dbMessage.semantic.c3];
  
  var bonus_type = dbMessage.semantic.bonus_type;
  userPrincipal = dbMessage.rate.amo;

	if(intention == "search"){
		//search card
		db.cardDetail(bank_name_list, card_name_list, getCard);
	}
	else if(intention == "rate"){
		//search rate
    db.searchRate(dbMessage,getRate);
	}
	else if(intention == "cal"){
		//calculation
    db.searchRate(dbMessage,doCal);
	}
}
 
//callback function for card after doing db query 
function getCard(result,card_num) {
  
  if(result == 0){
    finalCardInfo = "db error";
    messageControlFlag = 4;
    return;
  }

  var re = "";

  for(var k = 0; k < card_num; k++){
    
    re += result[k].bank_name+result[k].card_name+"的優惠如下：\n\n";
    for (var i = 0; i <= 5; i++) {
  	   re += "⚡️ "+result[i].bonus_title+"\n";
    }
    re += "\n🔗 更多資訊 "+result[0].card_link;

  }
  finalCardInfo = re;
  messageControlFlag = 1;

}

//callback function for rate after doing db query
function getRate(result){

  console.log(JSON.stringify(result));
  var re = "";
  re += result[0].bank_name+result[0].rate_name+"的"+result[0].rate_time+"期利率為："+result[0].rate_value+"💰";
  finalRateInfo = re;
  messageControlFlag = 2;
}

//callback function for calculation after get the rate
function doCal(result){

  //console.log(JSON.stringify(result));
  var finalVal = cal.interest(userPrincipal,result[0].rate_value,result[0].rate_time) - userPrincipal; 
  var re = "根據您查詢的條件所計算出的利息為："+ finalVal.toFixed(2)+"💵";

  finalRateInfo = re;
  messageControlFlag = 2;

}
//record information
function record(msg,lastInfo){

  lastInfo += msg;

}

function list_init(){
    
    bank_name_list = ["","",""];
    card_name_list = ["","",""];
}

module.exports.NLP = NLP;
