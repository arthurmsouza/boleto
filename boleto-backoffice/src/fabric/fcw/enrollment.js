/*
 *	Blockchain enrollment Library
 */

module.exports =  function(logger) {
 
    const { FileSystemWallet, Gateway } = require('fabric-network');
    const fs = require('fs');
    var path = require('path');
    const ccpPath = path.resolve(__dirname, '..', '..', '..', '..', '..','basic-network', 'connection.json');
    const ccpJSON = fs.readFileSync(ccpPath, 'utf8');
    const ccp = JSON.parse(ccpJSON);

    async function connection() {

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

    var chainCodeEnroll =  async function (options,cb){
    try { 
        
        console.log('options',options);
        console.log('cb',cb);
        console.log('####network asyn teste');
        //var networkPromise = await connection();
        
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
         console.log('####network async teste2', network);
          // Get the contract from the network.
         //const contract = network.getContract('boleto');
        
       // console.log('####network asyn teste2', networkPromise);
       // networkPromise.then(network => {
       //     console.log('####print network',network);
       //     resp = network;
       //     if(cb) cb(null, {network: network})
            
       // }).catch(error=>{console.log('###catch erro',error)})
       //     ;
       // console.log('####network asyn teste fim', resp);
       // return resp;
       if(cb) cb(null, {network: networkPromise});
       return;

        
    } catch (error) {
        console.error(`Failed to evaluate transaction: ${error}`); 
        if (cb) cb({error: 'cannot enroll with undefined uuid' });  
        return;
    }

    }
           
    return {
        chainCodeEnroll: chainCodeEnroll
    }
}