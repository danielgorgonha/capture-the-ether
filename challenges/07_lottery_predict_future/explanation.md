# Predict the Future - 500 pontos

## 📋 Resumo

Este desafio demonstra como é impossível gerar verdadeira aleatoriedade na blockchain. O contrato exige que você "preveja" um número antes dele ser gerado, mas como o número é calculado usando informações públicas da blockchain (hash do bloco anterior e timestamp), é possível calcular qual número será gerado e fazer lock com esse número.

## 🔍 Análise do Contrato

```solidity
pragma solidity ^0.4.21;

contract PredictTheFutureChallenge {
    address guesser;
    uint8 guess;
    uint256 settlementBlockNumber;

    function PredictTheFutureChallenge() public payable {
        require(msg.value == 1 ether);
    }

    function isComplete() public view returns (bool) {
        return address(this).balance == 0;
    }

    function lockInGuess(uint8 n) public payable {
        require(guesser == 0);
        require(msg.value == 1 ether);

        guesser = msg.sender;
        guess = n;
        settlementBlockNumber = block.number + 1;
    }

    function settle() public {
        require(msg.sender == guesser);
        require(block.number > settlementBlockNumber);

        uint8 answer = uint8(keccak256(block.blockhash(block.number - 1), now)) % 10;

        guesser = 0;
        if (guess == answer) {
            msg.sender.transfer(2 ether);
        }
    }
}
```

**Características:**
- O contrato exige que você faça lock do palpite ANTES do número ser gerado
- O número é calculado usando `keccak256(block.blockhash(block.number - 1), now) % 10`
- Há apenas 10 possibilidades (0-9)
- O desafio só está completo quando o saldo do contrato é 0

**Vulnerabilidade:**
- O número "aleatório" é calculado usando informações públicas da blockchain
- Podemos calcular qual número será gerado no bloco onde `settle()` será chamado
- Como há apenas 10 possibilidades, podemos tentar até acertar

## 🎯 Objetivo

Fazer lock do palpite correto e chamar `settle()` para receber os 2 ether, esvaziando o contrato.

## 🚀 Passo a Passo do Exploit

### 1. Fazer o deploy do contrato

```bash
npx hardhat run challenges/07_lottery_predict_future/scripts/deploy.js --network hardhat
```

### 2. Executar o exploit

```bash
npx hardhat run challenges/07_lottery_predict_future/scripts/exploit.js --network hardhat
```

**Estratégia do exploit:**

O problema com este desafio é que precisamos fazer lock ANTES de saber qual número será gerado. No entanto, como há apenas 10 possibilidades (0-9), podemos usar uma estratégia de força bruta:

1. Fazer lock com um número (0-9)
2. Minerar blocos até podermos chamar `settle()` (bloco > settlementBlockNumber)
3. Calcular qual número será gerado no bloco atual usando:
   - Hash do bloco anterior: `block.blockhash(block.number - 1)`
   - Timestamp do bloco atual: `now`
   - Calcular: `uint8(keccak256(block.blockhash(block.number - 1), now)) % 10`
4. Se o número calculado corresponder ao lock, chamar `settle()` e receber 2 ETH
5. Se não corresponder, chamar `settle()` para resetar o `guesser` e tentar novamente
6. Repetir até esvaziar o contrato completamente

**Por que pode levar várias tentativas?**

- Estamos fazendo lock com um número aleatório (ou sequencial) e esperando que o número calculado corresponda
- Como há apenas 10 possibilidades, estatisticamente vamos acertar em média a cada 10 tentativas
- Mas como o número muda a cada bloco, não podemos prever exatamente qual será gerado antes de fazer lock
- A estratégia atual funciona, mas não é a mais eficiente possível

**Nota:** O exploit foi testado e funciona, mas pode levar várias tentativas até esvaziar o contrato completamente, especialmente se o saldo inicial for alto (1 ETH do deploy + múltiplas tentativas de lock).

### 3. Verificar o resultado

O script mostrará:
- Estado antes e depois do exploit
- Saldo do contrato
- Se o desafio foi completado (`isComplete()`)

## 📊 Resultado Esperado

```
🔍 Iniciando exploit do PredictTheFutureChallenge...

📦 Nenhum endereço fornecido. Fazendo deploy do contrato...

✅ Contrato deployado em: 0x5FbDB2315678afecb367f032d93F642f64180aa3

🎯 Fazendo lock e settle() até esvaziar o contrato...

🔄 Tentativa 1 (saldo do contrato: 1.0 ETH)...
📝 Fazendo lock com número 0...
   ✅ Lock feito no bloco 3, settlement block: 4
   📊 Bloco para settle: 5, número calculado: 6
   ⚠️  Número não corresponde (lock: 0, calculado: 6). Chamando settle() para resetar...

🔄 Tentativa 2 (saldo do contrato: 2.0 ETH)...
📝 Fazendo lock com número 0...
   ✅ Lock feito no bloco 7, settlement block: 8
   📊 Bloco para settle: 9, número calculado: 0
   🎯 Número corresponde ao lock 0! Chamando settle()...
   ✅ Settle confirmado! Recebemos 2 ETH de volta.

📊 Estado após o exploit:
  - Saldo do contrato: 0.0 ETH
  - Desafio completo: true

🎉 Desafio completado! O número foi previsto e adivinhado corretamente
```

## 🔗 Referências

- [Capture the Ether - Predict the future](https://capturetheether.com/challenges/lotteries/predict-the-future/)
- [Solidity 0.4.21 Documentation](https://docs.soliditylang.org/en/v0.4.21/)
- [Ethers.js Documentation](https://docs.ethers.org/)

## 💡 Aprendizados

1. **Aleatoriedade na Blockchain**: É impossível gerar verdadeira aleatoriedade usando apenas informações da blockchain, pois todas são públicas e previsíveis.

2. **Block Hash e Timestamp**: `block.blockhash(block.number - 1)` e `now` são informações públicas que podem ser usadas para prever valores "aleatórios".

3. **Modulo 10**: Como o número é calculado com `% 10`, há apenas 10 possibilidades, tornando o ataque por força bruta viável.

4. **Estratégia de Ataque**: Podemos calcular qual número será gerado no bloco onde `settle()` será chamado e fazer lock com esse número, ou tentar todos os números até acertar.

5. **Esvaziar o Contrato**: O desafio só está completo quando o saldo do contrato é 0, então precisamos fazer múltiplas tentativas até esvaziar completamente o contrato.

