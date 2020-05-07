package main

import (
	"encoding/json"
	"errors"
	"fmt"
)

// PagaBoletoAceite é a struct que auxilia na atualizacao do status do AceiteProposta
type PagaBoletoAceite struct {
}

// PagarBoleto atualiza o status do pagamento do boleto da proposta
func (t *PagaBoletoAceite) PagarBoleto(database KeyValueDatabaseInterface, args []string) error {

	//Linha Digitavel Boleto
	//Assinatura IF pagadora
	if len(args) != 2 {
		return errors.New("Número de parâmetros incorreto. Aguardando 2 parâmetros")
	}

	var linhaDigitavel = args[0]
	var assinaturaIF = args[1]

	fmt.Println("PayBoleto: Pagando boleto: " + linhaDigitavel + " pela IF: " + assinaturaIF)

	var aceiteSerializado, err = database.GetState(linhaDigitavel)

	if err != nil {
		msgErro := err.Error()

		fmt.Println("PayBoleto: " + msgErro)

		return errors.New(msgErro)
	}

	if aceiteSerializado == nil {
		msgErro := "Boleto não encontrado no ledger"

		fmt.Println("PayBoleto: " + msgErro)

		return errors.New(msgErro)
	}

	fmt.Println("PayBoleto: Boleto encontrado")

	var aceite AceiteProposta

	err = json.Unmarshal(aceiteSerializado, &aceite)

	if err != nil {
		msgErro := err.Error()

		fmt.Println("PayBoleto: " + msgErro)

		return errors.New(msgErro)
	}

	if aceite.DadosBoleto.Status == "Pago" {
		msgErro := "Boleto já pago"

		fmt.Println("PayBoleto: " + msgErro)

		return errors.New(msgErro)
	}

	if aceite.DadosBoleto.IsExpired() {
		msgErro := "Boleto vencido"

		fmt.Println("PayBoleto: " + msgErro)

		return errors.New(msgErro)
	}

	aceite.DadosBoleto.AssinaturaIFPagadora = assinaturaIF
	aceite.DadosBoleto.Status = "Pago"
	aceite.DadosBoleto.NomeIFPagadora = ConsultarNomeIF(assinaturaIF, database)

	aceiteSerializado, err = json.Marshal(aceite)

	if err != nil {
		msgErro := err.Error()

		fmt.Println("PayBoleto: " + msgErro)

		return errors.New(msgErro)
	}

	fmt.Println("PayBoleto: Preparando para gravar aceite")

	err = database.PutState(linhaDigitavel, aceiteSerializado)

	if err != nil {
		msgErro := err.Error()

		fmt.Println("PayBoleto: " + msgErro)

		return errors.New(msgErro)
	}

	fmt.Println("PayBoleto: Aceite gravado")

	if err != nil {
		msgErro := err.Error()

		fmt.Println("PayBoleto: " + msgErro)

		return errors.New(msgErro)
	}

	err = AtualizarAceiteIndice(aceite, database)

	if err != nil {
		msgErro := err.Error()

		fmt.Println("PayBoleto: " + msgErro)

		return errors.New(msgErro)
	}

	return nil
}
