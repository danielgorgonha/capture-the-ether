# Fifty Years - 2000 pontos

## 📋 Resumo

Este desafio demonstra uma combinação de vulnerabilidades: **storage collision** e **integer overflow**. O contrato bloqueia ether por 50 anos, mas podemos usar storage collision para modificar o `unlockTimestamp` da primeira contribuição e depois usar integer overflow para adicionar uma nova contribuição com timestamp no passado, permitindo withdraw antecipado.

## 🔍 Análise do Contrato

```solidity
pragma solidity ^0.4.21;

contract FiftyYearsChallenge {
    struct Contribution {
        uint256 amount;
        uint256 unlockTimestamp;
    }
    Contribution[] queue;
    uint256 head;

    address owner;
    function FiftyYearsChallenge(address player) public payable {
        require(msg.value == 1 ether);
        owner = player;
        queue.push(Contribution(msg.value, now + 50 years));
    }

    function isComplete() public view returns (bool) {
        return address(this).balance == 0;
    }

    function upsert(uint256 index, uint256 timestamp) public payable {
        require(msg.sender == owner);

        if (index >= head && index < queue.length) {
            // Update existing contribution amount without updating timestamp.
            Contribution storage contribution = queue[index];
            contribution.amount += msg.value;
        } else {
            // Append a new contribution. Require that each contribution unlock
            // at least 1 day after the previous one.
            require(timestamp >= queue[queue.length - 1].unlockTimestamp + 1 days);

            contribution.amount = msg.value;
            contribution.unlockTimestamp = timestamp;
            queue.push(contribution);
        }
    }

    function withdraw(uint256 index) public {
        require(msg.sender == owner);
        require(now >= queue[index].unlockTimestamp);

        // Withdraw this and any earlier contributions.
        uint256 total = 0;
        for (uint256 i = head; i <= index; i++) {
            total += queue[i].amount;
            delete queue[i];
        }

        head = index + 1;
        msg.sender.transfer(total);
    }
}
```

**Características:**
- O contrato bloqueia ether por 50 anos na primeira contribuição
- A função `upsert` permite atualizar contribuições existentes ou adicionar novas
- A função `withdraw` permite retirar contribuições desbloqueadas
- O objetivo é esvaziar o contrato antes dos 50 anos

**Vulnerabilidades:**
1. **Storage Collision**: O array `queue` começa em `keccak256(0)`. Cada struct `Contribution` ocupa 2 slots (amount e unlockTimestamp). Podemos calcular um índice que faz wrap-around para sobrescrever `queue[0].unlockTimestamp`.
2. **Integer Overflow**: Se `queue[queue.length - 1].unlockTimestamp + 1 days` fizer overflow, podemos passar no require com um timestamp pequeno (no passado).
3. **Bug na função upsert**: Quando `index >= queue.length`, o código usa `contribution` que não foi inicializado, o que pode causar problemas.

## 🎯 Objetivo

Modificar `queue[0].unlockTimestamp` usando storage collision, depois usar integer overflow para adicionar uma contribuição com timestamp no passado, e finalmente fazer withdraw antecipado.

## 🚀 Passo a Passo do Exploit

### 1. Fazer o deploy do contrato

```bash
npx hardhat run challenges/14_math_fifty_years/scripts/deploy.js --network hardhat
```

### 2. Executar o exploit

```bash
npx hardhat run challenges/14_math_fifty_years/scripts/exploit.js --network hardhat
```

**Estratégia do exploit:**

1. **Calcular o índice que corresponde ao slot de `queue[0].unlockTimestamp`:**
   - O array `queue` começa em `keccak256(0)`
   - Cada struct `Contribution` ocupa 2 slots: `amount` (slot 0 do struct) e `unlockTimestamp` (slot 1 do struct)
   - O slot do array[index] é:
     - `amount`: `keccak256(0) + 2*index`
     - `unlockTimestamp`: `keccak256(0) + 2*index + 1`
   - Para sobrescrever `queue[0].unlockTimestamp` (que está em `keccak256(0) + 1`), precisamos que `unlockTimestamp` seja armazenado nesse slot:
     - `keccak256(0) + 2*index + 1 = keccak256(0) + 1` (mod 2^256)
     - `2*index = 0` (mod 2^256)
     - `index = 0` ou `index = 2^255`
   - Como `index = 0` já existe, usamos `index = 2^255`

2. **Modificar `queue[0].unlockTimestamp` para causar overflow:**
   - Fazer `upsert(2^255, MAX_UINT256 - 1 day)`
   - Isso sobrescreve `queue[0].unlockTimestamp` com `MAX_UINT256 - 1 day`
   - Quando fazemos `queue[0].unlockTimestamp + 1 day`, isso faz overflow (vira 0)

3. **Adicionar nova contribuição com timestamp no passado:**
   - Fazer `upsert(queue.length, 0)` ou `upsert(queue.length, timestamp_no_passado)`
   - O require `timestamp >= queue[queue.length - 1].unlockTimestamp + 1 days` passa devido ao overflow
   - Isso adiciona uma nova contribuição com timestamp no passado

4. **Fazer withdraw antecipado:**
   - Fazer `withdraw(1)` para retirar todo o ether
   - Como a nova contribuição tem timestamp no passado, o require `now >= queue[1].unlockTimestamp` passa

**Por que funciona?**

- Arrays de structs em Solidity usam `keccak256(slot)` como base
- Cada struct ocupa múltiplos slots consecutivos
- Se expandirmos o array para um tamanho muito grande (2^255), podemos fazer wrap-around
- Isso permite sobrescrever slots anteriores de storage
- Integer overflow permite passar no require de timestamp mesmo com valores no passado

### 3. Verificar o resultado

O script mostrará:
- Estado antes e depois do exploit
- Se o `unlockTimestamp` foi modificado
- Se o desafio foi completado (`isComplete()`)

## 📊 Resultado Esperado

```
🔍 Explorando bug na função upsert e integer overflow...

📊 Slot 0 hash (keccak256(0)): 0x290decd9548b62a8d60345a988386fc84ba6bc95484008f6362f93160ef3e563

📝 Passo 1: Usando storage collision para modificar queue[0].unlockTimestamp...
   Índice: 57896044618658097711785492504343953926634992332820282019728792003956564819968
   Novo unlockTimestamp: 115792089237316195423570985008687907853269984665640564039457584007913129553536

📤 Tentando fazer upsert para modificar unlockTimestamp...
✅ Upsert confirmado! unlockTimestamp modificado.

📝 Passo 2: Adicionando nova contribuição com timestamp = 0 usando integer overflow...
✅ Nova contribuição adicionada com timestamp = 0!

📝 Passo 3: Fazendo withdraw(1) para retirar todo o ether...
✅ Withdraw confirmado!

📊 Estado final:
  - Saldo do contrato: 0.0 ETH
  - Desafio completo: true

🎉 Desafio completado! O ether foi roubado com sucesso
```

## ⚠️ Nota Importante

Este exploit requer **MUITO gas** (potencialmente bilhões) porque precisa expandir o array para um tamanho enorme (2^255). Em Hardhat, isso pode não ser totalmente executável devido ao limite de gas por bloco (30 milhões), mas o conceito está correto. Em uma rede real, seria extremamente caro, mas tecnicamente possível.

## 🔗 Referências

- [Capture the Ether - Fifty years](https://capturetheether.com/challenges/math/fifty-years/)
- [Solidity 0.4.21 Documentation](https://docs.soliditylang.org/en/v0.4.21/)
- [Storage Layout in Solidity](https://docs.soliditylang.org/en/v0.4.21/miscellaneous.html#layout-of-state-variables-in-storage)
- [Integer Overflow in Solidity](https://swcregistry.io/docs/SWC-101)
- [Ethers.js Documentation](https://docs.ethers.org/)

## 💡 Aprendizados

1. **Storage Collision em Structs**: Arrays de structs podem fazer wrap-around do storage se expandidos para tamanhos muito grandes, permitindo sobrescrever slots anteriores.

2. **Cálculo de Índices**: Para arrays de structs, cada struct ocupa múltiplos slots. O slot do campo `i` do struct no índice `j` é: `keccak256(arraySlot) + structSize * j + i`.

3. **Integer Overflow**: Em Solidity 0.4.21, não há proteção contra overflow. Se `a + b` exceder `MAX_UINT256`, o resultado faz wrap-around (vira um valor pequeno).

4. **Combinação de Vulnerabilidades**: Este desafio demonstra como múltiplas vulnerabilidades podem ser combinadas para criar um exploit mais poderoso.

5. **Importância de Validação**: Contratos devem validar que arrays não podem ser expandidos para tamanhos que causem storage collision, e devem usar SafeMath ou Solidity 0.8+ para prevenir integer overflow.

