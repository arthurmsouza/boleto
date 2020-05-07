package main

import (
	"encoding/json"
	"time"
)

//CriarAceiteProposta cria um aceite proposta mocado
func CriarAceiteProposta() *AceiteProposta {
	var aceite = new(AceiteProposta)

	aceite.AssinaturaBeneficiario = "123123123"
	aceite.AssinaturaIF = "ITAUd829b5213ca8e49c2c4c1ee7629076fe"
	aceite.DadosBoleto = CriarBoletoProposta()
	aceite.DataRegistro = "time.Now()"
	aceite.HashProposta = "123123123"

	return aceite
}

//CriarBoletoProposta cria um boleto de proposta mocado
func CriarBoletoProposta() *BoletoProposta {
	var boleto = new(BoletoProposta)

	boleto.CPFCNPJ = "123123123123"

	var notExpiredDate = time.Now()

	boleto.DataVencimento = notExpiredDate.Format("02/01/2006")
	boleto.AssinaturaIFPagadora = ""
	boleto.LinhaDigitavel = "123123123123"
	boleto.Status = "Pendente"
	boleto.ValorBoleto = "123123"
	boleto.CNPJBeneficiario = "123123123"
	boleto.NomeBeneficiario = "123123123"
	boleto.NomePagador = "123123123"

	return boleto
}

// MascararBoletoProposta é uma função que auxilia a mascarar os dados do boleto
func MascararBoletoProposta(boleto *BoletoProposta) *BoletoProposta {
	boleto.AssinaturaIFPagadora = ""
	boleto.CNPJBeneficiario = ""
	boleto.CPFCNPJ = ""
	boleto.NomeBeneficiario = ""
	boleto.NomePagador = ""

	return boleto
}

//ConsultarNomeIF com base na assinatura
func ConsultarNomeIF(assinaturaIf string, database KeyValueDatabaseInterface) string {

	var membro Membro

	var membroDesserializado, _ = database.GetState(assinaturaIf)

	json.Unmarshal(membroDesserializado, &membro)

	return membro.Nome
}

// FilterArray filtra um arry de aceitePart com base na funcao test
func FilterArray(ss []AceitePart, test func(AceitePart) bool) (ret []AceitePart) {
	for _, s := range ss {
		if test(s) {
			ret = append(ret, s)
		}
	}
	return
}
