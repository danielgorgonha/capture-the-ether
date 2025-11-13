# Deploy a Contract - 50 pontos

## 📋 Resumo

Este é o primeiro desafio do Capture the Ether, um warmup para familiarizar-se com a plataforma. O objetivo é simplesmente fazer o deploy de um contrato que possui uma função `isComplete()` que sempre retorna `true`.

## 🔍 Análise do Contrato

```solidity
pragma solidity ^0.4.21;

contract DeployChallenge {
    function isComplete() public pure returns (bool) {
        return true;
    }
}
```

**Características:**
- Contrato muito simples em Solidity 0.4.21
- Função `isComplete()` sempre retorna `true`
- Não há lógica complexa ou vulnerabilidades a explorar
- O objetivo é apenas verificar que você conseguiu fazer o deploy

## 🎯 Objetivo

Fazer o deploy do contrato e verificar que a função `isComplete()` retorna `true`.

## 🚀 Passo a Passo do Exploit

### 1. Fazer o deploy do contrato

```bash
npx hardhat run challenges/00_warmup_deploy_contract/scripts/deploy.js --network hardhat
```

**Nota:** A rede `hardhat` é uma rede in-memory configurada com chainId 3 no `hardhat.config.js`. Não é necessário iniciar um nó externo.

### 3. Verificar o resultado

O script de deploy mostrará:
- Endereço da conta que fez o deploy
- Endereço do contrato deployado
- Transaction hash

### 4. Verificar o resultado

O script de exploit mostrará se o contrato foi deployado corretamente e se `isComplete()` retorna `true`.

## 📊 Resultado Esperado

```
🚀 Iniciando deploy do DeployChallenge...

📝 Deploying com a conta: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
💰 Saldo da conta: 10000.0 ETH

✅ Contrato deployado com sucesso!
📍 Endereço do contrato: 0x5FbDB2315678afecb367f032d93F642f64180aa3
🔗 Transaction hash: 0x...

💡 Próximo passo: Verifique no site Capture the Ether usando o endereço acima
```

## 🔗 Referências

- [Capture the Ether - Deploy a contract](https://capturetheether.com/challenges/warmup/deploy/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)

## 💡 Aprendizados

- Como fazer deploy de contratos com Hardhat
- Como verificar contratos deployados
- Introdução ao ecossistema de desenvolvimento Ethereum

