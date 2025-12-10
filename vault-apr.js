// Vault APR Calculator for HyperLiquid Vault
let currentAPR = 0;
let vaultData = null;

// Vault start date
const VAULT_START_DATE = new Date('2025-10-01');

async function fetchVaultAPR() {
    const vaultAddress = "0xccc01fa89e4163aaaa231d3d0a2943cc613bf2ea";
    
    try {
        const response = await fetch('https://api.hyperliquid.xyz/info', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                type: "vaultDetails",
                vaultAddress: vaultAddress
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        vaultData = data;
        
        console.log('Vault API Response:', data);
        
        if (data && data.apr !== undefined) {
            const aprDecimal = data.apr;
            currentAPR = aprDecimal;
            const aprPercentage = (aprDecimal * 100).toFixed(2);
            
            // Update the APR display
            updateAPRDisplay(aprPercentage, data.name || "Vice Algos Vault");
            
            // Calculate investment example
            updateInvestmentCalculator();
            
            // Update vault capital display
            updateVaultCapital(data);
            
            // Update trading return and days active
            updateTradingStats(data);
            
        } else {
            console.error('Vault data not found or APR missing:', data);
            displayError("Unable to fetch vault APR data");
        }
        
    } catch (error) {
        console.error('Error fetching vault APR:', error);
        displayError("Failed to fetch vault data");
    }
}

function updateVaultCapital(data) {
    const capitalElement = document.getElementById('vault-capital');
    if (!capitalElement) return;
    
    // Calculate total vault equity from followers or use maxDistributable
    let totalEquity = 0;
    
    if (data.followers && data.followers.length > 0) {
        // Sum all follower equities
        totalEquity = data.followers.reduce((sum, follower) => {
            return sum + parseFloat(follower.vaultEquity || 0);
        }, 0);
    } else if (data.maxDistributable) {
        totalEquity = parseFloat(data.maxDistributable);
    }
    
    // Format the capital display
    if (totalEquity >= 1000000) {
        capitalElement.innerHTML = `$${(totalEquity / 1000000).toFixed(2)}M`;
    } else if (totalEquity >= 1000) {
        capitalElement.innerHTML = `$${(totalEquity / 1000).toFixed(2)}K`;
    } else {
        capitalElement.innerHTML = `$${totalEquity.toFixed(2)}`;
    }
    
    // Update follower count if element exists
    const followerCountElement = document.getElementById('follower-count');
    if (followerCountElement && data.followers) {
        followerCountElement.innerHTML = data.followers.length;
    }
}

function updateTradingStats(data) {
    // Calculate initial deposits and unrealized PnL from followers data
    // Formula: initialDeposit = vaultEquity - unrealizedPnl
    // Then: tradingReturn = totalUnrealizedPnl / totalInitialDeposit * 100
    
    let totalInitialDeposit = 0;
    let totalUnrealizedPnl = 0;
    
    if (data.followers && data.followers.length > 0) {
        data.followers.forEach(follower => {
            const vaultEquity = parseFloat(follower.vaultEquity || 0);
            const unrealizedPnl = parseFloat(follower.pnl || 0);
            const initialDeposit = vaultEquity - unrealizedPnl;
            
            totalInitialDeposit += initialDeposit;
            totalUnrealizedPnl += unrealizedPnl;
            
            console.log(`Follower: equity=$${vaultEquity.toFixed(2)}, pnl=$${unrealizedPnl.toFixed(2)}, initial=$${initialDeposit.toFixed(2)}`);
        });
    }
    
    // Calculate trading return: Total Unrealized PnL / Total Initial Deposits
    let tradingReturn = 0;
    if (totalInitialDeposit > 0) {
        tradingReturn = (totalUnrealizedPnl / totalInitialDeposit) * 100;
    }
    
    // Calculate days active
    const now = new Date();
    const daysActive = Math.floor((now - VAULT_START_DATE) / (1000 * 60 * 60 * 24));
    
    console.log(`Trading Stats: Initial Deposit = $${totalInitialDeposit.toFixed(2)}, Unrealized PnL = $${totalUnrealizedPnl.toFixed(2)}, Return = ${tradingReturn.toFixed(2)}%, Days = ${daysActive}`);
    
    // Store globally for investment calculator
    window.tradingReturnPct = tradingReturn;
    window.daysActive = daysActive;
    
    // Update trading return display
    const totalReturnElement = document.getElementById('total-return');
    if (totalReturnElement) {
        const sign = tradingReturn >= 0 ? '+' : '';
        totalReturnElement.innerHTML = `${sign}${tradingReturn.toFixed(2)}%`;
        totalReturnElement.style.color = tradingReturn >= 0 ? 'var(--accent)' : '#ff6b6b';
    }
    
    // Update days active
    const daysActiveElement = document.getElementById('days-active');
    if (daysActiveElement) {
        daysActiveElement.innerHTML = daysActive;
    }
    
    // Update investment calculator with new trading return
    updateInvestmentCalculator();
}

function updateAPRDisplay(aprPercentage, vaultName) {
    // Update APR display if element exists
    const aprElement = document.getElementById('vault-apr');
    if (aprElement) {
        aprElement.innerHTML = `${aprPercentage}%`;
    }
    
    // Update vault name if element exists
    const nameElement = document.getElementById('vault-name');
    if (nameElement) {
        nameElement.innerHTML = vaultName;
    }
}

function updateInvestmentCalculator() {
    // Fixed investment amount of $1000
    const investmentAmount = 1000;
    
    // Use trading return stored from updateTradingStats
    const totalReturnPct = window.tradingReturnPct || 0;
    const totalDaysActive = window.daysActive || 70;
    
    if (totalReturnPct === 0) {
        return;
    }
    
    // Calculate daily return rate
    const dailyReturnPct = totalReturnPct / totalDaysActive;
    
    // Calculate return for the full period (since inception)
    const periodReturnPct = totalReturnPct;
    const periodProfit = investmentAmount * (periodReturnPct / 100);
    const totalValue = investmentAmount + periodProfit;
    
    // Calculate APY based on current performance
    const annualizedReturnPct = dailyReturnPct * 365;
    
    // Update days ago label (uses i18n if available)
    const daysAgoLabel = document.getElementById('days-ago-label');
    if (daysAgoLabel) {
        if (typeof t === 'function') {
            daysAgoLabel.textContent = `${t('calc.since')} (${totalDaysActive} ${t('calc.days_ago')})`;
        } else {
            daysAgoLabel.textContent = `Since vault inception on October 1st 2025 (${totalDaysActive} days ago)`;
        }
    }
    
    // Update main result display (profit only)
    const profitDisplay = document.getElementById('profit-display');
    const profitPctDisplay = document.getElementById('profit-pct-display');
    
    if (profitDisplay) {
        const sign = periodProfit >= 0 ? '+' : '';
        profitDisplay.textContent = `${sign}$${periodProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        profitDisplay.style.color = periodProfit >= 0 ? 'var(--accent)' : '#f87171';
    }
    
    if (profitPctDisplay) {
        const sign = periodReturnPct >= 0 ? '+' : '';
        profitPctDisplay.textContent = `(${sign}${periodReturnPct.toFixed(2)}% return)`;
    }
    
    // Update monthly rate display
    const monthlyRateDisplay = document.getElementById('monthly-rate-display');
    if (monthlyRateDisplay) {
        const monthlyRate = dailyReturnPct * 30;
        const monthLabel = (typeof t === 'function') ? t('calc.month') : '/month';
        monthlyRateDisplay.textContent = `~${monthlyRate.toFixed(1)}%${monthLabel}`;
    }
    
    // Calculate comparison returns for table
    const bankAPY = 0.04; // 4% annual
    const sp500APY = 0.10; // 10% annual
    const monthlyReturnPct = dailyReturnPct * 30;
    
    // Calculate profits for each time period
    // Bank: 4% APY
    const bank1m = investmentAmount * (bankAPY / 12);
    const bank6m = investmentAmount * (bankAPY / 2);
    const bank1y = investmentAmount * bankAPY;
    
    // S&P 500: 10% APY
    const sp5001m = investmentAmount * (sp500APY / 12);
    const sp5006m = investmentAmount * (sp500APY / 2);
    const sp5001y = investmentAmount * sp500APY;
    
    // Vice Algos: based on actual monthly rate
    const vice1m = investmentAmount * (monthlyReturnPct / 100);
    const vice6m = investmentAmount * ((monthlyReturnPct * 6) / 100);
    const vice1y = investmentAmount * ((monthlyReturnPct * 12) / 100);
    
    // Helper function to format currency
    const formatProfit = (val) => `+$${val.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    
    // Update table cells - Bank (grey)
    const bank1mEl = document.getElementById('bank-1m');
    const bank6mEl = document.getElementById('bank-6m');
    const bank1yEl = document.getElementById('bank-1y');
    if (bank1mEl) bank1mEl.textContent = formatProfit(bank1m);
    if (bank6mEl) bank6mEl.textContent = formatProfit(bank6m);
    if (bank1yEl) bank1yEl.textContent = formatProfit(bank1y);
    
    // Update table cells - S&P 500 (yellow)
    const sp5001mEl = document.getElementById('sp500-1m');
    const sp5006mEl = document.getElementById('sp500-6m');
    const sp5001yEl = document.getElementById('sp500-1y');
    if (sp5001mEl) sp5001mEl.textContent = formatProfit(sp5001m);
    if (sp5006mEl) sp5006mEl.textContent = formatProfit(sp5006m);
    if (sp5001yEl) sp5001yEl.textContent = formatProfit(sp5001y);
    
    // Update table cells - Vice Algos (green)
    const vice1mEl = document.getElementById('vice-1m');
    const vice6mEl = document.getElementById('vice-6m');
    const vice1yEl = document.getElementById('vice-1y');
    if (vice1mEl) vice1mEl.textContent = formatProfit(vice1m);
    if (vice6mEl) vice6mEl.textContent = formatProfit(vice6m);
    if (vice1yEl) vice1yEl.textContent = formatProfit(vice1y);
}

function displayError(message) {
    const aprElement = document.getElementById('vault-apr');
    if (aprElement) {
        aprElement.innerHTML = `<span style="color: var(--error);">${message}</span>`;
    }
    
    const calculatorElement = document.getElementById('investment-calculator');
    if (calculatorElement) {
        calculatorElement.innerHTML = `<p style="color: var(--error);">${message}</p>`;
    }
    
    const aprNote = document.getElementById('apr-note');
    if (aprNote) {
        aprNote.innerHTML = message;
    }
}

// Set up interactive calculator (simplified - no sliders)
function setupCalculator() {
    // Calculator now uses fixed $1000 and full period since inception
    // No interactive elements needed
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupCalculator();
    fetchVaultAPR();
});
