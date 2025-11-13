# Correções Aplicadas ao TokenWhaleChallenge

## Vulnerabilidades Identificadas

**VULN-01**: Uso incorreto de `msg.sender` em `_transfer()` quando chamado de `transferFrom()`
**VULN-02**: Integer underflow em Solidity 0.4.21

## Correções Implementadas

### Parâmetro `from` Explícito (TokenWhaleChallengeFixed.sol)

**Características**:
- `_transfer()` agora recebe `from` como parâmetro explícito
- Não depende mais de `msg.sender` para determinar origem
- Solidity 0.8.20 previne underflow automaticamente

**Melhorias**:
- ✅ `_transfer()` recebe `from` como parâmetro
- ✅ Não usa `msg.sender` para determinar origem
- ✅ Solidity 0.8.20 reverte automaticamente em caso de underflow
- ✅ Validações explícitas de saldo
- ✅ Eventos para transparência

## Como Funciona

- `transfer()` chama `_transfer(msg.sender, to, value)`
- `transferFrom()` chama `_transfer(from, to, value)` com o parâmetro correto
- Não há mais confusão entre `msg.sender` e `from`

## Como Testar

Execute os testes de correção:
```bash
npx hardhat test challenges/10_math_token_whale/test/TokenWhaleChallengeFixed.test.js
```

## Comparação

| Aspecto | Vulnerável | Corrigido |
|---------|------------|-----------|
| Parâmetro `from` | ❌ Usa msg.sender | ✅ Parâmetro explícito |
| Integer underflow | ⚠️ Possível | ✅ Prevenido (Solidity 0.8.20) |
| Validação de saldo | ⚠️ Apenas em transferFrom | ✅ Em _transfer |
| Exploração | ✅ Possível | ❌ Prevenida |

