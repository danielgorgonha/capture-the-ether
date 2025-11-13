# Token Sale - 500 pontos

## 📋 Resumo

Este desafio demonstra uma vulnerabilidade clássica de **integer overflow** em Solidity 0.4.21. O contrato permite comprar tokens a 1 ether cada, mas a multiplicação `numTokens * PRICE_PER_TOKEN` pode fazer overflow, permitindo comprar muitos tokens pagando muito pouco.

## 🔍 Análise do Contrato

```solidity
pragma solidity ^0.4.21;

contract TokenSaleChallenge {
    mapping(address => uint256) public balanceOf;
    uint256 constant PRICE_PER_TOKEN = 1 ether;

    function TokenSaleChallenge(address _player) public payable {
        require(msg.value == 1 ether);
    }

    function isComplete() public view returns (bool) {
        return address(this).balance < 1 ether;
    }

    function buy(uint256 numTokens) public payable {
        require(msg.value == numTokens * PRICE_PER_TOKEN);

        balanceOf[msg.sender] += numTokens;
    }

    function sell(uint256 numTokens) public {
        require(balanceOf[msg.sender] >= numTokens);

        balanceOf[msg.sender] -= numTokens;
        msg.sender.transfer(numTokens * PRICE_PER_TOKEN);
    }
}
```

**Características:**
- O contrato permite comprar tokens a 1 ether cada
- Permite vender tokens de volta a 1 ether cada
- O contrato começa com 1 ether de saldo
- O desafio está completo quando o saldo do contrato é menor que 1 ether

**Vulnerabilidade:**
- Em Solidity 0.4.21, não há proteção contra integer overflow
- A linha `require(msg.value == numTokens * PRICE_PER_TOKEN)` pode fazer overflow
- Se escolhermos `numTokens` grande o suficiente, `numTokens * 1 ether` fará overflow
- Podemos pagar pouco mas receber muitos tokens
- Depois podemos vender alguns tokens para receber mais do que pagamos

## 🎯 Objetivo

Explorar o integer overflow para comprar muitos tokens pagando pouco, depois vender alguns para esvaziar o contrato abaixo de 1 ether.

## 🚀 Passo a Passo do Exploit

### 1. Fazer o deploy do contrato

```bash
npx hardhat run challenges/09_math_token_sale/scripts/deploy.js --network hardhat
```

### 2. Executar o exploit

```bash
npx hardhat run challenges/09_math_token_sale/scripts/exploit.js --network hardhat
```

**Estratégia do exploit:**

1. **Calcular numTokens que causa overflow:**
   - `numTokens = (2^256 / 1 ether) + 1`
   - Isso fará com que `numTokens * 1 ether` faça overflow
   - O valor resultante será pequeno (apenas alguns wei)

2. **Comprar tokens com overflow:**
   - Chamar `buy(numTokens)` enviando o valor pequeno (resultado do overflow)
   - O contrato verifica `msg.value == numTokens * PRICE_PER_TOKEN` (que passa devido ao overflow)
   - Recebemos muitos tokens (o valor grande de `numTokens`)

3. **Vender alguns tokens:**
   - Vender apenas 1 token para receber 1 ether
   - O contrato tinha 1 ETH inicial + o que pagamos
   - Ao receber 1 ETH de volta, o saldo fica abaixo de 1 ETH

4. **Verificar que o desafio está completo:**
   - O saldo do contrato agora é menor que 1 ether
   - `isComplete()` retorna `true`

**Por que funciona?**

- Em Solidity 0.4.21, operações aritméticas não verificam overflow/underflow
- `numTokens * PRICE_PER_TOKEN` pode fazer overflow e resultar em um valor pequeno
- Mas `balanceOf[msg.sender] += numTokens` adiciona o valor grande de `numTokens`
- Podemos pagar pouco mas receber muitos tokens
- Ao vender alguns tokens, recebemos mais do que pagamos

### 3. Verificar o resultado

O script mostrará:
- Estado antes e depois do exploit
- Saldo do contrato
- Tokens recebidos
- Se o desafio foi completado (`isComplete()`)

## 📊 Resultado Esperado

```
🔍 Iniciando exploit do TokenSaleChallenge...

📊 Cálculos do exploit:
  - PRICE_PER_TOKEN: 1000000000000000000 wei (1 ether)
  - numTokens: 115792089237316195423570985008687907853269984665640564039458
  - numTokens * PRICE_PER_TOKEN (com overflow): 415992086870360064 wei
  - Valor a enviar: 0.415992086870360064 ETH

💰 Comprando tokens com overflow...
✅ Compra confirmada!

📊 Tokens recebidos: 115792089237316195423570985008687907853269984665640564039458

💸 Vendendo 1 token para receber 1 ETH...
✅ Venda confirmada!

📊 Saldo após vender 1 token: 0.415992086870360064 ETH

📊 Estado após o exploit:
  - Saldo do contrato: 0.415992086870360064 ETH
  - Desafio completo: true

🎉 Desafio completado! O integer overflow foi explorado com sucesso
💰 O contrato agora tem menos de 1 ether
```

## 🔗 Referências

- [Capture the Ether - Token sale](https://capturetheether.com/challenges/math/token-sale/)
- [Solidity 0.4.21 Documentation](https://docs.soliditylang.org/en/v0.4.21/)
- [Integer Overflow in Solidity](https://consensys.github.io/smart-contract-best-practices/attacks/integer-overflow/)
- [Ethers.js Documentation](https://docs.ethers.org/)

## 💡 Aprendizados

1. **Integer Overflow em Solidity 0.4.21**: Versões antigas do Solidity não verificam overflow/underflow automaticamente. Isso foi corrigido no Solidity 0.8.0.

2. **Multiplicação com Overflow**: Quando multiplicamos dois números grandes, o resultado pode fazer overflow e "voltar" para um valor pequeno.

3. **Estratégia de Ataque**: Podemos explorar overflow para pagar pouco mas receber muito, especialmente em operações de compra/venda.

4. **Proteção Contra Overflow**: Em versões modernas do Solidity (0.8.0+), overflow causa revert automático. Em versões antigas, devemos usar bibliotecas como SafeMath.

5. **Importância de Validação**: Sempre validar entradas e usar bibliotecas seguras para operações aritméticas em contratos antigos.

