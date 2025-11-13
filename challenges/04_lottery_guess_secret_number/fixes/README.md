# Correções Aplicadas ao GuessTheSecretNumberChallenge

## Vulnerabilidade Identificada

**VULN-01**: Espaço de busca pequeno permite brute force (uint8 = 256 valores)

## Correções Implementadas

### Opção 1: Aumentar Espaço de Busca + Rate Limiting (GuessTheSecretNumberChallengeFixed.sol)

**Características**:
- Usa `uint256` em vez de `uint8` (espaço de busca: 2^256 valores)
- Rate limiting (máximo 10 tentativas por endereço)
- Custo por tentativa (0.1 ether)
- Cooldown entre tentativas (1 hora)

**Melhorias**:
- ✅ Espaço de busca aumentado de 256 para 2^256 valores
- ✅ Rate limiting previne brute force rápido
- ✅ Custo por tentativa torna brute force caro
- ✅ Cooldown previne tentativas rápidas
- ✅ Controle de estado
- ✅ Eventos para transparência
- ✅ Atualizado para Solidity 0.8.20

## Como Testar

Execute os testes de correção:
```bash
npx hardhat test challenges/04_lottery_guess_secret_number/test/GuessTheSecretNumberChallengeFixed.test.js
```

## Comparação

| Aspecto | Vulnerável | Corrigido |
|---------|------------|-----------|
| Tipo | uint8 (256 valores) | uint256 (2^256 valores) |
| Brute Force | Trivial (< 1 segundo) | Impraticável |
| Rate Limiting | ❌ Nenhum | ✅ 10 tentativas/endereço |
| Custo | 1 ether/tentativa | 0.1 ether/tentativa |
| Cooldown | ❌ Nenhum | ✅ 1 hora |

