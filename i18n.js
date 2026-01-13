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
        "stats.return.avg_mo": "avg/mo",
        "stats.return.unavailable": "Portfolio history unavailable",
        "stats.days": "DAYS ACTIVE",
        "stats.days.since": "Since Oct 1, 2025",
        
        // Live data note
        "live.note": "*Live data from HyperLiquid",
        
        // Investment Time Machine
        "calc.title": "🚀 Investment Time Machine",
        "calc.invested": "If you had invested",
        "calc.since": "Since vault inception on October 1st 2025",
        "calc.days_ago": "days ago",
        "calc.earned": "You would have earned",
        "calc.return": "return",
        
        // Projected profits
        "proj.title": "📊 Projected future profits (if performance continues):",
        "proj.1month": "+1 MONTH",
        "proj.6months": "+6 MONTHS",
        "proj.1year": "+1 YEAR",
        
        // Comparison
        "compare.title": "Compare with traditional investments over the same period:",
        "compare.bank": "🏦 BANK SAVINGS",
        "compare.sp500": "📈 S&P 500",
        "compare.vice": "🚀 VICE ALGOS",
        
        // Footer note
        "calc.note": "Based on actual vault performance",
        "calc.month": "/month",
        
        // CTA Button
        "cta.join": "JOIN THE COPY TRADING ON HYPERLIQUID",
        
        // Footer
        "footer": "© Vice Algos are made with Love. All rights reserved."
    },
    fr: {
        // Header
        "nav.dashboard": "TABLEAU DE BORD",
        "nav.research": "RECHERCHE",
        "nav.copytrading": "COPY TRADING", 
        "nav.contact": "CONTACT",
        
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
        "stats.return.avg_mo": "moyenne/mois",
        "stats.return.unavailable": "Historique du portefeuille indisponible",
        "stats.days": "JOURS ACTIFS",
        "stats.days.since": "Depuis le 1er Oct 2025",
        
        // Live data note
        "live.note": "*Données en direct de HyperLiquid",
        
        // Investment Time Machine
        "calc.title": "🚀 Machine à Remonter le Temps",
        "calc.invested": "Si vous aviez investi",
        "calc.since": "Depuis la création du portefeuille le 1er Octobre 2025",
        "calc.days_ago": "jours",
        "calc.earned": "Vous auriez gagné",
        "calc.return": "rendement",
        
        // Projected profits
        "proj.title": "📊 Profits futurs projetés (si la performance continue):",
        "proj.1month": "+1 MOIS",
        "proj.6months": "+6 MOIS",
        "proj.1year": "+1 AN",
        
        // Comparison
        "compare.title": "Comparez avec les investissements traditionnels sur la même période:",
        "compare.bank": "🏦 ÉPARGNE BANCAIRE",
        "compare.sp500": "📈 S&P 500",
        "compare.vice": "🚀 VICE ALGOS",
        
        // Footer note
        "calc.note": "Basé sur la performance réelle du vault",
        "calc.month": "/mois",
        
        // CTA Button
        "cta.join": "REJOIGNEZ LE COPY TRADING SUR HYPERLIQUID",
        
        // Footer
        "footer": "© Vice Algos are made with Love. All rights reserved."
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
    
    // Update language toggle button
    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        langToggle.textContent = currentLang === 'en' ? '🇫🇷 FR' : '🇬🇧 EN';
        langToggle.title = currentLang === 'en' ? 'Passer en français' : 'Switch to English';
    }
    
    // Update days ago label dynamically
    updateDaysAgoLabel();
}

// Update days ago label with current language
function updateDaysAgoLabel() {
    const daysAgoLabel = document.getElementById('days-ago-label');
    if (daysAgoLabel && window.daysActive) {
        if (currentLang === 'fr') {
            daysAgoLabel.textContent = `${t('calc.since')} (${window.daysActive} ${t('calc.days_ago')})`;
        } else {
            daysAgoLabel.textContent = `${t('calc.since')} (${window.daysActive} ${t('calc.days_ago')})`;
        }
    }
}

// Toggle language
function toggleLanguage() {
    currentLang = currentLang === 'en' ? 'fr' : 'en';
    localStorage.setItem('preferredLang', currentLang);
    updatePageLanguage();
    
    // Re-run investment calculator to update dynamic text
    if (typeof updateInvestmentCalculator === 'function') {
        updateInvestmentCalculator();
    }

    // Re-render trading return subtitle (uses t()) without refetching
    if (typeof window.updateTradingReturnSubtitle === 'function') {
        window.updateTradingReturnSubtitle();
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
