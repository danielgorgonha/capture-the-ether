# Correções Aplicadas ao DonationChallenge

## Vulnerabilidades Identificadas

**VULN-01**: Storage collision em arrays de structs permite sobrescrever `owner`
**VULN-02**: Cálculo incorreto de `scale` (10^36 em vez de 10^18)

## Correções Implementadas

### Mapping em vez de Array (DonationChallengeFixed.sol)

**Características**:
- Usa mapping em vez de array de structs
- Corrigido cálculo de scale
- Previne storage collision

**Melhorias**:
- ✅ Usa mapping em vez de array de structs
- ✅ Corrigido cálculo de scale (10^18)
- ✅ Previne storage collision
- ✅ Eventos para transparência
- ✅ Atualizado para Solidity 0.8.20

## Como Funciona

- Mappings usam hashing para armazenamento
- Não é possível calcular um índice que faça wrap-around para sobrescrever `owner`
- Scale corrigido para 10^18 (1 ether)

## Como Testar

Execute os testes de correção:
```bash
npx hardhat test challenges/13_math_donation/test/DonationChallengeFixed.test.js
```

## Comparação

| Aspecto | Vulnerável | Corrigido |
|---------|------------|-----------|
| Estrutura de dados | Array de structs | Mapping |
| Storage collision | ✅ Possível | ❌ Prevenida |
| Scale | ❌ 10^36 (incorreto) | ✅ 10^18 (correto) |
| Proteção de owner | ❌ Vulnerável | ✅ Protegido |

