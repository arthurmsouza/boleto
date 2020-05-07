var express = require('express');

var ifRouter = express.Router();

var router = function(logger, chaincodeLib) {

    var ifController = require('../controller/ifController')(logger, chaincodeLib);
    // assegura as rotas através de um middleware
    ifRouter.use(ifController.middleware);

    /**
     * Rota para a página inicial da /if/
     */
    ifRouter.route('/')
        .get(ifController.getIf);

    /**
     * Rota para registrar o pagamento de um boleto
     */
    ifRouter.route('/registrarPagamento')
        .post(ifController.registrarPagamentoBoleto);

    return ifRouter;
};

module.exports = router;