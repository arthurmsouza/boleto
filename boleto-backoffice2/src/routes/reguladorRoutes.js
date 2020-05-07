var express = require('express');

var reguladorRouter = express.Router();

var router = function(logger) {

    var reguladorController = require('../controller/reguladorController')(logger);
    // assegura as rotas através de um middleware
    reguladorRouter.use(reguladorController.middleware);

    // Setting route for /regulador
    reguladorRouter.route('/')
        .get(reguladorController.getRegulador);

    return reguladorRouter;
};

module.exports = router;