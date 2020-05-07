var crypto = require('crypto');
var http = require('http');
var querystring = require('querystring');
var moment = require('moment');

// ID do Capturador (veículo que coletou a proposta)
const ID_CAPTURADOR = "Website Editora";
const CNPJ_BENEF = "03.143.327/0002-32";
const NOME_BENEF = "Editora BlockBR"
const ASSINATURA_DIGITAL_BENEF = "BlockBR";

// API Beneficiaria
var API_BENEF_HOST = '18.237.52.63';
var API_BENEF_PORT = 6001;

// local test API Beneficiaria
var API_BENEF_HOST_TEST = '18.237.52.63'; // test address, used when running locally
var API_BENEF_PORT_TEST = 6001; // test port, used when running locally
var propostaController = function() {

    // obtaining API hostname from cloud environment
    if (process.env.API_BENEF_HOSTNAME) {
        API_BENEF_HOST = process.env.API_BENEF_HOSTNAME;
        console.log("Using cloud environment's API host: " + API_BENEF_HOST + " : " + API_BENEF_PORT);
    } else {
        API_BENEF_HOST = API_BENEF_HOST_TEST;
        API_BENEF_PORT = API_BENEF_PORT_TEST;
        console.log('Using local API host: ' + API_BENEF_HOST + " : " + API_BENEF_PORT);
    }

    var adicionar = function(req, res) {

        // codigo mockado do id do capturador da proposta
        req.body.idCapturador = ID_CAPTURADOR;

        // obtém a data atual e a formata para envio ao Ledger
        var currenteDate = moment();
        var dataHora = currenteDate.locale('pt-BR').format('L') + ' - ' + currenteDate.locale('pt-BR').format('LTS')

        var aceiteProposta = {
            nome: req.body.nome,
            cpf: req.body.cpf,
            dataNascimento: req.body.dataNascimento,
            email: req.body.email,
            endereco: req.body.endereco,
            idCapturador: req.body.idCapturador,
            idProposta: req.body.idProposta,
            valor: req.body.valor,
            dataHoraRecebida: dataHora
        };

        gerarHashProposta(aceiteProposta, function(error, hash) {
            console.log("IF Beneficiaria selecionada: " + req.body.ifBeneficiaria);
            if (!error) {
                console.log("Hash gerado: " + hash);
                var proposta = {
                    nome: req.body.nome,
                    cpf: req.body.cpf,
                    valor: req.body.valor,
                    cnpjBeneficiaria: CNPJ_BENEF,
                    nomeBeneficiaria: NOME_BENEF,
                    assinaturaDigitalBenef: ASSINATURA_DIGITAL_BENEF,
                    dataHoraAceite: dataHora,
                    ifBeneficiaria: req.body.ifBeneficiaria,
                    hashProposta: hash
                };

               
                chamadaAPI(proposta, function(error, resposta) {
                    if (error) {
                        console.log("Erro na chamada de API: ");
                        console.log(error);
                        res.status(500);
                        res.json({ error: "Erro ao registrar no Ledger" });
                    } else {
                        console.log("Resposta da chamada de API: ");
                        console.log(resposta);
                        res.status(200);
                        res.json(resposta);
                    }
                });
                //aqui vai a resposta do boleto com os campos preenchidos
                //res.send("recebido")
            } else {
                console.log("Erro ao gerar hash de proposta: ");
                console.log(error);
                res.status(500);
                res.json({ error: "Erro ao gerar hash de proposta" });
            }
        });

    };

    /**
     * Realiza a chamada da API que
     * @param {*} aceiteProposta 
     * @param {*} cb callback
     */
    var chamadaAPI = function(aceiteProposta, cb) {


        console.log("Aceite de Proposta enviado para IF Beneficiaria: ");
        console.log(aceiteProposta);

        // An object of options to indicate where to post to
        var post_options = {
            host: API_BENEF_HOST,
            port: API_BENEF_PORT,
            path: '/proposta/registrar',
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
            //body: JSON.stringify(post_data)
        };

        // Set up the request
        var post_req = http.request(post_options, function(res) {
            console.log("Post_Options: ", post_options);

            var chunks = [];

            res.on("data", function(chunk) {
                chunks.push(chunk);
            });

            res.on("end", function() {
                var body = Buffer.concat(chunks);
                var body_data = body.toString()
                var responseObject;
                try {
                    responseObject = JSON.parse(body_data);
                    if (responseObject) {
                        cb(null, responseObject);
                    } else {
                        cb(body_data, null);
                    }
                } catch (error) {
                    cb(error, null);
                }


            });

        });

        post_req.on('error', function(error, resp) {
            console.log("erro:" + error);
            cb(error, null);
        });

        post_req.write(querystring.stringify(aceiteProposta));
        post_req.end();

    };

    /**
     * Função para transformar um objeto javascript em hash
     * @param {*} obj Objeto javascript que será utilizado para criação do hash
     * @param {*} cb Função de callback para retorno da resposta
     */
    var gerarHashProposta = function(obj, cb) {
        try {
            // transforma o objeto em texto JSON
            var txtAceiteProposta = JSON.stringify(obj);

            // cria o hash utilizando SHA256 
            return cb(null, crypto.createHmac('sha256', txtAceiteProposta.toString())
                .digest('hex'));

        } catch (error) {
            return cb(error, null);
        }
    }

    return {
        adicionar: adicionar
    };
};

module.exports = propostaController;