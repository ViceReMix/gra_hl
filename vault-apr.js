// Vault APR Calculator for HyperLiquid Vault
let currentAPR = 0;

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
        
        if (data && data.apr !== undefined) {
            const aprDecimal = data.apr;
            currentAPR = aprDecimal;
            const aprPercentage = (aprDecimal * 100).toFixed(2);
            
            // Update the APR display
            updateAPRDisplay(aprPercentage, data.name || "Vice Algos Vault");
            
            // Calculate investment example
            updateInvestmentCalculator();
            
        } else {
            console.error('Vault data not found or APR missing:', data);
            displayError("Unable to fetch vault APR data");
        }
        
    } catch (error) {
        console.error('Error fetching vault APR:', error);
        displayError("Failed to fetch vault data");
    }
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
    
    if (currentAPR === 0) {
        // APR not loaded yet
        return;
    }
    
    const annualReturn = investmentAmount * currentAPR;
    const monthlyReturn = annualReturn / 12;
    const dailyReturn = annualReturn / 365;
    
    // Update the display cards
    const dailyElement = document.getElementById('daily-return');
    const monthlyElement = document.getElementById('monthly-return');
    const annualElement = document.getElementById('annual-return');
    const aprNote = document.getElementById('apr-note');
    
    if (dailyElement) dailyElement.innerHTML = `$${dailyReturn.toFixed(2)}`;
    if (monthlyElement) monthlyElement.innerHTML = `$${monthlyReturn.toFixed(2)}`;
    if (annualElement) annualElement.innerHTML = `$${annualReturn.toFixed(2)}`;
    if (aprNote) aprNote.innerHTML = `Based on current APR of ${(currentAPR * 100).toFixed(2)}%`;
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
