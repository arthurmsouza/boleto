package main

import (
	"errors"

	"encoding/json"
	"fmt"
)

// ConsultaAceites é o struct que apoia o consumo dos aceites
type ConsultaAceites struct {
}

// ConsultarAceites é o método que consulta todos os aceites, considerando o privilégio de quem consome
func (t *ConsultaAceites) ConsultarAceites(database KeyValueDatabaseInterface, args []string) ([]byte, error) {

	if len(args) != 1 {
		msgErro := "Necessário enviar a assinatura de quem está consumindo"

		fmt.Println("QueryAcceptance: " + msgErro)

		return nil, errors.New(msgErro)
	}

	fmt.Println("QueryAcceptance: Consultando aceites para a Assinatura: " + args[0])

	var assinatura = args[0]
	var membroSerializado, err = database.GetState(assinatura)
	var membro Membro

	err = json.Unmarshal(membroSerializado, &membro)

	if err != nil {
		msgErro := err.Error()

		fmt.Println("QueryAcceptance: " + msgErro)

		return nil, errors.New(msgErro)
	}

	var aceiteIndex AceiteIndex
	var aceiteIndexSerializado []byte

	aceiteIndexSerializado, err = database.GetState(AceiteIndexTable)

	if err != nil {
		msgErro := err.Error()

		fmt.Println("QueryAcceptance: " + msgErro)

		return nil, errors.New(msgErro)
	}

	err = json.Unmarshal(aceiteIndexSerializado, &aceiteIndex)

	if err != nil {
		msgErro := err.Error()

		fmt.Println("QueryAcceptance: " + msgErro)

		return nil, errors.New(msgErro)
	}

	var aceites = AceiteList{Aceites: make([]AceiteProposta, 0)}

	var aceiteParts []AceitePart

	if !membro.Regulador {
		var filtrarAceiteInstituicao = func(aceitePart AceitePart) bool { return aceitePart.AssinaturaIF == assinatura }

		aceiteParts = FilterArray(aceiteIndex.Aceites, filtrarAceiteInstituicao)

	} else {
		aceiteParts = aceiteIndex.Aceites
	}

	for _, aceitePartAux := range aceiteParts {

		var aceiteSerializado []byte
		aceiteSerializado, err = database.GetState(aceitePartAux.LinhaDigitavel)

		if err != nil {
			msgErro := err.Error()

			fmt.Println("QueryAcceptance: " + msgErro)

			return nil, errors.New(msgErro)
		}

		var aceite AceiteProposta

		err = json.Unmarshal(aceiteSerializado, &aceite)

		if err != nil {
			msgErro := err.Error()

			fmt.Println("QueryAcceptance: " + msgErro)

			return nil, errors.New(msgErro)
		}

		if aceite.DadosBoleto.IsExpired() && aceite.DadosBoleto.Status != "Pago" {
			aceite.DadosBoleto.Status = "Vencido"
		}

		if err != nil {
			msgErro := err.Error()

			fmt.Println("QueryAcceptance: " + msgErro)

			return nil, errors.New(msgErro)
		}

		aceites.Aceites = append(aceites.Aceites, aceite)

	}

	var aceitesSerializados []byte

	aceitesSerializados, err = json.Marshal(aceites)

	fmt.Println("QueryAcceptance: JSON preparado para retorno " + string(aceitesSerializados))

	return aceitesSerializados, nil

}
