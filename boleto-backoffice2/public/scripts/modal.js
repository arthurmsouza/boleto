// funcao para registrar o pagamento do boleto ao clicar em Pagar na tela
function pagarBoleto(numeroBoleto, idLinhaTabela) {
    var jsonData = {
        linhaDigitavel: idLinhaTabela.slice(6, idLinhaTabela.length)
    };

    console.log(jsonData);
    $('html').addClass("wait");
    $.ajax({
        type: 'POST',
        url: 'if/registrarPagamento',
        data: jsonData,
        timeout: 10000
    }).done(function(response) {
        $('#modal').css("display", "block");
        $('#mask').css("display", "block");
        $('#modal').text("O registro de pagamento foi efetuado com sucesso");
        $('#' + idLinhaTabela).remove();
    }).fail(function(jqXHR, textStatus, errorThrown) {
        console.log("Não foi possível pagar o boleto");
        console.log("Erro: " + textStatus + "(" + errorThrown + ")");
        console.log(jqXHR);
        $('#modal').css("display", "block");
        $('#mask').css("display", "block");
        $('#modal').text("Não foi possível registrar o pagamento do boleto");
    }).always(function() {
        $('html').removeClass("wait");
    });
};
$(document).ready(function() {
    $('#mask').click(function() {
        $('#mask').css("display", "none");
        $('#modal').css("display", "none");
    })
});