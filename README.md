# Guide d'Utilisation - DApp SmartCourse

## 1. Comprendre les Pass (Tokens)

Votre progression est matérialisée par des badges numériques (NFT) de trois niveaux différents. Chaque niveau offre des droits d'accès spécifiques :

*   **Pass Silver** (Niveau 2) : Accès à une synthèse du cours.
*   **Pass Gold** (Niveau 3) : Accès à une synthèse du cours + des fiches de révision
*   **Pass Bronze** (Niveau 1) : Accès à une synthèse du cours + des fiches de révision + des examens blancs + des corrections des examens blancs  
    *   *Note : Le Pass Gold est **Soulbound**, il est lié à votre portefeuille et ne peut jamais être transféré.*


## 2. Actions Disponibles

### A. Obtenir des pass (Mint) (Simulation)
Pour tester l'application, vous pouvez générer vos propres badges dans la section **Admin Zone** (simulation d'un gain après une validation pédagogique).
- Choisissez le **niveau** du badge (Bronze, Argent ou Or).
- Indiquez la **quantité** souhaitée.
- Cliquez sur **Mint** et validez dans Metamask.
*Note : Vous devez posséder quelques ETH fictifs sur votre réseau local pour payer les frais du réseau.*

### B. Améliorer mes pass (Upgrade)
Vous pouvez fusionner vos compétences pour atteindre le niveau supérieur :
- fusion de **2 Pass Bronze** ➜ **1 Pass Silver**
- fusion de **2 Pass Silver** ➜ **1 Pass Gold**
*L'action d'upgrade détruit les anciens badges pour créer le nouveau automatiquement.*

### C. Transférer à un ami (Transfert)
Vous pouvez transférer vos jetons **Bronze** et **Argent** à un autre étudiant :
1.  **Récupérer l'adresse du destinataire** :
    - Dans Metamask, placez-vous sur le compte qui doit recevoir les jetons.
    - Récupérez l'adresse (en cliquant sur les trois petits points du compte destinataire > adresses > copier l'adresse de Hardhat Localhost).
2.  **Effectuer l'envoi dans l'application** :
    - Retournez sur votre compte expéditeur dans Metamask.
    - Dans la section **Transfert** de l'application, collez l'adresse de votre ami.
    - Choisissez le **type** de badge (Bronze ou Argent) et la **quantité**.
    - Cliquez sur **Envoyer** et validez la transaction.
*Rappel : Les badges **OR** sont "Soulbound" (liés à votre identité) et ne peuvent pas être envoyés.*

### D. Accéder au cours (Burn)
Pour avoir accès à un cours dans l'Espace Formation :
- Cliquez sur **"Obtenir le cours"**.
- Cela va "consommer" (brûler) **1 Pass** du niveau requis.
- Une fois consommé, le Pass est définitivement supprimé de votre inventaire, vous libérant ainsi de la place.


## 3. Règles et Limitations

Pour garantir la sécurité et l'équilibre de la plateforme, certaines règles automatiques s'appliquent :

1.  **Limite de Possession** : Un étudiant ne peut pas détenir plus de **8 jetons au total** dans son portefeuille (tous niveaux confondus).
2.  **Délai entre actions (Cooldown)** : Après une action majeure (Upgrade, Transfert, Consommation), vous devez patienter **1 minute** avant d'effectuer la suivante.
3.  **Gel à la réception (Lock)** : Tout jeton reçu (via Mint ou Transfert) est "bloqué" pendant **1 minute** avant de pouvoir être utilisé pour un upgrade ou renvoyé.
*Note : L'action "Admin Zone" n'est pas soumise au délai d'attente. Vous pouvez générer plusieurs jetons successivement.*

---


# Guide d'Installation et de Lancement - DApp SmartCourse

Bienvenue dans le guide technique de **SmartCourse**. Suivez ces étapes pour installer, configurer et lancer l'application sur votre environnement local (Windows ou Linux).

## 1. Pré-requis

Avant de commencer, assurez-vous d'avoir installé les outils suivants :
- **Node.js** (Version 18 ou supérieure) et **NPM**.
- L'extension de navigateur **Metamask**.

## 2. Installation et Lancement

### Étape A : Préparation du projet
Ouvrez un terminal à la racine du projet et installez les dépendances :
```bash
# Windows et Linux
npm install
```

### Étape B : Lancement (3 Terminaux requis)
L'application nécessite que trois services tournent simultanément. Ouvrez **3 terminaux séparés** :

#### Terminal 1 : La Blockchain Locale
Initialisez le simulateur de réseau Ethereum :
```bash
# Windows et Linux
npx hardhat node
```
> [!TIP]
> **Gardez ce terminal bien visible.** Dès qu'il est lancé, une liste de 20 comptes s'affiche. Notez la **Private Key** (Clé Privée) de l'Account #0, vous en aurez besoin pour Metamask à l'étape 3.

#### Terminal 2 : Déploiement du Contrat
Une fois que le Terminal 1 est prêt, déployez le Smart Contract :
```bash
# Windows et Linux
npx hardhat run scripts/deploy.js --network localhost
```
*Note : Le script déploie le contrat et met à jour automatiquement l'adresse `CONTRACT_ADDRESS` dans `app.js`.*

#### Terminal 3 : Serveur Web
Lancez l'interface utilisateur pour y accéder via votre navigateur :
```bash
# Option Node.js (Recommandée)
npx serve .

# Alternative Python
python -m http.server 8000
```
L'application sera alors accessible sur **`http://localhost:3000`** (ou 8000).


## 3. Configuration de Metamask

Pour interagir avec le contrat local, vous devez connecter Metamask au réseau simulé par Hardhat.

1.  **Ajouter le réseau "Hardhat Local"** :
    - Dans Metamask : Réseaux > Ajouter un réseau personnalisé.
    - **Nom** : `Hardhat Localhost`
    - **URL RPC** : `http://127.0.0.1:8545`
    - **ID de chaîne** : `31337`
    - **Symbole** : `ETH`
2.  **Importer votre compte de test** :
    - Cliquez sur votre profil (en haut à gauche) Ajouter un portefeuille > **Importer un compte**.
    - Copiez-collez la **Private Key** récupérée dans votre **Terminal 1** (celui où tu as lancé npx hardhat node) (ex: Account #0).
3.  **Connexion au site** :
    - Sur votre navigateur, allez sur `http://localhost:3000`.
    - Cliquez sur **"Connecter Wallet"** 
    - Sélectionnez le compte que vous venez d'importer
    - Assurez-vous que Metamask est bien positionné sur le réseau Hardhat Localhost pour que vos soldes s'affichent correctement.
4.  **En cas de blocage** :
    - Si une transaction semble "bloquée" ou échoue bizarrement : Paramètres > Avancé > **Effacer les données de l'onglet Activité** (cela réinitialise le compteur de transactions locales).

## 5. Configuration IPFS (Pinata)

Ce projet ne se connecte pas "automatiquement" à votre compte Pinata. C'est un processus décentralisé où vous devez uploader les fichiers pour obtenir leur adresse unique (CID).

Voici la marche à suivre étape par étape :

## Étape 1 : Préparer les Images
1.  Placez vos images (ex: `bronze.png`, `silver.png`, `gold.png`) dans le dossier `assets/` que je viens de créer.
2.  Allez sur [Pinata Cloud](https://app.pinata.cloud/).
3.  Cliquez sur **Add Files** -> **Folder**.
4.  Sélectionnez le dossier `assets`.
5.  Une fois uploadé, copiez le **CID** (le hash qui commence par `Qm...`) de ce dossier.

## Étape 2 : Mettre à jour les Images dans les JSON
1.  Ouvrez `metadata/bronze.json`, `metadata/silver.json`, `metadata/gold.json`.
2.  Remplacez `QmPlaceHolderImageHash` par le CID que vous venez de copier.
    *   Exemple : `"image": "ipfs://QmYourImageHash/bronze.png"`

## Étape 3 : Uploader le Contenu (Cours)
1.  Sur Pinata, cliquez sur **Add Files** -> **Folder**.
2.  Sélectionnez le dossier `content/` (qui contient déjà `cours_bronze.md`, etc.).
3.  Une fois uploadé, copiez le **CID** de ce dossier.

## Étape 4 : Mettre à jour le Contenu dans les JSON
1.  Ouvrez à nouveau les fichiers JSON dans `metadata/`.
2.  Remplacez `QmPlaceHolderContentHash` par le CID du dossier content.
    *   Exemple : `"hash": "ipfs://QmYourContentHash/cours_bronze.md"`

## Étape 5 : Uploader les Métadonnées (Final)
1.  Maintenant que vos JSON sont à jour (avec les bons liens images et contenu), on les upload.
2.  Sur Pinata, **Add Files** -> **Folder**.
3.  Sélectionnez le dossier `metadata`.
4.  Copiez le **CID Final** de ce dossier.
    *   C'est LE hash le plus important.

## Étape 6 : Connecter au Projet
1.  Lancez votre DApp.
2.  Connectez votre wallet Admin (celui qui a déployé).
3.  Dans la section "Administration", champ "IPFS URI", collez l'adresse suivante :
    `ipfs://LE_CID_FINAL/` 
    *(N'oubliez pas le `/` à la fin !)*
4.  Cliquez sur **"Définir URI"** et validez la transaction dans Metamask.
5.  Patientez quelques secondes le temps de la validation, puis rafraîchissez la page pour voir vos tokens s'afficher avec leurs images.

---

# Documentation technique - DApp SmartCourse

## 1. Architecture du système

Le projet repose sur une architecture Web3 standard qui sépare la logique métier, l'interface utilisateur et le stockage des données.

*   **Smart Contract (On-chain)** : C'est le cœur de l'application. Développé en Solidity, il gère la propriété des tokens, les règles d'échange et les restrictions temporelles.
*   **Interface (Frontend)** : Une application web légère qui utilise la bibliothèque Ethers.js pour interagir avec la blockchain Ethereum (réseau local pour le développement).
*   **Stockage (Off-chain)** : Les métadonnées et les images sont stockées sur IPFS. Cela permet de garantir que les informations liées aux tokens sont décentralisées et immuables, tout en évitant les coûts de stockage élevés sur la blockchain.

## 2. Choix techniques

Plusieurs décisions techniques ont été prises pour répondre aux besoins de performance et de sécurité :

*   **Ethereum & Solidity** : Nous avons choisi l'écosystème Ethereum pour sa maturité et la robustesse du langage Solidity.
*   **Standard ERC-1155** : Contrairement au format ERC-721 (NFT classique), l'ERC-1155 permet de gérer plusieurs types de tokens (Bronze, Silver, Gold) dans un seul et même contrat. C'est beaucoup plus économe en "gas" lors des déploiements et des transferts multiples.
*   **OpenZeppelin** : Utilisation des bibliothèques standards pour le contrôle d'accès (`Ownable`) et la sécurité (`ReentrancyGuard`).
*   **Hardhat** : Choisi comme environnement de développement pour ses outils de test performants et sa facilité de déploiement.
*   **Pinata (IPFS)** : Utilisé comme passerelle pour faciliter l'indexation et la persistance des fichiers sur IPFS.

| Composant | Technologie |
| :--- | :--- |
| **Langage Contrat** | Solidity 0.8.28 |
| **Bibliothèques Contrat** | OpenZeppelin (ERC1155, Ownable, ReentrancyGuard, ERC115Supply) |
| **Framework de Dev** | Hardhat |
| **Tests** | Mocha & Chai |
| **Librairie Web3** | Ethers.js v6 |
| **Hébergement Off-chain** | IPFS (Pinata Cloud) |


## 3. Respect des contraintes métiers

Le contrat `SmartCourse.sol` implémente strictement les règles définies pour le projet :

1.  **Tokenisation à niveaux** : Les ressources sont divisées en trois catégories (Bronze, Silver et Gold), chacune offrant des droits d'accès croissants.
2.  **Mécanisme d'échange** : Un système d'upgrade permet aux utilisateurs de convertir 2 tokens d'un niveau inférieur contre 1 token du niveau supérieur. Cette action "brûle" les tokens sources pour créer le nouveau.
3.  **Limite de possession** : Pour éviter l'accumulation, chaque adresse est limitée à un maximum de 8 tokens au total (configurable).
4.  **Contraintes temporelles** : 
    *   **Cooldown** : Un délai de 1 minute est imposé entre deux actions majeures (transfert, upgrade ou consommation).
    *   **Lock** : Chaque token reçu est verrouillé pendant 1 minute avant de pouvoir être transféré ou transformé.
5.  **Transférabilité** : Les tokens Bronze et Silver sont échangeables. Cependant, le token Gold est "Soulbound", il n'est pas transférable une fois acquis.

## 4. Sécurité et robustesse

*   **Contrôles d'accès** : Seul l'administrateur (propriétaire du contrat) peut créer (mint) de nouveaux tokens initiaux.
*   **Prévention des attaques** : L'utilisation de `nonReentrant` sur les fonctions critiques empêche les attaques par réentrance.
*   **Validation des entrées** : Chaque fonction vérifie systématiquement les soldes des utilisateurs et le respect des délais avant d'exécuter une modification d'état.
*   **Standardisation** : Le respect strict des interfaces ERC-1155 garantit la compatibilité avec les portefeuilles (Metamask) et les plateformes externes.

## 5. Tests unitaires

La robustesse du projet est garantie par une suite de **13 tests automatisés** exécutés via Hardhat et Chai. Ces tests simulent des conditions d'utilisation réelles et tentent de forcer les failles de sécurité.

### Liste détaillée des tests effectués :

*   **Déploiement** :
    *   `Should set the right owner` : Vérification que l'adresse qui déploie le contrat est bien définie comme administrateur principal.
*   **Distribution (Admin Minting)** :
    *   `Should allow owner to mint tokens` : Test de la capacité de l'admin à distribuer des jetons Bronze/Silver/Gold.
    *   `Should fail if total tokens exceed limit of 8` : Validation du blocage si l'admin tente d'attribuer plus de 8 jetons à un utilisateur (protection contre l'accumulation).
*   **Système d'Upgrade** :
    *   `Should upgrade 2 Bronze to 1 Silver` : Validation du mécanisme de fusion (destruction des sources et création du palier supérieur).
    *   `Should fail if not enough balance` : Vérification du blocage si l'utilisateur n'a pas les 2 jetons requis.
    *   `Should fail if called before cooldown (1 min)` : Test de la sécurité anti-spam empêchant d'enchaîner les upgrades trop vite.
*   **Transferts et Restrictions** :
    *   `Should allow transfer of Bronze tokens after lock time` : Succès du transfert après le délai de sécurité de 1 minute.
    *   `Should prevent transfer of Bronze tokens before lock time` : Échec automatique du transfert si le jeton vient d'être acquis (anti-revente immédiate).
    *   `Should prevent transfer of Gold tokens (Soulbound)` : Validation que le token Gold ne peut jamais quitter le portefeuille de son acquéreur.
    *   `Should verify recipient limit on transfer` : Bloque le transfert si le destinataire possède déjà 8 jetons.
*   **Consommation (Burn)** :
    *   `Should allow users to burn their own tokens` : Validation du droit d'accès (détruire un jeton pour débloquer un cours).
    *   `Should fail to burn if balance is insufficient` : Sécurité empêchant de consommer ce qu'on ne possède pas.
    *   `Should fail if called before cooldown (1 min)` : Limitation de la vitesse de consommation des ressources.

Pour lancer les tests :
```bash
npx hardhat test
```

## 6. Structure du projet

Voici l'organisation des fichiers pour s'y retrouver :

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

## 7. Mécanisme de Déploiement
1. Le script `deploy.js` compile le contrat et le déploie sur le réseau local Hardhat.
2. **Post-déploiement** : Le script écrit l'adresse dans `address.txt` et **injecte directement** la nouvelle valeur de `CONTRACT_ADDRESS` dans le fichier `app.js` pour une mise à jour immédiate de l'interface.

