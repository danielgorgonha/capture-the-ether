# Choose a Nickname - 200 pontos

## 📋 Resumo

Este desafio requer que você defina um nickname no contrato `CaptureTheEther` que está deployado na rede Ropsten. O contrato mantém um mapeamento de nicknames por endereço, e você precisa chamar a função `setNickname()` com um valor não vazio (bytes32).

## 🔍 Análise dos Contratos

### CaptureTheEther (Contrato Principal)

```solidity
pragma solidity ^0.4.21;

contract CaptureTheEther {
    mapping (address => bytes32) public nicknameOf;

    function setNickname(bytes32 nickname) public {
        nicknameOf[msg.sender] = nickname;
    }
}
```

**Características:**
- Mantém um mapeamento de endereços para nicknames (bytes32)
- Função pública `setNickname()` que permite qualquer endereço definir seu próprio nickname
- Na rede Ropsten real, este contrato está em: `0x71c46Ed333C35e4E6c62D32dc7C8F00D125b4fee`

### NicknameChallenge (Contrato de Verificação)

```solidity
pragma solidity ^0.4.21;

contract NicknameChallenge {
    CaptureTheEther cte = CaptureTheEther(msg.sender);
    address player;

    function NicknameChallenge(address _player) public {
        player = _player;
    }

    function isComplete() public view returns (bool) {
        return cte.nicknameOf(player)[0] != 0;
    }
}
```

**Características:**
- Verifica se o jogador definiu um nickname
- Verifica se o primeiro byte do nickname não é zero (não vazio)
- O contrato `CaptureTheEther` é passado como `msg.sender` no deploy

## 🎯 Objetivo

Chamar a função `setNickname()` no contrato `CaptureTheEther` com um nickname não vazio (bytes32) para completar o desafio.

## 🚀 Passo a Passo do Exploit

### 1. Fazer o deploy dos contratos (ambiente local)

```bash
npx hardhat run challenges/02_warmup_choose_nickname/scripts/deploy.js --network hardhat
```

Isso irá:
- Deployar o contrato `CaptureTheEther`
- Deployar o contrato `NicknameChallenge`
- Mostrar os endereços dos contratos
- Verificar o estado inicial (nickname vazio)

### 2. Executar o exploit

```bash
npx hardhat run challenges/02_warmup_choose_nickname/scripts/exploit.js --network hardhat
```

Ou, se você já tem os endereços dos contratos:

```bash
CTE_ADDRESS=0x... CHALLENGE_ADDRESS=0x... npx hardhat run challenges/02_warmup_choose_nickname/scripts/exploit.js --network hardhat
```

O exploit irá:
- Conectar aos contratos deployados
- Verificar o estado inicial (nickname vazio)
- Chamar `setNickname()` com um nickname (ex: "Hacker")
- Verificar que o nickname foi definido e o desafio está completo

### 3. Verificar o resultado

O script mostrará:
- Estado antes: `nickname = (vazio)`, `isComplete = false`
- Transaction hash da chamada `setNickname()`
- Estado após: `nickname = "Hacker"`, `isComplete = true`

### 4. Verificar no site Capture the Ether

**Importante:** No site real, o contrato `CaptureTheEther` está deployado na rede Ropsten no endereço:
```
0x71c46Ed333C35e4E6c62D32dc7C8F00D125b4fee
```

Para verificar no site:
1. Conecte sua MetaMask à rede Ropsten (ou simule localmente com chainId 3)
2. Chame `setNickname()` no contrato `CaptureTheEther` com seu nickname
3. No site Capture the Ether, clique em "Check Solution"

## 📊 Resultado Esperado

```
🔍 Iniciando exploit do NicknameChallenge...

📦 Endereços não fornecidos. Fazendo deploy dos contratos...

✅ Contratos deployados:
  - CaptureTheEther: 0x5FbDB2315678afecb367f032d93F642f64180aa3
  - NicknameChallenge: 0x...

📍 Endereços:
  - CaptureTheEther: 0x5FbDB2315678afecb367f032d93F642f64180aa3
  - NicknameChallenge: 0x...
  - Jogador: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

📊 Estado antes do exploit:
  - Nickname: (vazio)
  - Desafio completo: false

🎯 Executando exploit: definindo nickname...

📝 Definindo nickname: Hacker
📤 Transaction enviada: 0x...
✅ Transaction confirmada!

📊 Estado após o exploit:
  - Nickname: Hacker
  - Desafio completo: true

🎉 Desafio completado! O nickname foi definido com sucesso
```

## 🔗 Referências

- [Capture the Ether - Choose a nickname](https://capturetheether.com/challenges/warmup/nickname/)
- [Hardhat Documentation](https://hardhat.org/docs)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Solidity - bytes32](https://docs.soliditylang.org/en/latest/types.html#fixed-size-byte-arrays)

## 💡 Aprendizados

- Como trabalhar com tipos `bytes32` em Solidity
- Como converter strings para `bytes32` usando `encodeBytes32String()`
- Como interagir com contratos deployados externamente
- Como usar mapeamentos em Solidity
- Entendimento de como contratos podem verificar estados de outros contratos

## 🔒 Segurança

Este desafio demonstra que:
- Funções públicas podem ser chamadas por qualquer endereço
- Mapeamentos públicos permitem que qualquer um defina valores para si mesmo
- Em contratos reais, considere adicionar verificações de acesso ou validações
- O uso de `bytes32` para strings tem limitações (32 bytes máximo)

## 📝 Nota sobre bytes32

O tipo `bytes32` em Solidity armazena exatamente 32 bytes. Para converter uma string:
- Use `ethers.encodeBytes32String("texto")` para converter string para bytes32
- Use `ethers.toUtf8String(bytes32)` para converter bytes32 de volta para string
- Strings maiores que 32 bytes serão truncadas

