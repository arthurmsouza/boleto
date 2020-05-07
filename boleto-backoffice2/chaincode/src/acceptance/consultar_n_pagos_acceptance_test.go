package main

import (
	"encoding/json"
	"testing"
)

//TestConsultaAceitePropostaNPagos testa o comportamento esperado da consulta de boletos não pagos
func TestConsultaAceitePropostaNPagos(t *testing.T) {

	var database = MockedDatabase{values: make(map[string]string)}
	var gravaAceite = GravaAceite{}
	var pagaAceite = PagaBoletoAceite{}
	var consulta = ConsultaBoletosNPagos{}

	// Validar parametros corretos
	var aceiteIndex = AceiteIndex{}

	var aceiteIndexSerializado, _ = json.Marshal(aceiteIndex)

	database.PutState(AceiteIndexTable, aceiteIndexSerializado)

	AdicionarMembros(&database)

	var aceite = CriarAceiteProposta()

	aceite.DadosBoleto.LinhaDigitavel = "1"
	aceite.DadosBoleto.Status = ""

	var aceiteSerializado, _ = json.Marshal(aceite)

	var args []string

	args = append(args, string(aceiteSerializado))

	gravaAceite.GravarAceite(&database, args)

	aceite.DadosBoleto.LinhaDigitavel = "2"
	aceite.DadosBoleto.Status = ""

	aceiteSerializado, _ = json.Marshal(aceite)

	args[0] = string(aceiteSerializado)

	gravaAceite.GravarAceite(&database, args)

	aceite.DadosBoleto.LinhaDigitavel = "3"
	aceite.DadosBoleto.Status = ""

	aceiteSerializado, _ = json.Marshal(aceite)

	args[0] = string(aceiteSerializado)

	gravaAceite.GravarAceite(&database, args)

	aceite.DadosBoleto.LinhaDigitavel = "4"
	aceite.DadosBoleto.Status = ""

	aceiteSerializado, _ = json.Marshal(aceite)

	args[0] = string(aceiteSerializado)

	gravaAceite.GravarAceite(&database, args)

	args[0] = "2"
	args = append(args, aceite.AssinaturaIF)

	pagaAceite.PagarBoleto(&database, args)

	args = make([]string, 0)
	args = append(args, aceite.AssinaturaIF)

	var aceitesSerializados, err = consulta.ConsultarBoletosNPagos(&database, args)

	if err != nil {
		t.Error("A consulta não deveria ter retornado erro, já que a Assinatura está presente")
	}

	var aceites AceiteList

	err = json.Unmarshal(aceitesSerializados, &aceites)

	if err != nil {
		t.Error("Json mal formatado")
	}

	if len(aceites.Aceites) != 3 {
		t.Error("Um dos aceites está pago, portanto, deveria conter 3 aceites")
	}

	for _, aceite := range aceites.Aceites {
		if aceite.DadosBoleto.AssinaturaIFPagadora != "" {
			t.Error("A assinatura da IF pagadora deve ser mascarada")
		}
		if aceite.DadosBoleto.CNPJBeneficiario != "" {
			t.Error("O CNPJ do beneficiario deve ser mascarado")
		}
		if aceite.DadosBoleto.CPFCNPJ != "" {
			t.Error("O CPF CNPJ do pagado deve ser mascarado")
		}
		if aceite.DadosBoleto.NomeBeneficiario != "" {
			t.Error("O nome do beneficiario deve ser mascarado")
		}
		if aceite.DadosBoleto.NomePagador != "" {
			t.Error("O nome do pagador deve ser mascarado")
		}
		if aceite.DadosBoleto.Status != "Pendente" {
			t.Error("O boleto não pode estar com status diferente de 'Pendente'")
		}
	}

	args[0] = "123123"

	_, err = consulta.ConsultarBoletosNPagos(&database, args)

	if err == nil {
		t.Error("A consulta não deveria ser realizada para uma assinatura desconhecida")
	}
}
