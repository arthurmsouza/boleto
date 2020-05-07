var primeiroBloco = true;
var horaPrimeiroBloco = null;
var horaUltimoBloco = null;
var qtdBlocos = 0;
var timeDiff = 0;

$(function() {
    var wsUri = null;
    var wsTxt = null;
    if (document.location.protocol === 'https:') {
        wsTxt = '[wss]';
        wsUri = 'wss://' + document.location.hostname + ':' + document.location.port;
    } else {
        wsTxt = '[ws]';
        wsUri = 'ws://' + document.location.hostname + ':' + document.location.port;
    }
    console.log(wsTxt + ' Connecting to websocket', wsUri);

    var ws;
    ws = new WebSocket(wsUri);

    ws.onopen = function() {};
    ws.onmessage = function(evt) {
        console.log("Mensagem recebida: ");
        try {
            var msgObj = JSON.parse(evt.data);
            if (msgObj.error) {
                console.log("Erro ao obter atualização: " + msgObj.error);
            } else {
                if (msgObj.msg == 'block') {
                    console.log('Bloco recebido:');
                    console.log(msgObj.block);
                    $('#totalBlocos').text(msgObj.block.height);
                    animation(msgObj.block);
                    move_on_down();
                    if (primeiroBloco) {
                        primeiroBloco = false;
                        horaPrimeiroBloco = new Date(Date.now());
                        horaUltimoBloco = horaPrimeiroBloco;
                    } else {
                        horaUltimoBloco = new Date(Date.now());
                    }
                    qtdBlocos++;
                    console.log("Hora primeiro Bloco: " + horaPrimeiroBloco);
                    console.log("Hora ultimo Bloco: " + horaUltimoBloco);
                    timeDiff = (horaUltimoBloco - horaPrimeiroBloco) / 3600
                    console.log("Tempo total entre primeiro e ultimo: " + timeDiff);
                    if (timeDiff != 0) {
                        var totalPorHora = qtdBlocos / timeDiff;
                        console.log(totalPorHora);
                        $('#blocosHora').text(totalPorHora.toFixed(2));
                    }

                    // var now = new Date(Date.now());
                    // var formatted = now.getDay() + "/" + (now.getMonth() + 1) + "/" + now.getFullYear() + " - " // + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds();
                    // $('#blocosHora').text(formatted);

                }
            }
        } catch (error) {
            console.log(error);
        }
    };
    ws.onerror = function(evt) {
        console.log("Erro com WebSocket");
    };
    ws.onclose = function() {
        console.log("Conexão WebSocket fechada");
    };
});