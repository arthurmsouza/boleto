let block = 0;
let height = 0;
var lastHash = 0;

var screenWidth = screen.width;
var aux;
if (screenWidth > 600) {
	aux = 14;
} else {
	aux = 10;
}

// Exibe o bloquinho na tela
function animation(receivedBlock) {
	height = receivedBlock.height;
	lastHash = receivedBlock.hash;
    block = block + 1;
    //height++;
    console.log(screenWidth);
	$(".blocos").append("<div id='box' class='block'>" + height + "</div>");
	console.log(block);
    $('.block:last').animate({
			opacity: 5,
			left: (block)
		}, 500, function () {
			$('.lastblock').removeClass('lastblock');
			$('.block:last').addClass('lastblock');
		});
}

// Caso a tela seja maior que 600px, a primeira posição do bloco é passada para o próximo
function move_on_down() {
	if (block > aux) {
		$('.block:first').animate({
			opacity: 0
		}, 300, function () {
			$('.block:first').remove();
		});
		$('.block').animate({
			left: '-=0'
		}, 300, function () {});
		block--;
	}
}

//setInterval(function () {
//	animation();
//    move_on_down();

//}, 2000);