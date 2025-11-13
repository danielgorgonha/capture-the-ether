# Predict the Block Hash - 750 pontos

## 📋 Resumo

Este desafio demonstra uma limitação importante do Solidity: `block.blockhash()` só funciona para os últimos 256 blocos. Para blocos mais antigos, a função retorna `0x0`. Podemos explorar isso fazendo lock com `0x0` e esperando mais de 256 blocos para que o hash do bloco de settlement seja `0x0`.

## 🔍 Análise do Contrato

```solidity
pragma solidity ^0.4.21;

contract PredictTheBlockHashChallenge {
    address guesser;
    bytes32 guess;
    uint256 settlementBlockNumber;

    function PredictTheBlockHashChallenge() public payable {
        require(msg.value == 1 ether);
    }

    function isComplete() public view returns (bool) {
        return address(this).balance == 0;
    }

    function lockInGuess(bytes32 hash) public payable {
        require(guesser == 0);
        require(msg.value == 1 ether);

        guesser = msg.sender;
        guess = hash;
        settlementBlockNumber = block.number + 1;
    }

    function settle() public {
        require(msg.sender == guesser);
        require(block.number > settlementBlockNumber);

        bytes32 answer = block.blockhash(settlementBlockNumber);

        guesser = 0;
        if (guess == answer) {
            msg.sender.transfer(2 ether);
        }
    }
}
```

**Características:**
- O contrato exige que você faça lock do hash de um bloco futuro ANTES do bloco ser minerado
- O hash é verificado usando `block.blockhash(settlementBlockNumber)`
- O desafio só está completo quando o saldo do contrato é 0

**Vulnerabilidade:**
- `block.blockhash()` em Solidity só funciona para os últimos 256 blocos
- Para blocos mais antigos (mais de 256 blocos atrás), a função retorna `0x0`
- Podemos fazer lock com `0x0` e esperar mais de 256 blocos após o `settlementBlockNumber`
- Quando chamamos `settle()`, `block.blockhash(settlementBlockNumber)` retornará `0x0`, correspondendo ao nosso guess

## 🎯 Objetivo

Fazer lock do hash correto e chamar `settle()` para receber os 2 ether, esvaziando o contrato.

## 🚀 Passo a Passo do Exploit

### 1. Fazer o deploy do contrato

```bash
npx hardhat run challenges/08_lottery_predict_block_hash/scripts/deploy.js --network hardhat
```

### 2. Executar o exploit

```bash
npx hardhat run challenges/08_lottery_predict_block_hash/scripts/exploit.js --network hardhat
```

**Estratégia do exploit:**

1. Fazer lock com `0x0` (bytes32 zero)
2. Esperar mais de 256 blocos após o `settlementBlockNumber`
3. Chamar `settle()`
4. Como `block.blockhash(settlementBlockNumber)` retornará `0x0` (bloco muito antigo), nosso guess estará correto
5. Receber 2 ETH e esvaziar o contrato

**Por que funciona?**

- Em Solidity, `block.blockhash(blockNumber)` só retorna o hash real para os últimos 256 blocos
- Para blocos mais antigos, retorna `0x0000000000000000000000000000000000000000000000000000000000000000`
- Quando fazemos lock no bloco N, `settlementBlockNumber = N + 1`
- Se esperarmos mais de 256 blocos, quando chamarmos `settle()` no bloco M (M > N + 1 + 256), o bloco `settlementBlockNumber` estará muito antigo
- `block.blockhash(settlementBlockNumber)` retornará `0x0`, correspondendo ao nosso guess

### 3. Verificar o resultado

O script mostrará:
- Estado antes e depois do exploit
- Saldo do contrato
- Se o desafio foi completado (`isComplete()`)
- Quantos blocos foram minerados

## 📊 Resultado Esperado

```
🔍 Iniciando exploit do PredictTheBlockHashChallenge...

📦 Nenhum endereço fornecido. Fazendo deploy do contrato...

✅ Contrato deployado em: 0x5FbDB2315678afecb367f032d93F642f64180aa3

🎯 Fazendo lock com hash zero (0x0)...
   Estratégia: Esperar mais de 256 blocos para que block.blockhash() retorne 0x0

✅ Lock confirmado!

📊 Informações do lock:
  - Bloco do lock: 3
  - Settlement block number: 4
  - Hash do lock: 0x0

⏳ Minerando 257 blocos para que block.blockhash() retorne 0x0...
   Minerados 50 blocos...
   Minerados 100 blocos...
   Minerados 150 blocos...
   Minerados 200 blocos...
   Minerados 250 blocos...

✅ 257 blocos minerados!
   Bloco atual: 260
   Settlement block: 4
   Diferença: 256 blocos

📤 Chamando settle()...

✅ Settle confirmado!

📊 Estado após o exploit:
  - Saldo do contrato: 0.0 ETH
  - Desafio completo: true

🎉 Desafio completado! O hash do bloco foi previsto corretamente
💰 Você recebeu 2 ether de volta (1 ether enviado + 1 ether de lucro)

💡 A vulnerabilidade: block.blockhash() só funciona para os últimos 256 blocos.
   Para blocos mais antigos, retorna 0x0, permitindo prever o hash!
```

## 🔗 Referências

- [Capture the Ether - Predict the block hash](https://capturetheether.com/challenges/lotteries/predict-the-block-hash/)
- [Solidity Documentation - block.blockhash()](https://docs.soliditylang.org/en/v0.4.21/units-and-global-variables.html#block-and-transaction-properties)
- [Ethers.js Documentation](https://docs.ethers.org/)

## 💡 Aprendizados

1. **Limitação do block.blockhash()**: A função `block.blockhash()` em Solidity só funciona para os últimos 256 blocos. Para blocos mais antigos, retorna `0x0`.

2. **Previsibilidade de Blocos Futuros**: Não é possível prever o hash de um bloco futuro antes dele ser minerado, mas podemos explorar a limitação de `block.blockhash()` para blocos antigos.

3. **Estratégia de Ataque**: Fazer lock com `0x0` e esperar mais de 256 blocos garante que `block.blockhash(settlementBlockNumber)` retornará `0x0`, correspondendo ao nosso guess.

4. **Tempo de Espera**: Este exploit requer minerar mais de 256 blocos, o que pode levar algum tempo em uma rede real, mas é viável em ambiente local de teste.

5. **Importância de Entender Limitações**: Este desafio demonstra a importância de entender as limitações das funções globais do Solidity ao projetar contratos seguros.

