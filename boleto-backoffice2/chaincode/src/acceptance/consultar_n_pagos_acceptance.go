package main

import (
	"encoding/json"
	"errors"
	"fmt"
)

// ConsultaBoletosNPagos é a struct que auxilia na consulta de boletos de proposta não pagos
type ConsultaBoletosNPagos struct {
}

// ConsultarBoletosNPagos consulta todos os aceites com boletos não pagos e retorna para a tela em um array
func (t *ConsultaBoletosNPagos) ConsultarBoletosNPagos(database KeyValueDatabaseInterface, args []string) ([]byte, error) {

	if len(args) != 1 {
		msgErro := "Necessário enviar a assinatura de quem está consumindo"

		fmt.Println("QueryUnPaidAcceptance: " + msgErro)

		return nil, errors.New(msgErro)
	}

	var assinatura = args[0]

	fmt.Println("QueryUnPaidAcceptance: Assinatura recebida: " + assinatura)

	var membroSerializado, err = database.GetState(assinatura)
	var membro Membro

	err = json.Unmarshal(membroSerializado, &membro)

	if err != nil {
		msgErro := err.Error()

		fmt.Println("QueryUnPaidAcceptance: " + msgErro)

		return nil, errors.New(msgErro)
	}

	var aceiteIndex AceiteIndex
	var aceiteIndexSerializado []byte

	aceiteIndexSerializado, err = database.GetState(AceiteIndexTable)

	if err != nil {
		msgErro := err.Error()

		fmt.Println("QueryUnPaidAcceptance: " + msgErro)

		return nil, errors.New(msgErro)
	}

	err = json.Unmarshal(aceiteIndexSerializado, &aceiteIndex)

	if err != nil {
		msgErro := err.Error()

		fmt.Println("QueryUnPaidAcceptance: " + msgErro)

		return nil, errors.New(msgErro)
	}

	var aceites = AceiteList{Aceites: make([]AceiteProposta, 0)}

	var filtraNaoPago = func(aceitePart AceitePart) bool { return aceitePart.Status == "Pendente" }

	var aceiteNPagos = FilterArray(aceiteIndex.Aceites, filtraNaoPago)

	for _, aceitePartAux := range aceiteNPagos {

		var aceiteSerializado []byte
		aceiteSerializado, err = database.GetState(aceitePartAux.LinhaDigitavel)

		if err != nil {
			msgErro := err.Error()

			fmt.Println("QueryUnPaidAcceptance: " + msgErro)

			return nil, errors.New(msgErro)
		}

		var aceite AceiteProposta
		err = json.Unmarshal(aceiteSerializado, &aceite)

		if err != nil {
			fmt.Println("QueryUnPaidAcceptance: Erro desserializacao")
			msgErro := err.Error()

			fmt.Println("QueryUnPaidAcceptance: " + msgErro)

			return nil, errors.New(msgErro)
		}

		aceite.DadosBoleto = MascararBoletoProposta(aceite.DadosBoleto)

		if !aceite.DadosBoleto.IsExpired() {

			if err != nil {
				fmt.Println("QueryUnPaidAcceptance: Erro serializacao")
				msgErro := err.Error()

				fmt.Println("QueryUnPaidAcceptance: " + msgErro)

				return nil, errors.New(msgErro)
			}

			aceites.Aceites = append(aceites.Aceites, aceite)
		}
	}

	var aceitesSerializados []byte

	aceitesSerializados, err = json.Marshal(aceites)

	if err != nil {
		msgErro := err.Error()

		fmt.Println("QueryUnPaidAcceptance: " + msgErro)

		return nil, errors.New(msgErro)
	}

	fmt.Println("QueryUnPaidAcceptance: JSON preparado para retorno " + string(aceitesSerializados))

	return aceitesSerializados, nil
}
