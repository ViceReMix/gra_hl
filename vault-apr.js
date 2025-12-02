// Vault APR Calculator for HyperLiquid Vault
let currentAPR = 0;
let vaultData = null;

// Vault start date and initial capital
const VAULT_START_DATE = new Date('2025-10-01');
const VAULT_INITIAL_CAPITAL = 1000;

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
    // Find allTime portfolio data to get the last PnL value
    let allTimeData = null;
    if (data.portfolio) {
        for (const [period, periodData] of data.portfolio) {
            if (period === 'allTime') {
                allTimeData = periodData;
                break;
            }
        }
    }
    
    // Get the last pnlHistory value - this is the cumulative unrealized PnL
    let totalPnL = 0;
    if (allTimeData && allTimeData.pnlHistory && allTimeData.pnlHistory.length > 0) {
        // The last value in pnlHistory is the current cumulative PnL
        const lastPnLEntry = allTimeData.pnlHistory[allTimeData.pnlHistory.length - 1];
        totalPnL = parseFloat(lastPnLEntry[1]);
    }
    
    // Calculate trading return: PnL / Initial Capital
    const tradingReturn = (totalPnL / VAULT_INITIAL_CAPITAL) * 100;
    
    // Calculate days active
    const now = new Date();
    const daysActive = Math.floor((now - VAULT_START_DATE) / (1000 * 60 * 60 * 24));
    
    console.log(`Trading Stats: PnL = $${totalPnL.toFixed(2)}, Return = ${tradingReturn.toFixed(2)}%, Days = ${daysActive}`);
    
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
    const investmentInput = document.getElementById('investment-input');
    const investmentAmount = parseFloat(investmentInput.value) || 1000;
    
    // Use trading return stored from updateTradingStats
    const tradingReturnPct = window.tradingReturnPct || 0;
    const daysActive = window.daysActive || 62;
    
    if (tradingReturnPct === 0) {
        // Trading return not loaded yet
        return;
    }
    
    // Calculate monthly rate based on actual performance
    // tradingReturnPct is the return over daysActive days
    // Monthly rate = (tradingReturnPct / daysActive) * 30
    const monthlyReturnPct = (tradingReturnPct / daysActive) * 30;
    
    // Calculate projected returns
    const oneMonthReturn = investmentAmount * (monthlyReturnPct / 100);
    const sixMonthReturn = investmentAmount * (monthlyReturnPct * 6 / 100);
    const oneYearReturn = investmentAmount * (monthlyReturnPct * 12 / 100);
    
    // Update the display cards
    const monthlyElement = document.getElementById('monthly-return');
    const sixMonthElement = document.getElementById('sixmonth-return');
    const annualElement = document.getElementById('annual-return');
    const aprNote = document.getElementById('apr-note');
    
    if (monthlyElement) monthlyElement.innerHTML = `$${oneMonthReturn.toFixed(2)}`;
    if (sixMonthElement) sixMonthElement.innerHTML = `$${sixMonthReturn.toFixed(2)}`;
    if (annualElement) annualElement.innerHTML = `$${oneYearReturn.toFixed(2)}`;
    if (aprNote) aprNote.innerHTML = `Based on ${tradingReturnPct.toFixed(2)}% return over ${daysActive} days (~${monthlyReturnPct.toFixed(1)}%/month)`;
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

// Set up interactive calculator
function setupCalculator() {
    const investmentInput = document.getElementById('investment-input');
    if (investmentInput) {
        // Add input event listener for live updates
        investmentInput.addEventListener('input', updateInvestmentCalculator);
        
        // Add some styling enhancements on focus
        investmentInput.addEventListener('focus', function() {
            this.style.borderColor = 'var(--accent)';
            this.style.boxShadow = '0 0 10px rgba(67, 255, 175, 0.3)';
        });
        
        investmentInput.addEventListener('blur', function() {
            this.style.borderColor = 'var(--border-color)';
            this.style.boxShadow = 'none';
        });
        
        // Add keyboard navigation
        investmentInput.addEventListener('keydown', function(e) {
            if (e.key === 'ArrowUp') {
                e.preventDefault();
                this.value = Math.min(1000000, parseFloat(this.value) + 100);
                updateInvestmentCalculator();
            } else if (e.key === 'ArrowDown') {
                e.preventDefault();
                this.value = Math.max(1, parseFloat(this.value) - 100);
                updateInvestmentCalculator();
            }
        });
    }
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    setupCalculator();
    fetchVaultAPR();
});
