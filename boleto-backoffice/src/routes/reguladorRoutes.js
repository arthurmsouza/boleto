var express = require('express');

var reguladorRouter = express.Router();

var router = function(logger, chaincodeLib) {

    var reguladorController = require('../controller/reguladorController')(logger, chaincodeLib);
    // assegura as rotas através de um middleware
    reguladorRouter.use(reguladorController.middleware);

    // Setting route for /regulador
    reguladorRouter.route('/')
        .get(reguladorController.getRegulador);

    return reguladorRouter;
};

module.exports = router;