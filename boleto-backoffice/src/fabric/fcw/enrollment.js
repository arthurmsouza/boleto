/*
 *	Blockchain enrollment Library
 */

module.exports = function(logger) {
 
    const { FileSystemWallet, Gateway } = require('fabric-network');
    const fs = require('fs');
    var path = require('path');
    const ccpPath = path.resolve(__dirname, '..', '..', '..', '..', '..','basic-network', 'connection.json');
    const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
    const ccp = JSON.parse(ccpJSON);


    var chainCodeEnroll = async function (cb){
    try { 
        // Create a new file system based wallet for managing identities.
        const walletPath = path.join(process.cwd(), 'wallet');
        const wallet = new FileSystemWallet(walletPath);
        console.log(`Wallet path: ${walletPath}`);
        logger.debug('Debug');
        // Check to see if we've already enrolled the user.
        const userExists = await wallet.exists('user1');
        if (!userExists) {
            console.log('An identity for the user "user1" do not exists in the wallet');
            return;
        }
        
        // Create a new gateway for connecting to our peer node.
        const gateway = new Gateway();
        await gateway.connect(ccp, { wallet, identity: 'user1', discovery: { enabled: true, asLocalhost: false } });

        // Get the network (channel) our contract is deployed to.
        const network = await gateway.getNetwork('mychannel');

        // Get the contract from the network.
        //const contract = network.getContract('boleto');

        console.log('###retornando network', network);
        if(cb) cb(null, { network: network, submitter: submitter })
        return;
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`);   
        return;
    }

    }

    
    //getUser().catch(err => console.error(err));
           
    return {
        chainCodeEnroll: chainCodeEnroll
    }
}