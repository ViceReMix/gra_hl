// Dashboard.js - Trading Performance Dashboard

// Fetch trading metrics data
async function fetchTradingData() {
    try {
        // For local testing, use relative path
        const response = await fetch('./data/trading_metrics.json');
        if (!response.ok) {
            throw new Error('Failed to fetch trading data');
        }
        return await response.json();
    } catch (error) {
        console.error('Error fetching trading data:', error);
        document.body.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #f87171;">
                <h2>Error Loading Dashboard</h2>
                <p>${error.message}</p>
                <p>Please try again later or check the data source.</p>
            </div>
        `;
    }
}

// Handle special values like Infinity and NaN in JSON
function parseSpecialValues(obj) {
    if (typeof obj !== 'object' || obj === null) return obj;
    
    const result = Array.isArray(obj) ? [] : {};
    
    for (const key in obj) {
        if (obj[key] === 'Infinity' || obj[key] === Infinity) {
            result[key] = Infinity;
        } else if (obj[key] === 'NaN' || (typeof obj[key] === 'number' && isNaN(obj[key]))) {
            result[key] = NaN;
        } else if (typeof obj[key] === 'object' && obj[key] !== null) {
            result[key] = parseSpecialValues(obj[key]);
        } else {
            result[key] = obj[key];
        }
    }
    
    return result;
}

// Format numbers for display
function formatNumber(num, decimals = 2) {
    if (num === null || num === undefined || isNaN(num)) return '-';
    if (num === Infinity || num === 'Infinity') return '∞';
    if (num === 0) return '0';
    
    return Number(num).toLocaleString(undefined, {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// Format percentage
function formatPercent(num) {
    if (num === null || num === undefined || isNaN(num)) return '-';
    return `${formatNumber(num, 1)}%`; // Note: real data already has percentages
}

// Add positive/negative class based on value
function addValueClass(element, value) {
    if (value > 0) {
        element.classList.add('positive');
    } else if (value < 0) {
        element.classList.add('negative');
    }
}

// Update metrics display
function updateMetricsDisplay(metrics) {
    // Update last updated timestamp
    const lastUpdated = document.getElementById('last-updated');
    lastUpdated.textContent = `Last updated: ${metrics.last_updated}`;
    
    // Get signals data - we're using 'total' position type for main metrics
    const signalsData = metrics.strategies.Signals.total;
    
    // Update metrics
    const winRate = document.getElementById('win-rate');
    winRate.textContent = formatPercent(signalsData.win_rate);
    addValueClass(winRate, signalsData.win_rate - 50); // Above 50% is positive
    
    const totalTrades = document.getElementById('total-trades');
    totalTrades.textContent = signalsData.total_trades;
    
    const profitFactor = document.getElementById('profit-factor');
    profitFactor.textContent = formatNumber(signalsData.profit_factor);
    addValueClass(profitFactor, signalsData.profit_factor - 1); // Above 1 is positive
    
    const avgWin = document.getElementById('avg-win');
    avgWin.textContent = formatNumber(signalsData.avg_win);
    addValueClass(avgWin, signalsData.avg_win);
}

// Create Equity Curve chart
function createPnLChart(metrics) {
    const equityData = metrics.strategies.Signals.total.equity_curve_chart;
    
    if (!equityData || equityData.length === 0) {
        document.getElementById('pnl-chart').innerHTML = '<p class="no-data">No equity curve data available</p>';
        return;
    }
    
    // Prepare data for Plotly
    const x = equityData.map(point => point.timestamp);
    const y = equityData.map(point => point.equity_curve);
    
    // Create the trace
    const trace = {
        x: x,
        y: y,
        type: 'scatter',
        mode: 'lines+markers',
        name: 'Equity Curve',
        line: {
            color: '#4ade80',
            width: 2
        },
        marker: {
            size: 6,
            color: '#4ade80'
        },
        fill: 'tozeroy',
        fillcolor: 'rgba(74, 222, 128, 0.1)'
    };
    
    // Layout configuration
    const layout = {
        paper_bgcolor: 'rgba(0,0,0,0)',
        plot_bgcolor: 'rgba(0,0,0,0)',
        margin: { t: 10, r: 10, b: 40, l: 50 },
        xaxis: {
            title: 'Date',
            gridcolor: 'rgba(255,255,255,0.1)',
            tickfont: { color: '#fde2f3' }
        },
        yaxis: {
            title: 'Equity Curve (%)',
            gridcolor: 'rgba(255,255,255,0.1)',
            tickfont: { color: '#fde2f3' },
            ticksuffix: '%'
        },
        showlegend: false,
        hovermode: 'closest'
    };
    
    // Config options
    const config = {
        responsive: true,
        displayModeBar: false
    };
    
    // Create the chart
    Plotly.newPlot('pnl-chart', [trace], layout, config);
}

// Initialize dashboard
async function initDashboard() {
    try {
        const data = await fetchTradingData();
        if (!data) return;
        
        // Parse special values like Infinity and NaN
        const parsedData = parseSpecialValues(data);
        
        updateMetricsDisplay(parsedData);
        createPnLChart(parsedData);
    } catch (error) {
        console.error('Error initializing dashboard:', error);
        document.body.innerHTML = `
            <div style="text-align: center; padding: 2rem; color: #f87171;">
                <h2>Error Loading Dashboard</h2>
                <p>${error.message || 'Unknown error occurred'}</p>
                <p>Please try again later or check the data source.</p>
            </div>
        `;
    }
}

// Start the dashboard when the page loads
document.addEventListener('DOMContentLoaded', initDashboard);
