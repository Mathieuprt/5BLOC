const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const CONTRACT_ABI = [
    "function balanceOf(address account, uint256 id) view returns (uint256)",
    "function adminMint(address account, uint256 id, uint256 amount)",
    "function upgradeTokens(uint256 fromId)",
    "function safeTransferFrom(address from, address to, uint256 id, uint256 amount, bytes data)",
    "function owner() view returns (address)",
    "function burnPass(uint256 id, uint256 amount)",
    "function setURI(string newuri)",
    "function uri(uint256 id) view returns (string)"
];

async function checkAccess(id, contentName) {
    if (!contract) return;
    try {
        showStatus("Veuillez valider la transaction dans Metamask...", "var(--warning)");

        const tx = await contract.burnPass(id, 1);

        showStatus("Transaction envoyée, attente de validation...", "var(--warning)");
        await tx.wait();

        showSuccess("Token consommé avec succès !");
        updateBalances();

        setTimeout(() => {
            alert(`Obtenu !\n\nVous avez débloqué : ${contentName}.\n(Votre token a été consommé)`);
        }, 500);

    } catch (error) {
        handleError(error);
    }
}

let provider;
let signer;
let contract;
let userAddress;

const connectBtn = document.getElementById('connectBtn');
const disconnectBtn = document.getElementById('disconnectBtn');
const walletAddressSpan = document.getElementById('walletAddress');
const mainApp = document.getElementById('mainApp');
const loginView = document.getElementById('loginView');
const statusMessage = document.getElementById('statusMessage');

if (connectBtn) {
    connectBtn.addEventListener('click', async () => {
        if (window.ethereum) {
            try {
                provider = new ethers.BrowserProvider(window.ethereum);
                await provider.send("eth_requestAccounts", []);
                signer = await provider.getSigner();
                userAddress = await signer.getAddress();

                initializeUI(userAddress);

                contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
                updateBalances();

                window.ethereum.on('accountsChanged', handleAccountsChanged);

            } catch (error) {
                console.error(error);
                showError("Erreur de connexion: " + error.message);
            }
        } else {
            showError("Veuillez installer Metamask !");
        }
    });
}

if (disconnectBtn) {
    disconnectBtn.addEventListener('click', () => {
        // Simuler la deconnexion coté UI
        userAddress = null;
        signer = null;
        contract = null;
        resetUI();
        showSuccess("Déconnecté avec succès (Wallet reset).");
    });
}

function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        // Déconnexion forcée si plus de comptes connectés
        if (disconnectBtn) disconnectBtn.click();
    } else if (accounts[0] !== userAddress) {
        userAddress = accounts[0];
        initializeUI(userAddress);
        // On ré-initialise le signer du contrat
        provider.getSigner().then(s => {
            signer = s;
            contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);
            updateBalances();
        });
    }
}

function initializeUI(address) {
    if (walletAddressSpan) walletAddressSpan.innerText = address.slice(0, 6) + "..." + address.slice(-4);
    if (loginView) loginView.style.display = 'none';
    if (mainApp) {
        mainApp.classList.remove('hidden');
        mainApp.style.opacity = '0';
        mainApp.style.display = 'block';
        setTimeout(() => {
            mainApp.style.transition = 'opacity 0.5s ease';
            mainApp.style.opacity = '1';
        }, 10);
    }
}

function resetUI() {
    if (loginView) loginView.style.display = 'block';
    if (mainApp) {
        mainApp.classList.add('hidden');
        mainApp.style.display = 'none';
    }
    if (document.getElementById('bronzeBalance')) document.getElementById('bronzeBalance').innerText = '0';
    if (document.getElementById('silverBalance')) document.getElementById('silverBalance').innerText = '0';
    if (document.getElementById('goldBalance')) document.getElementById('goldBalance').innerText = '0';
}

// Conversion IPFS -> Gateway Pinata
function resolveIPFS(url) {
    if (!url) return "";
    if (url.startsWith("ipfs://")) {
        return url.replace("ipfs://", "https://gateway.pinata.cloud/ipfs/");
    }
    return url;
}

async function updateBalances() {
    if (!contract) return;
    try {
        const bronze = await contract.balanceOf(userAddress, 1);
        const silver = await contract.balanceOf(userAddress, 2);
        const gold = await contract.balanceOf(userAddress, 3);

        animateValue("bronzeBalance", bronze.toString());
        animateValue("silverBalance", silver.toString());
        animateValue("goldBalance", gold.toString());

        // Update de la vue
        loadInventory([bronze, silver, gold]);

    } catch (error) {
        console.error("Erreur lecture solde:", error);
    }
}

async function loadInventory(balances) {
    const grid = document.getElementById("inventoryGrid");
    grid.innerHTML = "";

    let hasItems = false;
    const ids = [1, 2, 3];

    for (let i = 0; i < ids.length; i++) {
        const id = ids[i];
        const balance = balances[i];

        if (balance > 0n) {
            hasItems = true;
            try {
                const uri = await contract.uri(id);
                let metadata = { name: `Token #${id}`, description: "Pas de métadonnées", image: "" };

                if (uri && uri.startsWith("ipfs://")) {
                    try {
                        const httpUri = resolveIPFS(uri);
                        const response = await fetch(httpUri);
                        if (response.ok) {
                            metadata = await response.json();
                        }
                    } catch (e) {
                        console.warn("Impossible de charger les métadonnées IPFS", e);
                    }
                }

                // Affichage carte
                const card = document.createElement("div");
                card.className = "card";
                card.style.borderColor = id === 1 ? "#cd7f32" : (id === 2 ? "#c0c0c0" : "#ffd700");

                const imageUrl = resolveIPFS(metadata.image);
                const imageTag = imageUrl ? `<img src="${imageUrl}" style="width:100%; border-radius:8px; margin-bottom:10px; height: 150px; object-fit: cover;" alt="${metadata.name}">` : `<div style="height:150px; background:rgba(255,255,255,0.05); display:flex; align-items:center; justify-content:center; border-radius:8px; margin-bottom:10px;">No Image</div>`;

                card.innerHTML = `
                    ${imageTag}
                    <h3>${metadata.name}</h3>
                    <p style="font-size:0.9rem; color:var(--text-muted); margin-bottom:10px;">${metadata.description}</p>
                    <div style="display:flex; justify-content:space-between; align-items:center; margin-top:auto;">
                        <span style="font-weight:bold;">Quantité: ${balance.toString()}</span>
                        <span style="font-size:0.8rem; background:rgba(255,255,255,0.1); padding:2px 6px; border-radius:4px;">ID: ${id}</span>
                    </div>
                `;
                grid.appendChild(card);

            } catch (error) {
                console.error(`Erreur loading token ${id}`, error);
            }
        }
    }

    if (!hasItems) {
        grid.innerHTML = `<p style="text-align: center; width: 100%; color: var(--text-muted);">Votre inventaire est vide.</p>`;
    }
}

// Mint (Réservé à l'Admin)
const mintBtn = document.getElementById('mintBtn');
if (mintBtn) {
    mintBtn.addEventListener('click', async () => {
        try {
            const id = document.getElementById('mintLevel').value;
            const amount = document.getElementById('mintAmount').value;

            showStatus("Mint en cours...", "var(--warning)");
            const tx = await contract.adminMint(userAddress, id, amount);
            await tx.wait();

            showSuccess("Mint effectué avec succès !");
            updateBalances();
        } catch (error) {
            handleError(error);
        }
    });
}

// Set URI (Admin)
const setUriBtn = document.getElementById('setUriBtn');
if (setUriBtn) {
    setUriBtn.addEventListener('click', async () => {
        try {
            const uri = document.getElementById('ipfsUriInput').value;
            if (!uri) return showError("Veuillez entrer une URI valide");

            showStatus("Mise à jour de l'URI...", "var(--warning)");
            const tx = await contract.setURI(uri);
            await tx.wait();

            showSuccess("URI mise à jour avec succès !");
        } catch (error) {
            handleError(error);
        }
    });

}

// Upgrades
const upgradeBronzeBtn = document.getElementById('upgradeBronzeBtn');
if (upgradeBronzeBtn) upgradeBronzeBtn.addEventListener('click', () => doUpgrade(1, "Bronze -> Silver"));

const upgradeSilverBtn = document.getElementById('upgradeSilverBtn');
if (upgradeSilverBtn) upgradeSilverBtn.addEventListener('click', () => doUpgrade(2, "Silver -> Gold"));

async function doUpgrade(id, label) {
    try {
        showStatus("Upgrade " + label + " en cours...", "var(--warning)");
        const tx = await contract.upgradeTokens(id);
        await tx.wait();

        showSuccess("Upgrade réussi !");
        updateBalances();
    } catch (error) {
        handleError(error);
    }
}

// Transfert
const transferBtn = document.getElementById('transferBtn');
if (transferBtn) {
    transferBtn.addEventListener('click', async () => {
        try {
            const to = document.getElementById('transferTo').value;
            const id = document.getElementById('transferLevel').value;
            const amount = document.getElementById('transferAmount').value;

            if (!ethers.isAddress(to)) {
                showError("Adresse destinataire invalide");
                return;
            }

            showStatus("Transfert en cours...", "var(--warning)");
            const tx = await contract.safeTransferFrom(userAddress, to, id, amount, "0x");
            await tx.wait();

            showSuccess("Transfert réussi !");
            updateBalances();
        } catch (error) {
            handleError(error);
        }
    });
}

// Contrôle d'accès (Token Gating)
const accessBronzeBtn = document.getElementById('accessBronzeBtn');
if (accessBronzeBtn) accessBronzeBtn.addEventListener('click', () => checkAccess(1, "Cours de Base"));

const accessSilverBtn = document.getElementById('accessSilverBtn');
if (accessSilverBtn) accessSilverBtn.addEventListener('click', () => checkAccess(2, "Tutoriels & Équipements"));

const accessGoldBtn = document.getElementById('accessGoldBtn');
if (accessGoldBtn) accessGoldBtn.addEventListener('click', () => checkAccess(3, "Coaching Privé"));

async function checkAccess(id, contentName) {
    if (!contract) return;
    try {
        showStatus("Veuillez valider la transaction dans Metamask...", "var(--warning)");

        const tx = await contract.burnPass(id, 1);

        showStatus("Transaction envoyée, attente de validation...", "var(--warning)");
        await tx.wait();

        showSuccess("Token consommé avec succès !");
        updateBalances();

        setTimeout(() => {
            alert(`Obtenu !\n\nVous avez débloqué : ${contentName}.\n(Votre token a été consommé)`);
        }, 500);

    } catch (error) {
        handleError(error);
    }
}

function handleError(error) {
    console.error(error);
    let msg = error.reason || error.message || "Erreur inconnue";
    if (msg.includes("user rejected") || msg.includes("User rejected")) msg = "Transaction annulée";
    else if (msg.includes("Limite de 8 tokens")) msg = "Limite de 8 tokens atteinte";
    else if (msg.includes("Soulbound")) msg = "Token Gold non-transférable";
    else if (msg.includes("cooldown")) msg = "Pause : Attendez 1 min !";
    else if (msg.includes("verrouille")) msg = "Token verrouillé (1 min)";
    else if (msg.includes("OwnableUnauthorizedAccount")) msg = "Action réservée à l'Admin";

    showError("Erreur: " + msg);
}

function showStatus(msg, color) {
    if (statusMessage) {
        statusMessage.innerText = msg;
        statusMessage.style.backgroundColor = color;
        statusMessage.style.display = 'block';
    }
}

function showSuccess(msg) {
    showStatus(msg, "var(--success)");
    setTimeout(() => {
        if (statusMessage) statusMessage.style.display = 'none';
    }, 4000);
}

function showError(msg) {
    showStatus(msg, "var(--error)");
    setTimeout(() => {
        if (statusMessage) statusMessage.style.display = 'none';
    }, 5000);
}

function animateValue(id, value) {
    const el = document.getElementById(id);
    if (el) {
        el.style.transform = "scale(1.2)";
        el.style.color = "white";
        setTimeout(() => {
            el.innerText = value;
            el.style.transform = "scale(1)";
            el.style.color = "";
        }, 200);
    }
}
