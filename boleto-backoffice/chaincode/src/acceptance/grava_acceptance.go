package main

import (
	"encoding/json"
	"errors"
	"fmt"
)

// GravaAceite é uma struct de apoio para realizar a gravação do aceite no ledger
type GravaAceite struct {
}

// GravarAceite grava o aceite no ledger
func (t *GravaAceite) GravarAceite(database KeyValueDatabaseInterface, args []string) error {
	var err error

	// Aceite serializado em um Json
	if len(args) != 1 {
		msgErro := "Para cadastrar o aceite é necessário somente o JSON contendo o Aceite"

		fmt.Println("SaveBoleto:" + msgErro)

		return errors.New(msgErro)
	}

	fmt.Println("SaveBoleto: Gravando aceite no Ledger: " + args[0] + "\n")

	var aceite AceiteProposta

	err = json.Unmarshal([]byte(args[0]), &aceite)

	if err != nil {
		msgErro := err.Error()

		fmt.Println("SaveBoleto:" + msgErro)

		return errors.New(msgErro)
	}

	if aceite.DadosBoleto.Status != "" {
		msgErro := "O boleto não deveria conter status no momento de cadastro"

		fmt.Println("SaveBoleto:" + msgErro)

		return errors.New(msgErro)
	}

	aceite.DadosBoleto.Status = "Pendente"

	_, err = aceite.IsValid()

	if err != nil {
		msgErro := err.Error()

		fmt.Println("SaveBoleto:" + msgErro)

		return errors.New(msgErro)
	}

	if aceite.DadosBoleto.AssinaturaIFPagadora != "" {
		msgErro := "A Instituição Pagadora não pode estar preenchida no momento de cadastro"

		fmt.Println("SaveBoleto:" + msgErro)

		return errors.New(msgErro)
	}

	if aceite.DadosBoleto.NomeIFPagadora != "" {
		msgErro := "A Instituição Pagadora não pode estar preenchida no momento de cadastro"

		fmt.Println("SaveBoleto:" + msgErro)

		return errors.New(msgErro)
	}

	aceite.NomeIfBeneficiario = ConsultarNomeIF(aceite.AssinaturaIF, database)

	err = t.gravarAceite(aceite, database)

	if err != nil {
		msgErro := err.Error()

		fmt.Println("SaveBoleto:" + msgErro)

		return errors.New(msgErro)
	}

	return nil
}

func (t *GravaAceite) gravarAceite(aceite AceiteProposta, database KeyValueDatabaseInterface) error {
	var err = t.gravarAceiteLedger(aceite, database)

	if err != nil {
		return err
	}

	err = t.gravarAceiteIndex(aceite, database)

	if err != nil {
		return err
	}

	return nil
}

func (t *GravaAceite) gravarAceiteLedger(aceite AceiteProposta, database KeyValueDatabaseInterface) error {

	var aceiteSerializado, err = json.Marshal(aceite)

	if err != nil {
		return err
	}

	err = database.PutState(aceite.DadosBoleto.LinhaDigitavel, aceiteSerializado)

	return err
}

func (t *GravaAceite) gravarAceiteIndex(aceite AceiteProposta, database KeyValueDatabaseInterface) error {
	return AdicionarAceiteIndice(aceite, database)
}
