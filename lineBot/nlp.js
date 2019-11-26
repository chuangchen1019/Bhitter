var express = require('express');
var getJSON = require('get-json');
var getKey = require('./config.js');
var http = require('http');
var request = require('request');
var md5 = require('md5');
var cal = require('./interest.js');
var mysql = require('mysql');
var db = require('./DB_query.js');

//final result var declaration
var finalCardInfo = "";
var finalRateInfo = "";
var finalCalInfo ="";
var messageControlFlag = 0;
var userPrincipal = 0;
//information register
var lastInfo = "";

var bank_name_list = ["","",""];
var card_name_list = ["","",""];

function NLP(msg, callback){

  console.log("nlp connect seccess!");

  //record message;
  lastInfo += msg;

	//Turn json to string
	var rq = JSON.stringify({
           
      "data" : {
                "input_type" : 1,
                "text" : lastInfo,
                },    
      "data_type" : "stt"})

    //get Timestamp
    var hrTime = new Date().getTime()

    //set sign 
    var sign = md5(getKey.olami.appSecret + "api=nli" + "appkey="+getKey.olami.appKey + "timestamp="+hrTime + getKey.olami.appSecret);


    //create url
    var url = getKey.olami.apiURL + "?appkey=" + getKey.olami.appKey + "&api=nli&timestamp=" + hrTime + "&sign=" + sign + "&rq=" + rq;
    url = encodeURI(url);

    //post url to api

    request.post({
      headers: {'content-type' : 'application/x-www-form-urlencoded'},
      url:url,
      body:rq
    },function(error, response, b){

            var res = JSON.parse(b);
            var getNLI = res.data.nli[0].desc_obj;  
            olamiResult = JSON.parse(getNLI.result);
             
            if ( olamiResult.mod == "2") {
              
              //judge user intention
              judge(olamiResult);

              //callback db result
              setTimeout(function () {

                if(messageControlFlag == 1){
                    callback(finalCardInfo);
                    messageControlFlag = 0;
                }
                else if(messageControlFlag == 2){
                    callback(finalRateInfo);
                    messageControlFlag = 0;
                }
                else if(messageControlFlag == 3){ 
                    callback(finalCalInfo);
                    messageControlFlag = 0;
                }
                else
                    console.log("Finalmessage is null");

                lastInfo = "";  

              }, 1000);
            }
            else{
              //return message
              callback(olamiResult.reply);
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
    
    re += result[k].bank_name+result[k].card_name+"的優惠如下：\n";
    for (var i = 0; i <= 5; i++) {
  	   re += result[i].bonus_title+"\n";
    }
    re += "...more on our website: http//:www.~~~~~~.com\n";

  }
  finalCardInfo = re;
  messageControlFlag = 1;

}

//callback function for rate after doing db query
function getRate(result){

  console.log(JSON.stringify(result));
  var re = "";
  re += result[0].bank_name+result[0].rate_name+"的"+result[0].rate_time+"期利率如下：\n";
  re += "利率為："+result[0].rate_value+"\n";
  finalRateInfo = re;
  messageControlFlag = 2;
}

//callback function for calculation after get the rate
function doCal(result){

  //console.log(JSON.stringify(result));
  var finalVal = cal.interest(userPrincipal,result[0].rate_value,result[0].rate_time) - userPrincipal; 
  var re = "根據您查詢的條件所計算出的利息為："+ finalVal.toFixed(2);

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
