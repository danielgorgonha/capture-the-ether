# Guess the Random Number - 300 pontos

## 📋 Resumo

Este desafio tenta criar um número "aleatório" usando informações do bloco. No entanto, a vulnerabilidade está no fato de que todas as informações usadas para gerar o número são **públicas e conhecidas** na blockchain. Podemos calcular o número exatamente da mesma forma que o contrato, usando o hash do bloco anterior e o timestamp do bloco de deploy.

## 🔍 Análise do Contrato

```solidity
pragma solidity ^0.4.21;

contract GuessTheRandomNumberChallenge {
    uint8 answer;

    function GuessTheRandomNumberChallenge() public payable {
        require(msg.value == 1 ether);
        answer = uint8(keccak256(block.blockhash(block.number - 1), now));
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
- O número é gerado no construtor usando: `uint8(keccak256(block.blockhash(block.number - 1), now))`
- Construtor requer 1 ether para deploy
- Função `guess()` requer 1 ether por tentativa
- Se acertar, recebe 2 ether de volta
- Desafio completo quando o saldo do contrato é 0

**Vulnerabilidade:**
- `block.blockhash(block.number - 1)` - o hash do bloco anterior é **público** e pode ser lido
- `now` (timestamp do bloco) também é **público** e pode ser lido
- Ambos os valores estão disponíveis na blockchain
- Podemos calcular o mesmo hash localmente usando os mesmos valores
- O número não é realmente aleatório, é **previsível**

## 🎯 Objetivo

Calcular o número "aleatório" usando:
1. Obter o hash do bloco anterior ao deploy (`block.blockhash(block.number - 1)`)
2. Obter o timestamp do bloco de deploy (`now`)
3. Calcular `keccak256(blockhash, timestamp)`
4. Converter para `uint8` (pegar os últimos 8 bits)
5. Chamar `guess()` com o número calculado

## 🚀 Passo a Passo do Exploit

### 1. Fazer o deploy do contrato

```bash
npx hardhat run challenges/05_lottery_guess_random_number/scripts/deploy.js --network hardhat
```

Isso irá:
- Deployar o contrato enviando 1 ether (requerido pelo construtor)
- Mostrar o endereço do contrato, bloco de deploy, hash do bloco anterior e timestamp
- Verificar que o desafio ainda não está completo

### 2. Executar o exploit

```bash
npx hardhat run challenges/05_lottery_guess_random_number/scripts/exploit.js --network hardhat
```

O exploit irá:
- Conectar ao contrato deployado (ou fazer deploy se necessário)
- Obter o bloco de deploy e o bloco anterior
- Calcular o número usando `keccak256(blockhash_anterior, timestamp)`
- Converter para `uint8`
- Chamar `guess()` com o número calculado enviando 1 ether
- Receber 2 ether de volta
- Verificar que o saldo do contrato é 0 e o desafio está completo

### 3. Verificar o resultado

O script mostrará:
- Estado antes: `saldo do contrato = 1 ETH`, `desafio completo = false`
- Informações do bloco usado no cálculo
- Número calculado
- Transaction hash da chamada `guess()`
- Estado após: `saldo do contrato = 0 ETH`, `desafio completo = true`

## 📊 Resultado Esperado

```
🔍 Iniciando exploit do GuessTheRandomNumberChallenge...

📦 Nenhum endereço fornecido. Fazendo deploy do contrato...

✅ Contrato deployado em: 0x5FbDB2315678afecb367f032d93F642f64180aa3
📊 Bloco de deploy: 1

📍 Endereço do contrato: 0x5FbDB2315678afecb367f032d93F642f64180aa3
👤 Atacante: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

📊 Estado antes do exploit:
  - Saldo do contrato: 1.0 ETH
  - Desafio completo: false

🔍 Calculando o número 'aleatório'...

📊 Informações do bloco usado no cálculo:
  - Bloco de deploy: 1
  - Bloco anterior: 0
  - Hash do bloco anterior: 0xa9ef285711733534a56747a78c6970c7cd8faf71b75633152c39ef1462780faf
  - Timestamp do bloco de deploy: 1763007630

🔐 Cálculo do número:
  - Hash do bloco anterior: 0xa9ef285711733534a56747a78c6970c7cd8faf71b75633152c39ef1462780faf
  - Timestamp: 1763007630
  - Hash combinado: 0x4619c154086dc95f0c32ed40e82bd34efeb77fb0fb8ad709b472d90efac7b143
  - Número calculado (uint8): 67

🎯 Executando exploit: adivinhando o número 67...

📤 Transaction enviada: 0x...
✅ Transaction confirmada!

📊 Estado após o exploit:
  - Saldo do contrato: 0.0 ETH
  - Desafio completo: true

🎉 Desafio completado! O número foi calculado e adivinhado corretamente
💰 Você recebeu 2 ether de volta (1 ether enviado + 1 ether de lucro)
```

## 🔗 Referências

- [Capture the Ether - Guess the random number](https://capturetheether.com/challenges/lotteries/guess-the-random-number/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Blockchain Block Structure](https://ethereum.org/en/developers/docs/blocks/)

## 💡 Aprendizados

- Como obter informações de blocos usando `provider.getBlock()`
- Como calcular hashes da mesma forma que o Solidity
- Como `keccak256` funciona com múltiplos argumentos em Solidity 0.4.21
- Por que informações de blocos não são seguras para aleatoriedade
- Como converter valores para `uint8` (últimos 8 bits)

## 🔒 Segurança

Este desafio demonstra que:
- **Informações de blocos são públicas** - qualquer um pode ler `block.blockhash`, `block.timestamp`, etc.
- **Não use informações de blocos para aleatoriedade** - elas são previsíveis
- `block.blockhash(block.number - 1)` pode ser lido por qualquer um
- `now` (timestamp do bloco) também é público
- Qualquer cálculo baseado em dados públicos pode ser replicado

**Para criar aleatoriedade verdadeira em contratos:**
- Use oráculos de aleatoriedade (Chainlink VRF)
- Use esquemas commit-reveal
- Use blockhash de blocos futuros (ainda previsível, mas mais difícil)
- Use múltiplas fontes de aleatoriedade combinadas

## 📝 Nota sobre Aleatoriedade em Blockchain

Em blockchains, **não existe verdadeira aleatoriedade** porque:
1. Todos os dados são públicos e verificáveis
2. Mineradores/validadores podem influenciar alguns valores (como timestamp)
3. Qualquer cálculo baseado em dados públicos pode ser replicado

O contrato tenta usar:
- `block.blockhash(block.number - 1)` - hash do bloco anterior (público)
- `now` - timestamp do bloco atual (público)

Ambos são conhecidos, então podemos calcular o número exatamente da mesma forma que o contrato.

## 🎓 Lição Aprendida

**Nunca use informações de blocos para gerar valores secretos ou aleatórios.** Todos os dados de blocos são públicos e podem ser lidos por qualquer pessoa. Para aleatoriedade verdadeira, use oráculos externos ou esquemas mais complexos como commit-reveal.

