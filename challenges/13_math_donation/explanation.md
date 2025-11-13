# Donation - 750 pontos

## 📋 Resumo

Este desafio demonstra uma vulnerabilidade de **storage collision** em arrays de structs. Podemos calcular um índice do array que faz wrap-around do storage para sobrescrever variáveis anteriores, especificamente `owner` que está no slot 1. Uma vez que controlamos o `owner`, podemos chamar `withdraw()` para roubar todo o ether.

## 🔍 Análise do Contrato

```solidity
pragma solidity ^0.4.21;

contract DonationChallenge {
    struct Donation {
        uint256 timestamp;
        uint256 etherAmount;
    }
    Donation[] public donations;

    address public owner;

    function DonationChallenge() public payable {
        require(msg.value == 1 ether);
        owner = msg.sender;
    }
    
    function isComplete() public view returns (bool) {
        return address(this).balance == 0;
    }

    function donate(uint256 etherAmount) public payable {
        // amount is in ether, but msg.value is in wei
        uint256 scale = 10**18 * 1 ether;  // ⚠️ scale = 10^36
        require(msg.value == etherAmount / scale);

        Donation donation;
        donation.timestamp = now;
        donation.etherAmount = etherAmount;

        donations.push(donation);
    }

    function withdraw() public {
        require(msg.sender == owner);
        msg.sender.transfer(address(this).balance);
    }
}
```

**Características:**
- O contrato aceita doações e armazena em um array de structs
- O cálculo `scale = 10**18 * 1 ether = 10^36` permite doar com pouco ether
- O objetivo é esvaziar o contrato (roubar o ether do owner)

**Vulnerabilidades:**
1. **Storage Collision**: O array `donations` começa em `keccak256(2)`. Cada struct `Donation` ocupa 2 slots (timestamp e etherAmount). Podemos calcular um índice que faz wrap-around para sobrescrever o slot 1 (owner).
2. **Cálculo de scale**: `scale = 10^36` permite que `etherAmount` seja muito grande enquanto `msg.value` é pequeno.

## 🎯 Objetivo

Sobrescrever `owner` usando storage collision e depois chamar `withdraw()` para roubar o ether.

## 🚀 Passo a Passo do Exploit

### 1. Fazer o deploy do contrato

```bash
npx hardhat run challenges/13_math_donation/scripts/deploy.js --network hardhat
```

### 2. Executar o exploit

```bash
npx hardhat run challenges/13_math_donation/scripts/exploit.js --network hardhat
```

**Estratégia do exploit:**

1. **Calcular o índice que corresponde ao slot 1 (owner):**
   - O array `donations` começa em `keccak256(2)`
   - Cada struct `Donation` ocupa 2 slots: `timestamp` (slot 0 do struct) e `etherAmount` (slot 1 do struct)
   - O slot do array[index] é:
     - `timestamp`: `keccak256(2) + 2*index`
     - `etherAmount`: `keccak256(2) + 2*index + 1`
   - Para sobrescrever `owner` (slot 1), precisamos que `etherAmount` seja armazenado no slot 1:
     - `keccak256(2) + 2*index + 1 = 1` (mod 2^256)
     - `2*index = 1 - keccak256(2) - 1 = -keccak256(2)` (mod 2^256)
     - `index = (2^256 - keccak256(2)) / 2`

2. **Calcular etherAmount:**
   - Queremos que `etherAmount` seja nosso endereço (convertido para uint256)
   - O cálculo `scale = 10^36` permite que `msg.value = etherAmount / scale` seja pequeno
   - Se `etherAmount = nosso endereço`, então `msg.value = endereço / 10^36` (muito pequeno, mas > 0)

3. **Fazer a doação:**
   - Chamar `donate(etherAmount)` com `msg.value = etherAmount / scale`
   - Isso armazenará nosso endereço no slot 1 (owner)

4. **Chamar withdraw():**
   - Como agora somos o owner, podemos chamar `withdraw()` para roubar todo o ether

**Por que funciona?**

- Arrays de structs em Solidity usam `keccak256(slot)` como base
- Cada struct ocupa múltiplos slots consecutivos
- Se expandirmos o array para um tamanho muito grande, podemos fazer wrap-around
- Isso permite sobrescrever slots anteriores de storage

### 3. Verificar o resultado

O script mostrará:
- Estado antes e depois do exploit
- Se o owner foi sobrescrito
- Se o desafio foi completado (`isComplete()`)

## 📊 Resultado Esperado

```
🔍 Iniciando exploit do DonationChallenge...

📊 Estado antes do exploit:
  - Saldo do contrato: 1.0 ETH
  - Owner atual: 0x...
  - Desafio completo: false

📊 Slot 2 hash (keccak256(2)): 0x405787fa12a823e0f2b7631cc41b3ba8828b3321ca811111fa75cd3aa3bb5ace
📊 Índice calculado para sobrescrever owner: 43344706377821576760468996987613231211325356002982170351334206299952371618456

📝 Passo 1: Fazendo doação para sobrescrever owner...
✅ Doação feita!

📊 Owner após doação: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (atacante)

✅ Owner foi sobrescrito! Agora podemos fazer withdraw()

📝 Passo 2: Fazendo withdraw() como novo owner...
✅ Withdraw confirmado!

📊 Estado após o exploit:
  - Saldo do contrato: 0.0 ETH
  - Desafio completo: true

🎉 Desafio completado! O ether foi roubado com sucesso
```

## 🔗 Referências

- [Capture the Ether - Donation](https://capturetheether.com/challenges/math/donation/)
- [Solidity 0.4.21 Documentation](https://docs.soliditylang.org/en/v0.4.21/)
- [Storage Layout in Solidity](https://docs.soliditylang.org/en/v0.4.21/miscellaneous.html#layout-of-state-variables-in-storage)
- [Ethers.js Documentation](https://docs.ethers.org/)

## 💡 Aprendizados

1. **Storage Collision em Structs**: Arrays de structs podem fazer wrap-around do storage se expandidos para tamanhos muito grandes, permitindo sobrescrever slots anteriores.

2. **Cálculo de Índices**: Para arrays de structs, cada struct ocupa múltiplos slots. O slot do campo `i` do struct no índice `j` é: `keccak256(arraySlot) + structSize * j + i`.

3. **Cálculo de scale**: O cálculo `scale = 10^18 * 1 ether = 10^36` permite que valores grandes de `etherAmount` resultem em valores pequenos de `msg.value`, facilitando o exploit.

4. **Importância de Validação**: Contratos devem validar que arrays não podem ser expandidos para tamanhos que causem storage collision.

5. **Uso de Mappings**: Este desafio demonstra por que mappings são preferidos sobre arrays para estruturas de dados grandes - mappings não têm problema de storage collision.

