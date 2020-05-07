module.exports = function(g_options, logger) {
	var enrollment = require('./enrollment')(logger);
    var queryCC = require('./queryCC')(logger);
    var invokeCC = require('./invokeCC')(g_options,logger);
	var queryPeer = require('./queryPeer.js')(logger);


        /*
     * Enrollment functions
    */
    var chainCodeEnroll =  async function(options, callback) {
        await enrollment.chainCodeEnroll(options, callback);
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
        chainCodeEnroll : chainCodeEnroll,
        queryChaincode: queryChaincode,
        invokeChaincode: invokeChaincode,
        queryChannel: queryChannel
    };
}