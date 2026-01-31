const {
    time,
    loadFixture,
} = require("@nomicfoundation/hardhat-toolbox/network-helpers");
const { anyValue } = require("@nomicfoundation/hardhat-chai-matchers/withArgs");
const { expect } = require("chai");
const hre = require("hardhat");
const { ethers } = hre;

describe("SmartCourse", function () {
    async function deploySmartCourseFixture() {
        const [owner, otherAccount, thirdAccount] = await ethers.getSigners();

        const SmartCourse = await ethers.getContractFactory("SmartCourse");
        const smartCourse = await SmartCourse.deploy();

        return { smartCourse, owner, otherAccount, thirdAccount };
    }

    describe("Deployment", function () {
        it("Should set the right owner", async function () {
            const { smartCourse, owner } = await loadFixture(deploySmartCourseFixture);
            expect(await smartCourse.owner()).to.equal(owner.address);
        });
    });

    describe("Admin Minting", function () {
        it("Should allow owner to mint tokens", async function () {
            const { smartCourse, owner, otherAccount } = await loadFixture(deploySmartCourseFixture);
            // On mint 2 tokens Bronze pour un autre compte
            await smartCourse.adminMint(otherAccount.address, 1, 2);
            expect(await smartCourse.balanceOf(otherAccount.address, 1)).to.equal(2);
        });

        it("Should fail if total tokens exceed limit of 8", async function () {
            const { smartCourse, owner, otherAccount } = await loadFixture(deploySmartCourseFixture);
            await expect(smartCourse.adminMint(otherAccount.address, 1, 9)).to.be.revertedWith("Limite de 8 tokens atteinte");
        });
    });

    describe("Upgrades", function () {
        it("Should upgrade 2 Bronze to 1 Silver", async function () {
            const { smartCourse, owner } = await loadFixture(deploySmartCourseFixture);
            await smartCourse.adminMint(owner.address, 1, 2);

            // Les tokens sont lockés 1 min après réception
            await time.increase(601);

            await smartCourse.upgradeTokens(1);

            expect(await smartCourse.balanceOf(owner.address, 1)).to.equal(0);
            expect(await smartCourse.balanceOf(owner.address, 2)).to.equal(1);
        });

        it("Should fail if not enough balance", async function () {
            const { smartCourse, owner } = await loadFixture(deploySmartCourseFixture);
            await smartCourse.adminMint(owner.address, 1, 1);
            await time.increase(601);
            await expect(smartCourse.upgradeTokens(1)).to.be.revertedWith("Solde insuffisant pour l'upgrade");
        });

        it("Should fail if called before cooldown (1 min)", async function () {
            const { smartCourse, owner } = await loadFixture(deploySmartCourseFixture);
            await smartCourse.adminMint(owner.address, 1, 4);
            await time.increase(65);

            // Premier upgrade OK
            await smartCourse.upgradeTokens(1);

            // On vérifie le cooldown contre le spam (1 min)
            await expect(smartCourse.upgradeTokens(1)).to.be.revertedWith("Veuillez attendre 1 minute entre les transactions");

            await time.increase(65);
            await smartCourse.upgradeTokens(1);
            expect(await smartCourse.balanceOf(owner.address, 2)).to.equal(2);
        });
    });

    describe("Transfers & Restrictions", function () {
        it("Should allow transfer of Bronze tokens after lock time", async function () {
            const { smartCourse, owner, otherAccount } = await loadFixture(deploySmartCourseFixture);
            await smartCourse.adminMint(owner.address, 1, 1);

            // Attente de la fin du verrouillage après réception
            await time.increase(65);

            await smartCourse.safeTransferFrom(owner.address, otherAccount.address, 1, 1, "0x");
            expect(await smartCourse.balanceOf(otherAccount.address, 1)).to.equal(1);
        });

        it("Should prevent transfer of Bronze tokens before lock time", async function () {
            const { smartCourse, owner, otherAccount } = await loadFixture(deploySmartCourseFixture);
            await smartCourse.adminMint(owner.address, 1, 1);

            await expect(smartCourse.safeTransferFrom(owner.address, otherAccount.address, 1, 1, "0x")).to.be.revertedWith("Token verrouille pendant 1 minute apres reception");
        });

        it("Should prevent transfer of Gold tokens (Soulbound)", async function () {
            const { smartCourse, owner, otherAccount } = await loadFixture(deploySmartCourseFixture);
            await smartCourse.adminMint(owner.address, 3, 1);
            await time.increase(65);

            // Le Gold ne doit jamais bouger (Soulbound)
            await expect(smartCourse.safeTransferFrom(owner.address, otherAccount.address, 3, 1, "0x")).to.be.revertedWith("Le token Gold est non-transferable (Soulbound)");
        });

        it("Should verify recipient limit on transfer", async function () {
            const { smartCourse, owner, otherAccount } = await loadFixture(deploySmartCourseFixture);
            await smartCourse.adminMint(owner.address, 1, 5);
            await smartCourse.adminMint(otherAccount.address, 1, 4);
            await time.increase(601);

            await expect(smartCourse.safeTransferFrom(owner.address, otherAccount.address, 1, 5, "0x")).to.be.revertedWith("Le destinataire a atteint la limite de tokens");
        });
    });

    describe("Consuming Tokens", function () {
        it("Should allow users to burn their own tokens", async function () {
            const { smartCourse, owner } = await loadFixture(deploySmartCourseFixture);
            await smartCourse.adminMint(owner.address, 1, 2);

            // Consommer un pass = burn du token
            await smartCourse.burnPass(1, 1);

            expect(await smartCourse.balanceOf(owner.address, 1)).to.equal(1);
        });

        it("Should fail to burn if balance is insufficient", async function () {
            const { smartCourse, owner } = await loadFixture(deploySmartCourseFixture);
            await smartCourse.adminMint(owner.address, 1, 1);

            await expect(smartCourse.burnPass(1, 2)).to.be.revertedWith("Solde insuffisant pour consommer ce Pass");
        });

        it("Should fail if called before cooldown (1 min)", async function () {
            const { smartCourse, owner } = await loadFixture(deploySmartCourseFixture);
            await smartCourse.adminMint(owner.address, 1, 2);
            await time.increase(601);

            await smartCourse.burnPass(1, 1);

            await expect(smartCourse.burnPass(1, 1)).to.be.revertedWith("Veuillez attendre 1 minute entre les transactions");
        });
    });
});
