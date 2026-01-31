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

    describe("Déploiement", function () {
        it("Vérifie que le owner est bien défini", async function () {
            const { smartCourse, owner } = await loadFixture(deploySmartCourseFixture);
            expect(await smartCourse.owner()).to.equal(owner.address);
        });
    });

    describe("Mint Admin", function () {
        it("L'admin peut bien générer des jetons", async function () {
            const { smartCourse, owner, otherAccount } = await loadFixture(deploySmartCourseFixture);
            await smartCourse.adminMint(otherAccount.address, 1, 2);
            expect(await smartCourse.balanceOf(otherAccount.address, 1)).to.equal(2);
        });

        it("Bloque si on dépasse la limite de 8 par wallet", async function () {
            const { smartCourse, owner, otherAccount } = await loadFixture(deploySmartCourseFixture);
            await expect(smartCourse.adminMint(otherAccount.address, 1, 9)).to.be.revertedWith("Limite de 8 tokens atteinte");
        });
    });

    describe("Upgrades", function () {
        it("Upgrade 2 Bronze -> 1 Silver", async function () {
            const { smartCourse, owner } = await loadFixture(deploySmartCourseFixture);
            await smartCourse.adminMint(owner.address, 1, 2);

            // Les tokens sont lockés 1 min après réception
            await time.increase(601);
            await smartCourse.upgradeTokens(1);

            expect(await smartCourse.balanceOf(owner.address, 1)).to.equal(0);
            expect(await smartCourse.balanceOf(owner.address, 2)).to.equal(1);
        });

        it("Erreur si pas assez de jetons pour upgrade", async function () {
            const { smartCourse, owner } = await loadFixture(deploySmartCourseFixture);
            await smartCourse.adminMint(owner.address, 1, 1);
            await time.increase(601);
            await expect(smartCourse.upgradeTokens(1)).to.be.revertedWith("Solde insuffisant pour l'upgrade");
        });

        it("Respect du cooldown (1 min) entre deux upgrades", async function () {
            const { smartCourse, owner } = await loadFixture(deploySmartCourseFixture);
            await smartCourse.adminMint(owner.address, 1, 4);
            await time.increase(65);

            await smartCourse.upgradeTokens(1);

            // On vérifie le cooldown contre le spam (1 min)
            await expect(smartCourse.upgradeTokens(1)).to.be.revertedWith("Veuillez attendre 1 minute entre les transactions");

            await time.increase(65);
            await smartCourse.upgradeTokens(1);
            expect(await smartCourse.balanceOf(owner.address, 2)).to.equal(2);
        });
    });

    describe("Transferts et Restrictions", function () {
        it("Transfert OK après le délai de lock", async function () {
            const { smartCourse, owner, otherAccount } = await loadFixture(deploySmartCourseFixture);
            await smartCourse.adminMint(owner.address, 1, 1);

            // Attente de la fin du verrouillage après réception
            await time.increase(65);
            await smartCourse.safeTransferFrom(owner.address, otherAccount.address, 1, 1, "0x");
            expect(await smartCourse.balanceOf(otherAccount.address, 1)).to.equal(1);
        });

        it("Bloque le transfert pendant le lock (1 min)", async function () {
            const { smartCourse, owner, otherAccount } = await loadFixture(deploySmartCourseFixture);
            await smartCourse.adminMint(owner.address, 1, 1);

            await expect(smartCourse.safeTransferFrom(owner.address, otherAccount.address, 1, 1, "0x")).to.be.revertedWith("Token verrouille pendant 1 minute apres reception");
        });

        it("Le Gold est bien intransférable (Soulbound)", async function () {
            const { smartCourse, owner, otherAccount } = await loadFixture(deploySmartCourseFixture);

            await smartCourse.adminMint(owner.address, 1, 4);
            await time.increase(601);
            await smartCourse.upgradeTokens(1);
            await time.increase(65);
            await smartCourse.upgradeTokens(1);
            await time.increase(65);
            await smartCourse.upgradeTokens(2);
            await time.increase(65);

            await expect(smartCourse.safeTransferFrom(owner.address, otherAccount.address, 3, 1, "0x")).to.be.revertedWith("Le token Gold est non-transferable (Soulbound)");
        });

        it("Vérifie la limite de 8 jetons chez le destinataire", async function () {
            const { smartCourse, owner, otherAccount } = await loadFixture(deploySmartCourseFixture);
            await smartCourse.adminMint(owner.address, 1, 5);
            await smartCourse.adminMint(otherAccount.address, 1, 4);
            await time.increase(601);

            await expect(smartCourse.safeTransferFrom(owner.address, otherAccount.address, 1, 5, "0x")).to.be.revertedWith("Le destinataire a atteint la limite de tokens");
        });
    });

    describe("Consommation (Burn)", function () {
        it("L'user peut burn ses propres pass", async function () {
            const { smartCourse, owner } = await loadFixture(deploySmartCourseFixture);
            await smartCourse.adminMint(owner.address, 1, 2);
            await smartCourse.burnPass(1, 1);
            expect(await smartCourse.balanceOf(owner.address, 1)).to.equal(1);
        });

        it("Erreur si solde insuffisant pour burn", async function () {
            const { smartCourse, owner } = await loadFixture(deploySmartCourseFixture);
            await smartCourse.adminMint(owner.address, 1, 1);
            await expect(smartCourse.burnPass(1, 2)).to.be.revertedWith("Solde insuffisant pour consommer ce Pass");
        });

        it("Respect du cooldown pour le burn", async function () {
            const { smartCourse, owner } = await loadFixture(deploySmartCourseFixture);
            await smartCourse.adminMint(owner.address, 1, 2);
            await time.increase(601);

            await smartCourse.burnPass(1, 1);
            await expect(smartCourse.burnPass(1, 1)).to.be.revertedWith("Veuillez attendre 1 minute entre les transactions");
        });
    });
});
