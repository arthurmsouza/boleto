var express = require('express');

var propostaRouter = express.Router();


var router = function(logger, chaincodeLib) {
    var propostaController = require('../controller/propostaController')(logger, chaincodeLib);
    // assegura as rotas através de um middleware
    propostaRouter.use(propostaController.middleware);

    propostaRouter.route('/registrar')
        .post(propostaController.registra);

    propostaRouter.route('/aceitesregulador')
        .get(propostaController.listarAceitesRegulador);

    return propostaRouter;
};


//criar registrar
module.exports = router;