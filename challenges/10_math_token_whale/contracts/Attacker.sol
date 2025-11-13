pragma solidity ^0.4.21;

interface TokenWhaleChallenge {
    function transfer(address to, uint256 value) external;
    function transferFrom(address from, address to, uint256 value) external;
    function approve(address spender, uint256 value) external;
    function balanceOf(address) external view returns (uint256);
}

contract Attacker {
    TokenWhaleChallenge public challenge;
    
    function Attacker(address challengeAddress) public {
        challenge = TokenWhaleChallenge(challengeAddress);
    }
    
    // Função para explorar a vulnerabilidade
    function attack() public {
        // A vulnerabilidade está em _transfer que usa msg.sender em vez de from
        // Quando transferFrom é chamado, _transfer usa msg.sender (o contrato atacante)
        // em vez de from (o endereço original)
        
        // Estratégia:
        // 1. Player aprova o contrato atacante para transferir seus tokens
        // 2. Contrato atacante chama transferFrom(player, player, valor)
        // 3. _transfer usa msg.sender (contrato) em vez de from (player)
        // 4. Isso permite manipular os saldos de forma incorreta
    }
    
    function() public payable {}
}

