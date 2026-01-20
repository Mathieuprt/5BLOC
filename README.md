# PassCours DApp

Application Décentralisée (DApp) pour la gestion d'accès via des tokens ERC-1155 évolutifs.

## Fonctionnalités
- **Tokens** : Bronze (1), Silver (2), Gold (3).
- **Upgrade** : Fusionner 2 tokens pour obtenir le niveau supérieur.
- **Soulbound** : Le token Gold est lié au wallet (non-transférable).
- **Sécurité** :
    - Limite de 8 tokens par portefeuille.
    - Délai de 5 minutes entre transactions.
    - Verrouillage de 10 minutes après réception d'un token.

## 🧠 Fonctionnement Technique

### 🔗 Blockchain & IPFS : Qui fait quoi ?

Ce projet utilise une architecture **hybride** standard dans le Web3 :

1.  **La Blockchain (Smart Contract)** :
    *   **Rôle** : C'est le "Registre Comptable".
    *   **Ce qu'elle stocke** : Uniquement les soldes. *"L'adresse 0xABC possède 1 Token Bronze"*.
    *   **Coût** : Très cher pour stocker des données. On n'y met jamais d'images ou de gros textes.

2.  **IPFS (Pinata)** :
    *   **Rôle** : C'est le "Disque Dur Décentralisé".
    *   **Ce qu'il stocke** : Les images, les fichiers JSON (Métadonnées) et le contenu des cours.
    *   **Lien** : Le Smart Contract contient une fonction `uri(id)` qui renvoie le lien IPFS vers les détails du token.

### 🔄 Cycle de Vie d'un Jeton

1.  **Création (Mint)** :
    *   L'Admin appelle `adminMint` sur la Blockchain.
    *   La Blockchain écrit : `Solde[User] += 1`.
    *   Aucun fichier n'est bougé. Le token "nait" avec un lien pré-défini vers IPFS.

2.  **Affichage (Wallet/Site)** :
    *   Le site web demande au contrat : *"Quel est l'URI du token 1 ?"*
    *   Le contrat répond : `ipfs://Qm.../bronze.json`
    *   Le site télécharge ce fichier JSON pour afficher le nom "Pass Bronze" et l'image.

3.  **Transfert** :
    *   L'utilisateur appelle `safeTransferFrom`.
    *   La Blockchain met simplement à jour les soldes : `Solde[Envoyeur] - 1`, `Solde[Destinataire] + 1`.
    *   Les données IPFS ne bougent pas.

4.  **Consommation (Burn)** :
    *   L'utilisateur veut accéder à un cours.
    *   Il appelle `burnPass`.
    *   La Blockchain vérifie le solde, brûle le token (`Solde - 1`) et valide la transaction.
    *   Le site web voit que la transaction a réussi et débloque l'affichage du cours (récupéré depuis IPFS).



## Installation et Lancement

1.  **Installer les dépendances** :
    ```bash
    npm install
    ```

2.  **Lancer le noeud local** :
    ```bash
    npx hardhat node
    ```

3.  **Déployer le contrat** (dans un autre terminal) :
    ```bash
    npx hardhat run scripts/deploy.js --network localhost
    ```

4.  **Lancer l'interface** :
    Ouvrez le fichier `index.html` dans votre navigateur.

## Tests
Pour lancer la suite de tests unitaires :
```bash
npx hardhat test
```
