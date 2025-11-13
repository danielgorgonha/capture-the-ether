# Mapping - 750 pontos

## 📋 Resumo

Este desafio demonstra uma vulnerabilidade de **storage collision** em arrays dinâmicos. Podemos expandir o array para um tamanho muito grande e fazer wrap-around do storage para sobrescrever variáveis anteriores, especificamente `isComplete` que está no slot 0.

## 🔍 Análise do Contrato

```solidity
pragma solidity ^0.4.21;

contract MappingChallenge {
    bool public isComplete;
    uint256[] map;

    function set(uint256 key, uint256 value) public {
        // Expand dynamic array as needed
        if (map.length <= key) {
            map.length = key + 1;  // ⚠️ Permite expandir para qualquer tamanho!
        }

        map[key] = value;  // ⚠️ Pode sobrescrever qualquer slot de storage!
    }

    function get(uint256 key) public view returns (uint256) {
        return map[key];
    }
}
```

**Características:**
- O contrato usa um array dinâmico para simular um mapping
- A função `set()` expande o array automaticamente se necessário
- O objetivo é fazer `isComplete` ser `true`

**Vulnerabilidade:**
- Em Solidity, variáveis de estado são armazenadas em slots sequenciais
- Slot 0: `isComplete` (bool)
- Slot 1: `map.length` (uint256)
- Slot `keccak256(1)`: `map[0]`
- Slot `keccak256(1) + 1`: `map[1]`
- etc.

- Se expandirmos o array para um tamanho muito grande, podemos fazer wrap-around
- O slot do array[index] = `keccak256(1) + index` (mod 2^256)
- Se `keccak256(1) + index >= 2^256`, faz wrap-around e pode sobrescrever slots anteriores
- Podemos calcular o índice que faz wrap-around para o slot 0

## 🎯 Objetivo

Sobrescrever `isComplete` (slot 0) usando o array `map`.

## 🚀 Passo a Passo do Exploit

### 1. Fazer o deploy do contrato

```bash
npx hardhat run challenges/12_math_mapping/scripts/deploy.js --network hardhat
```

### 2. Executar o exploit

```bash
npx hardhat run challenges/12_math_mapping/scripts/exploit.js --network hardhat
```

**Estratégia do exploit:**

1. **Calcular o índice que corresponde ao slot 0:**
   - O slot do array[index] = `keccak256(1) + index`
   - Para sobrescrever slot 0: `keccak256(1) + index = 0` (mod 2^256)
   - Isso significa: `keccak256(1) + index = 2^256`
   - Portanto: `index = 2^256 - keccak256(1)`

2. **Chamar set() com o índice calculado:**
   - Chamar `set(index, 1)` onde `index = 2^256 - keccak256(1)`
   - O contrato expandirá o array para esse tamanho (muito grande!)
   - O slot `keccak256(1) + index` fará wrap-around para slot 0
   - `isComplete` será sobrescrito com o valor 1 (true)

**Por que funciona?**

- Arrays dinâmicos em Solidity usam `keccak256(slot)` como base para seus elementos
- O slot do elemento `map[index]` é calculado como `keccak256(1) + index`
- Se o índice for grande o suficiente, `keccak256(1) + index` pode fazer wrap-around
- Isso permite sobrescrever slots anteriores de storage

**⚠️ Nota sobre Gas:**

Este exploit requer **MUITO gas** porque precisa expandir o array para um tamanho enorme (aproximadamente 2^256 - keccak256(1)). Em Hardhat, isso pode falhar devido ao limite de gas por bloco (30 milhões). Em uma rede real, seria extremamente caro, mas tecnicamente possível.

### 3. Verificar o resultado

O script mostrará:
- Estado antes e depois do exploit
- Se o desafio foi completado (`isComplete()`)
- O índice calculado usado para sobrescrever o slot 0

## 📊 Resultado Esperado

```
🔍 Iniciando exploit do MappingChallenge...

📊 Estado antes do exploit:
  - isComplete: false

📊 Slot 1 hash (keccak256(1)): 0xb10e2d527612073b26eecdfd717e6a320cf44b4afac2b0732d9fcbe2b7fa0cf6
📊 Índice para sobrescrever slot 0: 35707666377435648211887908874984608119992236509074197713628505308453184860938

📝 Sobrescrevendo slot 0 (isComplete) usando o índice calculado...
   Chamando set(index, 1) para definir isComplete = true...

⚠️  ATENÇÃO: Este exploit requer MUITO gas...

📊 Estado após o exploit:
  - isComplete: true

🎉 Desafio completado! isComplete foi sobrescrito com sucesso
```

**Nota:** Em Hardhat, o exploit pode falhar devido ao limite de gas, mas o conceito está correto.

## 🔗 Referências

- [Capture the Ether - Mapping](https://capturetheether.com/challenges/math/mapping/)
- [Solidity 0.4.21 Documentation](https://docs.soliditylang.org/en/v0.4.21/)
- [Storage Layout in Solidity](https://docs.soliditylang.org/en/v0.4.21/miscellaneous.html#layout-of-state-variables-in-storage)
- [Ethers.js Documentation](https://docs.ethers.org/)

## 💡 Aprendizados

1. **Storage Layout**: Em Solidity, variáveis de estado são armazenadas em slots sequenciais. Arrays dinâmicos começam em `keccak256(slot)`.

2. **Storage Collision**: Arrays dinâmicos podem fazer wrap-around do storage se expandidos para tamanhos muito grandes, permitindo sobrescrever slots anteriores.

3. **Cálculo de Índices**: Podemos calcular o índice do array que corresponde a um slot específico usando: `index = targetSlot - keccak256(arraySlot)` (considerando wrap-around).

4. **Custo de Gas**: Expandir arrays para tamanhos muito grandes é extremamente caro em gas. Este exploit demonstra uma vulnerabilidade teórica que pode ser impraticável em produção devido ao custo.

5. **Uso de Mappings**: Este desafio demonstra por que mappings são preferidos sobre arrays dinâmicos para estruturas de dados grandes - mappings não têm esse problema de storage collision.

