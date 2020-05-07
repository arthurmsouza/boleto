package main

import (
	"encoding/json"
	"testing"
)

//TestConsultaAceitePropostaNPagos testa o comportamento esperado da consulta de aceites
func TestConsultaAceite(t *testing.T) {

	var database = MockedDatabase{values: make(map[string]string)}
	var gravaAceite = GravaAceite{}
	var pagaAceite = PagaBoletoAceite{}
	var consulta = ConsultaAceites{}

	// Validar parametros corretos
	var aceiteIndex = AceiteIndex{}

	var aceiteIndexSerializado, _ = json.Marshal(aceiteIndex)

	database.PutState(AceiteIndexTable, aceiteIndexSerializado)

	AdicionarMembros(&database)

	var aceite = CriarAceiteProposta()

	aceite.DadosBoleto.LinhaDigitavel = "1"
	aceite.DadosBoleto.Status = ""
	aceite.AssinaturaIF = "ITAUd829b5213ca8e49c2c4c1ee7629076fe"

	var aceiteSerializado, _ = json.Marshal(aceite)

	var args []string

	args = append(args, string(aceiteSerializado))

	gravaAceite.GravarAceite(&database, args)

	aceite.DadosBoleto.LinhaDigitavel = "2"
	aceite.DadosBoleto.Status = ""
	aceite.AssinaturaIF = "ITAUd829b5213ca8e49c2c4c1ee7629076fe"

	aceiteSerializado, _ = json.Marshal(aceite)

	args[0] = string(aceiteSerializado)

	gravaAceite.GravarAceite(&database, args)

	aceite.DadosBoleto.LinhaDigitavel = "3"
	aceite.DadosBoleto.Status = ""
	aceite.AssinaturaIF = "ITAUd829b5213ca8e49c2c4c1ee7629076fe"

	aceiteSerializado, _ = json.Marshal(aceite)

	args[0] = string(aceiteSerializado)

	gravaAceite.GravarAceite(&database, args)

	aceite.DadosBoleto.LinhaDigitavel = "4"
	aceite.DadosBoleto.Status = ""
	aceite.AssinaturaIF = "BRADESCOee7c267a30984c940d3c7a3e39c161bf"

	aceiteSerializado, _ = json.Marshal(aceite)

	args[0] = string(aceiteSerializado)

	gravaAceite.GravarAceite(&database, args)

	args[0] = "2"
	args = append(args, "BRADESCOee7c267a30984c940d3c7a3e39c161bf")

	pagaAceite.PagarBoleto(&database, args)

	args = make([]string, 0)
	args = append(args, "ITAUd829b5213ca8e49c2c4c1ee7629076fe")

	var aceitesSerializados, err = consulta.ConsultarAceites(&database, args)

	if err != nil {
		t.Error("A consulta não deveria ter retornado erro, já que a Assinatura está presente")
	}

	var aceites AceiteList

	json.Unmarshal(aceitesSerializados, &aceites)

	if len(aceites.Aceites) != 3 {
		t.Error("Deveria ter retornado 3 aceites para a assinataura 'ITAUd829b5213ca8e49c2c4c1ee7629076fe'")
	}

	args = make([]string, 0)
	args = append(args, "BRADESCOee7c267a30984c940d3c7a3e39c161bf")

	aceitesSerializados, err = consulta.ConsultarAceites(&database, args)

	if err != nil {
		t.Error("A consulta não deveria ter retornado erro, já que a Assinatura está presente")
	}

	json.Unmarshal(aceitesSerializados, &aceites)

	if len(aceites.Aceites) != 1 {
		t.Error("Deveria ter retornado 3 aceites para a assinataura 'BRADESCOee7c267a30984c940d3c7a3e39c161bf'")
	}

	args = make([]string, 0)
	args = append(args, "CIPcd8562d226d37128b84a8bc1aad7ea3a")

	aceitesSerializados, err = consulta.ConsultarAceites(&database, args)

	if err != nil {
		t.Error("A consulta não deveria ter retornado erro, já que a Assinatura está presente")
	}

	json.Unmarshal(aceitesSerializados, &aceites)

	if len(aceites.Aceites) != 4 {
		t.Error("Deveria ter retornado 3 aceites para a assinataura 'CIPcd8562d226d37128b84a8bc1aad7ea3a'")
	}

	args[0] = "123123"

	_, err = consulta.ConsultarAceites(&database, args)

	if err == nil {
		t.Error("A consulta não deveria ser realizada para uma assinatura desconhecida")
	}

}
