const hre = require("hardhat");

const fs = require("fs");

async function main() {
    const passCours = await hre.ethers.deployContract("PassCours");

    await passCours.waitForDeployment();

    console.log(
        `PassCours deployed to ${passCours.target}`
    );

    fs.writeFileSync("address.txt", passCours.target);
}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
