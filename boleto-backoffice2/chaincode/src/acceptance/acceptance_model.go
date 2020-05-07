package main

import (
	"encoding/json"
	"errors"
	"strconv"
	"time"
)

// BoletoProposta Representa um boleto gerado por um aceite de proposta
type BoletoProposta struct {
	LinhaDigitavel       string `json:"linhaDigitavel"`
	ValorBoleto          string `json:"valor"`
	DataVencimento       string `json:"dataVencimento"`
	NomePagador          string `json:"nomePagador"`
	Status               string `json:"status_pagamento"`
	CPFCNPJ              string `json:"cpfcnpjPagador"`
	AssinaturaIFPagadora string `json:"assinatura_if_pagadora"`
	NomeIFPagadora       string `json:"nomeIfPagadora"`
	NomeBeneficiario     string `json:"nomeBeneficiario"`
	CNPJBeneficiario     string `json:"cnpjBeneficiario"`
}

// AceiteProposta representa um aceite de uma proposta de serviço que gera algum encargo
type AceiteProposta struct {
	DataRegistro           string          `json:"dataHoraAceite"`
	HashProposta           string          `json:"hashProposta"`
	DadosBoleto            *BoletoProposta `json:"boleto"`
	AssinaturaIF           string          `json:"assinaturaIFBeneficiario"`
	NomeIfBeneficiario     string          `json:"NomeIfBeneficiario"`
	AssinaturaBeneficiario string          `json:"assinaturaDigitalBenef"`
}

// Membro é uma classe de apoio que contém todos os membros e o indicador se ele é regulador ou não
type Membro struct {
	Nome       string `json:"nome"`
	Assinatura string `json:"assinatura"`
	Regulador  bool   `json:"regulador"`
}

// AceitePart contém as partes do Aceite que serviram para filtro.
type AceitePart struct {
	LinhaDigitavel string `json:"linhaDigitavel"`
	Status         string `json:"statusPagamento"`
	AssinaturaIF   string `json:"assinaturaIf"`
}

// AceiteIndex contém uma lista de AceitePart com todos os aceites que foram cadastrados na rede
type AceiteIndex struct {
	Aceites []AceitePart `json:"aceites"`
}

// AceiteList é uma estrutura de apoio para gerar uma lista de aceite
type AceiteList struct {
	Aceites []AceiteProposta `json:"aceites"`
}

// AceiteIndexTable é a chave do objeto que guarda todos os aceites
const AceiteIndexTable = "aceiteIndexTable"

func contains(s []AceitePart, e string) bool {
	for _, a := range s {
		if a.LinhaDigitavel == e {
			return true
		}
	}
	return false
}

// AdicionarAceiteIndice adiciona um aceite ao indice no ledger
func AdicionarAceiteIndice(aceite AceiteProposta, database KeyValueDatabaseInterface) error {

	var aceiteIndex AceiteIndex

	var aceiteindexSerializado, err = database.GetState(AceiteIndexTable)

	if err != nil {
		return err
	}

	err = json.Unmarshal(aceiteindexSerializado, &aceiteIndex)

	if err != nil {
		return err
	}

	var aceitePart = AceitePart{
		AssinaturaIF:   aceite.AssinaturaIF,
		LinhaDigitavel: aceite.DadosBoleto.LinhaDigitavel,
		Status:         aceite.DadosBoleto.Status,
	}

	if !contains(aceiteIndex.Aceites, aceitePart.LinhaDigitavel) {
		aceiteIndex.Aceites = append(aceiteIndex.Aceites, aceitePart)
	} else {
		return errors.New("Aceite para o boleto " + aceitePart.LinhaDigitavel + " já foi cadastrado no ledger")
	}

	aceiteindexSerializado, err = json.Marshal(aceiteIndex)

	if err != nil {
		return err
	}

	err = database.PutState(AceiteIndexTable, aceiteindexSerializado)

	return err
}

func pos(array []AceitePart, linhaDigitavel string) int {
	for p, v := range array {
		if v.LinhaDigitavel == linhaDigitavel {
			return p
		}
	}
	return -1
}

// AtualizarAceiteIndice adiciona um aceite ao indice no ledger
func AtualizarAceiteIndice(aceite AceiteProposta, database KeyValueDatabaseInterface) error {

	var aceiteIndex AceiteIndex

	var aceiteindexSerializado, err = database.GetState(AceiteIndexTable)

	if err != nil {
		return err
	}

	err = json.Unmarshal(aceiteindexSerializado, &aceiteIndex)

	if err != nil {
		return err
	}

	if !contains(aceiteIndex.Aceites, aceite.DadosBoleto.LinhaDigitavel) {
		return errors.New("Aceite para o boleto " + aceite.DadosBoleto.LinhaDigitavel + " ainda não cadastrado no ledger. Não é possível atualizar")
	}

	var posicaoAceite = pos(aceiteIndex.Aceites, aceite.DadosBoleto.LinhaDigitavel)

	aceiteIndex.Aceites[posicaoAceite].Status = aceite.DadosBoleto.Status

	aceiteindexSerializado, err = json.Marshal(aceiteIndex)

	if err != nil {
		return err
	}

	err = database.PutState(AceiteIndexTable, aceiteindexSerializado)

	return err
}

// IsValid retorna se o boleto possui todos os valores preenchidos
func (t *BoletoProposta) IsValid() (bool, error) {

	var valor, err = strconv.ParseFloat(t.ValorBoleto, 64)

	if t.LinhaDigitavel == "" {
		return false, errors.New("Linha Digitavel é obrigatória")
	} else if err != nil {
		return false, err
	} else if valor <= 0 {
		return false, errors.New("O Valor do Boleto tem que ser maior que 0")
	} else if t.DataVencimento == "" {
		return false, errors.New("A Data de Vencimento precisa ser preenchida")
	} else if t.CPFCNPJ == "" {
		return false, errors.New("O CPF ou CNPJ precisa ser preenchido")
	} else if t.NomePagador == "" {
		return false, errors.New("O nome do pagador é obrigatório")
	} else if t.NomeBeneficiario == "" {
		return false, errors.New("O nome do beneficiario é obrigatório")
	} else if t.CNPJBeneficiario == "" {
		return false, errors.New("O CNPJ do beneficiario é obrigatório")
	} else if !((t.Status == "Pendente") || (t.Status == "Pago") || (t.Status == "Vencido")) {
		return false, errors.New("O estado do boleto informado é desconhecido")
	}

	_, err = time.Parse("02/01/2006", t.DataVencimento)

	if err != nil {
		return false, err
	}

	return true, nil
}

// IsValid retorna se o aceite possui todos os valores preenchidos
func (t *AceiteProposta) IsValid() (bool, error) {

	var dadosBoleto = t.DadosBoleto
	var boletoValido, err = dadosBoleto.IsValid()

	if !boletoValido {
		return boletoValido, err
	} else if t.AssinaturaBeneficiario == "" {
		return false, errors.New("A Assinatura do Beneficiário é obrigatória")
	} else if t.AssinaturaIF == "" {
		return false, errors.New("A Assinatura da Instituição Financeira do Beneficiário é obrigatória")
	} else if t.HashProposta == "" {
		return false, errors.New("O Hash da Proposta é obrigatório")
	} else if t.DataRegistro == "" {
		return false, errors.New("A Data do Registro é obrigatória")
	}

	return true, nil
}

//IsExpired retorna se o boleto está vencido
func (t *BoletoProposta) IsExpired() bool {
	var vencimento time.Time

	vencimento, _ = time.Parse("02/01/2006", t.DataVencimento)

	var hoje = time.Date(time.Now().Year(), time.Now().Month(), time.Now().Day(), 0, 0, 0, 0, time.Now().Location())

	return vencimento.Sub(hoje).Hours() < 0
}
