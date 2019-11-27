var mysql = require('mysql');
var getKey = require('./config.js');
var searchDone = 0;
var connection = mysql.createConnection({
	    
	    host     : getKey.db.HOST,
	    port     : getKey.db.PORT,
	    user     : getKey.db.USER,
	    password : getKey.db.PSW,
	    database : getKey.db.NAME
	});

connectDB();

function connectDB(){

	connection.connect(function(err) {
	    
	    if (err) {
	        
	        return console.error('error: ' + err.message);
	    }
	    console.log("DB state:"+connection.state);

	});	
}

//search the rate for doing calculation
function calRate(dbMessage,callback){

	var queryStr = `SELECT 
						bank.bank_name, 
						rate.rate_name, 
						rate.rate_status, 
						rate.rate_value, 
						rate.rate_time, 
						rate.amount 
					FROM 
						bank, 
						rate 
					WHERE 
						bank.bank_id = rate.bank_id 
						AND bank.bank_name = "${dbMessage.semantic.b1}"`;

	var re = jsonToQuery(dbMessage.rate);
	
	if(dbMessage.rate.amo != "")
		queryStr += ` AND ${dbMessage.rate.amo} > rate.amount`;
	
	queryStr += re;

	connection.query(queryStr , function (error, results, fields) {
    
        if (error) throw error;
        callback(results);
    });
}

//input json object to search rate
function searchRate(dbMessage,callback){

	var queryStr = `SELECT 
						bank.bank_name, 
						rate.rate_name, 
						rate.rate_status, 
						rate.rate_value, 
						rate.rate_time, 
						rate.amount 
					FROM 
						bank, 
						rate 
					WHERE 
						bank.bank_id = rate.bank_id 
						AND bank.bank_name = "${dbMessage.semantic.b1}"`;

	var re = jsonToQuery(dbMessage.rate);
	queryStr += re;
	
	connection.query(queryStr , function (error, results, fields) {
    
        if (error) throw error;
        callback(results);
    });

} 


//do not complete
function searchCard(bank_name){

	var queryStr = `SELECT 
						bank.bank_name, 
						card.card_name
					FROM
						bank, 
						card 
					WHERE 
						bank.bank_id = card.bank_id 
						AND bank.bank_name = "${bank_name}"`;

	connection.query(queryStr , function (error, results, fields) {
    
        if (error) throw error;
        console.log('The solution is: ', results);
        
    });			
}

//Find the bonus title of card 
function cardDetail(bank_name,card_name,callback){

	var card_num = 0;
	for (var i=0;i<card_name.length;i++){
		if(card_name[i]!= "")
			card_num++;
	} 

	try{
	var queryStr = `SELECT bank.bank_name,card.card_name,card.card_link,bonus.bonus_title 
					FROM bank,card,bonus 
					WHERE bank.bank_id = card.bank_id AND card.card_id = bonus.card_id`
	
	for(var i=0; i<card_name.length ;i++ ){
		if(bank_name[i] != "" && card_name[i] != ""){
			queryStr += ` AND bank.bank_name = "${bank_name[i]}"`;
			queryStr += ` AND card.card_name = "${card_name[i]}"`;
		}
	}

	connection.query(queryStr , function (error, results, fields) {
    
        if (error) throw error;
        console.log(results);
      	callback(results,card_num);  
    });	
    }
    catch{
    	console.log("in db card catch block");
    	callback(0,0);
    }					
}

//parse the json object and make the query string
function jsonToQuery (jsonObject) {
	var str = "";
	for (var key in jsonObject) {
		var value = jsonObject[key];

		if(value != "" && key != "amo")
			str += ` AND rate.rate_${key} = "${value}"`;
	}
	return str;
	
}

function terminateDB(){
	connection.end();
}



module.exports.connectDB = connectDB;
module.exports.terminateDB = terminateDB;
module.exports.searchRate = searchRate;
module.exports.calRate = calRate;
module.exports.searchCard = searchCard;
module.exports.cardDetail = cardDetail;



