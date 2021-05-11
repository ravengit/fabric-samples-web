const BlockchainHelper = require('../helpers/BlockchainHelper')
const StringHelper = require('../helpers/StringHelper')
const Constants = require('../config/constants')
const faker = require('faker');

//
// GET /api/asset/enroll
//
exports.enroll = async (req, res) => {
    
    try {
		const ccp = BlockchainHelper.buildCCP();
		const caClient = BlockchainHelper.buildCAClient(ccp);
        const wallet = await BlockchainHelper.buildWallet();
		await BlockchainHelper.enrollAdmin(caClient, wallet, Constants.ORG_MSP);
		await BlockchainHelper.registerAndEnrollUser(caClient, wallet, Constants.ORG_MSP, Constants.ORG_USER_ID, Constants.ORG_DEPARTMENT);
        res.send({message: 'Admin & appUser enrolled successfully'})
    } catch (error) {
        console.error(`Failed to enroll admin & appUser: ${error.message}`);
        console.error( error.stack );
        res.send({message: 'Failed to enroll admin & appUser'})
    }

}

//
// GET /api/asset/initPrivateData
//
exports.initPrivateData = async (req, res) => {

    let gateway;            

    try {
        gateway = await BlockchainHelper.getGateway();
        let network = await BlockchainHelper.getNetwork(gateway, Constants.CHANNEL_NAME);
        let contract = BlockchainHelper.getContract(network, Constants.CHAINCODE_NAME);
        // Initialize a set of asset data on the channel using the chaincode 'InitLedger' function.
        // This type of transaction would only be run once by an application the first time it was started after it
        // deployed the first time. Any updates to the chaincode deployed later would likely not need to run
        // an "init" type function.
        console.log('--> Submit Transaction: InitPrivateData, function creates the initial set of assets on the private data collection');
        await contract.submitTransaction('InitPrivateData');
        console.log('*** Result: committed');
        res.send({message: 'InitPrivateData ran successfully'})
    } catch (error) {
        console.error(`InitPrivateData failed to run: ${error.message}`);
        console.error( error.stack );
        res.send({message: 'InitPrivateData failed to run'})
    } finally {
        console.log('Disconnect from Fabric gateway.');    
        if (gateway != null) { gateway.disconnect(); }
    }

}

//
// GET /api/asset/getAllPrivateData
//
exports.getAllPrivateData = async (req, res) => {

    let gateway;            

    try {
        gateway = await BlockchainHelper.getGateway();
        let network = await BlockchainHelper.getNetwork(gateway, Constants.CHANNEL_NAME);
        let contract = BlockchainHelper.getContract(network, Constants.CHAINCODE_NAME);
        console.log('--> Submit Transaction: GetAllPrivateData, function returns all the current assets on the ledger');
        let result = await contract.submitTransaction('GetAllPrivateData');
        res.send({getAllPrivateData: StringHelper.toJSONObject(result)})
    } catch (error) {
        console.error(`GetAllPrivateData failed to run: ${error.message}`);
        console.error( error.stack );
        res.send({message: 'GetAllPrivateData failed to run'})
    } finally {
        console.log('Disconnect from Fabric gateway.');    
        if (gateway != null) { gateway.disconnect(); }
    }

}

//
// GET /api/asset/createPrivateData
//
exports.createPrivateData = async (req, res) => {

    let gateway;            

    try {
        gateway = await BlockchainHelper.getGateway();
        let network = await BlockchainHelper.getNetwork(gateway, Constants.CHANNEL_NAME);
        let contract = BlockchainHelper.getContract(network, Constants.CHAINCODE_NAME);
        console.log('--> Submit Transaction: CreatePrivateData, creates new asset with ID, color, owner, size, and appraisedValue arguments');

        const asset = {
            ID:  Buffer.from(`asset${faker.datatype.number()}`),
            Color: Buffer.from(faker.commerce.color()),
            Size: Buffer.from(faker.datatype.number().toString()),
            Owner: Buffer.from(faker.name.firstName()),
            AppraisedValue: Buffer.from(faker.datatype.number().toString())
        }

        const result = await contract.createTransaction('CreatePrivateData')
                        .setTransient(asset)
                        .submit();        

        res.send({createPrivateData: StringHelper.toJSONObject(result)})
    } catch (error) {
        console.error(`createPrivateData failed to run: ${error.message}`);
        console.error( error.stack );
        res.send({message: 'createPrivateData failed to run'})
    } finally {
        console.log('Disconnect from Fabric gateway.');    
        if (gateway != null) { gateway.disconnect(); }
    }

}

//
// GET /api/asset/readPrivateData
//
exports.readPrivateData = async (req, res) => {

    let gateway;            
    let assetId = req.query.assetId || 'asset103'

    try {
        gateway = await BlockchainHelper.getGateway();
        let network = await BlockchainHelper.getNetwork(gateway, Constants.CHANNEL_NAME);
        let contract = BlockchainHelper.getContract(network, Constants.CHAINCODE_NAME);
        console.log('\n--> Submit Transaction: ReadPrivateData, function returns an asset with a given assetID');
        result = await contract.submitTransaction('ReadPrivateData', assetId);
        res.send({readPrivateData: StringHelper.toJSONObject(result)})
    } catch (error) {
        console.error(`readPrivateData failed to run: ${error.message}`);
        console.error( error.stack );
        res.send({message: 'readPrivateData failed to run'})
    } finally {
        console.log('Disconnect from Fabric gateway.');    
        if (gateway != null) { gateway.disconnect(); }
    }

}

//
// GET /api/asset/updatePrivateData
//
exports.updatePrivateData = async (req, res) => {

    let gateway;            
    let assetId = req.query.assetId || 'asset103'

    try {
        gateway = await BlockchainHelper.getGateway();
        let network = await BlockchainHelper.getNetwork(gateway, Constants.CHANNEL_NAME);
        let contract = BlockchainHelper.getContract(network, Constants.CHAINCODE_NAME);

        const asset = {
            ID:  Buffer.from(assetId),
            Color: Buffer.from(faker.commerce.color()),
            Size: Buffer.from(faker.datatype.number().toString()),
            Owner: Buffer.from(faker.name.firstName()),
            AppraisedValue: Buffer.from(faker.datatype.number().toString())
        }

        console.log(`--> Submit Transaction: UpdatePrivateData ${assetId}, change all of its values`);
        await contract.createTransaction('UpdatePrivateData')
                .setTransient(asset)
                .submit();        

        console.log('--> Submit Transaction: ReadPrivateData, function returns an asset with a given assetID');
        result = await contract.submitTransaction('ReadPrivateData', assetId);
    
        res.send({status: 'OK', afterUpdatePrivateDataAssetValues: StringHelper.toJSONObject(result)})
    } catch (error) {
        console.error(`updatePrivateData failed to run: ${error.message}`);
        console.error( error.stack );
        res.send({message: 'updatePrivateData failed to run'})
    } finally {
        console.log('Disconnect from Fabric gateway.');    
        if (gateway != null) { gateway.disconnect(); }
    }

}

//
// GET /api/asset/transferPrivateData
//
exports.transferPrivateData = async (req, res) => {

    let gateway;            
    let assetId = req.query.assetId || 'asset103'
    let newOwner = faker.name.firstName()

    try {
        gateway = await BlockchainHelper.getGateway();
        let network = await BlockchainHelper.getNetwork(gateway, Constants.CHANNEL_NAME);
        let contract = BlockchainHelper.getContract(network, Constants.CHAINCODE_NAME);

        const asset = {
            ID:  Buffer.from(assetId),
            Owner: Buffer.from(faker.name.firstName()),
        }

        console.log(`--> Submit Transaction: TransferPrivateData ${assetId} to new owner ${newOwner}`);
        await contract.createTransaction('TransferPrivateData')
                .setTransient(asset)
                .submit();        

        console.log('--> Submit Transaction: ReadPrivateData, function returns an asset with a given assetID');
        result = await contract.submitTransaction('ReadPrivateData', assetId);
    
        res.send({status: 'OK', afterTransferPrivateDataAssetValues: StringHelper.toJSONObject(result)})
    } catch (error) {
        console.error(`updatePrivateData failed to run: ${error.message}`);
        console.error( error.stack );
        res.send({message: 'updatePrivateData failed to run'})
    } finally {
        console.log('Disconnect from Fabric gateway.');    
        if (gateway != null) { gateway.disconnect(); }
    }

}


//
// GET /api/asset/initLedger
//
exports.initLedger = async (req, res) => {

    let gateway;            

    try {
        gateway = await BlockchainHelper.getGateway();
        let network = await BlockchainHelper.getNetwork(gateway, Constants.CHANNEL_NAME);
        let contract = BlockchainHelper.getContract(network, Constants.CHAINCODE_NAME);
        // Initialize a set of asset data on the channel using the chaincode 'InitLedger' function.
        // This type of transaction would only be run once by an application the first time it was started after it
        // deployed the first time. Any updates to the chaincode deployed later would likely not need to run
        // an "init" type function.
        console.log('--> Submit Transaction: InitLedger, function creates the initial set of assets on the ledger');
        await contract.submitTransaction('InitLedger');
        console.log('*** Result: committed');
        res.send({message: 'InitLedger ran successfully'})
    } catch (error) {
        console.error(`InitLedger failed to run: ${error.message}`);
        console.error( error.stack );
        res.send({message: 'InitLedger failed to run'})
    } finally {
        console.log('Disconnect from Fabric gateway.');    
        if (gateway != null) { gateway.disconnect(); }
    }

}

//
// GET /api/asset/getAllAssets
//
exports.getAllAssets = async (req, res) => {

    let gateway;            

    try {
        gateway = await BlockchainHelper.getGateway();
        let network = await BlockchainHelper.getNetwork(gateway, Constants.CHANNEL_NAME);
        let contract = BlockchainHelper.getContract(network, Constants.CHAINCODE_NAME);
        console.log('--> Submit Transaction: GetAllAssets, function returns all the current assets on the ledger');
        let result = await contract.submitTransaction('GetAllAssets');
        res.send({getAllAssets: StringHelper.toJSONObject(result)})
    } catch (error) {
        console.error(`GetAllAssets failed to run: ${error.message}`);
        console.error( error.stack );
        res.send({message: 'GetAllAssets failed to run'})
    } finally {
        console.log('Disconnect from Fabric gateway.');    
        if (gateway != null) { gateway.disconnect(); }
    }

}

//
// GET /api/asset/createAsset
//
exports.createAsset = async (req, res) => {

    let gateway;            

    try {
        gateway = await BlockchainHelper.getGateway();
        let network = await BlockchainHelper.getNetwork(gateway, Constants.CHANNEL_NAME);
        let contract = BlockchainHelper.getContract(network, Constants.CHAINCODE_NAME);
        console.log('--> Submit Transaction: CreateAsset, creates new asset with ID, color, owner, size, and appraisedValue arguments');
        result = await contract.submitTransaction('CreateAsset', `asset${faker.datatype.number()}`, faker.commerce.color(), faker.datatype.number().toString(), faker.name.firstName(), faker.datatype.number());
        res.send({CreateAsset: StringHelper.toJSONObject(result)})
    } catch (error) {
        console.error(`createAsset failed to run: ${error.message}`);
        console.error( error.stack );
        res.send({message: 'createAsset failed to run'})
    } finally {
        console.log('Disconnect from Fabric gateway.');    
        if (gateway != null) { gateway.disconnect(); }
    }

}

//
// GET /api/asset/readAsset
//
exports.readAsset = async (req, res) => {

    let gateway;            
    let assetId = req.query.assetId || 'asset3'

    try {
        gateway = await BlockchainHelper.getGateway();
        let network = await BlockchainHelper.getNetwork(gateway, Constants.CHANNEL_NAME);
        let contract = BlockchainHelper.getContract(network, Constants.CHAINCODE_NAME);
        console.log('\n--> Submit Transaction: ReadAsset, function returns an asset with a given assetID');
        result = await contract.submitTransaction('ReadAsset', assetId);
        res.send({readAsset: StringHelper.toJSONObject(result)})
    } catch (error) {
        console.error(`readAsset failed to run: ${error.message}`);
        console.error( error.stack );
        res.send({message: 'readAsset failed to run'})
    } finally {
        console.log('Disconnect from Fabric gateway.');    
        if (gateway != null) { gateway.disconnect(); }
    }

}

//
// GET /api/asset/updateAsset
//
exports.updateAsset = async (req, res) => {

    let gateway;            
    let assetId = req.query.assetId || 'asset3'

    try {
        gateway = await BlockchainHelper.getGateway();
        let network = await BlockchainHelper.getNetwork(gateway, Constants.CHANNEL_NAME);
        let contract = BlockchainHelper.getContract(network, Constants.CHAINCODE_NAME);

        console.log(`--> Submit Transaction: UpdateAsset ${assetId}, change all of its values`);
        await contract.submitTransaction('UpdateAsset', assetId, faker.commerce.color(), faker.datatype.number().toString(), faker.name.firstName(), faker.datatype.number());

        console.log('\n--> Submit Transaction: ReadAsset, function returns an asset with a given assetID');
        result = await contract.submitTransaction('ReadAsset', assetId);
    
        res.send({status: 'OK', afterUpdateAssetValues: StringHelper.toJSONObject(result)})
    } catch (error) {
        console.error(`updateAsset failed to run: ${error.message}`);
        console.error( error.stack );
        res.send({message: 'updateAsset failed to run'})
    } finally {
        console.log('Disconnect from Fabric gateway.');    
        if (gateway != null) { gateway.disconnect(); }
    }

}

//
// GET /api/asset/transferAsset
//
exports.transferAsset = async (req, res) => {

    let gateway;            
    let assetId = req.query.assetId || 'asset3'
    let newOwner = faker.name.firstName()

    try {
        gateway = await BlockchainHelper.getGateway();
        let network = await BlockchainHelper.getNetwork(gateway, Constants.CHANNEL_NAME);
        let contract = BlockchainHelper.getContract(network, Constants.CHAINCODE_NAME);

        console.log(`--> Submit Transaction: TransferAsset ${assetId}, transfer to new owner of ${newOwner}`);
        await contract.submitTransaction('TransferAsset', assetId, newOwner);

        console.log('\n--> Submit Transaction: ReadAsset, function returns an asset with a given assetID');
        result = await contract.submitTransaction('ReadAsset', assetId);

        res.send({status: 'OK', afterTransferAssetValues: StringHelper.toJSONObject(result)})
    } catch (error) {
        console.error(`updateAsset failed to run: ${error.message}`);
        console.error( error.stack );
        res.send({message: 'updateAsset failed to run'})
    } finally {
        console.log('Disconnect from Fabric gateway.');    
        if (gateway != null) { gateway.disconnect(); }
    }

}


