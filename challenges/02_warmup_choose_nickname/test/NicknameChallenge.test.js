const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("NicknameChallenge", function () {
  let captureTheEther;
  let nicknameChallenge;
  let deployer;
  let player;

  beforeEach(async function () {
    [deployer, player] = await ethers.getSigners();
    
    // Deploy CaptureTheEther
    const CaptureTheEther = await ethers.getContractFactory(
      "challenges/02_warmup_choose_nickname/contracts/CaptureTheEther.sol:CaptureTheEther"
    );
    captureTheEther = await CaptureTheEther.deploy();
    await captureTheEther.waitForDeployment();
    const cteAddress = await captureTheEther.getAddress();

    // Deploy NicknameChallenge
    const NicknameChallenge = await ethers.getContractFactory(
      "challenges/02_warmup_choose_nickname/contracts/NicknameChallenge.sol:NicknameChallenge"
    );
    nicknameChallenge = await NicknameChallenge.deploy(player.address, cteAddress);
    await nicknameChallenge.waitForDeployment();
  });

  describe("Deploy", function () {
    it("Should deploy both contracts successfully", async function () {
      expect(await captureTheEther.getAddress()).to.be.properAddress;
      expect(await nicknameChallenge.getAddress()).to.be.properAddress;
    });

    it("Should initialize with empty nickname", async function () {
      const nickname = await captureTheEther.nicknameOf(player.address);
      expect(nickname).to.equal(ethers.ZeroHash);
    });

    it("Should start with challenge incomplete", async function () {
      const isComplete = await nicknameChallenge.isComplete();
      expect(isComplete).to.be.false;
    });
  });

  describe("setNickname()", function () {
    it("Should set nickname correctly", async function () {
      const nickname = ethers.encodeBytes32String("Hacker");
      await captureTheEther.connect(player).setNickname(nickname);
      
      const storedNickname = await captureTheEther.nicknameOf(player.address);
      expect(storedNickname).to.equal(nickname);
    });

    it("Should allow any address to set their own nickname", async function () {
      const [, otherAccount] = await ethers.getSigners();
      const nickname = ethers.encodeBytes32String("OtherUser");
      
      await captureTheEther.connect(otherAccount).setNickname(nickname);
      const storedNickname = await captureTheEther.nicknameOf(otherAccount.address);
      expect(storedNickname).to.equal(nickname);
    });

    it("Should allow empty nickname (no validation in contract)", async function () {
      await captureTheEther.connect(player).setNickname(ethers.ZeroHash);
      const nickname = await captureTheEther.nicknameOf(player.address);
      expect(nickname).to.equal(ethers.ZeroHash);
    });
  });

  describe("isComplete()", function () {
    it("Should return false for empty nickname", async function () {
      // Nickname já está vazio no início
      const isComplete = await nicknameChallenge.isComplete();
      expect(isComplete).to.be.false;
      
      // Tentar definir nickname vazio explicitamente
      await captureTheEther.connect(player).setNickname(ethers.ZeroHash);
      expect(await nicknameChallenge.isComplete()).to.be.false;
    });

    it("Should return true for non-empty nickname", async function () {
      const nickname = ethers.encodeBytes32String("Hacker");
      await captureTheEther.connect(player).setNickname(nickname);
      
      const isComplete = await nicknameChallenge.isComplete();
      expect(isComplete).to.be.true;
    });

    it("Should check first byte of nickname", async function () {
      // Criar nickname onde primeiro byte não é zero
      const nickname = ethers.encodeBytes32String("A"); // 'A' = 0x41
      await captureTheEther.connect(player).setNickname(nickname);
      
      expect(await nicknameChallenge.isComplete()).to.be.true;
    });
  });

  describe("bytes32 Operations", function () {
    it("Should handle different nickname lengths", async function () {
      const shortNickname = ethers.encodeBytes32String("Hi");
      await captureTheEther.connect(player).setNickname(shortNickname);
      expect(await nicknameChallenge.isComplete()).to.be.true;
      
      const longNickname = ethers.encodeBytes32String("ThisIsAVeryLongNickname");
      await captureTheEther.connect(player).setNickname(longNickname);
      expect(await nicknameChallenge.isComplete()).to.be.true;
    });

    it("Should handle special characters", async function () {
      const specialNickname = ethers.encodeBytes32String("H@ck3r!");
      await captureTheEther.connect(player).setNickname(specialNickname);
      expect(await nicknameChallenge.isComplete()).to.be.true;
    });
  });
});

