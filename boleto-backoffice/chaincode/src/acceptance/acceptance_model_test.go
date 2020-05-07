package main

import (
	"encoding/json"
	"testing"
	"time"
)

func boletoValido(boleto *BoletoProposta) bool {
	var valido, _ = boleto.IsValid()

	return valido
}

//TestBoletoProposta testa as funcionalidades da struct BoletoProposta
func TestBoletoProposta(t *testing.T) {
	var boleto = new(BoletoProposta)

	if boletoValido(boleto) {
		t.Error("Boleto de Proposta não pode ser válido se não possuir nenhum valor preenchido")
	}

	boleto = CriarBoletoProposta()

	if !boletoValido(boleto) {
		t.Error("Boleto de proposta deve ser considerado valido")
	}

	boleto.CPFCNPJ = ""

	if boletoValido(boleto) {
		t.Error("O boleto de proposta precisa ter um CPF ou CNPJ")
	}

	boleto.CPFCNPJ = "123123123"
	boleto.DataVencimento = ""

	if boletoValido(boleto) {
		t.Error("O boleto precisa de uma data de vencimento")
	}

	boleto.DataVencimento = "2015-10-07"

	if boletoValido(boleto) {
		t.Error("Formato de data de vencimento esta fora do esperado. Formato esperado DD/MM/AAAA")
	}

	var expiredDate = time.Now()
	expiredDate = expiredDate.AddDate(0, 0, -1)

	boleto.DataVencimento = expiredDate.Format("02/01/2006")

	if !boleto.IsExpired() {
		t.Error("Boleto deveria ser considerado vencido")
	}

	var notExpiredDate = time.Now()

	boleto.DataVencimento = notExpiredDate.Format("02/01/2006")

	if boleto.IsExpired() {
		t.Error("Boleto não deveria ser considerado vencido")
	}

	notExpiredDate.AddDate(0, 0, 1)

	if boleto.IsExpired() {
		t.Error("Boleto não deveria ser considerado vencido")
	}

	boleto.LinhaDigitavel = ""

	if boletoValido(boleto) {
		t.Error("O boleto precisa de uma linha digitavel")
	}

	boleto.LinhaDigitavel = "123123123"
	boleto.Status = "teste"

	if boletoValido(boleto) {
		t.Error("Os únicaos status validos para o boleto são: 'Pendente', 'Pago' e 'Vencido'")
	}
}

func aceiteValido(aceite *AceiteProposta) bool {
	var valido, _ = aceite.IsValid()

	return valido
}

func TestAceiteProposta(t *testing.T) {
	var aceite = new(AceiteProposta)
	aceite.DadosBoleto = new(BoletoProposta)

	if aceiteValido(aceite) {
		t.Error("O aceite vazio não pode ser válido")
	}

	aceite = CriarAceiteProposta()

	if !aceiteValido(aceite) {
		t.Error("O aceite deveria ser valido")
	}

	aceite.AssinaturaBeneficiario = ""

	if aceiteValido(aceite) {
		t.Error("O aceite precisa ter a Assinatura do Beneficiario")
	}

	aceite.AssinaturaBeneficiario = "123123123"
	aceite.AssinaturaIF = ""

	if aceiteValido(aceite) {
		t.Error("O aceite precisa ter a Assinatura do Beneficiario")
	}

	aceite.AssinaturaIF = "123123"
	aceite.DadosBoleto = new(BoletoProposta)

	if aceiteValido(aceite) {
		t.Error("O aceite precisa ter um boleto de proposta valido")
	}

	aceite.DadosBoleto = CriarBoletoProposta()
	aceite.DataRegistro = ""

	if aceiteValido(aceite) {
		t.Error("O aceite precisa ter uma data de registro")
	}

	aceite.DataRegistro = "123123123"
	aceite.HashProposta = ""

	if aceiteValido(aceite) {
		t.Error("O aceite precisa ter um hash de proposta")
	}

}

func TestUnmarshaling(t *testing.T) {

	var aceite *AceiteProposta
	var jsonValue string

	aceite = new(AceiteProposta)
	aceite.DadosBoleto = new(BoletoProposta)

	jsonValue = "{\"assinaturaIFBeneficiario\": \"itau\", \"assinaturaDigitalBenef\": \"abril\",\"dataHoraAceite\": \"1491941366302\",\"hashProposta\": \"23irh32irh239r3rijfheeeei22@\",\"boleto\": {\"linhaDigitavel\": \"234092384923843234\",\"dataVencimento\": \"15/04/2017\",\"valor\": \"50.00\",\"cpfcnpjPagador\": \"32437389811\",\"nomePagador\": \"Jose da Silva\",\"cnpjBeneficiario\": \"19333513000142\",\"nomeBeneficiario\": \"Editora Abril\"}}"

	var err = json.Unmarshal([]byte(jsonValue), &aceite)

	aceite.DadosBoleto.Status = "Pendente"

	if !aceiteValido(aceite) {
		if err != nil {
			t.Error(err.Error())
		} else {
			t.Error("JSON invalido!")
		}
	}

}

func TestIndiceAceite(t *testing.T) {
	var aceiteIndex = AceiteIndex{}

	var aceiteSerializado, err = json.Marshal(aceiteIndex)

	if err != nil {
		t.Error(err.Error())
	}

	err = json.Unmarshal(aceiteSerializado, &aceiteIndex)

	if err != nil {
		t.Error(err.Error())
	}

	var aceiteProposta = CriarAceiteProposta()
	var aceitePart = AceitePart{
		AssinaturaIF:   aceiteProposta.DadosBoleto.AssinaturaIFPagadora,
		LinhaDigitavel: aceiteProposta.DadosBoleto.LinhaDigitavel,
		Status:         aceiteProposta.DadosBoleto.Status,
	}

	aceiteIndex.Aceites = append(aceiteIndex.Aceites, aceitePart)

	if aceiteIndex.Aceites == nil {
		t.Error("Não fez o append!!!")
	}

	aceiteSerializado, err = json.Marshal(aceiteIndex)

}
