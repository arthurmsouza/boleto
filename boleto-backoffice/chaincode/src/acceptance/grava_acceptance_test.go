package main

import (
	"encoding/json"
	"testing"
	"time"
)

//TestGravarAceiteProposta testa o comportamento esperado quando se grava um aceite de proposta
func TestGravarAceiteProposta(t *testing.T) {

	var database = MockedDatabase{values: make(map[string]string)}
	var gravaAceite = GravaAceite{}

	// Validar parametros corretos
	var aceiteIndex = AceiteIndex{}

	var aceiteIndexSerializado, _ = json.Marshal(aceiteIndex)

	database.PutState(AceiteIndexTable, aceiteIndexSerializado)

	var aceite = CriarAceiteProposta()
	aceite.DadosBoleto.Status = "" // na criacao o status não pode estar preenchido

	AdicionarMembros(&database)

	var aceiteSerializado, _ = json.Marshal(aceite)

	var args []string

	var err = gravaAceite.GravarAceite(&database, args)

	if err == nil {
		t.Error("Não deveria ser possível gravar sem parametros")
	}

	args = append(args, string(aceiteSerializado))

	err = gravaAceite.GravarAceite(&database, args)

	if err != nil {
		t.Error("O aceite deveria ter sido gravado, porém deu o erro '" + err.Error() + "'")
	}

	var aceiteAux AceiteProposta

	aceiteIndexSerializado, _ = database.GetState(AceiteIndexTable)
	aceiteSerializado, err = database.GetState(aceite.DadosBoleto.LinhaDigitavel)

	if err != nil {
		t.Error("O aceite deveria ter sido gravado no ledger")
	}

	json.Unmarshal(aceiteIndexSerializado, &aceiteIndex)

	if len(aceiteIndex.Aceites) != 1 {
		t.Error("O indice de aceites deveria conter exatamento 1 elemento")
	}
	if aceiteIndex.Aceites[0].AssinaturaIF != aceite.AssinaturaIF {
		t.Error("O indice deveria conter a mesma assinatura de IF do aceite")
	}
	if aceiteIndex.Aceites[0].LinhaDigitavel != aceite.DadosBoleto.LinhaDigitavel {
		t.Error("O indice deveria conter a mesma linha digitavel do boleto do aceite")
	}
	if aceiteIndex.Aceites[0].Status != "Pendente" {
		t.Error("O indice deveria conter o status 'Pendente' no momento de inclusão do boleto")
	}

	json.Unmarshal(aceiteSerializado, &aceiteAux)

	if aceiteAux.AssinaturaBeneficiario != aceite.AssinaturaBeneficiario {
		t.Error("A inclusão não deveria modificar a Assinatura do Beneficiario")
	}
	if aceiteAux.AssinaturaIF != aceite.AssinaturaIF {
		t.Error("A inclusão não deveria modificar a Assinatura da IF emissora do boleto")
	}
	if aceiteAux.DataRegistro != aceite.DataRegistro {
		t.Error("A inclusão não deveria modificar a data do registro do aceite")
	}
	if aceiteAux.HashProposta != aceite.HashProposta {
		t.Error("A inclusão não deveria modificar o hash da proposta")
	}
	if aceiteAux.NomeIfBeneficiario == "" {
		t.Error("A inclusão deveria modificar o nome da IF emissora do boleto")
	}
	if aceiteAux.DadosBoleto.CNPJBeneficiario != aceite.DadosBoleto.CNPJBeneficiario {
		t.Error("A inclusão não deveria modificar o CNPJ do beneficiario")
	}
	if aceiteAux.DadosBoleto.CPFCNPJ != aceite.DadosBoleto.CPFCNPJ {
		t.Error("A inclusão não deveria modificar o CPF/CNPJ")
	}
	if aceiteAux.DadosBoleto.DataVencimento != aceite.DadosBoleto.DataVencimento {
		t.Error("A inclusão não deveria modificar a data de vencimento do boleto")
	}
	if aceiteAux.DadosBoleto.LinhaDigitavel != aceite.DadosBoleto.LinhaDigitavel {
		t.Error("A inclusão não deveria modificar a linha digitável")
	}
	if aceiteAux.DadosBoleto.NomeBeneficiario != aceite.DadosBoleto.NomeBeneficiario {
		t.Error("A inclusão não deveria modificar o nome do beneficiario")
	}
	if aceiteAux.DadosBoleto.NomeIFPagadora != "" {
		t.Error("A inclusão não deveria colocar o nome da IF onde foi pago o boleto")
	}
	if aceiteAux.DadosBoleto.NomePagador != aceite.DadosBoleto.NomePagador {
		t.Error("A inclusão não deveria alterar o nome do pagador")
	}
	if aceiteAux.DadosBoleto.Status != "Pendente" {
		t.Error("A inclusão do boleto deveria alterar o status para 'Pendente'")
	}
	if aceiteAux.DadosBoleto.ValorBoleto != aceite.DadosBoleto.ValorBoleto {
		t.Error("A inclusão do boleto não deveria alterar o valor do boleto")
	}
	if aceiteAux.DadosBoleto.AssinaturaIFPagadora != "" {
		t.Error("A inclusão não deveria colocar a assinatura da IF pagadora no boleto")
	}

	// Validar reinclusão
	err = gravaAceite.GravarAceite(&database, args)

	if err == nil {
		t.Error("Não deveria fazer inclusão de um boleto que já está na base")
	}

	// Validar json mal formatado

	args[0] = "{}}"

	err = gravaAceite.GravarAceite(&database, args)

	if err == nil {
		t.Error("Não deveria ser possível gravar no ledger um aceite com Json mal formatado")
	}

	// Validar json injection
	aceite = CriarAceiteProposta()

	aceiteSerializado, _ = json.Marshal(aceite)

	args[0] = string(aceiteSerializado)

	err = gravaAceite.GravarAceite(&database, args)

	if err == nil {
		t.Error("Não deveria ser possível gravar no ledger um aceite com status no boleto")
	}

	aceite.DadosBoleto.Status = ""
	aceite.DadosBoleto.AssinaturaIFPagadora = "123123"

	aceiteSerializado, _ = json.Marshal(aceite)

	args[0] = string(aceiteSerializado)

	err = gravaAceite.GravarAceite(&database, args)

	if err == nil {
		t.Error("Não deveria ser possível gravar no ledger um aceite com a assinatura da IF pagadora no boleto")
	}

	aceite.DadosBoleto.AssinaturaIFPagadora = ""
	aceite.DadosBoleto.NomeIFPagadora = "123"

	aceiteSerializado, _ = json.Marshal(aceite)

	args[0] = string(aceiteSerializado)

	err = gravaAceite.GravarAceite(&database, args)

	if err == nil {
		t.Error("Não deveria ser possível gravar no ledger um aceite com o nome da IF pagadora no boleto")
	}

	aceite.DadosBoleto.NomeIFPagadora = ""
	// Validar inclusao de boleto vencido
	var expiredDate = time.Now()
	expiredDate = expiredDate.AddDate(0, 0, -1)

	aceite.DadosBoleto.DataVencimento = expiredDate.Format("02/01/2006")

	aceiteSerializado, _ = json.Marshal(aceite)

	args[0] = string(aceiteSerializado)

	err = gravaAceite.GravarAceite(&database, args)

	if err == nil {
		t.Error("Não deveria ser possível gravar no ledger um aceite com o boleto vencido")
	}

	// Validar inclusao por IF que não é membro
	aceite = CriarAceiteProposta()
	aceite.AssinaturaIF = "123123"

	aceiteSerializado, _ = json.Marshal(aceite)

	args[0] = string(aceiteSerializado)

	err = gravaAceite.GravarAceite(&database, args)

	if err == nil {
		t.Error("Não deveria ser possível gravar no ledger um aceite enviado com a assinatura desconhecida")
	}

}
