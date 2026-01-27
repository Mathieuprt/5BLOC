pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC1155/ERC1155.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/token/ERC1155/extensions/ERC1155Supply.sol";

// Gestion des accès via tokens ERC-1155
contract PassCours is ERC1155, Ownable, ReentrancyGuard, ERC1155Supply {

    uint256 public constant BRONZE = 1;
    uint256 public constant SILVER = 2;
    uint256 public constant GOLD = 3;

    uint256 public constant MAX_TOKENS_PER_WALLET = 8;
    uint256 public constant COOLDOWN_TIME = 1 minutes;
    uint256 public constant LOCK_TIME = 1 minutes;

    // Suivi des timestamps pour cooldown et lock
    mapping(address => uint256) public lastTransactionTimestamp;

    // Utilisateur => Token ID => Timestamp de réception
    mapping(address => mapping(uint256 => uint256)) public lastReceiveTimestamp;

    constructor() ERC1155("https://example.com/api/item/{id}.json") Ownable(msg.sender) {}

    // Mint initial ou test (avec limite de 8 tokens/wallet)
    function adminMint(address account, uint256 id, uint256 amount) public onlyOwner {
        require(id >= BRONZE && id <= GOLD, "ID de token invalide");
        require(balanceOf(account, BRONZE) + balanceOf(account, SILVER) + balanceOf(account, GOLD) + amount <= MAX_TOKENS_PER_WALLET, "Limite de 8 tokens atteinte");
        
        _mint(account, id, amount, "");
        _updateLastReceive(account, id);
    }

    function setURI(string memory newuri) public onlyOwner {
        _setURI(newuri);
    }

    // Override pour pointer vers les fichiers JSON spécifiques
    function uri(uint256 id) public view override returns (string memory) {
        string memory base = super.uri(id);
        
        if (id == BRONZE) return string(abi.encodePacked(base, "bronze.json"));
        if (id == SILVER) return string(abi.encodePacked(base, "silver.json"));
        if (id == GOLD) return string(abi.encodePacked(base, "gold.json"));
        
        return base;
    }

    // Consommation d'un pass (burn) pour accès au contenu
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
        
        // Burn des sources et mint du niveau supérieur
        _burn(msg.sender, fromId, cost);
        _mint(msg.sender, toId, 1, "");

        lastTransactionTimestamp[msg.sender] = block.timestamp;
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
        
        _updateLastReceive(to, id);
        
        // Mise à jour du cooldown de l'expéditeur (considéré comme transaction majeure ?)
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

    function _updateLastReceive(address user, uint256 id) internal {
        lastReceiveTimestamp[user][id] = block.timestamp;
    }

    function _update(address from, address to, uint256[] memory ids, uint256[] memory values)
        internal
        override(ERC1155, ERC1155Supply)
    {
        super._update(from, to, ids, values);
    }
}
