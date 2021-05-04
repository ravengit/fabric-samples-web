module.exports = app => {

    const assetCtrl = require("../controllers/asset.controller.js");

    var router = require("express").Router();

    router.get("/enroll", assetCtrl.enroll);
    router.get("/initLedger", assetCtrl.initLedger)
    router.get("/getAllAssets", assetCtrl.getAllAssets)
    router.get("/createAsset", assetCtrl.createAsset)
    router.get("/readAsset", assetCtrl.readAsset)
    router.get("/updateAsset", assetCtrl.updateAsset)
    router.get("/transferAsset", assetCtrl.transferAsset)

    app.use('/api/asset', router);

};
