package main

import (
	"fmt"

	"encoding/json"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

//AceitePropostaChain contem o contrato que descreve a interação entre IF's
type AceitePropostaChain struct {
}

// AdicionarMembros adicionar os membros da poc no ledger
func AdicionarMembros(database KeyValueDatabaseInterface) error {

	var membros = [5]Membro{
		Membro{
			Nome:       "Itaú",
			Assinatura: "ITAUd829b5213ca8e49c2c4c1ee7629076fe",
			Regulador:  false,
		},
		Membro{
			Nome:       "CIP",
			Assinatura: "CIPcd8562d226d37128b84a8bc1aad7ea3a",
			Regulador:  true,
		},
		Membro{
			Nome:       "Bradesco",
			Assinatura: "BRADESCOee7c267a30984c940d3c7a3e39c161bf",
			Regulador:  false,
		},
		Membro{
			Nome:       "Banco do Brasil",
			Assinatura: "BANCOBRASILe2dce04bc495521a8300c1d1ff78bc2d",
			Regulador:  false,
		},
		Membro{
			Nome:       "Santander",
			Assinatura: "SANTANDER8fbbf95f1e5678899cb285b6051846a7",
			Regulador:  false,
		},
	}

	for i := 0; i < len(membros); i++ {
		var membroSerializado, err = json.Marshal(membros[i])

		if err != nil {
			return err
		}

		err = database.PutState(membros[i].Assinatura, membroSerializado)

		if err != nil {
			return err
		}

	}

	return nil

}

func criarIndice(database KeyValueDatabaseInterface) error {

	var aceiteIndex = AceiteIndex{}

	var aceiteSerializado, err = json.Marshal(aceiteIndex)

	err = database.PutState(AceiteIndexTable, aceiteSerializado)

	return err
}

//Init é o método chamado na inicialização do chaincode
func (t *AceitePropostaChain) Init(stub shim.ChaincodeStubInterface) pb.Response {
	fmt.Println("Init chamado, chaincode inicializado")

	var err = AdicionarMembros(stub)

	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("Init: adicionado membros a lista")

	err = criarIndice(stub)

	if err != nil {
		return shim.Error(err.Error())
	}

	fmt.Println("Init: criado lista de aceite")

	return shim.Success(nil)
}

func (t *AceitePropostaChain) cadastrarAceite(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var gravaAceite = new(GravaAceite)

	var err = gravaAceite.GravarAceite(stub, args)

	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(nil)
}

func (t *AceitePropostaChain) consultarAceite(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var consultaAceites = new(ConsultaAceites)

	var aceites, err = consultaAceites.ConsultarAceites(stub, args)

	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(aceites)
}

func (t *AceitePropostaChain) pagarBoleto(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var pagaBoleto = new(PagaBoletoAceite)

	var err = pagaBoleto.PagarBoleto(stub, args)

	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(nil)
}
func (t *AceitePropostaChain) consultarBoletosNPagos(stub shim.ChaincodeStubInterface, args []string) pb.Response {
	var consultaBoletosNPagos = new(ConsultaBoletosNPagos)

	var aceites, err = consultaBoletosNPagos.ConsultarBoletosNPagos(stub, args)

	if err != nil {
		return shim.Error(err.Error())
	}

	return shim.Success(aceites)
}

//Invoke é o metódo de entrada para chamada dos métodos do chaincode
func (t *AceitePropostaChain) Invoke(stub shim.ChaincodeStubInterface) pb.Response {
	function, args := stub.GetFunctionAndParameters()
	if function == "cadastrar_aceite" {
		return t.cadastrarAceite(stub, args)
	} else if function == "consultar_aceite" {
		return t.consultarAceite(stub, args)
	} else if function == "pagar_boleto" {
		return t.pagarBoleto(stub, args)
	} else if function == "consultar_boletos_n_pagos" {
		return t.consultarBoletosNPagos(stub, args)
	}

	return shim.Error("Invalid invoke function name. Expecting \"invoke\"")
}

func main() {
	err := shim.Start(new(AceitePropostaChain))
	if err != nil {
		fmt.Printf("Error starting Simple chaincode: %s", err)
	}
}
