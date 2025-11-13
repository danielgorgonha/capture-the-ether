const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("MappingChallengeFixed", function () {
  let challenge;
  let deployer;
  let player;
  let attacker;

  beforeEach(async function () {
    [deployer, player, attacker] = await ethers.getSigners();
    
    const MappingChallengeFixed = await ethers.getContractFactory(
      "challenges/12_math_mapping/fixes/MappingChallengeFixed.sol:MappingChallengeFixed"
    );
    
    challenge = await MappingChallengeFixed.deploy();
    await challenge.waitForDeployment();
  });

  describe("Deploy", function () {
    it("Should deploy successfully", async function () {
      const address = await challenge.getAddress();
      expect(address).to.be.properAddress;
      
      expect(await challenge.isComplete()).to.be.false;
    });
  });

  describe("Set and Get Functions", function () {
    it("Should allow setting and getting values", async function () {
      await challenge.set(0n, 100n);
      expect(await challenge.get(0n)).to.equal(100n);
      
      await challenge.set(1n, 200n);
      expect(await challenge.get(1n)).to.equal(200n);
    });

    it("Should allow setting large indices", async function () {
      const largeIndex = ethers.MaxUint256;
      await challenge.set(largeIndex, 999n);
      expect(await challenge.get(largeIndex)).to.equal(999n);
    });
  });

  describe("Security Improvements", function () {
    it("Should prevent storage collision", async function () {
      // No contrato vulnerável, era possível calcular um índice que
      // fazia wrap-around para sobrescrever isComplete
      // No contrato corrigido, isso não é mais possível
      
      // Tentar setar valores em índices grandes
      const largeIndex = ethers.MaxUint256;
      await challenge.set(largeIndex, 999n);
      
      // isComplete não deve ser afetado
      expect(await challenge.isComplete()).to.be.false;
      
      // Tentar setar em outro índice grande
      const anotherLargeIndex = ethers.MaxUint256 - 1n;
      await challenge.set(anotherLargeIndex, 888n);
      
      // isComplete ainda não deve ser afetado
      expect(await challenge.isComplete()).to.be.false;
    });

    it("Should use constant gas cost for any index", async function () {
      // Mappings têm custo de gas constante, independente do índice
      const smallIndex = 0n;
      const largeIndex = ethers.MaxUint256;
      
      const tx1 = await challenge.set(smallIndex, 100n);
      const receipt1 = await tx1.wait();
      const gas1 = receipt1.gasUsed;
      
      const tx2 = await challenge.set(largeIndex, 200n);
      const receipt2 = await tx2.wait();
      const gas2 = receipt2.gasUsed;
      
      // Gas deve ser similar (mappings têm custo constante)
      expect(gas2).to.be.closeTo(gas1, gas1 / 10n); // Tolerância de 10%
    });
  });
});

