/*
 *	Blockchain enrollment Library
 */

module.exports = function(logger) {
    var HFC = require('fabric-client');
    var path = require('path');
    var common = require('./common.js')(logger);
    var User = require('fabric-client/lib/User.js');
    var CaService = require('fabric-ca-client/lib/FabricCAClientImpl.js');
    var Orderer = require('fabric-client/lib/Orderer.js');
    var Peer = require('fabric-client/lib/Peer.js');
    var os = require('os');



    /**
     * Enroll a user
     * @param {*} logger Logger reference
     * @param {*} options Blockchain options (Instantiated Chaincode)
     * @param {*} cb callback response
     * options = {
    			peer_urls: ['array of peer grpc urls'],
    			channel_id: 'channel name',
    			uuid: 'unique name for this enollment',
    			ca_url: 'http://urlhere:port',
    			orderer_url: 'grpc://urlhere:port',
    			enroll_id: 'enrollId',
    			enroll_secret: 'enrollSecret',
    			msp_id: 'string',
    			pem: 'complete tls certificate'						<optional>
    			common_name: 'common name used in pem certificate' 	<optional>
    		}
     */
    var enroll = function(options, cb) {

        // setting enrollment object
        var enrollmentObj = {
            channel_id: options.app.channel_id,
            uuid: 'CIPvNext - Aciptance' + options.network_id + '-' + options.app.channel_id + '-' + options.peers[0].name,
            ca_url: options.cas[0].api,
            orderer_url: options.orderers[0].discovery,
            peer_urls: [options.peers[0].discovery],
            enroll_id: options.cas[0].users[0].enrollId,
            enroll_secret: options.cas[0].users[0].enrollSecret,
            msp_id: options.peers[0].msp_id,
            pem: options.tls_certificates.cert_1.pem,
            common_name: options.common_name || null
        };

        var client = null;
        var chain = {};
        try {
            client = new HFC();
            chain = client.newChain(enrollmentObj.channel_id);
        } catch (e) {
            logger.error(e); //it might error about 1 chain per network, but that's not a problem just continue
        }

        if (!enrollmentObj.uuid) {
            logger.error('cannot enroll with undefined uuid');
            if (cb) cb({ error: 'cannot enroll with undefined uuid' });
            return;
        }

        var debug = { // this is just for console printing, no PEM here
            peer_urls: enrollmentObj.peer_urls,
            channel_id: enrollmentObj.channel_id,
            uuid: enrollmentObj.uuid,
            ca_url: enrollmentObj.ca_url,
            orderer_url: enrollmentObj.orderer_url,
            enroll_id: enrollmentObj.enroll_id,
            enroll_secret: enrollmentObj.enroll_secret,
            msp_id: enrollmentObj.msp_id
        };
        logger.debug('[fcw] Going to enroll for mspId ', debug);

        // Make eCert kvs (Key Value Store)
        HFC.newDefaultKeyValueStore({
            path: path.join(os.homedir(), '.hfc-key-store/' + enrollmentObj.uuid) //store eCert in the kvs directory
        }).then(function(store) {
            client.setStateStore(store);
            return getSubmitter(client, enrollmentObj); //do most of the work here
        }).then(function(submitter) {

            chain.addOrderer(new Orderer(enrollmentObj.orderer_url, {
                pem: enrollmentObj.pem,
                'ssl-target-name-override': enrollmentObj.common_name //can be null if cert matches hostname
            }));

            try {
                for (var i in enrollmentObj.peer_urls) {
                    chain.addPeer(new Peer(enrollmentObj.peer_urls[i], {
                        pem: enrollmentObj.pem,
                        'ssl-target-name-override': enrollmentObj.common_name //can be null if cert matches hostname
                    }));
                    logger.debug('added peer', enrollmentObj.peer_urls[i]);
                }
            } catch (e) {
                //might error if peer already exists, but we don't care
            }
            try {
                chain.setPrimaryPeer(new Peer(enrollmentObj.peer_urls[0], {
                    pem: enrollmentObj.pem,
                    'ssl-target-name-override': enrollmentObj.common_name //can be null if cert matches hostname
                }));
                logger.debug('added primary peer', enrollmentObj.peer_urls[0]);
            } catch (e) {
                //might error b/c bugs, don't care
            }

            // --- Success --- //
            logger.debug('[fcw] Successfully got enrollment ' + enrollmentObj.uuid);
            if (cb) cb(null, { chain: chain, submitter: submitter });
            return;

        }).catch(

            // --- Failure --- //
            function(err) {
                logger.error('[fcw] Failed to get enrollment ' + enrollmentObj.uuid, err.stack ? err.stack : err);
                var formatted = common.format_error_msg(err);
                if (cb) cb(formatted);
                return;
            });
    }

    // Get Submitter - ripped this function off from fabric-client (from marbles example)
    function getSubmitter(client, enrollmentObj) {
        var member;
        return client.getUserContext(enrollmentObj.enroll_id).then((user) => {
            if (user && user.isEnrolled()) {
                logger.info('[fcw] Successfully loaded member from persistence');
                return user;
            } else {

                // Need to enroll it with CA server
                var ca_client = new CaService(enrollmentObj.ca_url);
                logger.debug('id', enrollmentObj.enroll_id, 'secret', enrollmentObj.enroll_secret); //dsh todo remove this
                logger.debug('msp_id', enrollmentObj.msp_id);
                return ca_client.enroll({
                    enrollmentID: enrollmentObj.enroll_id,
                    enrollmentSecret: enrollmentObj.enroll_secret

                    // Store Certs
                }).then((enrollment) => {
                    logger.info('[fcw] Usuário autenticado com sucesso \'' + enrollmentObj.enroll_id + '\'');
                    member = new User(enrollmentObj.enroll_id, client);

                    return member.setEnrollment(enrollment.key, enrollment.certificate, enrollmentObj.msp_id);

                    // Save Submitter Enrollment
                }).then(() => {
                    return client.setUserContext(member);

                    // Return Submitter Enrollment
                }).then(() => {
                    return member;

                    // Send Errors to Callback
                }).catch((err) => {
                    logger.error('[fcw] Failed to enroll and persist user. Error: ' + err.stack ? err.stack : err);
                    throw new Error('Failed to obtain an enrolled user');
                });
            }
        });
    }

    return {
        enroll: enroll
    }
}