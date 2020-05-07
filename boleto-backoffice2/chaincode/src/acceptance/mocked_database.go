package main

import "errors"

// MockedDatabase utilizado para teste unitários
type MockedDatabase struct {
	values map[string]string
}

// GetState returns the byte array value specified by the `key`.
func (t *MockedDatabase) GetState(key string) ([]byte, error) {
	if t.values[key] == "" {
		return nil, errors.New("Nenhum objeto não encontrado para a chave: " + key)
	}

	return []byte(t.values[key]), nil
}

// PutState writes the specified `value` and `key` into the ledger.
func (t *MockedDatabase) PutState(key string, value []byte) error {
	t.values[key] = string(value)
	return nil
}
