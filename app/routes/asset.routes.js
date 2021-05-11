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

    router.get("/initPrivateData", assetCtrl.initPrivateData)
    router.get("/getAllPrivateData", assetCtrl.getAllPrivateData)
    router.get("/createPrivateData", assetCtrl.createPrivateData)
    router.get("/readPrivateData", assetCtrl.readPrivateData)
    router.get("/updatePrivateData", assetCtrl.updatePrivateData)
    router.get("/transferPrivateData", assetCtrl.transferPrivateData)

    app.use('/api/asset', router);

};
