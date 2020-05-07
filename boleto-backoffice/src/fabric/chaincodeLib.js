module.exports = function(options, fcw, logger) {
    /**
     * Attempt of enrollments
     */
    var attempt;

    /**
     * Authentication object obtained after enrollment
     */
    var enrollObj = null;

    async function connection() {
        const { FileSystemWallet, Gateway } = require('fabric-network');
        const fs = require('fs');
        var path = require('path');
        const ccpPath = path.resolve(__dirname, '..', '..', '..', '..','basic-network', 'connection.json');
        const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
        const ccp = JSON.parse(ccpJSON);

        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`xxxWallet path: ${walletPath}`);
       
        // Check to see if we've already enrolled the user.
        console.log('####user');
        const userExists = await wallet.exists('user1');
        console.log('####use2',userExists);
        if (!userExists) {
            console.log('An identity for the user "user1" do not exists in the wallet');
            return;
        }
        console.log('####user',userExists);
        console.log('####gateway');
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: true, asLocalhost: false } });
        console.log('####gateway fim');
        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');
        console.log('####network async', network);
         // Get the contract from the network.
        //const contract = network.getContract('boleto');
        
        return network;
      }

    var chainCodeEnroll =  async function(cb) {
        console.log('TTTTTTT conection unction chainCodeEnroll');
            // fcw.chainCodeEnroll(null,function(errCode, obj) {
            //        console.log('#####function chainCodeEnroll obj',obj)
            //        // uptading enrollObject with authentication parameters
            //        enrollObj = obj;
            //        if (cb) cb(null);
                
            //});
            //console.log('resp',enrollObj);
            
            await connection();
            
            console.log('AAAAAAAconection chainCodeEnroll',enrollObj);
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
        logger.debug('Consultando blockchain height...teste');
        console.log('########cb',cb);
        this.chainCodeEnroll();
        var network=enrollObj;
        console.log('@@@@@@@@@network',network);
        fcw.queryChannel(network, null, cb);
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