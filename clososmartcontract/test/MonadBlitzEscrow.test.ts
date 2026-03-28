import { expect } from "chai";
import { ethers } from "hardhat";

describe("MonadBlitzEscrow", function () {
  async function deployFixture() {
    const [admin, operator, business, seller, outsider] = await ethers.getSigners();
    const Escrow = await ethers.getContractFactory("MonadBlitzEscrow");
    const escrow = await Escrow.deploy(admin.address, operator.address);
    await escrow.waitForDeployment();

    return { escrow, admin, operator, business, seller, outsider };
  }

  it("happy path: funded -> approved -> paid", async function () {
    const { escrow, business, seller, operator } = await deployFixture();
    const saleId = ethers.id("sale:happy-path");
    const amount = ethers.parseEther("1");

    await escrow.connect(business).depositForSale(saleId, seller.address, { value: amount });
    await escrow.connect(operator).approveSale(saleId);

    await expect(() => escrow.connect(operator).release(saleId)).to.changeEtherBalances(
      [seller, escrow],
      [amount, -amount],
    );

    const sale = await escrow.sales(saleId);
    expect(sale.state).to.equal(3n); // Paid
    expect(sale.amount).to.equal(0n);
  });

  it("authorization: only payout operator can approve/release", async function () {
    const { escrow, business, seller, outsider } = await deployFixture();
    const saleId = ethers.id("sale:auth");
    const amount = ethers.parseEther("0.5");

    await escrow.connect(business).depositForSale(saleId, seller.address, { value: amount });

    await expect(escrow.connect(outsider).approveSale(saleId)).to.be.reverted;
    await expect(escrow.connect(outsider).release(saleId)).to.be.reverted;
  });

  it("idempotency: duplicate payout is blocked", async function () {
    const { escrow, business, seller, operator } = await deployFixture();
    const saleId = ethers.id("sale:idempotent");
    const amount = ethers.parseEther("0.7");

    await escrow.connect(business).depositForSale(saleId, seller.address, { value: amount });
    await escrow.connect(operator).approveAndRelease(saleId);
    await expect(escrow.connect(operator).approveAndRelease(saleId)).to.be.reverted;
  });

  it("reentrancy attempt from seller cannot reenter release", async function () {
    const { escrow, business, operator } = await deployFixture();
    const saleId = ethers.id("sale:reentrant");
    const amount = ethers.parseEther("0.2");

    const ReentrantSeller = await ethers.getContractFactory("ReentrantSeller");
    const attacker = await ReentrantSeller.deploy(await escrow.getAddress(), saleId);
    await attacker.waitForDeployment();

    await escrow.connect(business).depositForSale(saleId, await attacker.getAddress(), { value: amount });
    await escrow.connect(operator).approveAndRelease(saleId);

    expect(await attacker.attempted()).to.equal(true);
    expect(await attacker.reentered()).to.equal(false);
  });

  it("allows business refund while sale is funded", async function () {
    const { escrow, business, seller } = await deployFixture();
    const saleId = ethers.id("sale:refund");
    const amount = ethers.parseEther("0.3");

    await escrow.connect(business).depositForSale(saleId, seller.address, { value: amount });

    await expect(() => escrow.connect(business).refund(saleId)).to.changeEtherBalances(
      [business, escrow],
      [amount, -amount],
    );

    const sale = await escrow.sales(saleId);
    expect(sale.state).to.equal(4n); // Cancelled
    expect(sale.amount).to.equal(0n);
  });

  it("blocks state-changing actions when paused", async function () {
    const { escrow, admin, business, seller, operator } = await deployFixture();
    const saleId = ethers.id("sale:paused");
    const amount = ethers.parseEther("0.4");

    await escrow.connect(admin).pause();
    await expect(escrow.connect(business).depositForSale(saleId, seller.address, { value: amount })).to.be.reverted;

    await escrow.connect(admin).unpause();
    await escrow.connect(business).depositForSale(saleId, seller.address, { value: amount });
    await escrow.connect(operator).approveSale(saleId);

    await escrow.connect(admin).pause();
    await expect(escrow.connect(operator).release(saleId)).to.be.reverted;
  });
});
