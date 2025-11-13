# Token Whale - 500 pontos

## 📋 Resumo

Este desafio demonstra uma vulnerabilidade crítica na função `_transfer()`: ela usa `msg.sender` em vez de `from` quando chamada por `transferFrom()`. Isso permite explorar um integer underflow quando `msg.sender` não tem tokens, resultando em um saldo muito grande (2^256 - 1).

## 🔍 Análise do Contrato

```solidity
pragma solidity ^0.4.21;

contract TokenWhaleChallenge {
    address player;

    uint256 public totalSupply;
    mapping(address => uint256) public balanceOf;
    mapping(address => mapping(address => uint256)) public allowance;

    function TokenWhaleChallenge(address _player) public {
        player = _player;
        totalSupply = 1000;
        balanceOf[player] = 1000;
    }

    function isComplete() public view returns (bool) {
        return balanceOf[player] >= 1000000;
    }

    function _transfer(address to, uint256 value) internal {
        balanceOf[msg.sender] -= value;  // ⚠️ BUG: Usa msg.sender em vez de from!
        balanceOf[to] += value;

        emit Transfer(msg.sender, to, value);
    }

    function transferFrom(address from, address to, uint256 value) public {
        require(balanceOf[from] >= value);
        require(balanceOf[to] + value >= balanceOf[to]);
        require(allowance[from][msg.sender] >= value);

        allowance[from][msg.sender] -= value;
        _transfer(to, value);  // ⚠️ Chama _transfer mas não passa 'from'!
    }
}
```

**Características:**
- O contrato tem um totalSupply de 1000 tokens, todos dados ao player inicialmente
- O objetivo é fazer `balanceOf[player] >= 1000000`
- Há funções `transfer`, `approve` e `transferFrom`

**Vulnerabilidade:**
- A função `_transfer()` usa `msg.sender` para subtrair tokens
- Quando `transferFrom()` é chamado, ele verifica que `from` tem saldo suficiente
- Mas `_transfer()` subtrai de `msg.sender` (não de `from`)
- Se `msg.sender` não tem tokens, `balanceOf[msg.sender] -= value` faz underflow
- Em Solidity 0.4.21, underflow resulta em um número muito grande (2^256 - 1)

## 🎯 Objetivo

Explorar a vulnerabilidade para fazer o player ter pelo menos 1,000,000 tokens.

## 🚀 Passo a Passo do Exploit

### 1. Fazer o deploy do contrato

```bash
npx hardhat run challenges/10_math_token_whale/scripts/deploy.js --network hardhat
```

### 2. Executar o exploit

```bash
npx hardhat run challenges/10_math_token_whale/scripts/exploit.js --network hardhat
```

**Estratégia do exploit:**

1. **Player aprova o atacante:**
   - Player chama `approve(attacker, MAX_UINT256)` para permitir que o atacante transfira seus tokens

2. **Atacante chama transferFrom:**
   - Atacante chama `transferFrom(player, player, 1)`
   - O contrato verifica que `player` tem saldo suficiente (✓)
   - O contrato verifica que `player` tem allowance para o atacante (✓)
   - Reduz a allowance
   - Chama `_transfer(player, 1)`

3. **Bug em _transfer:**
   - `_transfer` faz `balanceOf[msg.sender] -= 1` (msg.sender é o atacante, não o player!)
   - Como o atacante não tem tokens, isso faz underflow
   - `balanceOf[attacker] = 2^256 - 1` (número muito grande)
   - `balanceOf[player] += 1` (player ganha 1 token)

4. **Transferir tokens para o player:**
   - Como o atacante agora tem muitos tokens (devido ao underflow), podemos transferir para o player
   - Transferir tokens suficientes para o player ter 1,000,000 tokens

**Por que funciona?**

- `transferFrom` verifica que `from` tem saldo, mas `_transfer` subtrai de `msg.sender`
- Se `msg.sender` não tem tokens, o underflow cria um saldo enorme
- Podemos então transferir esses tokens para o player

### 3. Verificar o resultado

O script mostrará:
- Estado antes e depois do exploit
- Saldos de tokens
- Se o desafio foi completado (`isComplete()`)

## 📊 Resultado Esperado

```
🔍 Iniciando exploit do TokenWhaleChallenge...

📊 Estado antes do exploit:
  - Total supply: 1000
  - Tokens do player: 1000
  - Tokens do atacante: 0
  - Desafio completo: false

📝 Passo 1: Player aprova o atacante para transferir tokens...
✅ Aprovação confirmada!

📝 Passo 2: Atacante chama transferFrom(player, player, 1)...
✅ TransferFrom confirmado!

📊 Saldos após transferFrom:
  - Tokens do atacante: 115792089237316195423570985008687907853269984665640564039457584007913129639935
  - Tokens do player: 1001

📝 Passo 3: Transferir tokens do atacante para o player...
   Tokens necessários: 998999
✅ Transferência confirmada!

📊 Estado após o exploit:
  - Tokens do player: 1000000
  - Desafio completo: true

🎉 Desafio completado! O player agora tem pelo menos 1,000,000 tokens
```

## 🔗 Referências

- [Capture the Ether - Token whale](https://capturetheether.com/challenges/math/token-whale/)
- [Solidity 0.4.21 Documentation](https://docs.soliditylang.org/en/v0.4.21/)
- [Integer Underflow in Solidity](https://consensys.github.io/smart-contract-best-practices/attacks/integer-overflow/)
- [Ethers.js Documentation](https://docs.ethers.org/)

## 💡 Aprendizados

1. **Bug em _transfer**: A função `_transfer()` deve receber `from` como parâmetro, não usar `msg.sender`. Quando chamada por `transferFrom()`, deve subtrair de `from`, não de `msg.sender`.

2. **Integer Underflow**: Em Solidity 0.4.21, não há proteção contra underflow. Subtrair de um número menor que o valor resulta em um número muito grande (2^256 - 1).

3. **Estratégia de Ataque**: Podemos explorar o bug para criar um saldo enorme através de underflow, depois transferir para o endereço desejado.

4. **Importância de Parâmetros Corretos**: Funções internas devem receber todos os parâmetros necessários, não depender de `msg.sender` quando o contexto pode ser diferente.

5. **Proteção Contra Underflow**: Em versões modernas do Solidity (0.8.0+), underflow causa revert automático. Em versões antigas, devemos usar bibliotecas como SafeMath.

