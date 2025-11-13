pragma solidity ^0.8.20;

/**
 * @title DonationChallengeFixed
 * @notice Versão corrigida do DonationChallenge usando mapping em vez de array
 *
 * CORREÇÕES APLICADAS:
 * 1. Usa mapping em vez de array de structs para prevenir storage collision
 * 2. Corrigido cálculo de scale (era 10^36, agora é 10^18)
 * 3. Atualizado para Solidity 0.8.20 com proteções built-in
 * 4. Eventos: Emite eventos para transparência e auditoria
 */
contract DonationChallengeFixed {
    struct Donation {
        uint256 timestamp;
        uint256 etherAmount;
    }
    
    mapping(address => Donation[]) public donationsByAddress;
    mapping(uint256 => Donation) public donationsById;
    uint256 public donationCount;
    
    address public owner;

    event DonationMade(address indexed donor, uint256 indexed donationId, uint256 etherAmount, uint256 timestamp);
    event Withdrawn(address indexed to, uint256 amount);

    constructor() payable {
        require(msg.value == 1 ether, "Must send 1 ether");
        owner = msg.sender;
    }
    
    function isComplete() external view returns (bool) {
        return address(this).balance == 0;
    }

    function donate(uint256 etherAmount) external payable {
        // CORREÇÃO: scale = 10^18 (1 ether), não 10^36
        uint256 scale = 1 ether;
        require(msg.value == etherAmount / scale, "Incorrect payment");

        Donation memory donation = Donation({
            timestamp: block.timestamp,
            etherAmount: etherAmount
        });

        donationsByAddress[msg.sender].push(donation);
        donationsById[donationCount] = donation;
        donationCount++;

        emit DonationMade(msg.sender, donationCount - 1, etherAmount, block.timestamp);
    }

    function withdraw() external {
        require(msg.sender == owner, "Not owner");
        uint256 balance = address(this).balance;
        payable(owner).transfer(balance);
        emit Withdrawn(owner, balance);
    }
}

