# Guess the Secret Number - 300 pontos

## 📋 Resumo

Este desafio é uma melhoria do desafio anterior. Desta vez, o número não está hardcoded, mas sim armazenado como um hash. No entanto, a vulnerabilidade permanece: como o número é um `uint8` (valores de 0 a 255), podemos fazer **brute force** testando todos os 256 valores possíveis até encontrar o que produz o hash correto.

## 🔍 Análise do Contrato

```solidity
pragma solidity ^0.4.21;

contract GuessTheSecretNumberChallenge {
    bytes32 answerHash = 0xdb81b4d58595fbbbb592d3661a34cdca14d7ab379441400cbfa1b78bc447c365;

    function GuessTheSecretNumberChallenge() public payable {
        require(msg.value == 1 ether);
    }
    
    function isComplete() public view returns (bool) {
        return address(this).balance == 0;
    }

    function guess(uint8 n) public payable {
        require(msg.value == 1 ether);

        if (keccak256(n) == answerHash) {
            msg.sender.transfer(2 ether);
        }
    }
}
```

**Características:**
- O número está armazenado como um hash (`answerHash`)
- Construtor requer 1 ether para deploy
- Função `guess()` requer 1 ether por tentativa
- Se acertar, recebe 2 ether de volta
- Desafio completo quando o saldo do contrato é 0

**Vulnerabilidade:**
- O número é do tipo `uint8`, que tem apenas **256 valores possíveis** (0-255)
- Embora o hash seja criptograficamente seguro, o espaço de busca é muito pequeno
- Podemos fazer brute force testando todos os valores de 0 a 255
- O número secreto é **170** (encontrado via brute force)

## 🎯 Objetivo

Encontrar o número secreto fazendo brute force de todos os valores possíveis (0-255), calcular o hash de cada um e comparar com `answerHash`. Quando encontrar o match, chamar `guess()` com o número correto.

## 🚀 Passo a Passo do Exploit

### 1. Fazer o deploy do contrato

```bash
npx hardhat run challenges/04_lottery_guess_secret_number/scripts/deploy.js --network hardhat
```

Isso irá:
- Deployar o contrato enviando 1 ether (requerido pelo construtor)
- Mostrar o endereço do contrato e o saldo inicial (1 ether)
- Verificar que o desafio ainda não está completo

### 2. Executar o exploit

```bash
npx hardhat run challenges/04_lottery_guess_secret_number/scripts/exploit.js --network hardhat
```

O exploit irá:
- Conectar ao contrato deployado
- Verificar o estado inicial (saldo do contrato = 1 ether)
- Fazer brute force testando todos os valores de 0 a 255
- Calcular `keccak256(i)` para cada valor e comparar com `answerHash`
- Quando encontrar o match (número 170), chamar `guess(170)` enviando 1 ether
- Receber 2 ether de volta
- Verificar que o saldo do contrato é 0 e o desafio está completo

### 3. Verificar o resultado

O script mostrará:
- Estado antes: `saldo do contrato = 1 ETH`, `desafio completo = false`
- Progresso do brute force
- Número secreto encontrado: `170`
- Transaction hash da chamada `guess(170)`
- Estado após: `saldo do contrato = 0 ETH`, `desafio completo = true`

## 📊 Resultado Esperado

```
🔍 Iniciando exploit do GuessTheSecretNumberChallenge...

📦 Nenhum endereço fornecido. Fazendo deploy do contrato...

✅ Contrato deployado em: 0x5FbDB2315678afecb367f032d93F642f64180aa3

📍 Endereço do contrato: 0x5FbDB2315678afecb367f032d93F642f64180aa3
👤 Atacante: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

📊 Estado antes do exploit:
  - Saldo do contrato: 1.0 ETH
  - Desafio completo: false

🔐 Hash alvo: 0xdb81b4d58595fbbbb592d3661a34cdca14d7ab379441400cbfa1b78bc447c365
💡 Como o número é uint8 (0-255), podemos fazer brute force!

🔍 Procurando o número secreto...

   Testando... 50/255
   Testando... 100/255
   Testando... 150/255
✅ Número secreto encontrado: 170

🎯 Executando exploit: adivinhando o número 170...

📤 Transaction enviada: 0x...
✅ Transaction confirmada!

📊 Estado após o exploit:
  - Saldo do contrato: 0.0 ETH
  - Desafio completo: true

🎉 Desafio completado! O número secreto foi encontrado e adivinhado corretamente
💰 Você recebeu 2 ether de volta (1 ether enviado + 1 ether de lucro)
```

## 🔗 Referências

- [Capture the Ether - Guess the secret number](https://capturetheether.com/challenges/lotteries/guess-the-secret-number/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Keccak-256 Hash Function](https://en.wikipedia.org/wiki/SHA-3)

## 💡 Aprendizados

- Como fazer brute force de valores pequenos (uint8 = 256 possibilidades)
- Como calcular keccak256 em JavaScript/Ethers.js
- Como o Solidity 0.4.21 trata `keccak256(uint8)` (faz hash do byte diretamente)
- Importância de usar espaços de busca grandes para valores secretos
- Limitações de segurança quando o espaço de busca é pequeno

## 🔒 Segurança

Este desafio demonstra que:
- **Hash não é suficiente se o espaço de busca for pequeno**
- Um `uint8` tem apenas 256 valores possíveis, tornando brute force trivial
- Para valores secretos, use tipos maiores (uint256) ou aumente a complexidade
- Mesmo com hash criptográfico seguro (keccak256), se o espaço de busca é pequeno, é vulnerável
- Em contratos reais, considere:
  - Usar valores maiores (uint256 em vez de uint8)
  - Adicionar rate limiting ou custos por tentativa
  - Usar esquemas commit-reveal para aleatoriedade verdadeira

## 📝 Nota sobre Brute Force

O número secreto neste desafio é **170**. O exploit faz brute force testando todos os valores de 0 a 255:

1. Para cada valor `i` de 0 a 255:
   - Calcula `keccak256(i)` (em Solidity 0.4.21, isso faz hash do byte diretamente)
   - Compara com `answerHash`
   - Se match, encontramos o número!

2. Como há apenas 256 valores possíveis, o brute force é muito rápido (menos de 1 segundo)

3. Em Solidity 0.4.21, `keccak256(uint8)` faz hash do valor como um único byte, então precisamos calcular o hash da mesma forma no JavaScript.

## 🎓 Lição Aprendida

**Nunca use tipos pequenos (uint8, uint16) para valores secretos que precisam ser seguros.** Mesmo com hash, o espaço de busca pequeno torna o brute force trivial. Use `uint256` ou esquemas mais complexos para valores que precisam ser secretos.

