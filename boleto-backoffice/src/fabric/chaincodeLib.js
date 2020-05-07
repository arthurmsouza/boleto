module.exports = function(options, fcw, logger) {
    /**
     * Attempt of enrollments
     */
    var attempt;

    /**
     * Authentication object obtained after enrollment
     */

     var chaincode = null;

    var chainCodeEnroll = function() {
        ;(async () => {
            const obj = await fcw.chainCodeEnroll()
            console.log(obj)
            chaincode=obj
          })()
    }

    /**
     * Persist an register on the ledger
     * @param {*} aceiteProposta object to be stored on the ledger
     * @param {*} cb callback
     */
    var cadastrarAceite = function(aceiteProposta, cb) {
        console.log('');
        logger.info('Cadastrando um aceite...');
       

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

        fcw.invokeChaincode(chainCode, opts, cb);
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
        fcw.queryChaincode(chainCode, opts, function(err, resp) {
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
        fcw.queryChaincode(chainCode, opts, function(err, resp) {
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
        if (chainCode == null) {

            logger.error('chainCode is null. Enroll an user first.');
            return cb({ error: 'chainCode not defined' }, null);
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

        fcw.invokeChaincode(chainCode, opts, cb);
    };

    // get block height
    var channelStats = function(cb) {
        console.log('########fcw',fcw);
        chaincode= fcw.chainCodeEnroll();
        logger.debug('Consultando blockchain height...teste');
        console.log('########chaincode',chaincode);
        console.log('########cb',cb);
        fcw.queryChannel(chainCode, null, cb);
    };

    return {
        chainCodeEnroll :chainCodeEnroll,
        cadastrarAceite: cadastrarAceite,
        consultarAceite: consultarAceite,
        consultarBoletosNaoPagos: consultarBoletosNaoPagos,
        registrarPagamentoBoleto: registrarPagamentoBoleto,
        channelStats: channelStats
    }
};