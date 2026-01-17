// Translations for EN/FR
const translations = {
    en: {
        // Header
        "nav.dashboard": "DASHBOARD",
        "nav.research": "RESEARCH", 
        "nav.copytrading": "COPY TRADING",
        "nav.contact": "CONTACT",
        
        // Stat cards
        "stats.apr": "ANNUAL PERCENTAGE RATE",
        "stats.apr.note": "Projected from avg/mo",
        "stats.apr.note.projected": "Projected from avg/mo",
        "stats.apr.note.unavailable": "Projection unavailable",
        "stats.capital": "VAULT CAPITAL",
        "stats.followers": "followers",
        "stats.return": "TRADING RETURN",
        "stats.return.note": "Pure PnL / Initial Capital",
        "stats.return.last_30d": "last 30d",
        "stats.return.mtd": "month-to-date",
        "stats.return.avg_mo": "avg/mo",
        "stats.return.unavailable": "Portfolio history unavailable",
        "stats.days": "DAYS ACTIVE",
        "stats.days.since": "Since Oct 1, 2025",
        "stats.days.started": "Vault started Oct 1, 2025",
        "stats.avg_month": "AVG / MONTH",
        
        // Live data note
        "live.note": "*Live data from HyperLiquid",
        
        // Investment Time Machine
        
        // Projected profits
        
        // Comparison
        
        // Footer note
        
        // CTA Button
        "cta.join": "JOIN THE COPY TRADING ON HYPERLIQUID",

        // Hero
        "hero.tagline": "Systematic trading on HyperLiquid, transparent performance, copy-trade via vault.",

        // Verified
        "verified.link": "Don't Trust! Verify on HyperLiquid →",

        // How it works
        "how.title": "How it works",
        "how.step1.title": "1) Deposit USDC into the vault",
        "how.step1.link": "Open the HyperLiquid vault",
        "how.step2.title": "2) Strategy trades automatically",
        "how.step2.text": "Trades are executed systematically without your intervention.",
        "how.step3.title": "3) Withdraw anytime",
        "how.step3.text": "You can withdraw your funds whenever you want.",

        // Risk
        "risk.title": "Risk & assumptions",
        "risk.text": "Not financial advice. Past performance does not guarantee future results. This is crypto and copy trading — drawdowns can be significant.",

        // Monthly grid
        "monthly.grid.title": "Monthly Performance Grid",
        "monthly.grid.tooltip": "Calculated with Flow-adjusted TWR to isolate trading performance by neutralizing deposits and withdrawals.",
        "monthly.grid.year_total": "Year Total",

        // Footer
        "footer": "© Vice Algos are made with Love. All rights reserved."
    },
    fr: {
        
        // Stat cards
        "stats.apr": "TAUX DE RENDEMENT ANNUEL",
        "stats.apr.note": "Projection basée sur la moyenne mensuelle",
        "stats.apr.note.projected": "Projection basée sur la moyenne mensuelle",
        "stats.apr.note.unavailable": "Projection indisponible",
        "stats.capital": "CAPITAL DU VAULT",
        "stats.followers": "investisseurs",
        "stats.return": "RENDEMENT TRADING",
        "stats.return.note": "PnL Pur / Capital Initial",
        "stats.return.last_30d": "30 derniers jours",
        "stats.return.mtd": "depuis le début du mois",
        "stats.return.avg_mo": "moyenne/mois",
        "stats.return.unavailable": "Historique du portefeuille indisponible",
        "stats.days": "JOURS ACTIFS",
        "stats.days.since": "Depuis le 1er Oct 2025",
        "stats.days.started": "Vault lancé le 1er Oct 2025",
        "stats.avg_month": "MOYENNE / MOIS",
        
        // Live data note
        "live.note": "*Données en direct de HyperLiquid",
        
        // CTA Button
        "cta.join": "REJOIGNEZ LE COPY TRADING SUR HYPERLIQUID",

        // Hero
        "hero.tagline": "Trading algorithmique, performance transparente, copiez les trades via un coffre-fort numérique.",

        // Verified
        "verified.link": "Vérifiez l'historique des trades sur HyperLiquid en cliquant ici →",

        // How it works
        "how.title": "Comment ça marche?",
        "how.step1.title": "1) Déposez vos fonds dans le coffre-fort numérique",
        "how.step1.link": "Ouvrir le coffre-fort numérique sur HyperLiquid",
        "how.step2.title": "2) Déploiement actif de votre capital",
        "how.step2.text": "Les trades sont exécutés systématiquement vous n'avez rien à faire.",
        "how.step3.title": "3) Retirez à tout moment",
        "how.step3.text": "Vous pouvez retirer vos fonds quand vous le souhaitez.",

        // Risk
        "risk.title": "Attention aux Risques Financiers",
        "risk.text": "Les performances passées ne garantissent pas les résultats futurs.",

        // Monthly grid
        "monthly.grid.title": "Grille de performance mensuelle",
        "monthly.grid.tooltip": "Calculé avec TWR ajustée pour neutraliser les dépôts et retraits et isoler la performance de trading.",
        "monthly.grid.year_total": "Total annuel",

        // Footer
        "footer": "© Vice Algos are made with Love. All Rights reserved."
    }
};

// Current language
let currentLang = 'en';

// Detect browser language
function detectLanguage() {
    const browserLang = navigator.language || navigator.userLanguage;
    // Check if browser language starts with 'fr'
    if (browserLang.toLowerCase().startsWith('fr')) {
        return 'fr';
    }
    return 'en';
}

// Get translation
function t(key) {
    return translations[currentLang][key] || translations['en'][key] || key;
}

// Update all translatable elements
function updatePageLanguage() {
    // Update all elements with data-i18n attribute
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        el.textContent = t(key);
    });

    // Update tooltip text for data-i18n-tooltip elements
    document.querySelectorAll('[data-i18n-tooltip]').forEach(el => {
        const key = el.getAttribute('data-i18n-tooltip');
        const value = t(key);
        el.setAttribute('data-tooltip', value);
        el.setAttribute('aria-label', value);
    });
    
    // Update language toggle button
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        langToggle.textContent = currentLang === 'en' ? '🇫🇷 FR' : '🇬🇧 EN';
        langToggle.title = currentLang === 'en' ? 'Passer en français' : 'Switch to English';
    }
}

// Toggle language
function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'fr' : 'en';
    localStorage.setItem('preferredLang', currentLang);
    updatePageLanguage();

    // Re-render trading return subtitle (uses t()) without refetching
    if (typeof window.updateTradingReturnSubtitle === 'function') {
        window.updateTradingReturnSubtitle();
    }

    // Re-render avg/month card subtitle (uses t()) without refetching
    if (typeof window.updateAvgMonthlyCard === 'function') {
        window.updateAvgMonthlyCard();
    }

}

// Initialize language on page load
function initLanguage() {
    // Check localStorage first, then browser detection
    const savedLang = localStorage.getItem('preferredLang');
    if (savedLang && (savedLang === 'en' || savedLang === 'fr')) {
        currentLang = savedLang;
    } else {
        currentLang = detectLanguage();
    }
    updatePageLanguage();
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initLanguage);
