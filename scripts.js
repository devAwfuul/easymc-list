document.addEventListener('DOMContentLoaded', () => {
    const tooltipContainer = document.getElementById('tooltip-container');

    document.querySelectorAll('.tooltip-container').forEach(container => {
        let timer;
        let tooltip;

        container.addEventListener('mouseenter', () => {
            timer = setTimeout(() => {
                tooltip = document.createElement('div');
                tooltip.className = 'tooltip fade-in';
                tooltip.innerHTML = container.id === 'search-button' ? 
                    'Search for Minecraft accounts by username or UUID' : 
                    'Upload a file to search multiple Minecraft usernames or UUIDs simultaneously';
            
                tooltipContainer.appendChild(tooltip);
            
                const rect = container.getBoundingClientRect();
                const tooltipRect = tooltip.getBoundingClientRect();
                tooltip.style.left = `${rect.left + (rect.width / 2) - (tooltipRect.width / 2)}px`;
                tooltip.style.top = `${rect.top - tooltipRect.height - 10}px`;
            }, 1000);
        });

        container.addEventListener('mouseleave', () => {
            clearTimeout(timer);
            if (tooltip) {
                tooltip.classList.remove('fade-in');
                tooltip.classList.add('fade-out');
                setTimeout(() => {
                    if (tooltip && tooltipContainer.contains(tooltip)) {
                        tooltipContainer.removeChild(tooltip);
                    }
                }, 200);
            }
        });
    });
});

const searchInput = document.getElementById('search-input');
const searchButton = document.getElementById('search-button');
const fileUpload = document.getElementById('file-upload');
const resultsContainer = document.getElementById('results');
const loader = document.getElementById('loader');
const statusMessage = document.getElementById('status-message');
const allAccountsContainer = document.getElementById('all-accounts-list');
const progressBar = document.getElementById('progress-bar');
const progress = document.getElementById('progress');
const accountCount = document.getElementById('account-count');
const usernameLink = document.querySelector('.username-link');
const sortSelect = document.getElementById('sort-select');

const CSV_URL = 'https://raw.githubusercontent.com/devAwfuul/awfuuls-easymc-list/main/list.csv';

// Add particles to the username
function addParticles() {
    const particleCount = 10;
    for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('span');
        particle.className = 'particle';
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 2}s`;
        usernameLink.appendChild(particle);
    }
}

addParticles();

// Add click event to username
usernameLink.addEventListener('click', (e) => {
    e.preventDefault();
    window.open('https://namemc.com/profile/awfuul', '_blank');
});

async function searchAccount(query) {
    loader.style.display = 'flex';
    statusMessage.textContent = '';

    try {
        const response = await fetch(CSV_URL);
        const text = await response.text();
        const lines = text.split('\n');
        
        const foundAccount = lines.find(line => {
            const [type, mcName, uuid] = line.split(',');
            return mcName.toLowerCase() === query.toLowerCase() || uuid.toLowerCase() === query.toLowerCase();
        });
    
        if (foundAccount) {
            const [type, mcName, uuid, session] = foundAccount.split(',');
            return { type, mcName, uuid, session };
        } else {
            return null;
        }
    } catch (error) {
        console.error('Error searching account:', error);
        return null;
    } finally {
        loader.style.display = 'none';
    }
}

function displayAccount(account, container = resultsContainer) {
    const card = document.createElement('div');
    card.className = 'card';

    const skinUrl = `https://crafatar.com/avatars/${account.uuid}?size=128&overlay`;

    const typeTag = `<span class="account-type-tag ${account.type.toLowerCase()}">${account.type}</span>`;

    card.innerHTML = `
        <div class="card-header">
            <img src="${skinUrl}" alt="${account.mcName}'s skin">
            <div class="card-content">
                <h3>${account.mcName} ${typeTag}</h3>
                <p>UUID: ${account.uuid.slice(0, 8)}...</p>
                <button class="copy-button" data-username="${account.mcName}"><i class="fas fa-copy icon"></i> Copy Username</button>
                <button class="copy-uuid-button" data-uuid="${account.uuid}"><i class="fas fa-copy icon"></i> Copy UUID</button>
                <button class="namemc-button" data-username="${account.mcName}"><i class="fas fa-external-link-alt icon"></i> NameMC</button>
            </div>
        </div>
    `;

    card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const deltaX = (x - centerX) / centerX;
        const deltaY = (y - centerY) / centerY;
        
        card.style.transform = `perspective(1000px) rotateY(${deltaX * 15}deg) rotateX(${-deltaY * 15}deg)`;
        card.style.background = `radial-gradient(circle at ${x/2}px ${y/2}px, rgba(255, 255, 255, 0.15), rgba(255, 255, 255, 0) 100%)`;
        card.style.scale = `105%`;
    });

    card.addEventListener('mouseleave', () => {
        card.style.transform = 'perspective(1000px) rotateY(0deg) rotateX(0deg)';
        card.style.background = `radial-gradient(circle at center, rgba(255, 255, 255, 0.1), rgba(255, 255, 255, 0) 100%)`;
        card.style.scale = `100%`;
    });

    card.addEventListener('click', (e) => {
        if (!e.target.classList.contains('copy-button') && !e.target.classList.contains('namemc-button')) {
            expandCard(account);
        }
    });

    const copyButton = card.querySelector('.copy-button');
    copyButton.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(account.mcName).then(() => {
            copyButton.textContent = 'Copied!';
            setTimeout(() => {
                copyButton.innerHTML = '<i class="fas fa-copy icon"></i> Copy Username';
            }, 2000);
        });
    });

    const copyUuidButton = card.querySelector('.copy-uuid-button');
    copyUuidButton.addEventListener('click', (e) => {
        e.stopPropagation();
        navigator.clipboard.writeText(account.uuid).then(() => {
            copyUuidButton.textContent = 'UUID Copied!';
            setTimeout(() => {
                copyUuidButton.innerHTML = '<i class="fas fa-copy icon"></i> Copy UUID';
            }, 2000);
        });
    });

    const namemcButton = card.querySelector('.namemc-button');
    namemcButton.addEventListener('click', (e) => {
        e.stopPropagation();
        window.open(`https://namemc.com/profile/${account.mcName}`, '_blank');
    });

    container.appendChild(card);
}

function displayErrorMessage(query) {
    const errorMessage = document.createElement('div');
    errorMessage.className = 'error-message';
    errorMessage.textContent = `${query} is not found.`;
    resultsContainer.appendChild(errorMessage);
}

function expandCard(account) {
    const overlay = document.createElement('div');
    overlay.className = 'overlay';

    const expandedCard = document.createElement('div');
    expandedCard.className = 'expanded-card';

    const fullSkinUrl = `https://crafatar.com/renders/body/${account.uuid}?overlay`;

    const typeTag = `<span class="account-type-tag ${account.type.toLowerCase()}">${account.type}</span>`;

    expandedCard.innerHTML = `
        <button class="close-button">&times;</button>
        <img src="${fullSkinUrl}" alt="${account.mcName}'s full skin">
        <h3>${account.mcName} ${typeTag}</h3>
        <p>UUID: ${account.uuid}</p>
        <button class="copy-button" data-username="${account.mcName}"><i class="fas fa-copy icon"></i> Copy Username</button>
        <button class="copy-uuid-button" data-uuid="${account.uuid}"><i class="fas fa-copy icon"></i> Copy UUID</button>
        <button class="namemc-button" data-username="${account.mcName}"><i class="fas fa-external-link-alt icon"></i> NameMC Profile</button>
    `;

    document.body.appendChild(overlay);
    document.body.appendChild(expandedCard);

    expandedCard.addEventListener('mousemove', (e) => {
        const rect = expandedCard.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        
        const deltaX = (x - centerX) / centerX;
        const deltaY = (y - centerY) / centerY;
        
        expandedCard.style.transform = `translate(-50%, -50%) perspective(1000px) rotateY(${deltaX * 5}deg) rotateX(${-deltaY * 5}deg)`;
    });

    expandedCard.addEventListener('mouseleave', () => {
        expandedCard.style.transform = 'translate(-50%, -50%) perspective(1000px) rotateY(0deg) rotateX(0deg)';
    });

    const closeButton = expandedCard.querySelector('.close-button');
    closeButton.addEventListener('click', () => {
        document.body.removeChild(overlay);
        document.body.removeChild(expandedCard);
    });

    overlay.addEventListener('click', () => {
        document.body.removeChild(overlay);
        document.body.removeChild(expandedCard);
    });

    const copyButton = expandedCard.querySelector('.copy-button');
    copyButton.addEventListener('click', () => {
        navigator.clipboard.writeText(account.mcName).then(() => {
            copyButton.textContent = 'Copied!';
            setTimeout(() => {
                copyButton.innerHTML = '<i class="fas fa-copy icon"></i> Copy Username';
            }, 2000);
        });
    });

    const copyUuidButton = expandedCard.querySelector('.copy-uuid-button');
    copyUuidButton.addEventListener('click', () => {
        navigator.clipboard.writeText(account.uuid).then(() => {
            copyUuidButton.textContent = 'UUID Copied!';
            setTimeout(() => {
                copyUuidButton.innerHTML = '<i class="fas fa-copy icon"></i> Copy UUID';
            }, 2000);
        });
    });

    const namemcButton = expandedCard.querySelector('.namemc-button');
    namemcButton.addEventListener('click', () => {
        window.open(`https://namemc.com/profile/${account.mcName}`, '_blank');
    });
}

async function processFile(file) {
    const text = await file.text();
    const usernames = text.split('\n').filter(username => username.trim() !== '');
    
    resultsContainer.innerHTML = '';
    progressBar.style.display = 'block';
    
    const totalUsernames = usernames.length;
    let processedUsernames = 0;
    const processedAccounts = new Set();

    for (const username of usernames) {
        const trimmedUsername = username.trim();
        if (!processedAccounts.has(trimmedUsername)) {
            const account = await searchAccount(trimmedUsername);
            if (account) {
                displayAccount(account);
                processedAccounts.add(trimmedUsername);
            } else {
                displayErrorMessage(trimmedUsername);
            }
            processedUsernames++;
            progress.style.width = `${(processedUsernames / totalUsernames) * 100}%`;
        }
    }

    progressBar.style.display = 'none';
    statusMessage.textContent = `Processed ${processedUsernames} unique usernames.`;
}

async function loadAllAccounts() {
    try {
        const response = await fetch(CSV_URL);
        const text = await response.text();
        const lines = text.split('\n');
        
        allAccountsContainer.innerHTML = '';
        
        const accounts = lines.slice(1).filter(line => {
            const [type, mcName, uuid] = line.split(',');
            return mcName && uuid;
        });
    
        accountCount.textContent = `Total Accounts: ${accounts.length}`;
        
        accounts.forEach(line => {
            const [type, mcName, uuid, session] = line.split(',');
            displayAccount({ type, mcName, uuid, session }, allAccountsContainer);
        });
    } catch (error) {
        console.error('Error loading all accounts:', error);
        statusMessage.textContent = 'Failed to load all accounts. Please try again later.';
    }
}

searchButton.addEventListener('click', () => {
    const query = searchInput.value.trim();
    if (query) {
        resultsContainer.innerHTML = '';
        searchAccount(query).then(account => {
            if (account) {
                displayAccount(account);
            } else {
                displayErrorMessage(query);
            }
        });
    }
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        const query = searchInput.value.trim();
        if (query) {
            resultsContainer.innerHTML = '';
            searchAccount(query).then(account => {
                if (account) {
                    displayAccount(account);
                } else {
                    displayErrorMessage(query);
                }
            });
        }
    }
});

fileUpload.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (file) {
        processFile(file);
    }
});

// Initial load of all accounts
loadAllAccounts();

// Lazy loading for all accounts
const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            observer.unobserve(img);
        }
    });
}, {
    rootMargin: '0px 0px 50px 0px'
});

function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    images.forEach(img => observer.observe(img));
}

// Implement infinite scrolling for all accounts
let page = 1;
const accountsPerPage = 50;

async function loadMoreAccounts() {
    const response = await fetch(CSV_URL);
    const text = await response.text();
    const lines = text.split('\n');
    
    const accounts = lines.slice(1).filter(line => {
        const [type, mcName, uuid] = line.split(',');
        return mcName && uuid;
    });

    const startIndex = (page - 1) * accountsPerPage;
    const endIndex = startIndex + accountsPerPage;
    const accountsToLoad = accounts.slice(startIndex, endIndex);

    accountsToLoad.forEach(line => {
        const [type, mcName, uuid, session] = line.split(',');
        displayAccount({ type, mcName, uuid, session }, allAccountsContainer);
    });

    lazyLoadImages();
    page++;

    return accountsToLoad.length > 0;
}

const infiniteScrollObserver = new IntersectionObserver((entries) => {
    if (entries[0].isIntersecting) {
        loadMoreAccounts().then(hasMore => {
            if (!hasMore) {
                infiniteScrollObserver.unobserve(entries[0].target);
            }
        });
    }
}, {
    rootMargin: '0px 0px 200px 0px'
});

const sentinel = document.createElement('div');
sentinel.id = 'sentinel';
allAccountsContainer.appendChild(sentinel);
infiniteScrollObserver.observe(sentinel);

// Sorting functionality
sortSelect.addEventListener('change', async () => {
    const response = await fetch(CSV_URL);
    const text = await response.text();
    const lines = text.split('\n');
    
    const accounts = lines.slice(1).filter(line => {
        const [type, mcName, uuid] = line.split(',');
        return mcName && uuid;
    }).map(line => {
        const [type, mcName, uuid, session] = line.split(',');
        return { type, mcName, uuid, session };
    });

    switch (sortSelect.value) {
        case 'username-asc':
            accounts.sort((a, b) => a.mcName.localeCompare(b.mcName));
            break;
        case 'username-desc':
            accounts.sort((a, b) => b.mcName.localeCompare(a.mcName));
            break;
    }

    allAccountsContainer.innerHTML = '';
    accounts.forEach(account => displayAccount(account, allAccountsContainer));
    lazyLoadImages();
});
