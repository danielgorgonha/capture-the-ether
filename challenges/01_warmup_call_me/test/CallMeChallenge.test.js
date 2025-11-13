const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("CallMeChallenge", function () {
  let callMeChallenge;
  let deployer;
  let attacker;

  beforeEach(async function () {
    [deployer, attacker] = await ethers.getSigners();
    
    const CallMeChallenge = await ethers.getContractFactory(
      "challenges/01_warmup_call_me/contracts/CallMeChallenge.sol:CallMeChallenge"
    );
    callMeChallenge = await CallMeChallenge.deploy();
    await callMeChallenge.waitForDeployment();
  });

  describe("Deploy", function () {
    it("Should deploy successfully", async function () {
      const address = await callMeChallenge.getAddress();
      expect(address).to.be.properAddress;
      expect(address).to.not.equal(ethers.ZeroAddress);
    });

    it("Should initialize isComplete as false", async function () {
      const isComplete = await callMeChallenge.isComplete();
      expect(isComplete).to.be.false;
    });
  });

  describe("callme()", function () {
    it("Should change isComplete to true", async function () {
      await callMeChallenge.callme();
      const isComplete = await callMeChallenge.isComplete();
      expect(isComplete).to.be.true;
    });

    it("Should be callable by any address", async function () {
      // Chamar como attacker
      const challengeAsAttacker = callMeChallenge.connect(attacker);
      await challengeAsAttacker.callme();
      
      const isComplete = await callMeChallenge.isComplete();
      expect(isComplete).to.be.true;
    });

    it("Should be callable multiple times", async function () {
      // Chamar múltiplas vezes - sempre deve manter isComplete = true
      await callMeChallenge.callme();
      expect(await callMeChallenge.isComplete()).to.be.true;
      
      await callMeChallenge.callme();
      expect(await callMeChallenge.isComplete()).to.be.true;
    });
  });

  describe("State Management", function () {
    it("Should maintain state correctly", async function () {
      // Estado inicial
      expect(await callMeChallenge.isComplete()).to.be.false;
      
      // Após chamar callme()
      await callMeChallenge.callme();
      expect(await callMeChallenge.isComplete()).to.be.true;
    });
  });

  describe("Security", function () {
    it("Should not have access control on callme()", async function () {
      // Qualquer endereço pode chamar
      const [, , otherAccount] = await ethers.getSigners();
      const challengeAsOther = callMeChallenge.connect(otherAccount);
      
      await challengeAsOther.callme();
      expect(await callMeChallenge.isComplete()).to.be.true;
    });
  });
});

