pragma solidity ^0.8.20;

/**
 * @title RetirementFundChallengeFixed
 * @notice Versão corrigida do RetirementFundChallenge com validação de balance
 *
 * CORREÇÕES APLICADAS:
 * 1. Valida que balance <= startBalance antes do cálculo
 * 2. Solidity 0.8.20 reverte automaticamente em caso de underflow
 * 3. Previne exploração de integer underflow
 * 4. Eventos: Emite eventos para transparência e auditoria
 */
contract RetirementFundChallengeFixed {
    uint256 public startBalance;
    address public owner;
    address public beneficiary;
    uint256 public expiration;

    event Withdrawn(address indexed to, uint256 amount);
    event PenaltyCollected(address indexed beneficiary, uint256 amount);

    constructor(address player) payable {
        require(msg.value == 1 ether, "Must send 1 ether");

        owner = msg.sender;
        beneficiary = player;
        startBalance = msg.value;
        expiration = block.timestamp + 10 * 365 days;
    }

    function isComplete() external view returns (bool) {
        return address(this).balance == 0;
    }

    function withdraw() external {
        require(msg.sender == owner, "Not owner");

        uint256 balance = address(this).balance;
        
        if (block.timestamp < expiration) {
            // early withdrawal incurs a 10% penalty
            uint256 amount = balance * 9 / 10;
            payable(owner).transfer(amount);
            emit Withdrawn(owner, amount);
        } else {
            payable(owner).transfer(balance);
            emit Withdrawn(owner, balance);
        }
    }

    function collectPenalty() external {
        require(msg.sender == beneficiary, "Not beneficiary");

        uint256 currentBalance = address(this).balance;
        
        // CORREÇÃO: Validar que balance <= startBalance antes do cálculo
        // Isso previne integer underflow quando selfdestruct força ether no contrato
        require(currentBalance <= startBalance, "Balance cannot exceed startBalance");
        
        uint256 withdrawn = startBalance - currentBalance;

        // an early withdrawal occurred
        require(withdrawn > 0, "No early withdrawal");

        // penalty is what's left
        payable(beneficiary).transfer(currentBalance);
        emit PenaltyCollected(beneficiary, currentBalance);
    }
}

