var ifController = function(logger, chaincodeLib) {

    /**
     * Middleware da if
     * Verifica se o usuário está autenticado e é uma if
     */
    var middleware = function(req, res, next) {
        if (!req.user || req.user.profile != "if") {
            res.redirect('/');
        } else {
            next();
            // chaincodeLib.enrollAdmin(1, function(e) {
            //     if (e == null) {
            //         logger.info("[chaincodeLib] Autenticado");
            //         next();
            //     } else logger.info("[chaincodeLib] Erro ao autenticar");
            // });
        }
    };

    /**
     * Rota de requisição da página inicial da IF
     * @param {*} req 
     * @param {*} res 
     */
    var getIf = function(req, res) {
        var usuario = {
            nome: req.user.name,
            username: req.user.username
        };

        var aceiteLista = [];
        var boletosNaoPagos = [];

        if (!req.user) {
            logger.debug("Usuario nao autenticado");
            res.redirect('/');
        } else {
            // obter lista de aceites da IF
            listarAceitesIf(req.user.assinatura, function(error, resposta) {
                if (error) {
                    res.render('if', {
                        error: error,
                        aceiteLista: aceiteLista,
                        boletosNaoPagos: boletosNaoPagos,
                        usuario: usuario
                    });
                } else {
                    aceiteLista = resposta.parsed.aceites;
                    // reverte a lista para exibir os mais recentes primeiro
                    aceiteLista.reverse();
                    logger.debug('Lista parseada');
                    logger.debug(aceiteLista);

                    // Buscar boletos nao pagos no ledger
                    listarBoletosNaoPagos(req.user.assinatura, function(errBoleto, boletosNaoPagos) {
                        if (errBoleto) {
                            res.render('if', {
                                error: errBoleto,
                                aceiteLista: aceiteLista,
                                boletosNaoPagos: boletosNaoPagos,
                                usuario: usuario
                            });
                        } else {
                            logger.debug("Boletos Nao Pagos:" + JSON.stringify(boletosNaoPagos));
                            var boletosParaView = formatarBoletosNaoPagosParaView(boletosNaoPagos);
                            // reverte a lista para exibir os mais recentes primeiro
                            boletosParaView.reverse();
                            res.render('if', {
                                aceiteLista: aceiteLista,
                                boletosNaoPagos: boletosParaView,
                                usuario: usuario
                            });
                        }
                    });
                }
            });
        }
    };

    /**
     * Lista os aceites da IF registrados no Ledger
     * @param {*} assinatura Assinatura da IF a ser consultada
     * @param {*} cb 
     */
    var listarAceitesIf = function(assinatura, cb) {

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
     * Função que busca no ledger todos os boletos não pagos registrados.
     * @param {*} assinatura Assinatura da IF que está consultando
     * @param {*} cb Callback para o retorno dos boletos não pagos.
     */
    var listarBoletosNaoPagos = function(assinatura, cb) {

        chaincodeLib.consultarBoletosNaoPagos(assinatura, function(err, retornoLedger) {
            if (err) {
                return cb(err, null);
            } else {
                listaBoletosNaoPagos = [];
                if (retornoLedger != null && retornoLedger.parsed != null) {
                    var listaAceiteProposta = retornoLedger.parsed.aceites;
                    if (listaAceiteProposta != null) {
                        for (i = 0; i < listaAceiteProposta.length; i++) {
                            var aceiteProposta = listaAceiteProposta[i];
                            if (aceiteProposta != null && aceiteProposta.boleto != null) {
                                var boleto = {
                                    numeroBoleto: aceiteProposta.boleto.linhaDigitavel,
                                    numeroProposta: aceiteProposta.hashProposta,
                                    dataVencimento: aceiteProposta.boleto.dataVencimento
                                };
                                listaBoletosNaoPagos.push(boleto);
                            }
                        }
                    }
                }

                return cb(null, listaBoletosNaoPagos);
            }
        });
    };

    /**
     * Função auxiliar para formatar os boletos não pagos para a página EJS.
     * 
     * @param {*} boletosNaoPagos 
     */
    function formatarBoletosNaoPagosParaView(boletosNaoPagos) {
        var boletosParaView = [];
        if (boletosNaoPagos) {
            for (var i = 0; i < boletosNaoPagos.length; i++) {
                var bnp = boletosNaoPagos[i];
                var numeroBoleto = bnp.numeroBoleto != null && bnp.numeroBoleto != "" ? bnp.numeroBoleto : "-";
                var numeroProposta = bnp.numeroProposta != null && bnp.numeroProposta != "" ? bnp.numeroProposta : "-";
                var dataVencimento = bnp.dataVencimento != null && bnp.dataVencimento != "" ? bnp.dataVencimento : "-";
                var boletoView = {
                    numeroBoleto: numeroBoleto,
                    numeroProposta: numeroProposta,
                    dataVencimento: dataVencimento
                };
                boletosParaView.push(boletoView);
            }
        }
        return boletosParaView;
    };

    /**
     * Rota de registro de pagamento de boleto
     * @param {*} req 
     * @param {*} res 
     */
    var registrarPagamentoBoleto = function(req, res) {
        logger.info('Registro de pagamento solicitado.');
        // valida se os parametros requeridos foram recebidos

        if (!req.body.linhaDigitavel || !req.user.assinatura) {
            logger.debug(req.body.linhaDigitavel, req.user.assinatura);
            logger.error('Registro de pagamento não realizado. Parametros invalidos');
            res.status(404);
            res.json({
                error: "Parametros invalidos. Necessario enviar Linha Digitavel"
            });
        } else {
            var args = {};
            args.linhaDigitavel = req.body.linhaDigitavel;
            args.assinaturaIF = req.user.assinatura;
            logger.debug("Argumentos: ")
            logger.debug(args);

            //chamada Fabric SDK
            logger.info('Enviando proposta de transação [Registro de Pagamento de Boleto]');
            chaincodeLib.registrarPagamentoBoleto(args, function(error, resposta) {
                if (error) {
                    logger.error('Registro de pagamento não realizado');
                    logger.debug(error);
                    res.status(500);
                    res.json({
                        error: 'Internal server error'
                    });
                } else {
                    logger.info('Registro de pagamento realizado');
                    logger.debug(resposta);
                    res.status(200);
                    res.json({
                        resposta: "Registro de pagamento realizado com sucesso"
                    });
                }
            });
        }
    };

    return {
        middleware: middleware,
        getIf: getIf,
        registrarPagamentoBoleto: registrarPagamentoBoleto
    };
};

module.exports = ifController;