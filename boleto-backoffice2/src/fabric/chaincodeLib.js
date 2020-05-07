module.exports = function(options, fcw, logger) {
    /**
     * Attempt of enrollments
     */
    var attempt;

    /**
     * Authentication object obtained after enrollment
     */
    var enrollObj = null;

    /**
     * Enroll an user admin in order to make requests
     * @param {*} attempt quantity of attempts
     * @param {*} cb 
     */
    var enrollAdmin = function(attempt, cb) {
        fcw.enroll(options.creds.credentials, function(errCode, obj) {
            if (errCode != null) {
                logger.error('could not enroll...');
                attempt = 0;
                // --- Try Again ---  //
                if (attempt >= 2) {
                    if (cb) cb(errCode);
                } else {
                    try {
                        logger.warn('removing older kvs and trying to enroll again');
                        rmdir(makeKVSpath()); //delete old kvs folder
                        logger.warn('removed older kvs');
                        enrollAdmin(++attempt, cb);
                    } catch (e) {
                        logger.error('could not delete old kvs', e);
                    }
                }
            } else {
                // uptading enrollObject with authentication parameters
                enrollObj = obj;
                if (cb) cb(null);
            }
        });
    }

    /**
     * Persist an register on the ledger
     * @param {*} aceiteProposta object to be stored on the ledger
     * @param {*} cb callback
     */
    var cadastrarAceite = function(aceiteProposta, cb) {
        console.log('');
        logger.info('Cadastrando um aceite...');
        if (enrollObj == null) {

            logger.error('enrollObj is null. Enroll an user first.');
            return cb({
                error: 'enrollObj not defined'
            }, null);
        }

        var jsonAceiteProposta = JSON.stringify(aceiteProposta);

        var opts = {
            channel_id: options.creds.credentials.app.channel_id,
            chaincode_id: options.creds.credentials.app.chaincode_id,
            chaincode_version: options.creds.credentials.app.chaincode_version,
            event_url: options.creds.credentials.peers[0].events,
            endorsed_hook: options.creds.credentials.endorsed_hook,
            ordered_hook: options.creds.credentials.ordered_hook,
            cc_function: 'cadastrar_aceite',
            cc_args: [jsonAceiteProposta],
            pem: options.creds.credentials.tls_certificates.cert_1.pem
        };

        fcw.invokeChaincode(enrollObj, opts, cb);
    };

    /**
     * Read all the acceptance for a financial institution
     * @param {*} assinaturaIFBeneficiario digital signature
     * @param {*} cb callback
     */
    var consultarAceite = function(assinaturaIFBeneficiario, cb) {
        console.log('');
        logger.info('Lendo aceites para a IF ' + assinaturaIFBeneficiario + '... ');

        var opts = {
            channel_id: options.creds.credentials.app.channel_id,
            chaincode_id: options.creds.credentials.app.chaincode_id,
            chaincode_version: options.creds.credentials.app.chaincode_version,
            cc_function: 'consultar_aceite',
            cc_args: [assinaturaIFBeneficiario]
        };
        fcw.queryChaincode(enrollObj, opts, function(err, resp) {
            if (err != null) {
                if (cb) return cb(err, resp);
            } else {
                if (resp.parsed == null) { //if nothing is here, no chaincode
                    if (cb) return cb({
                        error: 'chaincode not found'
                    }, resp);
                } else {
                    if (cb) return cb(null, resp);
                }
            }
        });
    }

    /**
     * 
     * @param {*} assinaturaIFBeneficiario digital signature
     * @param {*} cb callback
     */
    var consultarBoletosNaoPagos = function(assinaturaIFBeneficiario, cb) {
        console.log('');
        logger.info('Lendo boletos todos os boletos não pagos');

        var opts = {
            channel_id: options.creds.credentials.app.channel_id,
            chaincode_id: options.creds.credentials.app.chaincode_id,
            chaincode_version: options.creds.credentials.app.chaincode_version,
            cc_function: 'consultar_boletos_n_pagos',
            cc_args: [assinaturaIFBeneficiario]
        };
        fcw.queryChaincode(enrollObj, opts, function(err, resp) {
            if (err != null) {
                if (cb) return cb(err, resp);
            } else {
                if (resp.parsed == null) { //if nothing is here, no chaincode
                    if (cb) return cb({
                        error: 'chaincode not found'
                    }, resp);
                } else {
                    if (cb) return cb(null, resp);
                }
            }
        });
    };

    /**
     * Register a boleto's payment
     * @param {*} args Contains the linhaDigitavel and assinaturaIFPagadora
     * @param {*} cb 
     */
    var registrarPagamentoBoleto = function(args, cb) {
        logger.info('Registrando o pagamento do boleto...');
        if (enrollObj == null) {

            logger.error('enrollObj is null. Enroll an user first.');
            return cb({ error: 'enrollObj not defined' }, null);
        }

        var opts = {
            channel_id: options.creds.credentials.app.channel_id,
            chaincode_id: options.creds.credentials.app.chaincode_id,
            chaincode_version: options.creds.credentials.app.chaincode_version,
            event_url: options.creds.credentials.peers[0].events,
            endorsed_hook: options.creds.credentials.endorsed_hook,
            ordered_hook: options.creds.credentials.ordered_hook,
            cc_function: 'pagar_boleto',
            cc_args: [args.linhaDigitavel, args.assinaturaIF],
            pem: options.creds.credentials.tls_certificates.cert_1.pem
        };

        fcw.invokeChaincode(enrollObj, opts, cb);
    };

    // get block height
    var channelStats = function(cb) {
        logger.debug('Consultando blockchain height...');
        fcw.queryChannel(enrollObj, null, cb);
    };

    return {
        enrollAdmin: enrollAdmin,
        cadastrarAceite: cadastrarAceite,
        consultarAceite: consultarAceite,
        consultarBoletosNaoPagos: consultarBoletosNaoPagos,
        registrarPagamentoBoleto: registrarPagamentoBoleto,
        channelStats: channelStats
    }
};