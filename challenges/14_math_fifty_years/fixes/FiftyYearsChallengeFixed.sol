pragma solidity ^0.8.20;

/**
 * @title FiftyYearsChallengeFixed
 * @notice Versão corrigida do FiftyYearsChallenge usando mapping e protegendo contra overflow
 *
 * CORREÇÕES APLICADAS:
 * 1. Usa mapping em vez de array de structs para prevenir storage collision
 * 2. Valida timestamp para prevenir integer overflow
 * 3. Inicializa variável contribution corretamente
 * 4. Atualizado para Solidity 0.8.20 com proteções built-in
 * 5. Eventos: Emite eventos para transparência e auditoria
 */
contract FiftyYearsChallengeFixed {
    struct Contribution {
        uint256 amount;
        uint256 unlockTimestamp;
    }
    
    mapping(uint256 => Contribution) public contributions;
    uint256 public contributionCount;
    uint256 public head;

    address public owner;

    event ContributionAdded(uint256 indexed id, uint256 amount, uint256 unlockTimestamp);
    event ContributionUpdated(uint256 indexed id, uint256 amount);
    event Withdrawn(address indexed to, uint256 amount, uint256 total);

    constructor(address player) payable {
        require(msg.value == 1 ether, "Must send 1 ether");

        owner = player;
        contributions[0] = Contribution({
            amount: msg.value,
            unlockTimestamp: block.timestamp + 50 * 365 days
        });
        contributionCount = 1;
    }

    function isComplete() external view returns (bool) {
        return address(this).balance == 0;
    }

    function upsert(uint256 index, uint256 timestamp) external payable {
        require(msg.sender == owner, "Not owner");

        if (index < contributionCount) {
            // Update existing contribution amount without updating timestamp.
            Contribution storage contribution = contributions[index];
            contribution.amount += msg.value;
            emit ContributionUpdated(index, contribution.amount);
        } else {
            // Append a new contribution. Require that each contribution unlock
            // at least 1 day after the previous one.
            require(contributionCount > 0, "No previous contribution");
            Contribution storage lastContribution = contributions[contributionCount - 1];
            
            // CORREÇÃO: Validar que timestamp não causa overflow
            require(
                timestamp >= lastContribution.unlockTimestamp + 1 days,
                "Timestamp must be at least 1 day after previous"
            );
            require(timestamp <= block.timestamp + 100 * 365 days, "Timestamp too far in future");

            contributions[contributionCount] = Contribution({
                amount: msg.value,
                unlockTimestamp: timestamp
            });
            emit ContributionAdded(contributionCount, msg.value, timestamp);
            contributionCount++;
        }
    }

    function withdraw(uint256 index) external {
        require(msg.sender == owner, "Not owner");
        require(index < contributionCount, "Invalid index");
        require(block.timestamp >= contributions[index].unlockTimestamp, "Not yet unlocked");

        // Withdraw this and any earlier contributions.
        uint256 total = 0;
        for (uint256 i = head; i <= index; i++) {
            total += contributions[i].amount;
            delete contributions[i];
        }

        // Move the head of the queue forward so we don't have to loop over
        // already-withdrawn contributions.
        head = index + 1;

        payable(owner).transfer(total);
        emit Withdrawn(owner, total, total);
    }
}

