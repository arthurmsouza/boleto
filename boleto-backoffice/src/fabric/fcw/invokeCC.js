module.exports = function(g_options, logger) {
    var utils = require('fabric-client/lib/utils.js');
    //var EventHub = require('fabric-client/lib/EventHub.js');
    var common = require('./common.js')(logger);

    if (!g_options) g_options = {};
    if (!g_options.block_delay) g_options.block_delay = 10000;


    /*
    	options: {
    				channel_id: "channel id",
    				chaincode_id: "chaincode id",
    				chaincode_version: "v0",
    				event_url: "peers event url",			<optional>
    				endorsed_hook: function(error, res){},	<optional>
    				ordered_hook: function(error, res){},	<optional>
    				cc_function: "function_name",
    				cc_args: ["argument 1"],
    				pem: 'complete tls certificate'			<optional>
    	}
    */
    var invoke = function(obj, options, cb) {
        logger.debug('[fcw] Invoking Chaincode: ' + options.cc_function + '()');
        var eventhub;
        var chain = obj.chain;
        var nonce = utils.getNonce();
        var cbCalled = false;

        // send proposal to endorser
        var request = {
            chainId: options.channel_id,
            chaincodeId: options.chaincode_id,
            chaincodeVersion: options.chaincode_version,
            fcn: options.cc_function,
            args: options.cc_args,
            //txId: chain.buildTransactionID(nonce, obj.submitter),
            txId: nonce,
            nonce: nonce,
        };
        logger.debug('[fcw] Sending invoke req', request);

        // Setup EventHub
        if (options.event_url) {
            logger.debug('[fcw] listening to event url', options.event_url);
            //eventhub = new EventHub();
            //const data = fs.readFileSync(path.join(__dirname, 'somepath/tlscacerts/org1.example.com-cert.pem'));
            //const peer = client.newPeer(
            //    'grpcs://localhost:7051',
            //    {
            //        pem: Buffer.from(data).toString(),
            //        'ssl-target-name-override': 'peer0.org1.example.com'
            //    }
            //);
            //const eventhub = channel.newChannelEventHub(peer);
            eventhub = chain.getChannelEventHubsForOrg(null);
            //antigo fabric client eventhub.setPeerAddr(options.event_url, {
            //    pem: options.pem,
            //    'ssl-target-name-override': options.common_name || null //can be null if cert matches hostname
            //});
            console.log('###EventHub',eventhub)
            //eventhub.connect(null,null);
        } else {
            logger.debug('[fcw] will not use tx event');
        }

        // Send Proposal
        chain.sendTransactionProposal(request).then(function(results) {

            // Check Response
            var request = common.check_proposal_res(results, options.endorsed_hook);
            return chain.sendTransaction(request);
        }).then(function(response) {

            // All good
            if (response.status === 'SUCCESS') {
                logger.debug('[fcw] Successfully ordered endorsement transaction.');

                // Call optional order hook
                if (options.ordered_hook) options.ordered_hook(null, request.txId.toString());

                // ------- [A] Use Event for Tx Confirmation ------- // option A
                if (options.event_url) {
                    try {
                        // Watchdog for no block event
                        var watchdog = setTimeout(() => {
                            logger.error('[fcw] Failed to receive block event within the timeout period');

                            if (cb && !cbCalled) {
                                cbCalled = true;
                                return cb(null); //timeout pass it back
                            } else return;
                        }, g_options.block_delay + 2000);

                        // Wait for tx committed event
                        eventhub.registerTxEvent(request.txId.toString(), (tx, code) => {
                            logger.info('[fcw] A transação foi realizada com sucesso:', code);
                            clearTimeout(watchdog);

                            if (code !== 'VALID') {
                                if (cb && !cbCalled) {
                                    cbCalled = true;
                                    return cb(common.format_error_msg('Commit code: ' + code)); //pass error back
                                } else return;
                            } else {
                                if (cb && !cbCalled) {
                                    cbCalled = true;
                                    return cb(null); //all good, pass it back
                                } else return;
                            }
                        });
                    } catch (e) {
                        logger.error('[fcw] Illusive event error: ', e); //not sure why this happens, seems rare 3/27/2017
                        if (cb && !cbCalled) {
                            cbCalled = true;
                            return cb(e); //all terrible, pass it back
                        } else return;
                    }

                    // ------- [B] Wait xxxx ms for Block  ------- // option B
                } else {
                    setTimeout(function() {
                        if (cb) return cb(null);
                        else return;
                    }, g_options.block_delay + 2000);
                }
            }

            // ordering failed, No good
            else {
                if (options.ordered_hook) options.ordered_hook('failed');
                logger.error('[fcw] Failed to order the transaction. Error code: ', response);
                throw response;
            }
        }).catch(function(err) {
            logger.error('[fcw] Error in invoke catch block', typeof err, err);

            var formatted = common.format_error_msg(err);
            if (options.ordered_hook) options.ordered_hook('failed', formatted);

            if (cb) return cb(formatted, null);
            else return;
        });
    };

    return {
        invoke: invoke
    }

}