pragma solidity ^0.4.21;

interface PredictTheBlockHashChallenge {
    function lockInGuess(bytes32 hash) external payable;
    function settle() external;
}

contract Attacker {
    PredictTheBlockHashChallenge public challenge;
    
    function Attacker(address challengeAddress) public {
        challenge = PredictTheBlockHashChallenge(challengeAddress);
    }
    
    // Função para fazer lock do hash
    function lockInGuess(bytes32 hash) public payable {
        require(msg.value == 1 ether);
        challenge.lockInGuess.value(1 ether)(hash);
    }
    
    // Função para chamar settle()
    function settle() public {
        challenge.settle();
    }
    
    function() public payable {}
}

