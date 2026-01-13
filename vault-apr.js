// Vault APR Calculator for HyperLiquid Vault
let currentAPR = 0;
let vaultData = null;

// Vault start date
const VAULT_START_DATE = new Date('2025-10-01');

// BTC reference price for the alpha comparison
const BTC_START_PRICE_USD = 114000;

async function fetchBtcPriceNow() {
    const resp = await fetch('https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT', {
        method: 'GET'
    });
    if (!resp.ok) {
        throw new Error(`Binance HTTP error! status: ${resp.status}`);
    }
    const data = await resp.json();
    const price = Number(data && data.price);
    if (!Number.isFinite(price)) {
        throw new Error('Invalid BTC price response');
    }
    return price;
}

function fmtUsd(v) {
    if (!Number.isFinite(v)) return 'N/A';
    return `$${v.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function fmtPct(v) {
    if (!Number.isFinite(v)) return 'N/A';
    const sign = v >= 0 ? '+' : '';
    return `${sign}${v.toFixed(2)}%`;
}

async function updateAlphaSection() {
    const elBtcNow = document.getElementById('btc-price-now');
    const elBtcRet = document.getElementById('btc-return');
    const elVaultRet = document.getElementById('vault-return');
    const elAlpha = document.getElementById('alpha-excess');
    if (!elBtcNow || !elBtcRet || !elVaultRet || !elAlpha) return;

    const vaultRet = window.tradingReturnPct;
    elVaultRet.textContent = (typeof vaultRet === 'number' && Number.isFinite(vaultRet)) ? fmtPct(vaultRet) : 'N/A';

    try {
        const btcNow = await fetchBtcPriceNow();
        const btcRet = ((btcNow / BTC_START_PRICE_USD) - 1) * 100;
        const alpha = (typeof vaultRet === 'number' && Number.isFinite(vaultRet)) ? (vaultRet - btcRet) : NaN;

        elBtcNow.textContent = fmtUsd(btcNow);
        elBtcRet.textContent = fmtPct(btcRet);
        elAlpha.textContent = fmtPct(alpha);
        elAlpha.style.color = Number.isFinite(alpha) && alpha >= 0 ? '' : '#ff6b6b';
    } catch (e) {
        console.error('Error updating BTC alpha section:', e);
        elBtcNow.textContent = 'N/A';
        elBtcRet.textContent = 'N/A';
        elAlpha.textContent = 'N/A';
        elAlpha.style.color = 'var(--text-secondary)';
    }
}

window.updateAlphaSection = updateAlphaSection;

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
        
        if (data) {
            const aprDecimal = data.apr;
            currentAPR = typeof aprDecimal === 'number' ? aprDecimal : 0;

            updateAPRDisplay(null, data.name || "Vice Algos Vault");
            
            // Update vault capital display
            updateVaultCapital(data);
            
            // Update trading return and days active
            updateTradingStats(data);
            
        } else {
            console.error('Vault data not found:', data);
            displayError("Unable to fetch vault data");
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
    const getLegacyFollowerReturnPct = (vaultDetails) => {
        let totalInitialDeposit = 0;
        let totalUnrealizedPnl = 0;

        if (vaultDetails.followers && vaultDetails.followers.length > 0) {
            vaultDetails.followers.forEach(follower => {
                const vaultEquity = parseFloat(follower.vaultEquity || 0);
                const unrealizedPnl = parseFloat(follower.pnl || 0);
                const initialDeposit = vaultEquity - unrealizedPnl;

                totalInitialDeposit += initialDeposit;
                totalUnrealizedPnl += unrealizedPnl;
            });
        }

        if (totalInitialDeposit <= 0) return 0;
        return (totalUnrealizedPnl / totalInitialDeposit) * 100;
    };

    const getPortfolioSeries = (vaultDetails, windowLabel = 'allTime') => {
        const portfolio = vaultDetails && vaultDetails.portfolio;
        if (!Array.isArray(portfolio)) return null;

        const entry = portfolio.find(([label]) => label === windowLabel);
        if (!entry || !entry[1]) return null;

        const accountValueHistory = Array.isArray(entry[1].accountValueHistory)
            ? entry[1].accountValueHistory
            : null;
        const pnlHistory = Array.isArray(entry[1].pnlHistory)
            ? entry[1].pnlHistory
            : null;

        if (!accountValueHistory || accountValueHistory.length < 2) return null;

        const toPoints = (arr) => arr
            .map((pair) => ({
                ts: pair && pair.length > 0 ? Number(pair[0]) : NaN,
                value: pair && pair.length > 1 ? Number(pair[1]) : NaN
            }))
            .filter((p) => Number.isFinite(p.ts) && Number.isFinite(p.value))
            .sort((a, b) => a.ts - b.ts);

        return {
            accountValue: toPoints(accountValueHistory),
            pnl: pnlHistory ? toPoints(pnlHistory) : null
        };
    };

    const trimSeriesToFirstPositiveCapital = (series) => {
        if (!series || !Array.isArray(series.accountValue) || series.accountValue.length < 2) return null;
        if (!Array.isArray(series.pnl) || series.pnl.length < 2) {
            const idx = series.accountValue.findIndex((p) => Number.isFinite(p.value) && p.value > 0);
            if (idx <= 0) return series;
            return { ...series, accountValue: series.accountValue.slice(idx) };
        }

        const pnlSorted = [...series.pnl].sort((a, b) => a.ts - b.ts);
        const maxDeltaMs = 15 * 60 * 1000;
        let j = 0;
        const netDepositsByAvIdx = new Array(series.accountValue.length).fill(null);

        for (let i = 0; i < series.accountValue.length; i += 1) {
            const av = series.accountValue[i];
            if (!Number.isFinite(av.ts) || !Number.isFinite(av.value)) continue;

            while (j + 1 < pnlSorted.length && pnlSorted[j + 1].ts <= av.ts) {
                j += 1;
            }

            const candidates = [];
            if (j >= 0 && j < pnlSorted.length) candidates.push(pnlSorted[j]);
            if (j + 1 < pnlSorted.length) candidates.push(pnlSorted[j + 1]);

            let best = null;
            let bestDelta = Infinity;
            candidates.forEach((c) => {
                const d = Math.abs(c.ts - av.ts);
                if (d < bestDelta) {
                    bestDelta = d;
                    best = c;
                }
            });

            if (!best || !(bestDelta <= maxDeltaMs)) continue;
            if (!Number.isFinite(best.value)) continue;

            netDepositsByAvIdx[i] = av.value - best.value;
        }

        const idx = series.accountValue.findIndex((p, i) => {
            const vOk = Number.isFinite(p.value) && p.value > 0;
            const nd = netDepositsByAvIdx[i];
            const ndOk = Number.isFinite(nd) ? nd > 0 : true;
            return vOk && ndOk;
        });

        if (idx <= 0) return series;
        return { ...series, accountValue: series.accountValue.slice(idx) };
    };

    const computeFlowAdjustedTwrPct = (series) => {
        if (!series || !Array.isArray(series.accountValue) || series.accountValue.length < 2) return null;
        if (!Array.isArray(series.pnl) || series.pnl.length < 2) return null;

        const pnlSorted = [...series.pnl].sort((a, b) => a.ts - b.ts);
        const maxDeltaMs = 15 * 60 * 1000;
        let j = 0;
        const points = [];

        for (let i = 0; i < series.accountValue.length; i += 1) {
            const av = series.accountValue[i];
            if (!Number.isFinite(av.ts) || !Number.isFinite(av.value)) continue;

            while (j + 1 < pnlSorted.length && pnlSorted[j + 1].ts <= av.ts) {
                j += 1;
            }

            const candidates = [];
            if (j >= 0 && j < pnlSorted.length) candidates.push(pnlSorted[j]);
            if (j + 1 < pnlSorted.length) candidates.push(pnlSorted[j + 1]);

            let best = null;
            let bestDelta = Infinity;
            candidates.forEach((c) => {
                const d = Math.abs(c.ts - av.ts);
                if (d < bestDelta) {
                    bestDelta = d;
                    best = c;
                }
            });

            if (!best || !(bestDelta <= maxDeltaMs)) continue;
            if (!Number.isFinite(best.value)) continue;

            points.push({ v: av.value, pnl: best.value });
        }

        if (points.length < 2) return null;

        const nd = points.map((p) => ({ v: p.v, netDeposits: p.v - p.pnl }));

        let growth = 1;
        for (let i = 1; i < nd.length; i += 1) {
            const prevV = nd[i - 1].v;
            if (!(prevV > 0)) continue;

            const flow = nd[i].netDeposits - nd[i - 1].netDeposits;
            const adjEnd = nd[i].v - flow;
            const r = (adjEnd / prevV) - 1;
            if (!Number.isFinite(r)) continue;

            growth *= (1 + r);
        }

        return (growth - 1) * 100;
    };

    const seriesAllTime = getPortfolioSeries(data, 'allTime');
    const seriesSinceDeposit = trimSeriesToFirstPositiveCapital(seriesAllTime);
    const tradingReturnFromPortfolio = computeFlowAdjustedTwrPct(seriesSinceDeposit);
    const tradingReturn = tradingReturnFromPortfolio;

    const seriesMonth = getPortfolioSeries(data, 'month');
    const monthReturnFromPortfolio = computeFlowAdjustedTwrPct(seriesMonth);

    // Calculate days active
    const now = new Date();
    const daysActive = Math.floor((now - VAULT_START_DATE) / (1000 * 60 * 60 * 24));
    
    if (typeof tradingReturn === 'number' && Number.isFinite(tradingReturn)) {
        console.log(`Trading Stats: Return = ${tradingReturn.toFixed(2)}%, Days = ${daysActive}`);
    } else {
        console.log(`Trading Stats: Return unavailable (missing portfolio history), Days = ${daysActive}`);
    }
    
    // Store globally for investment calculator
    window.tradingReturnPct = typeof tradingReturn === 'number' && Number.isFinite(tradingReturn)
        ? tradingReturn
        : null;
    window.daysActive = daysActive;
    window.monthReturnPctLast30d = monthReturnFromPortfolio;
    window.avgMonthlyReturnPct = daysActive > 0
        && typeof tradingReturn === 'number'
        && Number.isFinite(tradingReturn)
        ? (tradingReturn / daysActive) * 30
        : null;

    const projectedAprPct = typeof window.avgMonthlyReturnPct === 'number'
        && Number.isFinite(window.avgMonthlyReturnPct)
        ? window.avgMonthlyReturnPct * 12
        : null;

    window.projectedAprPct = projectedAprPct;

    if (typeof projectedAprPct === 'number' && Number.isFinite(projectedAprPct)) {
        updateAPRDisplay(projectedAprPct.toFixed(2), data.name || "Vice Algos Vault");
    } else {
        updateAPRDisplay(null, data.name || "Vice Algos Vault");
    }
    
    // Update trading return display
    const totalReturnElement = document.getElementById('total-return');
    if (totalReturnElement) {
        if (typeof tradingReturn === 'number' && Number.isFinite(tradingReturn)) {
            const sign = tradingReturn >= 0 ? '+' : '';
            totalReturnElement.innerHTML = `${sign}${tradingReturn.toFixed(2)}%`;
            if (tradingReturn >= 0) {
                totalReturnElement.style.color = '';
            } else {
                totalReturnElement.style.color = '#ff6b6b';
            }
        } else {
            totalReturnElement.innerHTML = 'N/A';
            totalReturnElement.style.color = 'var(--text-secondary)';

            const subtitleEl = document.getElementById('trading-return-subtitle');
            if (subtitleEl) {
                subtitleEl.textContent = (typeof t === 'function')
                    ? t('stats.return.unavailable')
                    : 'Portfolio history unavailable';
            }
        }
    }

    if (typeof window.updateTradingReturnSubtitle === 'function') {
        window.updateTradingReturnSubtitle();
    }

    updateAvgMonthlyCard();

    updateAlphaSection();
    
    // Update days active
    const daysActiveElement = document.getElementById('days-active');
    if (daysActiveElement) {
        daysActiveElement.innerHTML = daysActive;
    }
    
    // Update investment calculator with new trading return
    
}

window.updateTradingReturnSubtitle = function updateTradingReturnSubtitle() {
    const subtitleEl = document.getElementById('trading-return-subtitle');
    if (!subtitleEl) return;

    const totalReturnPct = window.tradingReturnPct;
    if (typeof totalReturnPct === 'number' && Number.isFinite(totalReturnPct)) {
        subtitleEl.textContent = (typeof t === 'function')
            ? t('stats.days.since')
            : 'Since Oct 1, 2025';
        return;
    }

    subtitleEl.textContent = (typeof t === 'function')
        ? t('stats.return.unavailable')
        : 'Portfolio history unavailable';
};

function updateAvgMonthlyCard() {
    const avgEl = document.getElementById('avg-monthly-return');
    const subEl = document.getElementById('last-30d-subtitle');
    if (!avgEl || !subEl) return;

    const avgMo = window.avgMonthlyReturnPct;
    const last30d = window.monthReturnPctLast30d;

    if (typeof avgMo === 'number' && Number.isFinite(avgMo)) {
        const sign = avgMo >= 0 ? '+' : '';
        avgEl.textContent = `${sign}${avgMo.toFixed(2)}%`;
        avgEl.style.color = '';
    } else {
        avgEl.textContent = 'N/A';
        avgEl.style.color = 'var(--text-secondary)';
    }

    const last30dLabel = (typeof t === 'function') ? t('stats.return.last_30d') : 'last 30d';
    if (typeof last30d === 'number' && Number.isFinite(last30d)) {
        subEl.textContent = `~${last30d.toFixed(1)}% ${last30dLabel}`;
    } else {
        subEl.textContent = (typeof t === 'function')
            ? t('stats.return.unavailable')
            : 'Portfolio history unavailable';
    }
}

window.updateAvgMonthlyCard = updateAvgMonthlyCard;

function updateAPRDisplay(aprPercentage, vaultName) {
    // Update APR display if element exists
    const aprElement = document.getElementById('vault-apr');
    if (aprElement) {
        if (typeof aprPercentage === 'string' && aprPercentage.length > 0) {
            aprElement.innerHTML = `${aprPercentage}%`;
        } else {
            aprElement.innerHTML = 'N/A';
        }
    }
    
    // Update vault name if element exists
    const nameElement = document.getElementById('vault-name');
    if (nameElement) {
        nameElement.innerHTML = vaultName;
    }

    const aprNote = document.getElementById('apr-note-text');
    if (aprNote) {
        aprNote.textContent = (typeof aprPercentage === 'string' && aprPercentage.length > 0)
            ? ((typeof t === 'function') ? t('stats.apr.note.projected') : 'Projected from avg/mo')
            : ((typeof t === 'function') ? t('stats.apr.note.unavailable') : 'Projection unavailable');
    }
}

function displayError(message) {
    const aprElement = document.getElementById('vault-apr');
    if (aprElement) {
        aprElement.innerHTML = `<span style="color: var(--error);">${message}</span>`;
    }
}

// Initialize everything when page loads
document.addEventListener('DOMContentLoaded', function() {
    fetchVaultAPR();
});
