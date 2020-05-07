// test libs
var chai = require('chai');
var chaiHttp = require('chai-http');
//var app = require('../app');
var should = chai.should();

chai.use(chaiHttp);

// gerar hash
var crypto = require('crypto');

describe("API Aceite de Proposta", function() {

    /**
     * Testes de registro de Aceite
     */
    describe('Registrar uma proposta de aceite', () => {
        var now;
        var aceite1;
        var aceite2;
        before((done) => {
            done();

        });

        it('Registra o primeiro aceite de proposta no Ledger', (done) => {
            now = new Date(Date.now());
            aceite1 = {
                nome: "Antonio Neves",
                cpf: "321.321.312-32",
                valor: "11.01",
                cnpjBeneficiaria: "03.143.327/0002-32",
                nomeBeneficiaria: "Editora April",
                assinaturaDigitalBenef: "April",
                dataHoraAceite: now.getDay() + "/" + (now.getMonth() + 1) + "/" + now.getFullYear() + " - " + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + ":" + now.getMilliseconds(),
                hashProposta: "",
                ifBeneficiaria: "itau"
            };
            aceite1.hashProposta = crypto.createHmac('sha256', JSON.stringify(aceite1).toString())
                .digest('hex');
            console.log(aceite1);
            console.log('');
            chai.request('http://localhost:6001')
                .post('/proposta/registrar/')
                .send(aceite1)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    console.log(err);
                    done();
                })
        });
        it('Registra o segundo aceite de proposta no Ledger', (done) => {
            now = new Date(Date.now());
            aceite2 = {
                nome: "Geraldo Santos",
                cpf: "321.321.312-32",
                valor: "11.02",
                cnpjBeneficiaria: "03.143.327/0002-32",
                nomeBeneficiaria: "Editora April",
                assinaturaDigitalBenef: "April",
                dataHoraAceite: now.getDay() + "/" + (now.getMonth() + 1) + "/" + now.getFullYear() + " - " + now.getHours() + ":" + now.getMinutes() + ":" + now.getSeconds() + ":" + now.getMilliseconds(),
                hashProposta: "",
                ifBeneficiaria: "itau"
            };
            aceite2.hashProposta = crypto.createHmac('sha256', JSON.stringify(aceite2).toString())
                .digest('hex');

            console.log(aceite2);
            chai.request('http://localhost:6001')
                .post('/proposta/registrar/')
                .send(aceite2)
                .end((err, res) => {
                    res.should.have.status(200);
                    res.body.should.be.a('object');
                    console.log(err);
                    done();
                })
        });
    });
});