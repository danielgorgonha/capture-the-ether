# Call Me - 100 pontos

## 📋 Resumo

Este é o segundo desafio do Capture the Ether. O objetivo é simplesmente chamar uma função pública `callme()` no contrato deployado. Quando essa função é chamada, ela altera o estado `isComplete` de `false` para `true`, completando o desafio.

## 🔍 Análise do Contrato

```solidity
pragma solidity ^0.4.21;

contract CallMeChallenge {
    bool public isComplete = false;

    function callme() public {
        isComplete = true;
    }
}
```

**Características:**
- Contrato simples em Solidity 0.4.21
- Variável pública `isComplete` inicializada como `false`
- Função pública `callme()` que altera `isComplete` para `true`
- Não há proteções ou restrições na função - qualquer um pode chamá-la

## 🎯 Objetivo

Chamar a função `callme()` do contrato deployado para alterar `isComplete` de `false` para `true`.

## 🚀 Passo a Passo do Exploit

### 1. Fazer o deploy do contrato

```bash
npx hardhat run challenges/01_warmup_call_me/scripts/deploy.js --network hardhat
```

Isso irá:
- Deployar o contrato na rede Hardhat
- Mostrar o endereço do contrato
- Verificar que `isComplete` está inicialmente como `false`

### 2. Executar o exploit

```bash
npx hardhat run challenges/01_warmup_call_me/scripts/exploit.js --network hardhat
```

Ou, se você já tem o endereço do contrato:

```bash
CONTRACT_ADDRESS=0x... npx hardhat run challenges/01_warmup_call_me/scripts/exploit.js --network hardhat
```

O exploit irá:
- Conectar ao contrato deployado
- Verificar o estado inicial (`isComplete = false`)
- Chamar a função `callme()`
- Verificar que `isComplete` mudou para `true`

### 3. Verificar o resultado

O script mostrará:
- Estado antes do exploit: `isComplete = false`
- Transaction hash da chamada `callme()`
- Estado após o exploit: `isComplete = true`

### 4. Verificar no site Capture the Ether

1. Use o endereço do contrato deployado
2. No site Capture the Ether, clique em "Check Solution"
3. O site verificará se `isComplete` está como `true`

## 📊 Resultado Esperado

```
🔍 Iniciando exploit do CallMeChallenge...

📦 Nenhum endereço fornecido. Fazendo deploy do contrato...

✅ Contrato deployado em: 0x5FbDB2315678afecb367f032d93F642f64180aa3

📍 Endereço do contrato: 0x5FbDB2315678afecb367f032d93F642f64180aa3
📊 Estado antes do exploit - isComplete: false

🎯 Executando exploit: chamando função callme()...

📤 Transaction enviada: 0x...
✅ Transaction confirmada!

📊 Estado após o exploit - isComplete: true

🎉 Desafio completado! A função callme() foi chamada com sucesso
💡 Use este endereço no site Capture the Ether para verificar a solução
```

## 🔗 Referências

- [Capture the Ether - Call me](https://capturetheether.com/challenges/warmup/call-me/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)

## 💡 Aprendizados

- Como interagir com contratos deployados usando Ethers.js
- Como chamar funções públicas de contratos
- Como verificar mudanças de estado em contratos
- Introdução à interação com contratos via scripts

## 🔒 Segurança

Este desafio demonstra que:
- Funções públicas podem ser chamadas por qualquer endereço
- Não há proteções ou restrições na função `callme()`
- Em contratos reais, é importante considerar quem pode chamar quais funções
- Modificadores como `onlyOwner` ou verificações de acesso são importantes para funções sensíveis

