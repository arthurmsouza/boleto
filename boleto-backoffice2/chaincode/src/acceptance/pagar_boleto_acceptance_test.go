package main

import (
	"encoding/json"
	"testing"
	"time"
)

//TestPagamentoBoletoProposta testa o comportamento esperado quando se paga um boleto de proposta
func TestPagamentoBoletoProposta(t *testing.T) {

	var database = MockedDatabase{values: make(map[string]string)}

	var index = AceiteIndex{}

	var aceite = CriarAceiteProposta()

	var aceitePart = AceitePart{
		AssinaturaIF:   aceite.AssinaturaIF,
		LinhaDigitavel: aceite.DadosBoleto.LinhaDigitavel,
		Status:         aceite.DadosBoleto.Status,
	}

	index.Aceites = append(index.Aceites, aceitePart)

	var indexSerializado, _ = json.Marshal(index)
	var aceiteSerializado, _ = json.Marshal(aceite)

	database.PutState(AceiteIndexTable, indexSerializado)
	database.PutState(aceite.DadosBoleto.LinhaDigitavel, aceiteSerializado)

	AdicionarMembros(&database)

	var pagaBoletoAceite = PagaBoletoAceite{}

	var args []string
	args = append(args, aceite.DadosBoleto.LinhaDigitavel)
	args = append(args, "ITAUd829b5213ca8e49c2c4c1ee7629076fe")

	var err = pagaBoletoAceite.PagarBoleto(&database, args)

	if err != nil {
		t.Error("Erro ao tentar gravar o boleto: '" + err.Error() + "'")
	}

	indexSerializado, _ = database.GetState(AceiteIndexTable)
	aceiteSerializado, _ = database.GetState(aceite.DadosBoleto.LinhaDigitavel)

	var aceiteAux AceiteProposta

	json.Unmarshal(indexSerializado, &index)
	json.Unmarshal(aceiteSerializado, &aceiteAux)

	var aceitePartAux = index.Aceites[0]

	if len(index.Aceites) != 1 {
		t.Error("O pagamento do boleto não deveria adicionar elementos no indice")
	}
	if aceitePartAux.LinhaDigitavel != aceitePart.LinhaDigitavel {
		t.Error("O pagamento do boleto não deveria modificar a linha digitável no Indice")
	}
	if aceitePartAux.AssinaturaIF != aceitePart.AssinaturaIF {
		t.Error("O pagamento do boleto não deveria modificar a Assinatura da IF emissora do boleto no Indice")
	}
	if aceitePartAux.Status != "Pago" {
		t.Error("O pagamento deveria atualizar o status do boleto no Indice para pago")
	}
	if aceiteAux.AssinaturaBeneficiario != aceite.AssinaturaBeneficiario {
		t.Error("O pagamento não deveria modificar a Assinatura do Beneficiario")
	}
	if aceiteAux.AssinaturaIF != aceite.AssinaturaIF {
		t.Error("O pagamento não deveria modificar a Assinatura da IF emissora do boleto")
	}
	if aceiteAux.DataRegistro != aceite.DataRegistro {
		t.Error("O pagamento não deveria modificar a data do registro do aceite")
	}
	if aceiteAux.HashProposta != aceite.HashProposta {
		t.Error("O pagamento não deveria modificar o hash da proposta")
	}
	if aceiteAux.NomeIfBeneficiario != aceite.NomeIfBeneficiario {
		t.Error("O pagamento não deveria modificar o nome da IF emissora do boleto")
	}
	if aceiteAux.DadosBoleto.CNPJBeneficiario != aceite.DadosBoleto.CNPJBeneficiario {
		t.Error("O pagamento não deveria modificar o CNPJ do beneficiario")
	}
	if aceiteAux.DadosBoleto.CPFCNPJ != aceite.DadosBoleto.CPFCNPJ {
		t.Error("O pagamento não deveria modificar o CPF/CNPJ")
	}
	if aceiteAux.DadosBoleto.DataVencimento != aceite.DadosBoleto.DataVencimento {
		t.Error("O pagamento não deveria modificar a data de vencimento do boleto")
	}
	if aceiteAux.DadosBoleto.LinhaDigitavel != aceite.DadosBoleto.LinhaDigitavel {
		t.Error("O pagamento não deveria modificar a linha digitável")
	}
	if aceiteAux.DadosBoleto.NomeBeneficiario != aceite.DadosBoleto.NomeBeneficiario {
		t.Error("O pagamento não deveria modificar o nome do beneficiario")
	}
	if aceiteAux.DadosBoleto.NomeIFPagadora == "" {
		t.Error("O pagamento deveria colocar o nome da IF onde foi pago o boleto")
	}
	if aceiteAux.DadosBoleto.AssinaturaIFPagadora == "" {
		t.Error("O pagamento deveria colocar a assinatura da IF pagadora no boleto")
	}
	if aceiteAux.DadosBoleto.NomePagador != aceite.DadosBoleto.NomePagador {
		t.Error("O pagamento não deveria alterar o nome do pagador")
	}
	if aceiteAux.DadosBoleto.Status != "Pago" {
		t.Error("O pagamento do boleto deveria alterar o status para 'pago'")
	}
	if aceiteAux.DadosBoleto.ValorBoleto != aceite.DadosBoleto.ValorBoleto {
		t.Error("O pagamento do boleto não deveria alterar o valor do boleto")
	}

	err = pagaBoletoAceite.PagarBoleto(&database, args)

	if err == nil {
		t.Error("O pagamento não deveria ser realizado se o boleto já tivesse sido pago")
	}

	args[0] = "123"

	err = pagaBoletoAceite.PagarBoleto(&database, args)

	if err == nil {
		t.Error("O pagamento não deveria finalizar com sucesso se não encontrar o boleto")
	}

	args[0] = aceite.DadosBoleto.LinhaDigitavel

	var expiredDate = time.Now()
	expiredDate = expiredDate.AddDate(0, 0, -1)

	aceite.DadosBoleto.DataVencimento = expiredDate.Format("02/01/2006")
	aceite.DadosBoleto.Status = "Pendente"
	aceiteSerializado, _ = json.Marshal(aceite)

	database.PutState(aceite.DadosBoleto.LinhaDigitavel, aceiteSerializado)

	err = pagaBoletoAceite.PagarBoleto(&database, args)

	if err == nil {
		t.Error("O pagamento não deveria ser realizado se o boleto estiver vencido")
	}

}
