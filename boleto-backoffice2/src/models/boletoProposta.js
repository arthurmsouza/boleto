
var BoletoProposta = function (data) {
this.data = data;
}

BoletoProposta.prototype.data = {}

//JSON 
var toJson = function(){
    return '{boletoProposta: {'+
		'linhaDigitavel: 02432423'+
	'}'
	JSON.stringify(seuObj).toString();
};

module.exports = BoletoProposta;