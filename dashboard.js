// Dashboard.js - Trading Performance Dashboard

// Fetch trading data
async function fetchTradingData() {
    try {
        const response = await fetch('data/trading_metrics.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        return data;
    } catch (error) {
        console.error('Error fetching trading data:', error);
        throw error;
    }
}

// Format numbers for display
function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) return '-';
    if (num === Infinity || num === 'Infinity') return '∞';
    if (num === -Infinity || num === '-Infinity') return '-∞';
    if (num >= 999999) return '∞'; // Display very large numbers as infinity
    if (num === 0) return '0';
    
    return Number(num).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// Format percentage
function formatPercent(num) {
    if (num === null || num === undefined || isNaN(num)) return '-';
    if (num === Infinity || num === 'Infinity') return '∞%';
    if (num === -Infinity || num === '-Infinity') return '-∞%';
    return `${formatNumber(num, 1)}%`;
}

// Format duration in hours to readable format
function formatDuration(hours) {
    // Always show plain hours (no days), with one decimal
    if (hours === null || hours === undefined || isNaN(hours)) return '-';
    return `${formatNumber(hours, 1)}h`;
}

// Add positive/negative class based on value
function addValueClass(element, value) {
    element.classList.remove('positive', 'negative');
    if (value > 0) {
        element.classList.add('positive');
    } else if (value < 0) {
        element.classList.add('negative');
    }
}

// Current filter state
let currentFilter = 'total';
let currentMetrics = null;
let pnlChart = null;
let riskRewardChart = null;
let pnlDistributionChart = null;
let durationDistributionChart = null;
let isInitialized = false;

// Update stat cards with trading metrics
function updateStatCards(metrics, filter = 'total') {
    // Update last updated timestamp
    const lastUpdated = document.getElementById('last-updated');
    if (lastUpdated) {
        lastUpdated.textContent = `Last updated: ${metrics.last_updated} UTC`;
    }
    
    // Get signals data based on filter
    const signalsData = metrics.strategies.Signals[filter];
    
    // Row 1: Win Rate / Total Trades / Avg Win / Avg Loss / Avg Position Size
    const winRate = document.getElementById('win-rate');
    if (winRate) {
        winRate.textContent = formatPercent(signalsData.win_rate);
        addValueClass(winRate, signalsData.win_rate - 50); // Above 50% is positive
    }
    
    const totalTrades = document.getElementById('total-trades');
    if (totalTrades) {
        totalTrades.textContent = signalsData.total_trades || '0';
    }
    
    const avgWin = document.getElementById('avg-win');
    if (avgWin) {
        avgWin.textContent = formatPercent(signalsData.avg_win);
        addValueClass(avgWin, signalsData.avg_win);
    }
    
    const avgLoss = document.getElementById('avg-loss');
    if (avgLoss) {
        if (signalsData.avg_loss === 0) {
            avgLoss.textContent = '0%';
        } else {
            avgLoss.textContent = formatPercent(signalsData.avg_loss);
        }
        // avg_loss is always negative or zero, so we don't add positive class
    }
    
    const avgPositionSize = document.getElementById('avg-position-size');
    if (avgPositionSize) {
        avgPositionSize.textContent = formatPercent(signalsData.avg_position_size_percent);
    }
    
    // Row 2: Avg Duration / Sharpe Ratio / Calmar Ratio / Max Profit / Max Drawdown
    const avgDuration = document.getElementById('avg-duration');
    if (avgDuration) {
        avgDuration.textContent = formatDuration(signalsData.avg_duration);
    }
    
    const sharpeRatio = document.getElementById('sharpe-ratio');
    if (sharpeRatio) {
        sharpeRatio.textContent = formatNumber(signalsData.sharpe_ratio);
        addValueClass(sharpeRatio, signalsData.sharpe_ratio - 1); // Above 1 is positive
    }
    
    const calmarRatio = document.getElementById('calmar-ratio');
    if (calmarRatio) {
        if (signalsData.calmar_ratio === 0) {
            calmarRatio.textContent = '0';
        } else {
            calmarRatio.textContent = formatNumber(signalsData.calmar_ratio);
            addValueClass(calmarRatio, signalsData.calmar_ratio);
        }
    }
    
    const maxProfit = document.getElementById('max-profit');
    if (maxProfit) {
        maxProfit.textContent = formatPercent(signalsData.max_profit);
        addValueClass(maxProfit, signalsData.max_profit);
    }
    
    const maxDrawdown = document.getElementById('max-drawdown');
    if (maxDrawdown) {
        if (signalsData.max_drawdown === 0) {
            maxDrawdown.textContent = '0%';
        } else {
            maxDrawdown.textContent = formatPercent(signalsData.max_drawdown);
        }
        // max_drawdown is always negative or zero for losses
    }
    
    // Row 3: Max Consecutive Wins / Max Consecutive Loss / Kelly Criterion / Return Means / Returns Skew
    const maxConsecutiveWins = document.getElementById('max-consecutive-wins');
    if (maxConsecutiveWins) {
        maxConsecutiveWins.textContent = signalsData.max_consecutive_wins || '0';
        addValueClass(maxConsecutiveWins, signalsData.max_consecutive_wins);
    }
    
    const maxConsecutiveLosses = document.getElementById('max-consecutive-losses');
    if (maxConsecutiveLosses) {
        maxConsecutiveLosses.textContent = signalsData.max_consecutive_losses || '0';
    }
    
    const kellyCriterion = document.getElementById('kelly-criterion');
    if (kellyCriterion) {
        if (signalsData.kelly_criterion === 0) {
            kellyCriterion.textContent = '0%';
        } else {
            kellyCriterion.textContent = formatPercent(signalsData.kelly_criterion);
            addValueClass(kellyCriterion, signalsData.kelly_criterion);
        }
    }
    
    const returnMeans = document.getElementById('return-means');
    if (returnMeans) {
        returnMeans.textContent = formatPercent(signalsData.returns_mean);
        addValueClass(returnMeans, signalsData.returns_mean);
    }
    
    const returnsSkew = document.getElementById('returns-skew');
    if (returnsSkew) {
        returnsSkew.textContent = formatNumber(signalsData.returns_skew);
        addValueClass(returnsSkew, signalsData.returns_skew);
    }

    // Equity-Weighted Return (decimal in data -> convert to percentage)
    const eqWeighted = document.getElementById('equity-weighted-return');
    if (eqWeighted && typeof signalsData.equity_weighted_return === 'number') {
        eqWeighted.textContent = formatPercent(signalsData.equity_weighted_return * 100);
        addValueClass(eqWeighted, signalsData.equity_weighted_return);
    }
}

// Process individual trades data to create cumulative PnL timeline
function processTradesForChart(individualTrades) {
    if (!individualTrades || individualTrades.length === 0) {
        return { labels: [], data: [] };
    }
    
    // Sort trades by timestamp
    const sortedTrades = [...individualTrades].sort((a, b) => 
        new Date(a.timestamp_exit) - new Date(b.timestamp_exit)
    );
    
    const labels = [];
    const data = [];
    let cumulativeEquityGrowth = 0;
    
    // Add starting point (0% one day before first trade)
    const firstTradeDate = new Date(sortedTrades[0].timestamp_exit);
    const startDate = new Date(firstTradeDate);
    startDate.setDate(startDate.getDate() - 1);
    
    // Format date in European style (DD/MM/YYYY)
    labels.push(startDate.toLocaleDateString('en-GB'));
    data.push(0);
    
    // Process each trade
    sortedTrades.forEach(trade => {
        // Calculate accurate equity growth: pnl_percentage * position_size_percent_equity
        const equityImpact = (trade.pnl_percentage * trade.position_size_percent_equity) / 100;
        cumulativeEquityGrowth += equityImpact;
        
        const tradeDate = new Date(trade.timestamp_exit);
        
        // Format date in European style (DD/MM/YYYY)
        labels.push(tradeDate.toLocaleDateString('en-GB'));
        data.push(cumulativeEquityGrowth);
    });
    
    return { labels, data };
}

// Create PnL progression chart
function createPnLChart(individualTrades) {
    const ctx = document.getElementById('pnl-chart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (pnlChart) {
        pnlChart.destroy();
        pnlChart = null;
    }
    
    const chartData = processTradesForChart(individualTrades);
    
    pnlChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartData.labels,
            datasets: [{
                label: 'Cumulative Equity Growth %',
                data: chartData.data,
                borderColor: '#4ade80',
                backgroundColor: 'rgba(74, 222, 128, 0.1)',
                borderWidth: 2,
                fill: true,
                tension: 0.1,
                pointBackgroundColor: '#4ade80',
                pointBorderColor: '#4ade80',
                pointRadius: 4,
                pointHoverRadius: 6
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
                legend: {
                    labels: {
                        color: '#fde2f3'
                    }
                }
            },
            scales: {
                x: {
                    ticks: {
                        color: '#fde2f3'
                    },
                    grid: {
                        color: 'rgba(253, 226, 243, 0.1)'
                    }
                },
                y: {
                    ticks: {
                        color: '#fde2f3',
                        callback: function(value) {
                            return value.toFixed(2) + '%';
                        },
                        stepSize: 0.05,  // 0.05% intervals for better granularity
                        maxTicksLimit: 8  // Limit number of ticks to avoid overcrowding
                    },
                    grid: {
                        color: 'rgba(253, 226, 243, 0.1)'
                    },
                    beginAtZero: true,
                    suggestedMin: 0,
                    suggestedMax: function(context) {
                        // Dynamic max based on data with some padding
                        const maxValue = Math.max(...context.chart.data.datasets[0].data);
                        return Math.ceil(maxValue * 1.2 * 20) / 20; // Round up to nearest 0.05%
                    }
                }
            },
            elements: {
                point: {
                    hoverBackgroundColor: '#4ade80'
                }
            }
        }
    });
}

// Create Risk/Reward scatter plot chart
function createRiskRewardChart(individualTrades) {
    const ctx = document.getElementById('risk-reward-chart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (riskRewardChart) {
        riskRewardChart.destroy();
        riskRewardChart = null;
    }
    
    if (!individualTrades || individualTrades.length === 0) {
        return;
    }
    
    // Prepare data for scatter plot
    const longTrades = [];
    const shortTrades = [];
    
    individualTrades.forEach(trade => {
        const dataPoint = {
            x: trade.min_pnl, // MAE (Maximum Adverse Excursion)
            y: trade.max_pnl, // MFE (Maximum Favorable Excursion)
            pnl: trade.pnl_percentage,
            symbol: trade.symbol,
            trade_id: trade.trade_id,
            side: trade.position_side
        };
        
        if (trade.position_side === 'LONG') {
            longTrades.push(dataPoint);
        } else {
            shortTrades.push(dataPoint);
        }
    });
    
    // Create datasets
    const datasets = [];
    
    // Long positions dataset
    if (longTrades.length > 0) {
        datasets.push({
            label: 'Long Positions',
            data: longTrades,
            backgroundColor: longTrades.map(trade => {
                // Color based on final PnL: red to green scale
                if (trade.pnl <= -5) return '#dc2626'; // Dark red
                if (trade.pnl <= -2.5) return '#f87171'; // Light red
                if (trade.pnl < 0) return '#fca5a5'; // Very light red
                if (trade.pnl === 0) return '#6b7280'; // Gray
                if (trade.pnl <= 2.5) return '#86efac'; // Light green
                if (trade.pnl <= 5) return '#4ade80'; // Green
                return '#16a34a'; // Dark green
            }),
            borderColor: '#374151',
            borderWidth: 1,
            pointRadius: 8,
            pointHoverRadius: 10
        });
    }
    
    // Short positions dataset
    if (shortTrades.length > 0) {
        datasets.push({
            label: 'Short Positions',
            data: shortTrades,
            backgroundColor: shortTrades.map(trade => {
                // Color based on final PnL: red to green scale
                if (trade.pnl <= -5) return '#dc2626'; // Dark red
                if (trade.pnl <= -2.5) return '#f87171'; // Light red
                if (trade.pnl < 0) return '#fca5a5'; // Very light red
                if (trade.pnl === 0) return '#6b7280'; // Gray
                if (trade.pnl <= 2.5) return '#86efac'; // Light green
                if (trade.pnl <= 5) return '#4ade80'; // Green
                return '#16a34a'; // Dark green
            }),
            borderColor: '#374151',
            borderWidth: 1,
            pointRadius: 8,
            pointHoverRadius: 10,
            pointStyle: 'triangle'
        });
    }
    
    // Calculate axis ranges with padding
    const allTrades = [...longTrades, ...shortTrades];
    const minX = Math.min(...allTrades.map(t => t.x)) * 1.1;
    const maxY = Math.max(...allTrades.map(t => t.y)) * 1.1;
    
    riskRewardChart = new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const trade = context.raw;
                            return [
                                `Trade ID: ${trade.trade_id}`,
                                `Side: ${trade.side}`,
                                `Max Profit: ${trade.y.toFixed(2)}%`,
                                `Max Drawdown: ${trade.x.toFixed(2)}%`,
                                `Final PnL: ${trade.pnl.toFixed(2)}%`
                            ];
                        }
                    }
                }
            },
            scales: {
                x: {
                    type: 'linear',
                    position: 'bottom',
                    title: {
                        display: true,
                        text: 'Maximum Drawdown (%)',
                        color: '#fde2f3'
                    },
                    ticks: {
                        color: '#fde2f3'
                    },
                    grid: {
                        color: 'rgba(253, 226, 243, 0.1)'
                    },
                    min: minX,
                    max: 0
                },
                y: {
                    title: {
                        display: true,
                        text: 'Maximum Profit (%)',
                        color: '#fde2f3'
                    },
                    ticks: {
                        color: '#fde2f3'
                    },
                    grid: {
                        color: 'rgba(253, 226, 243, 0.1)'
                    },
                    min: 0,
                    max: maxY
                }
            }
        }
    });
}

// Create PnL Distribution histogram chart
function createPnLDistributionChart(individualTrades) {
    const ctx = document.getElementById('pnl-distribution-chart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (pnlDistributionChart) {
        pnlDistributionChart.destroy();
        pnlDistributionChart = null;
    }
    
    if (!individualTrades || individualTrades.length === 0) {
        return;
    }
    
    // Separate trades by position side
    const allTrades = individualTrades.map(trade => trade.pnl_percentage);
    const longTrades = individualTrades.filter(trade => trade.position_side === 'LONG').map(trade => trade.pnl_percentage);
    const shortTrades = individualTrades.filter(trade => trade.position_side === 'SHORT').map(trade => trade.pnl_percentage);
    
    // Calculate histogram bins with 0.1% granularity
    const minPnl = Math.min(...allTrades);
    const maxPnl = Math.max(...allTrades);
    const binSize = 0.1; // Fixed 0.1% bin size
    const numBins = Math.ceil((maxPnl - Math.floor(minPnl * 10) / 10) / binSize);
    const adjustedMinPnl = Math.floor(minPnl * 10) / 10; // Round down to nearest 0.1%
    
    // Debug: log the trades and bin info
    console.log('All trades PnL:', allTrades);
    console.log('Min PnL:', minPnl, 'Max PnL:', maxPnl, 'Bin size:', binSize);
    
    // Create bin labels and data
    const bins = [];
    const allTradesData = [];
    const longTradesData = [];
    const shortTradesData = [];
    
    for (let i = 0; i < numBins; i++) {
        const binStart = adjustedMinPnl + (i * binSize);
        const binEnd = adjustedMinPnl + ((i + 1) * binSize);
        bins.push(`${binStart.toFixed(1)}`);
        
        // Count trades in each bin (include binEnd for the last bin)
        const allCount = allTrades.filter(pnl => 
            i === (numBins - 1) ? (pnl >= binStart && pnl <= binEnd) : (pnl >= binStart && pnl < binEnd)
        ).length;
        const longCount = longTrades.filter(pnl => 
            i === (numBins - 1) ? (pnl >= binStart && pnl <= binEnd) : (pnl >= binStart && pnl < binEnd)
        ).length;
        const shortCount = shortTrades.filter(pnl => 
            i === (numBins - 1) ? (pnl >= binStart && pnl <= binEnd) : (pnl >= binStart && pnl < binEnd)
        ).length;
        
        // Debug: log bin info
        if (longCount > 0 || shortCount > 0) {
            console.log(`Bin ${i}: ${binStart.toFixed(2)} - ${binEnd.toFixed(2)}, Long: ${longCount}, Short: ${shortCount}`);
        }
        
        allTradesData.push(allCount);
        longTradesData.push(longCount);
        shortTradesData.push(shortCount);
    }
    
    // Calculate mean values
    const totalMean = allTrades.reduce((sum, pnl) => sum + pnl, 0) / allTrades.length;
    
    // Create datasets - only Long and Short trades
    const datasets = [];
    
    if (longTrades.length > 0) {
        datasets.push({
            label: 'Long Trades',
            data: longTradesData,
            backgroundColor: 'rgba(39, 174, 96, 0.7)',
            borderColor: '#27AE60',
            borderWidth: 1
        });
    }
    
    if (shortTrades.length > 0) {
        datasets.push({
            label: 'Short Trades',
            data: shortTradesData,
            backgroundColor: 'rgba(231, 76, 60, 0.7)',
            borderColor: '#E74C3C',
            borderWidth: 1
        });
    }
    
    pnlDistributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: bins,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#fde2f3'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y} trades`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'PnL %',
                        color: '#fde2f3'
                    },
                    ticks: {
                        color: '#fde2f3',
                        maxTicksLimit: 10
                    },
                    grid: {
                        color: 'rgba(253, 226, 243, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Number of Trades',
                        color: '#fde2f3'
                    },
                    ticks: {
                        color: '#fde2f3',
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(253, 226, 243, 0.1)'
                    }
                }
            }
        }
    });
}

// Create Duration Distribution histogram chart
function createDurationDistributionChart(individualTrades) {
    const ctx = document.getElementById('duration-distribution-chart');
    if (!ctx) return;
    
    // Destroy existing chart if it exists
    if (durationDistributionChart) {
        durationDistributionChart.destroy();
        durationDistributionChart = null;
    }
    
    if (!individualTrades || individualTrades.length === 0) {
        return;
    }
    
    // Separate trades by position side
    const allTrades = individualTrades.map(trade => trade.duration_hours);
    const longTrades = individualTrades.filter(trade => trade.position_side === 'LONG').map(trade => trade.duration_hours);
    const shortTrades = individualTrades.filter(trade => trade.position_side === 'SHORT').map(trade => trade.duration_hours);
    
    // Calculate histogram bins with 1-hour granularity
    const minDuration = Math.min(...allTrades);
    const maxDuration = Math.max(...allTrades);
    const binSize = 1; // Fixed 1-hour bin size
    const numBins = Math.ceil((maxDuration - Math.floor(minDuration)) / binSize);
    const adjustedMinDuration = Math.floor(minDuration); // Round down to nearest hour
    
    // Debug: log the trades and bin info
    console.log('All trades Duration:', allTrades);
    console.log('Min Duration:', minDuration, 'Max Duration:', maxDuration, 'Bin size:', binSize);
    
    // Create bin labels and data
    const bins = [];
    const allTradesData = [];
    const longTradesData = [];
    const shortTradesData = [];
    
    for (let i = 0; i < numBins; i++) {
        const binStart = adjustedMinDuration + (i * binSize);
        const binEnd = adjustedMinDuration + ((i + 1) * binSize);
        bins.push(`${binStart.toFixed(0)}`);
        
        // Count trades in each bin (include binEnd for the last bin)
        const allCount = allTrades.filter(duration => 
            i === (numBins - 1) ? (duration >= binStart && duration <= binEnd) : (duration >= binStart && duration < binEnd)
        ).length;
        const longCount = longTrades.filter(duration => 
            i === (numBins - 1) ? (duration >= binStart && duration <= binEnd) : (duration >= binStart && duration < binEnd)
        ).length;
        const shortCount = shortTrades.filter(duration => 
            i === (numBins - 1) ? (duration >= binStart && duration <= binEnd) : (duration >= binStart && duration < binEnd)
        ).length;
        
        // Debug: log bin info
        if (longCount > 0 || shortCount > 0) {
            console.log(`Duration Bin ${i}: ${binStart.toFixed(2)} - ${binEnd.toFixed(2)} hours, Long: ${longCount}, Short: ${shortCount}`);
        }
        
        allTradesData.push(allCount);
        longTradesData.push(longCount);
        shortTradesData.push(shortCount);
    }
    
    // Create datasets - only Long and Short trades
    const datasets = [];
    
    if (longTrades.length > 0) {
        datasets.push({
            label: 'Long Trades',
            data: longTradesData,
            backgroundColor: 'rgba(39, 174, 96, 0.7)',
            borderColor: '#27AE60',
            borderWidth: 1
        });
    }
    
    if (shortTrades.length > 0) {
        datasets.push({
            label: 'Short Trades',
            data: shortTradesData,
            backgroundColor: 'rgba(231, 76, 60, 0.7)',
            borderColor: '#E74C3C',
            borderWidth: 1
        });
    }
    
    durationDistributionChart = new Chart(ctx, {
        type: 'bar',
        data: {
            labels: bins,
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            animation: false,
            plugins: {
                legend: {
                    display: true,
                    position: 'top',
                    labels: {
                        color: '#fde2f3'
                    }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y} trades`;
                        }
                    }
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: 'Duration (Hours)',
                        color: '#fde2f3'
                    },
                    ticks: {
                        color: '#fde2f3',
                        maxTicksLimit: 10
                    },
                    grid: {
                        color: 'rgba(253, 226, 243, 0.1)'
                    }
                },
                y: {
                    title: {
                        display: true,
                        text: 'Number of Trades',
                        color: '#fde2f3'
                    },
                    ticks: {
                        color: '#fde2f3',
                        stepSize: 1
                    },
                    grid: {
                        color: 'rgba(253, 226, 243, 0.1)'
                    }
                }
            }
        }
    });
}

// Handle filter button clicks
function setupFilterButtons() {
    // Prevent multiple event listeners
    if (isInitialized) return;
    
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    filterButtons.forEach(button => {
        button.addEventListener('click', handleFilterClick);
    });
}

// Filter click handler (separate function to prevent memory leaks)
function handleFilterClick(event) {
    const button = event.target;
    const filterButtons = document.querySelectorAll('.filter-btn');
    
    // Remove active class from all buttons
    filterButtons.forEach(btn => btn.classList.remove('active'));
    
    // Add active class to clicked button
    button.classList.add('active');
    
    // Get filter value and update display
    const filter = button.getAttribute('data-filter');
    currentFilter = filter;
    
    if (currentMetrics) {
        updateStatCards(currentMetrics, filter);
    }
}

// Destroy all charts
function destroyAllCharts() {
    if (pnlChart) {
        pnlChart.destroy();
        pnlChart = null;
    }
    if (riskRewardChart) {
        riskRewardChart.destroy();
        riskRewardChart = null;
    }
    if (pnlDistributionChart) {
        pnlDistributionChart.destroy();
        pnlDistributionChart = null;
    }
    if (durationDistributionChart) {
        durationDistributionChart.destroy();
        durationDistributionChart = null;
    }
}

// Initialize dashboard
async function initDashboard() {
    try {
        // Prevent multiple initializations
        if (isInitialized) {
            console.log('Dashboard already initialized, skipping...');
            return;
        }
        
        const data = await fetchTradingData();
        if (!data) {
            throw new Error('Failed to fetch trading data');
        }
        
        // Destroy any existing charts first
        destroyAllCharts();
        
        currentMetrics = data;
        updateStatCards(data, currentFilter);
        setupFilterButtons();
        
        // Create charts if individual trades data exists
        if (data.individual_trades && data.individual_trades.length > 0) {
            createPnLChart(data.individual_trades);
            createRiskRewardChart(data.individual_trades);
            createPnLDistributionChart(data.individual_trades);
            createDurationDistributionChart(data.individual_trades);
        }
        
        isInitialized = true;
        console.log('Dashboard initialized successfully');
        
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        document.body.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: var(--negative-color);">
                <h2>Error Loading Dashboard</h2>
                <p>${error.message || 'Unknown error occurred'}</p>
                <p>Please try again later or check the data source.</p>
            </div>
        `;
    }
}

// Start the dashboard when the page loads
document.addEventListener('DOMContentLoaded', function() {
    // Ensure we only initialize once
    if (!isInitialized) {
        initDashboard();
    }
});

// Clean up on page unload to prevent memory leaks
window.addEventListener('beforeunload', function() {
    destroyAllCharts();
});
