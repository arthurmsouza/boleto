var moment = require('moment');
var fs = require('fs');

// lista das instituições financeiras (IFs)
var ifs;

// ler listas com as IFs
fs.readFile('./resource/users.json', 'utf8', function(err, data) {
    if (err) {
        return logger.error(err);
    }
    ifs = JSON.parse(data).authentication.users;
});

var propostaController = function(logger, chaincodeLib) {

    // Assinatura do beneficiario
    var assinaturaIfBeneficiario;

    var middleware = function(req, res, next) {
        next();
    };

    var registra = function(req, res) {
        console.log('##REGISTRAR');
        // Obtem qual o beneficiario para definir qual a assinatura
        switch (req.body.ifBeneficiaria) {
            case 'bancobrasil':
                assinaturaIfBeneficiario = ifs[3].assinatura;
                break;
            case 'bradesco':
                assinaturaIfBeneficiario = ifs[2].assinatura;
                break;
            case 'itau':
                assinaturaIfBeneficiario = ifs[1].assinatura;
                break;
            case 'santander':
                assinaturaIfBeneficiario = ifs[4].assinatura;
                break;
            default: // default definida como a do BB
                assinaturaIfBeneficiario = ifs[3].assinatura
                break;
        }

        
        //44 caracteres
        // Building our acceptance proposal that will be stored on the ledger
        //var aceiteProposta = {
        //    dataHoraAceite: req.body.dataHoraAceite,
        //    hashProposta: req.body.hashProposta,
        //    boleto: null,
        //    assinaturaIFBeneficiario: assinaturaIfBeneficiario,
        //    assinaturaDigitalBenef: req.body.assinaturaDigitalBenef
        //};
        var pessoaFisica = {
            id: req.body.nome,
            nome: req.body.nome,
            cpf: req.body.cpf
        };

        var pessoaJuridica = {
            id: req.body.nomeBeneficiaria,
            nome: req.body.nomeBeneficiaria,
            cnpj: req.body.cnpjBeneficiaria
        };

        var banco = {
            id: req.body.ifBeneficiaria,
            nome: req.body.ifBeneficiaria,
            cnpj: req.body.cnpjBeneficiaria
        };

        var boleto = {
            boletoId: req.body.hashProposta,
        };

        var aceiteProposta = {
            boletoId: req.body.hashProposta,
            instituicao: req.body.ifBeneficiaria,
            beneficiario: req.body.nomeBeneficiaria,
            pagador: req.body.nome,
            valor: req.body.valor
        };

        console.log('###ACEITE DE PROPOSTA', aceiteProposta);

        //gerarBoletoProposta(req.body, function(error, boletoProposta) {
            if (!req) {
                //logger.debug("Boleto gerado: ");
                //logger.debug(boletoProposta);

                //aceiteProposta.boleto = boletoProposta;

                 //Pessoa Fisica
                 logger.info('Criar Pessoa Fisica');
                chaincodeLib.cadastrarAceite(pessoaFisica, 'criarPessoa', function(error) {
                    if (error) {
                        logger.error('Aceite não cadastrado');
                        logger.debug(error);
                        res.status(500);
                        res.send('Internal server error');
                    } else {
                        logger.info('Aceite cadastrado');
                        res.status(200);
                        res.json(boletoProposta);
                    }
                });
                
                //Pessoa Juridica
                logger.info('Criar Pessoa Juridica');
                chaincodeLib.cadastrarAceite(pessoaJuridica, 'criarPessoa', function(error) {
                    if (error) {
                        logger.error('Aceite não cadastrado');
                        logger.debug(error);
                        res.status(500);
                        res.send('Internal server error');
                    } else {
                        logger.info('Aceite cadastrado');
                        res.status(200);
                        res.json(boletoProposta);
                    }
                });
                //Banco
                logger.info('Criar Banco');
                chaincodeLib.cadastrarAceite(banco, 'criarBanco', function(error) {
                    if (error) {
                        logger.error('Aceite não cadastrado');
                        logger.debug(error);
                        res.status(500);
                        res.send('Internal server error');
                    } else {
                        logger.info('Aceite cadastrado');
                        res.status(200);
                        res.json(boletoProposta);
                    }
                });
                
                //Boleto
                logger.info('Cadastro Boleto');
                chaincodeLib.cadastrarAceite(boleto, 'criarBoleto', function(error) {
                    if (error) {
                        logger.error('Aceite não cadastrado');
                        logger.debug(error);
                        res.status(500);
                        res.send('Internal server error');
                    } else {
                        logger.info('Aceite cadastrado');
                        res.status(200);
                        res.json(boletoProposta);
                    }
                });
                //Registrar Boleto
                logger.info('Registrando Boleto');
                //chamada Fabric SDK passando parametros a ser gravados no Ledger
                logger.info('Enviando uma proposta de transação [Inclusão do Aceite no Ledger]');
                chaincodeLib.cadastrarAceite(aceiteProposta, 'registrarBoleto', function(error) {
                    if (error) {
                        logger.error('Aceite não cadastrado');
                        logger.debug(error);
                        res.status(500);
                        res.send('Internal server error');
                    } else {
                        logger.info('Aceite cadastrado');
                        res.status(200);
                        res.json(boletoProposta);
                    }
                });
            } else {
                res.status(400);
                logger.error('Boleto não gerado');
                res.send('Bad Request');
                logger.debug(error);
            }
        //});
    };

    /**
     * Função para gerar um boleto de proposta
     * @param {*} obj Objeto javascript que contem as informações da proposta
     * @param {*} cb Função de callback para retorno da resposta
     */
    var gerarBoletoProposta = function(obj, cb) {
        try {
            //44 caracteres
            var linhaDigitavel = (Math.random() * Date.now() * 10000000).toString() + (Math.random() * Date.now() * 10000000).toString() + "000000";
            const DIAS_VENCIMENTO = 3;
            var dataVencimento = moment().add(DIAS_VENCIMENTO, 'day').locale('pt-BR').format('L'); // date + 3 dias

            logger.debug("DataVencimento: " + dataVencimento);
            var valor = obj.valor;
            var cpfcnpjPagador = obj.cpf;
            var nomePagador = obj.nome;
            var cnpjBeneficiario = obj.cnpjBeneficiaria;
            var nomeBeneficiario = obj.nomeBeneficiaria;


            if (!valor || !cpfcnpjPagador || !nomePagador || !cnpjBeneficiario || !nomeBeneficiario) {
                throw new Error('Campos invalidos para gerar boleto')
            } else {
                var boletoProposta = {
                    linhaDigitavel: linhaDigitavel,
                    dataVencimento: dataVencimento,
                    valor: valor,
                    cpfcnpjPagador: cpfcnpjPagador,
                    nomePagador: nomePagador,
                    cnpjBeneficiario: cnpjBeneficiario,
                    nomeBeneficiario: nomeBeneficiario
                };

                logger.debug(boletoProposta);
                return cb(null, boletoProposta);

            }
        } catch (error) {
            return cb(error, null);
        }

        logger.debug('boleto gerado');
    };

    var listarAceitesRegulador = function(req, res) {
        var aceitesLista;

        //chamada para SDK HyperLedger passando assinatura retorna lista de aceites no Ledger

        //ver assinatura regulador
        aceitesLista = [];

        logger.debug(aceiteslista);

        res.status(200);
        res.json(aceiteslista);
    };

    return {
        middleware: middleware,
        registra: registra,
        listarAceitesRegulador: listarAceitesRegulador,
    };
};

module.exports = propostaController;