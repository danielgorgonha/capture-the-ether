# Retirement Fund - 500 pontos

## 📋 Resumo

Este desafio demonstra duas vulnerabilidades importantes: **integer underflow** e o uso de **selfdestruct** para forçar ether em contratos. O contrato calcula `withdrawn = startBalance - address(this).balance`, mas se o saldo for maior que `startBalance`, isso causa underflow, permitindo que o beneficiary colete a "penalidade" mesmo sem saque antecipado.

## 🔍 Análise do Contrato

```solidity
pragma solidity ^0.4.21;

contract RetirementFundChallenge {
    uint256 startBalance;
    address owner = msg.sender;
    address beneficiary;
    uint256 expiration = now + 10 years;

    function RetirementFundChallenge(address player) public payable {
        require(msg.value == 1 ether);
        beneficiary = player;
        startBalance = msg.value;
    }

    function isComplete() public view returns (bool) {
        return address(this).balance == 0;
    }

    function collectPenalty() public {
        require(msg.sender == beneficiary);

        uint256 withdrawn = startBalance - address(this).balance;  // ⚠️ BUG: Pode fazer underflow!

        // an early withdrawal occurred
        require(withdrawn > 0);

        // penalty is what's left
        msg.sender.transfer(address(this).balance);
    }
}
```

**Características:**
- O contrato tem 1 ether depositado pelo owner
- O owner só pode sacar após 10 anos, ou paga 10% de penalidade
- O beneficiary (player) pode coletar a penalidade se houver saque antecipado
- O objetivo é fazer o saldo do contrato ser 0

**Vulnerabilidades:**
1. **Integer Underflow**: Se `address(this).balance > startBalance`, então `startBalance - address(this).balance` faz underflow, resultando em um número muito grande (2^256 - 1)
2. **selfdestruct**: Podemos usar `selfdestruct` para forçar ether para o contrato, mesmo sem função `payable`

## 🎯 Objetivo

Explorar o integer underflow para fazer o beneficiary coletar toda a penalidade, esvaziando o contrato.

## 🚀 Passo a Passo do Exploit

### 1. Fazer o deploy do contrato

```bash
npx hardhat run challenges/11_math_retirement_fund/scripts/deploy.js --network hardhat
```

### 2. Executar o exploit

```bash
npx hardhat run challenges/11_math_retirement_fund/scripts/exploit.js --network hardhat
```

**Estratégia do exploit:**

1. **Criar um contrato atacante:**
   - Criar um contrato simples com uma função `attack()` que chama `selfdestruct(target)`
   - `selfdestruct` pode enviar ether para qualquer endereço, mesmo sem função `payable`

2. **Enviar ether para o contrato atacante:**
   - Enviar algum ether (ex: 0.1 ETH) para o contrato atacante

3. **Chamar selfdestruct:**
   - Chamar `attack(retirementFundAddress)` para forçar ether para o RetirementFundChallenge
   - Isso aumenta o saldo do contrato acima de `startBalance` (1 ETH)

4. **Chamar collectPenalty():**
   - Como beneficiary, chamar `collectPenalty()`
   - O cálculo `withdrawn = startBalance - address(this).balance` fará underflow
   - `withdrawn` será um número muito grande (2^256 - 1)
   - `require(withdrawn > 0)` passará
   - Podemos transferir todo o saldo do contrato

**Por que funciona?**

- `selfdestruct` pode enviar ether para qualquer endereço, ignorando funções `payable`
- Se o saldo for maior que `startBalance`, o cálculo faz underflow
- O underflow cria um número muito grande que passa no `require(withdrawn > 0)`
- Podemos então transferir todo o saldo

### 3. Verificar o resultado

O script mostrará:
- Estado antes e depois do exploit
- Saldo do contrato
- Se o desafio foi completado (`isComplete()`)

## 📊 Resultado Esperado

```
🔍 Iniciando exploit do RetirementFundChallenge...

📊 Estado antes do exploit:
  - Saldo do contrato: 1.0 ETH
  - Start balance: 1.0 ETH
  - Desafio completo: false

📝 Passo 1: Criando contrato atacante e enviando ether via selfdestruct...
✅ Contrato atacante deployado em: 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512
📤 Enviando 0.1 ETH para o contrato atacante...
✅ Ether enviado!

💥 Chamando selfdestruct para forçar ether para o RetirementFundChallenge...
✅ Selfdestruct executado!

📊 Saldo após selfdestruct: 1.1 ETH
📊 Start balance: 1.0 ETH

📝 Passo 2: Chamando collectPenalty()...
✅ collectPenalty() confirmado!

📊 Estado após o exploit:
  - Saldo do contrato: 0.0 ETH
  - Desafio completo: true

🎉 Desafio completado! O contrato foi esvaziado
```

## 🔗 Referências

- [Capture the Ether - Retirement fund](https://capturetheether.com/challenges/math/retirement-fund/)
- [Solidity 0.4.21 Documentation](https://docs.soliditylang.org/en/v0.4.21/)
- [Integer Underflow in Solidity](https://consensys.github.io/smart-contract-best-practices/attacks/integer-overflow/)
- [selfdestruct in Solidity](https://docs.soliditylang.org/en/v0.4.21/introduction-to-smart-contracts.html#deactivate-and-self-destruct)
- [Ethers.js Documentation](https://docs.ethers.org/)

## 💡 Aprendizados

1. **Integer Underflow**: Em Solidity 0.4.21, não há proteção contra underflow. Subtrair um número maior de um menor resulta em um número muito grande (2^256 - 1).

2. **selfdestruct**: A função `selfdestruct` pode enviar ether para qualquer endereço, mesmo que o contrato não tenha função `payable`. Isso pode ser usado para forçar ether em contratos.

3. **Validação de Cálculos**: Sempre validar que os cálculos não podem resultar em underflow/overflow. Em versões antigas do Solidity, usar bibliotecas como SafeMath.

4. **Lógica de Negócio**: O cálculo `withdrawn = startBalance - balance` assume que `balance <= startBalance`. Se isso não for garantido, pode causar problemas.

5. **Proteção Contra selfdestruct**: Em versões modernas do Solidity, `selfdestruct` foi deprecado, mas ainda funciona. Contratos devem considerar que podem receber ether via `selfdestruct` mesmo sem função `payable`.

