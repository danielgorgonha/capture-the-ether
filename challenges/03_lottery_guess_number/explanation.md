# Guess the Number - 200 pontos

## 📋 Resumo

Este desafio é uma "loteria" onde você precisa adivinhar um número. O contrato requer 1 ether para ser deployado e mais 1 ether para cada tentativa de adivinhar. Se você acertar, recebe 2 ether de volta. A vulnerabilidade está no fato de que o número está **hardcoded** no contrato, tornando-o visível para qualquer um.

## 🔍 Análise do Contrato

```solidity
pragma solidity ^0.4.21;

contract GuessTheNumberChallenge {
    uint8 answer = 42;

    function GuessTheNumberChallenge() public payable {
        require(msg.value == 1 ether);
    }

    function isComplete() public view returns (bool) {
        return address(this).balance == 0;
    }

    function guess(uint8 n) public payable {
        require(msg.value == 1 ether);

        if (n == answer) {
            msg.sender.transfer(2 ether);
        }
    }
}
```

**Características:**
- Variável `answer` está hardcoded como `42` no contrato
- Construtor requer 1 ether para deploy
- Função `guess()` requer 1 ether por tentativa
- Se acertar, recebe 2 ether de volta (1 ether enviado + 1 ether de lucro)
- Desafio completo quando o saldo do contrato é 0

**Vulnerabilidade:**
- O número `answer = 42` está visível no código-fonte do contrato
- Qualquer um pode ver o valor e adivinhar corretamente na primeira tentativa
- Não há aleatoriedade real

## 🎯 Objetivo

Adivinhar o número correto (42) chamando `guess(42)` com 1 ether, recebendo 2 ether de volta e esvaziando o saldo do contrato.

## 🚀 Passo a Passo do Exploit

### 1. Fazer o deploy do contrato

```bash
npx hardhat run challenges/03_lottery_guess_number/scripts/deploy.js --network hardhat
```

Isso irá:
- Deployar o contrato enviando 1 ether (requerido pelo construtor)
- Mostrar o endereço do contrato e o saldo inicial (1 ether)
- Verificar que o desafio ainda não está completo

### 2. Executar o exploit

```bash
npx hardhat run challenges/03_lottery_guess_number/scripts/exploit.js --network hardhat
```

Ou, se você já tem o endereço do contrato:

```bash
CONTRACT_ADDRESS=0x... npx hardhat run challenges/03_lottery_guess_number/scripts/exploit.js --network hardhat
```

O exploit irá:
- Conectar ao contrato deployado
- Verificar o estado inicial (saldo do contrato = 1 ether)
- Chamar `guess(42)` enviando 1 ether
- Receber 2 ether de volta
- Verificar que o saldo do contrato é 0 e o desafio está completo

### 3. Verificar o resultado

O script mostrará:
- Estado antes: `saldo do contrato = 1 ETH`, `desafio completo = false`
- Transaction hash da chamada `guess(42)`
- Estado após: `saldo do contrato = 0 ETH`, `desafio completo = true`
- Você recebeu 2 ether de volta

## 📊 Resultado Esperado

```
🔍 Iniciando exploit do GuessTheNumberChallenge...

📦 Nenhum endereço fornecido. Fazendo deploy do contrato...

✅ Contrato deployado em: 0x5FbDB2315678afecb367f032d93F642f64180aa3

📍 Endereço do contrato: 0x5FbDB2315678afecb367f032d93F642f64180aa3
👤 Atacante: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

📊 Estado antes do exploit:
  - Saldo do contrato: 1.0 ETH
  - Saldo do atacante: 10000.0 ETH
  - Desafio completo: false

🎯 Executando exploit: adivinhando o número 42
💡 O número está hardcoded no contrato, então podemos vê-lo!

📤 Transaction enviada: 0x...
✅ Transaction confirmada!

📊 Estado após o exploit:
  - Saldo do contrato: 0.0 ETH
  - Saldo do atacante: 10001.0 ETH (ou próximo disso, considerando gas)
  - Desafio completo: true

🎉 Desafio completado! O número foi adivinhado corretamente
💰 Você recebeu 2 ether de volta (1 ether enviado + 1 ether de lucro)
```

## 🔗 Referências

- [Capture the Ether - Guess the number](https://capturetheether.com/challenges/lotteries/guess-the-number/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)

## 💡 Aprendizados

- Como trabalhar com contratos que requerem ether no deploy (construtor payable)
- Como enviar ether em transações usando `{ value: parseEther("1.0") }`
- Como receber ether de volta de contratos usando `transfer()`
- Importância de não hardcodear valores secretos em contratos
- Como verificar saldos de contratos e contas

## 🔒 Segurança

Este desafio demonstra que:
- **Nunca hardcode valores secretos** em contratos - eles são públicos e visíveis
- Valores armazenados em variáveis de estado são visíveis na blockchain
- Para criar uma loteria verdadeiramente aleatória, é necessário usar fontes de aleatoriedade externas (oráculos, commit-reveal schemes, etc.)
- Qualquer informação no contrato pode ser lida por qualquer pessoa

## 📝 Nota sobre Valores Hardcoded

Em Solidity, variáveis de estado são armazenadas no storage do contrato e são **públicas por padrão**. Mesmo que não sejam marcadas como `public`, elas podem ser lidas através do storage slot. No caso deste contrato, `answer` está hardcoded como `42`, tornando-o trivial de descobrir.

Para uma loteria segura, seria necessário:
- Usar um esquema commit-reveal
- Usar um oráculo de aleatoriedade (Chainlink VRF)
- Usar blockhash com salt (ainda previsível)
- Usar um esquema de múltiplas partes

