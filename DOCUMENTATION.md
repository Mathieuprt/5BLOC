# Documentation Technique - SmartCourse

## Structure du Projet

## Structure du Projet

- `assets/` : Images des tokens (PNG), utilisées pour les métadonnées.
- `content/` : Contenu éducatif (Markdown files), lié aux tokens pour l'accès exclusif.
- `contracts/` : Contient le code source Solidity.
    - `SmartCourse.sol` : Le contrat principal ERC-1155.
- `metadata/` : Fichiers JSON (Standard ERC-1155) contenant les métadonnées des tokens.
- `scripts/` : Scripts d'automatisation.
    - `deploy.js` : Script de déploiement sécurisé sur la blockchain.
- `test/` : Tests unitaires.
    - `SmartCourse.test.js` : Tests complets des fonctionnalités et contraintes.
- `index.html` : Interface utilisateur (Dashboard, Inventaire, Admin).
- `app.js` : Logique frontend (Ethers.js v6) et interactions Blockchain/IPFS.
- `hardhat.config.js` : Configuration de l'environnement de développement.
- `address.txt` : Fichier généré contenant l'adresse du dernier déploiement.
- `IPFS_GUIDE.md` : Guide étape par étape pour l'hébergement des assets sur IPFS.

## Détails du Smart Contract (SmartCourse.sol)

### Variables d'État
- `lastTransactionTimestamp` : Enregistre le timestamp de la dernière action initiée par l'utilisateur (Upgrade, Transfert sortant). Utilisé pour le Cooldown de 1 minutes.
- `lastReceiveTimestamp` : Enregistre quand un utilisateur a reçu un certain type de token. Utilisé pour le Lock de 1 minutes.

### Fonctions Clés
- `adminMint(account, id, amount)` :
    - **Rôle** : Permet à l'admin (owner) de créer des tokens.
    - **Contrainte** : Vérifie que le solde total du destinataire ne dépasse pas 8.
- `upgradeTokens(fromId)` :
    - **Rôle** : Échange 2 tokens de niveau `fromId` contre 1 token de niveau supérieur.
    - **Logique** : Burn 2 `fromId`, Mint 1 `fromId + 1`.
    - **Contraintes** : Solde suffisant, Cooldown respecté, Lock respecté.
- `safeTransferFrom(...)` :
    - **Rôle** : Transfère des tokens.
    - **Surchage** : Ajout de vérifications avant l'appel à `super`.
    - **Contraintes** :
        - Pas de transfert de Gold (ID 3).
        - Lock respecté (1 min après réception).
        - Limite de possession du destinataire (Max 8).
        - Cooldown respecté si c'est l'expéditeur qui initie.

## Frontend

Le frontend utilise `Ethers.js` pour communiquer avec la blockchain.
- Il détecte `window.ethereum` (Metamask).
- Il permet de se connecter et d'afficher l'adresse et les soldes.
- Chaque action (Mint, Upgrade, Transfer) appelle la fonction correspondante du contrat.
- Les erreurs retournées par le contrat (revert strings) sont capturées et traduites en messages lisibles pour l'utilisateur.

## Tests

Les tests sont écrits avec Chai et Hardhat Toolbox. Ils utilisent `loadFixture` pour optimiser la vitesse d'exécution.
Ils couvrent les cas nominaux (succès) et les cas d'erreur (reverts attendus) pour toutes les contraintes métier (limites, temps, transférabilité).

## Guide de Lancement et Utilisation

### Pré-requis
- **Node.js** et **NPM** doivent être installés sur votre machine.
- Une extension de portefeuille comme **Metamask** doit être installée sur votre navigateur.

### Installation
1.  Ouvrez un terminal à la racine du projet.
2.  Installez les dépendances nécessaires avec la commande :
    ```bash
    npm install
    ```

### Démarrage Local
Pour tester l'application en local, suivez ces étapes précises :

1.  **Lancer la Blockchain Locale** :
    Dans un premier terminal, lancez le noeud Hardhat. Cela va créer une blockchain locale et générer 20 comptes de test avec des faux ETH.
    ```bash
    npx hardhat node
    ```

2.  **Déployer le Contrat** :
    Dans un **second terminal** (ne fermez pas le premier), déployez le smart contract sur votre blockchain locale.
    ```bash
    npx hardhat run scripts/deploy.js --network localhost
    ```
    *Note : L'adresse du contrat déployé sera affichée. Le script met aussi automatiquement à jour le fichier `app.js` avec cette nouvelle adresse (si le script de déploiement n'a pas été modifié pour le faire, assurez-vous de copier l'adresse dans la constante `CONTRACT_ADDRESS` de `app.js`).*

3.  **Configurer Metamask** :
    - Ouvrez Metamask et changez le réseau pour **Localhost 8545**.
    - Si vous ne l'avez pas, ajoutez un réseau manuellement :
        - Nom du réseau : Hardhat Localhost
        - URL RPC : `http://127.0.0.1:8545`
        - ID de chaîne : `31337`
        - Symbole devise : `ETH`
    - Importez un compte : Copiez la clé privée (Private Key) de l'un des comptes affichés dans le premier terminal (Account #0 ou #1 par exemple) et importez-la dans Metamask ("Importer un compte").

4.  **Lancer l'Application** :
    Ouvrez simplement le fichier `index.html` dans votre navigateur.
    *Conseil : Utilisez une extension comme "Live Server" sur VS Code pour un meilleur fonctionnement, ou ouvrez directement le fichier.*

### Utilisation de la DApp
Une fois sur la page web :
1.  Cliquez sur **"Connecter Wallet"**. Votre adresse et vos soldes de tokens s'affichent.
2.  **Mint (Simulation Admin)** : En tant que propriétaire du contrat (Account #0 par défaut), vous pouvez vous donner des tokens. Sélectionnez "Bronze" et cliquez sur "Mint Tokens".
3.  **Upgrade** : Une fois que vous avez 2 tokens Bronze, cliquez sur "Upgrade 2 Bronze -> 1 Silver".
    - *Attention :* Après avoir reçu des tokens (via Mint ou Transfert), ils sont verrouillés pendant 1 minutes. Vous devrez attendre ce délai pour les utiliser dans un upgrade !
4.  **Transfert** : Vous pouvez envoyer des tokens Bronze ou Silver à une autre adresse.
    - Le Gold est "Soulbound" et ne peut pas être transféré.
    - La limite de 8 tokens par portefeuille est vérifiée à chaque réception.
