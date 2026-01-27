const hre = require("hardhat");

const fs = require("fs");

async function main() {
    // Déploiement du contrat PassCours
    const passCours = await hre.ethers.deployContract("PassCours");

    await passCours.waitForDeployment();

    console.log(
        `PassCours deployed to ${passCours.target}`
    );

    // On sauvegarde l'adresse pour les scripts de test/dev
    fs.writeFileSync("address.txt", passCours.target);

    // Mettre à jour automatiquement app.js
    const appJsPath = "app.js";
    if (fs.existsSync(appJsPath)) {
        let appJsContent = fs.readFileSync(appJsPath, "utf8");
        appJsContent = appJsContent.replace(
            /const CONTRACT_ADDRESS = "0x[a-fA-F0-9]{40}";/,
            `const CONTRACT_ADDRESS = "${passCours.target}";`
        );
        fs.writeFileSync(appJsPath, appJsContent);
        console.log(`Updated CONTRACT_ADDRESS in ${appJsPath}`);
    }

}

main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
});
