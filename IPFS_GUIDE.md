# Guide d'Intégration IPFS (Pinata)

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
1.  Lancez votre DApp (`index.html`).
2.  Connectez votre wallet Admin (celui qui a déployé).
3.  Dans la section "Administration", champ "IPFS URI", collez l'adresse suivante :
    `ipfs://LE_CID_FINAL/` 
    *(N'oubliez pas le `/` à la fin !)*
4.  Cliquez sur "Définir URI" et validez la transaction.

✅ **Terminé !** Vos tokens pointent maintenant vers vos fichiers sur IPFS.
