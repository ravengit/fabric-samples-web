const { Wallet, Wallets, Gateway } = require('fabric-network');
const FabricCAServices = require('fabric-ca-client');
const Constants = require('../config/constants')
const fs = require('fs');

const funcs = {

    buildCCP: () => {
        const ccpPath = Constants.CONNECTION_PROFILE_PATH;
        const fileExists = fs.existsSync(ccpPath);
        if (!fileExists) {
            throw new Error(`no such file or directory: ${ccpPath}`);
        }
        const contents = fs.readFileSync(ccpPath, 'utf8');
        const ccp = JSON.parse(contents);
        console.log(`Loaded the network configuration located at ${ccpPath}`);
        return ccp;
    },

    buildCAClient: (ccp) => {
        const caInfo = ccp.certificateAuthorities[Constants.CA_HOST_NAME];
        const caTLSCACerts = caInfo.tlsCACerts.pem;
        const caClient = new FabricCAServices(caInfo.url, { trustedRoots: caTLSCACerts, verify: false }, caInfo.caName);
        console.log(`Built a CA Client named ${caInfo.caName}`);
        return caClient;
    },
    
    buildWallet: async () => {
        let walletPath = Constants.WALLET_PATH
        let wallet = new Wallet();
        if (walletPath) {
            wallet = await Wallets.newFileSystemWallet(walletPath);
            console.log(`Built a file system wallet at ${walletPath}`);
        } else {
            wallet = await Wallets.newInMemoryWallet();
            console.log('Built an in memory wallet');
        }
        return wallet;
    },

    enrollAdmin: async (caClient, wallet, orgMspId) => {
        // Check to see if we've already enrolled the admin user.
        const identity = await wallet.get(Constants.ADMIN_USER_ID);
        if (identity) {
            console.log('An identity for the admin user already exists in the wallet');
            return;
        }
        // Enroll the admin user, and import the new identity into the wallet.
        const enrollment = await caClient.enroll({ enrollmentID: Constants.ADMIN_USER_ID, enrollmentSecret: Constants.ADMIN_USER_PASSWORD });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: orgMspId,
            type: 'X.509',
        };
        await wallet.put(Constants.ADMIN_USER_ID, x509Identity);
        console.log('Successfully enrolled admin user and imported it into the wallet');
    },    

    registerAndEnrollUser: async (caClient, wallet, orgMspId, userId, affiliation) => {
        // Check to see if we've already enrolled the user
        const userIdentity = await wallet.get(userId);
        if (userIdentity) {
            console.log(`An identity for the user ${userId} already exists in the wallet`);
            return;
        }

        // Must use an admin to register a new user
        const adminIdentity = await wallet.get(Constants.ADMIN_USER_ID);
        if (!adminIdentity) {
            console.log('An identity for the admin user does not exist in the wallet');
            console.log('Enroll the admin user before retrying');
            return;
        }

        // build a user object for authenticating with the CA
        const provider = wallet.getProviderRegistry().getProvider(adminIdentity.type);
        const adminUser = await provider.getUserContext(adminIdentity, Constants.ADMIN_USER_ID);

        // Register the user, enroll the user, and import the new identity into the wallet.
        // if affiliation is specified by client, the affiliation value must be configured in CA
        const secret = await caClient.register({
            affiliation: affiliation,
            enrollmentID: userId,
            role: 'client'
        }, adminUser);
        const enrollment = await caClient.enroll({
            enrollmentID: userId,
            enrollmentSecret: secret
        });
        const x509Identity = {
            credentials: {
                certificate: enrollment.certificate,
                privateKey: enrollment.key.toBytes(),
            },
            mspId: orgMspId,
            type: 'X.509',
        };
        await wallet.put(userId, x509Identity);
        console.log(`Successfully registered and enrolled user ${userId} and imported it into the wallet`);
    },
    
    getGateway: async (org) => {

        const ccp = funcs.buildCCP()
        const walletPath = Constants.WALLET_PATH

        const wallet = await Wallets.newFileSystemWallet(walletPath);

        // Check to see if we've already enrolled the user.
        const identity = await wallet.get(Constants.ORG_USER_ID);
        if (!identity) {
            console.log("Identity appUser not found in wallet")
            return null;
        } else {
            const gateway = new Gateway();
            await gateway.connect(ccp, { wallet, identity: Constants.ORG_USER_ID, discovery: { enabled: true, asLocalhost: true } });
            return gateway    
        }

    },

    getNetwork: async (gateway, channelName) => {

        let network = await gateway.getNetwork(channelName);
        return network;

    },

    getContract: (network, contractName) => {

        let contract = network.getContract(contractName)
        return contract

    },

}

module.exports = funcs;
