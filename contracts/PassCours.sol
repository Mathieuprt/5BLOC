// SPDX-License-Identifier: MIT
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

// Contrat PassCours gérant les accès via tokens ERC-1155
// Bronze = 1, Silver = 2, Gold = 3
contract PassCours is ERC1155, Ownable, ReentrancyGuard, ERC1155Supply {

    // ID des tokens
    uint256 public constant BRONZE = 1;
    uint256 public constant SILVER = 2;
    uint256 public constant GOLD = 3;

    // Limites et constantes de temps
    uint256 public constant MAX_TOKENS_PER_WALLET = 8;
    uint256 public constant COOLDOWN_TIME = 1 minutes;
    uint256 public constant LOCK_TIME = 1 minutes;

    // Mapping pour suivre le dernier timestamp d'action majeure d'un utilisateur
    mapping(address => uint256) public lastTransactionTimestamp;

    // Mapping pour suivre quand un token a été reçu (pour le blocage de 10 min)
    // Utilisateur => Token ID => Timestamp de réception
    // Note : Pour faire simple, on bloque tout le solde du token ID spécifique si un nouveau est reçu.
    // Une approche plus fine nécessiterait de tracker chaque token unitairement (style NFT 721),
    // mais ici on réinitialise le timer du type de token à chaque réception pour simplifier la logique ERC1155.
    mapping(address => mapping(uint256 => uint256)) public lastReceiveTimestamp;

    constructor() ERC1155("https://example.com/api/item/{id}.json") Ownable(msg.sender) {}

    // Fonction de mint pour l'admin (pour initialiser ou tester)
    // Vérifie la limite de possession
    function adminMint(address account, uint256 id, uint256 amount) public onlyOwner {
        require(id >= BRONZE && id <= GOLD, "ID de token invalide");
        require(balanceOf(account, BRONZE) + balanceOf(account, SILVER) + balanceOf(account, GOLD) + amount <= MAX_TOKENS_PER_WALLET, "Limite de 8 tokens atteinte");
        
        _mint(account, id, amount, "");
        _updateLastReceive(account, id);
    }

    // Permet de mettre à jour l'URI de base (pour IPFS)
    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    // Override de uri pour retourner des noms de fichiers spécifiques
    function uri(uint256 id) public view override returns (string memory) {
        string memory base = super.uri(id);
        
        if (id == BRONZE) return string(abi.encodePacked(base, "bronze.json"));
        if (id == SILVER) return string(abi.encodePacked(base, "silver.json"));
        if (id == GOLD) return string(abi.encodePacked(base, "gold.json"));
        
        return base;
    }

    // Fonction pour consommer un Pass (brûler le token) pour accéder au contenu
    function burnPass(uint256 id, uint256 amount) public {
        require(block.timestamp >= lastTransactionTimestamp[msg.sender] + COOLDOWN_TIME, "Veuillez attendre 1 minute entre les transactions");
        require(balanceOf(msg.sender, id) >= amount, "Solde insuffisant pour consommer ce Pass");
        
        _burn(msg.sender, id, amount);
        
        lastTransactionTimestamp[msg.sender] = block.timestamp;
    }

    // Système d'upgrade (Burn & Mint)
    // 2 Bronze -> 1 Silver
    // 2 Silver -> 1 Gold
    function upgradeTokens(uint256 fromId) public nonReentrant {
        require(fromId == BRONZE || fromId == SILVER, "Upgrade impossible pour cet ID");
        require(block.timestamp >= lastTransactionTimestamp[msg.sender] + COOLDOWN_TIME, "Veuillez attendre 1 minute entre les transactions");
        // Vérification du lock sur les tokens source
        require(block.timestamp >= lastReceiveTimestamp[msg.sender][fromId] + LOCK_TIME, "Vos tokens sont verrouilles pour 1 minute apres reception");

        uint256 toId = fromId + 1;
        uint256 cost = 2;

        require(balanceOf(msg.sender, fromId) >= cost, "Solde insuffisant pour l'upgrade");
        
        // Vérification de la limite totale avant mint
        // On brûle 2 et on gagne 1, donc le solde total diminue de 1.
        // Pas de risque de dépasser la limite si on l'avait déjà respectée, mais bonne pratique de vérifier si la logique change.
        // Ici : Total = Total - 2 + 1 = Total - 1. Donc OK.

        _burn(msg.sender, fromId, cost);
        _mint(msg.sender, toId, 1, "");

        // Mise à jour des timestamps
        lastTransactionTimestamp[msg.sender] = block.timestamp;
        // On considère l'upgrade comme une réception du nouveau token
        _updateLastReceive(msg.sender, toId);
    }

    // Override de safeTransferFrom pour gérer les restrictions
    function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes memory data) public override {
        require(from == msg.sender || isApprovedForAll(from, msg.sender), "Caller is not owner nor approved");
        require(id != GOLD, "Le token Gold est non-transferable (Soulbound)");
        require(block.timestamp >= lastReceiveTimestamp[from][id] + LOCK_TIME, "Token verrouille pendant 1 minute apres reception");
        
        // Vérification de la limite du destinataire
        uint256 recipientTotal = balanceOf(to, BRONZE) + balanceOf(to, SILVER) + balanceOf(to, GOLD);
        require(recipientTotal + amount <= MAX_TOKENS_PER_WALLET, "Le destinataire a atteint la limite de tokens");

        super.safeTransferFrom(from, to, id, amount, data);
        
        // Mise à jour du timestamp de réception du destinataire
        _updateLastReceive(to, id);
        
        // Mise à jour du cooldown de l'expéditeur (considéré comme transaction majeure ?)
        // Le cahier des charges dit "Cooldown: 5-minute delay between two major transactions".
        // Nous appliquons cela aux transferts également.
        if (from == msg.sender) { // Si c'est l'utilisateur qui initie
             require(block.timestamp >= lastTransactionTimestamp[from] + COOLDOWN_TIME, "Veuillez attendre 1 minute entre les transactions");
             lastTransactionTimestamp[from] = block.timestamp;
        }
    }

    // Override de safeBatchTransferFrom pour gérer les restrictions
    function safeBatchTransferFrom(address from, address to, uint256[] memory ids, uint256[] memory amounts, bytes memory data) public override {
         require(from == msg.sender || isApprovedForAll(from, msg.sender), "Caller is not owner nor approved");
         
         uint256 totalAmount = 0;
         for (uint256 i = 0; i < ids.length; ++i) {
             require(ids[i] != GOLD, "Le token Gold est non-transferable (Soulbound)");
             require(block.timestamp >= lastReceiveTimestamp[from][ids[i]] + LOCK_TIME, "Token verrouille pendant 1 minute apres reception");
             totalAmount += amounts[i];
         }

        // Vérification de la limite du destinataire
        uint256 recipientTotal = balanceOf(to, BRONZE) + balanceOf(to, SILVER) + balanceOf(to, GOLD);
        require(recipientTotal + totalAmount <= MAX_TOKENS_PER_WALLET, "Le destinataire a atteint la limite de tokens");

        super.safeBatchTransferFrom(from, to, ids, amounts, data);

        // Mise à jour des timestamps de réception
         for (uint256 i = 0; i < ids.length; ++i) {
             _updateLastReceive(to, ids[i]);
         }
         
        if (from == msg.sender) {
             require(block.timestamp >= lastTransactionTimestamp[from] + COOLDOWN_TIME, "Veuillez attendre 1 minute entre les transactions");
             lastTransactionTimestamp[from] = block.timestamp;
        }
    }

    // Fonction utilitaire interne pour mettre à jour le timestamp de réception
    function _updateLastReceive(address user, uint256 id) internal {
        lastReceiveTimestamp[user][id] = block.timestamp;
    }

    // The following functions are overrides required by Solidity.
    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Supply)
    {
        super._update(from, to, ids, values);
    }
}
