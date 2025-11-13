# Correções Aplicadas ao MappingChallenge

## Vulnerabilidade Identificada

**VULN-01**: Storage collision em arrays dinâmicos permite sobrescrever variáveis de estado

## Correções Implementadas

### Mapping em vez de Array (MappingChallengeFixed.sol)

**Características**:
- Usa `mapping(uint256 => uint256)` em vez de `uint256[]`
- Mappings não podem fazer wrap-around do storage
- Previne storage collision

**Melhorias**:
- ✅ Usa mapping em vez de array dinâmico
- ✅ Não pode fazer wrap-around do storage
- ✅ Previne storage collision
- ✅ Eventos para transparência
- ✅ Atualizado para Solidity 0.8.20

## Como Funciona

- Mappings usam hashing para armazenamento, não slots sequenciais
- Não é possível calcular um índice que faça wrap-around
- Storage collision não é mais possível

## Como Testar

Execute os testes de correção:
```bash
npx hardhat test challenges/12_math_mapping/test/MappingChallengeFixed.test.js
```

## Comparação

| Aspecto | Vulnerável | Corrigido |
|---------|------------|-----------|
| Estrutura de dados | Array dinâmico | Mapping |
| Storage collision | ✅ Possível | ❌ Prevenida |
| Wrap-around | ✅ Possível | ❌ Prevenido |
| Índices grandes | ⚠️ Custo alto de gas | ✅ Custo constante |

