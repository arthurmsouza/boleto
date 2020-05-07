package main

// KeyValueDatabaseInterface é a interface que representa um banco de dados chave valor com operações básicas
type KeyValueDatabaseInterface interface {
	// GetState returns the byte array value specified by the `key`.
	GetState(key string) ([]byte, error)

	// PutState writes the specified `value` and `key` into the ledger.
	PutState(key string, value []byte) error
}
