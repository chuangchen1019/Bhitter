var power = function (x, y) {
    var a = 1;
    for (var i = 1; i <= y; i++) {
        a = a * x;
    }
    return a;
}
function interest(presentVal, rate, term) {
	
    var fuctureValue = presentVal * (power(1 + rate, term));
    return fuctureValue;
};

module.exports.interest = interest;