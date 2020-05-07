/**
 * Controlador do Regulador
 */
var reguladorController = function(logger) {

    /**
     * Middleware do regulador
     * Verifica se o usuário está autenticado e é um regulador
     */
    var middleware = function(req, res, next) {
        if (!req.user || req.user.profile != "regulador") {
            res.redirect('/');
        } else next();
    };

    /**
     * Rota de requisição da página inicial do Regulador
     * @param {*} req 
     * @param {*} res 
     */
    var getRegulador = function(req, res) {
        var usuario = {
            nome: req.user.name,
            username: req.user.username
        };
        var aceiteLista = [];
        var infoDashboard = {
            totalBlocos: "123",
            blocosHora: "-"
        };
        // obter lista de aceites
        listarAceites(req.user.assinatura, function(error, resposta) {
            if (error) {
                res.render('regulator', {
                    error: error,
                    aceiteLista: aceiteLista,
                    usuario: usuario
                });
            } else {
                // definindo a lista recebida como aceiteLista
                aceiteLista = resposta.parsed.aceites;
                // reverte a lista para exibir os mais recentes primeiro
                aceiteLista.reverse();

                // obter informações do dashboard
                buscarInfoDashboard(function(errorDashboard, lastBlock) {
                    if (errorDashboard) {
                        logger.error("Erro buscarInfoDashboard: ")
                        logger.error(errorDashboard);
                        res.render('regulator', {
                            infoDashboard: infoDashboard,
                            aceiteLista: aceiteLista,
                            usuario: usuario
                        });
                    } else {
                        infoDashboard.totalBlocos = lastBlock.height;
                        res.render('regulator', {
                            infoDashboard: infoDashboard,
                            aceiteLista: aceiteLista,
                            usuario: usuario
                        });
                    }
                });
            }
        });

    };

    /**
     * Lista os aceites registrados no Ledger para o Regulador
     * @param {*} assinatura Assinatura do Regulador a ser consultado
     * @param {*} cb 
     */
    var listarAceites = function(assinatura, cb) {

        //chamada para SDK HyperLedger passando assinatura retorna lista de aceites no Ledger
        if (assinatura) {
            chaincodeLib.consultarAceite(assinatura, function(error, resposta) {
                if (!error) {
                    logger.debug("Resposta consultarAceite: ");
                    logger.debug(resposta);
                    cb(null, resposta);
                } else {
                    logger.error("Erro consultarAceite: ");
                    logger.debug(error);
                    logger.debug("Res consultarAceite (erro): ");
                    logger.debug(resposta);
                    cb(error, resposta);
                }
            });
        } else {
            logger.error("assinatura invalida");
            var err = "assinatura invalida";
            cb(err, null);
        }
    };

    /**
     * Busca as informações para popular o Dashboard do Regulador
     */
    var buscarInfoDashboard = function(cb) {
        var lastBlock = {};

        chaincodeLib.channelStats(function(err, resp) {
            logger.debug("Resposta da consulta de block: ");
            var newBlock = false;
            if (err != null) {
                logger.error(err);
                var eobj = {
                    msg: 'error',
                    e: err,
                };
                return cb(eobj, null);
            } else {

                if (resp && resp.height && resp.height.low) {
                    lastBlock = {
                        height: resp.height.low,
                        hash: resp.currentBlockHash
                    };
                    logger.debug("lastBlock: ");
                    logger.debug(lastBlock);
                    return cb(null, lastBlock);
                }
            }
        });
    };

    return {
        middleware: middleware,
        getRegulador: getRegulador
    };
};

module.exports = reguladorController;