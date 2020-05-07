/**
 * Websocket server side
 */
var ws = require('ws');


var wss = null;
const KEEP_ALIVE = 30000; // 30 seconds to authenticate


var websocketServer = function(logger, chaincodeLibp) {
    var enrollInterval;
    var checkPerodically;

    console.log('parametro serverside',chaincodeLibp)
     
    var knownHeight = 0;
    /**
     * Setup web server
     * @param {*} server 
     */
    var setup = function(server) {
        /**
         * Enrolling on Blockchain Network to listen to events (Repeating event)
         */
        var chaincodeObj = chaincodeLibp;
        console.log('serverside teste chaincode',chaincodeObj);
            if (chaincodeObj != null) {
                logger.debug("Usuario autenticado (websocket)");
                listenToBlockchainEvents();
            } else {
                logger.error('Could not enroll');
            }
        /**
         * Websocket setup
         */
        logger.info('Configurando o servidor Websocket');
        wss = new ws.Server({
            server: server
        });

        wss.on('connection', function connection(ws) {
            logger.info("Uma nova conexão com o Websocket foi aberta");
            ws.on('message', function incoming(message) {
                logger.debug(message);
                wss.clients.forEach(function each(client) {
                    client.send(message);
                });
                //ws.send(message);
            });
            ws.on('close', function close() {
                logger.info("Uma conexão com o Websocket foi fechada");
            });

        });
    };

    /**
     *  Broadcast message to all clients
     * @param {*} data Data to be sent
     */
    var broadcast = function(data) {
        logger.debug('[ws] broadcasting to clients. ', data.msg)
        if (!wss) {
            logger.error("Cannot broadcast because [wss] is null. Setup server first.");
            return;
        }
        var i = 0;
        wss.clients.forEach(function each(client) {
            try {
                client.send(JSON.stringify(data));
            } catch (e) {
                logger.debug('[ws] error broadcast ws', e);
            }
        });
    };

    /**
     * Ouvir aos eventos do blockchain
     */
    function listenToBlockchainEvents() {
        clearTimeout(checkPerodically);
        checkPerodically = setTimeout(function() {
            try {
                checkForUpates(null);
            } catch (e) {
                console.log('');
                logger.error('Error in listenToBlockchainEvents \n\n', e);
                listenToBlockchainEvents();
                checkForUpates(null);
            }
        }, 1);
    };
    /**
     * Check for Updates to Ledger 
     */
    var checkForUpates = function() {
        chaincodeLibp.channelStats(function(err, resp) {
            var newBlock = false;
            if (err != null) {
                var eobj = {
                    msg: 'error',
                    error: err,
                };
                logger.error('Erro ao obter atualização do Ledger');
                broadcast(eobj); //send to all clients
            } else {
                if (resp && resp.height && resp.height.low) {
                    if (resp.height.low > knownHeight) {
                        logger.info('Novo bloco identificado!', resp.height.low, resp);
                        knownHeight = resp.height.low;
                        newBlock = true;
                        logger.debug('[verificando] novos blocos, enviando para todos os clients');
                        broadcast({
                            msg: 'block',
                            error: null,
                            block: {
                                height: resp.height.low,
                                hash: resp.currentBlockHash
                            }
                        }); //send to all clients
                    }
                }
            }
            listenToBlockchainEvents(); //check again
        });
    };

    return {
        setup: setup,
        broadcast: broadcast
    };
};

module.exports = websocketServer;