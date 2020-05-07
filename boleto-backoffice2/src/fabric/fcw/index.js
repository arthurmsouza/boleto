module.exports = function(g_options, logger) {
	var enrollment = require('./enrollment')(logger);
    var queryCC = require('./queryCC')(logger);
    var invokeCC = require('./invokeCC')(g_options,logger);
	var queryPeer = require('./queryPeer.js')(logger);

    /*
     * Enrollment functions
    */
    var enroll = function(options, callback) {
        enrollment.enroll(options, callback);
    };

    /**
     * Query Chaincode
     */
     var queryChaincode = function(enrollObj, options, cb_done) {
        queryCC.query(enrollObj, options, cb_done);
     };

    /**
     * Invoke Chaincode
     */
     var invokeChaincode = function(enrollObj, options, cb_done) {
        invokeCC.invoke(enrollObj, options, cb_done);
     };

     /**
      *  Get Blockheight
      */
	var queryChannel = function(enrollObj, options, cb_done){
		queryPeer.query_channel(enrollObj, options, cb_done);
	};
    
    return {
        enroll: enroll,
        queryChaincode: queryChaincode,
        invokeChaincode: invokeChaincode,
        queryChannel: queryChannel
    };
}