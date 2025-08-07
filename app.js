/* 
Author: AROCKIA ALWIN A
Project: Modern Easy Data Analysis Dashboard
Version: 1.0
Date: August 07, 2025
Description: JavaScript logic for the dashboard application.
*/



let globalData = [];
let globalHeaders = [];
let selectedColumns = [];
const charts = {};
let isDark = false;

const dropZone = document.getElementById('dropZone');
const fileUpload = document.getElementById('fileUpload');
const loading = document.getElementById('loading');
const previewSection = document.getElementById('previewSection');

// Debounce utility for resize events
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// File upload handling
dropZone.addEventListener('click', () => fileUpload.click());
fileUpload.addEventListener('change', (e) => handleFile(e.target.files[0]));
dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--button-bg)';
});
dropZone.addEventListener('dragleave', () => {
    dropZone.style.borderColor = 'var(--border-color)';
});
dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.style.borderColor = 'var(--border-color)';
    handleFile(e.dataTransfer.files[0]);
});

// Parse uploaded file
function handleFile(file) {
    if (!file) {
        loading.style.display = 'none';
        return;
    }
    loading.style.display = 'flex';
    const reader = new FileReader();
    reader.onload = function(event) {
        try {
            let workbook;
            if (file.name.endsWith('.csv')) {
                workbook = XLSX.read(event.target.result, {type: 'string'});
            } else if (file.name.endsWith('.xlsx')) {
                workbook = XLSX.read(event.target.result, {type: 'binary'});
            } else if (file.name.endsWith('.json')) {
                let jsonData;
                try {
                    jsonData = JSON.parse(event.target.result);
                } catch (e) {
                    throw new Error('Invalid JSON format');
                }
                if (!Array.isArray(jsonData) || jsonData.length === 0) {
                    throw new Error('JSON must be a non-empty array of objects');
                }
                if (jsonData.length > 10000 || Object.keys(jsonData[0]).length > 50) {
                    throw new Error('Dataset too large: max 10,000 rows or 50 columns');
                }
                globalData = jsonData;
                globalHeaders = Object.keys(jsonData[0]);
                if (globalHeaders.length === 0) {
                    throw new Error('No columns found in JSON data');
                }
                createPreview();
                return;
            } else {
                throw new Error('Unsupported file format. Use .csv, .xlsx, or .json');
            }
            const sheetName = workbook.SheetNames[0];
            if (!sheetName) {
                throw new Error('No sheets found in file');
            }
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, {header: 1});
            if (jsonData.length === 0) {
                throw new Error('No data found in file');
            }
            globalHeaders = jsonData[0];
            if (globalHeaders.length === 0) {
                throw new Error('No columns found in file');
            }
            if (jsonData.length > 10000 || globalHeaders.length > 50) {
                throw new Error('Dataset too large: max 10,000 rows or 50 columns');
            }
            globalData = jsonData.slice(1).map(row => {
                let obj = {};
                globalHeaders.forEach((h, i) => obj[h] = row[i]);
                return obj;
            });
            createPreview();
        } catch (error) {
            alert('Error parsing file: ' + error.message);
            console.error(error);
        } finally {
            loading.style.display = 'none';
        }
    };
    reader.onerror = () => {
        alert('Error reading file');
        loading.style.display = 'none';
    };
    if (file.name.endsWith('.json')) {
        reader.readAsText(file);
    } else {
        reader.readAsBinaryString(file);
    }
}

// Create data preview table
function createPreview() {
    const preview = document.getElementById('preview');
    preview.innerHTML = '';
    const table = document.createElement('table');
    table.id = 'previewTable';
    const thead = document.createElement('thead');
    const tr = document.createElement('tr');
    const selectAllTh = document.createElement('th');
    const selectAll = document.createElement('input');
    selectAll.type = 'checkbox';
    selectAll.checked = true;
    selectAll.addEventListener('change', () => {
        document.querySelectorAll('.col-checkbox').forEach(cb => cb.checked = selectAll.checked);
    });
    selectAllTh.appendChild(selectAll);
    tr.appendChild(selectAllTh);
    globalHeaders.forEach(header => {
        const th = document.createElement('th');
        const cb = document.createElement('input');
        cb.type = 'checkbox';
        cb.className = 'col-checkbox';
        cb.checked = true;
        cb.dataset.col = header;
        th.appendChild(cb);
        th.appendChild(document.createTextNode(header));
        tr.appendChild(th);
    });
    thead.appendChild(tr);
    table.appendChild(thead);
    const tbody = document.createElement('tbody');
    globalData.slice(0, 50).forEach(row => {
        const tr = document.createElement('tr');
        const td = document.createElement('td');
        tr.appendChild(td);
        globalHeaders.forEach(header => {
            const td = document.createElement('td');
            td.textContent = row[header] ?? '';
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });
    table.appendChild(tbody);
    preview.appendChild(table);
    previewSection.style.display = 'block';
    document.getElementById('generateDashboard').disabled = false;
    document.getElementById('downloadExcel').disabled = false;
}

// Generate dashboard
document.getElementById('generateDashboard').addEventListener('click', () => {
    selectedColumns = Array.from(document.querySelectorAll('.col-checkbox:checked')).map(cb => cb.dataset.col);
    if (selectedColumns.length === 0) {
        alert('Select at least one column');
        return;
    }
    createDashboard(globalData, selectedColumns);
    document.getElementById('downloadImage').disabled = false;
});

// Create charts for selected columns
function createDashboard(data, columns) {
    const dashboard = document.getElementById('dashboard');
    dashboard.innerHTML = '';
    columns.forEach(col => {
        const colDiv = document.createElement('div');
        colDiv.className = 'chart-container';
        colDiv.id = 'col-' + col.replace(/\s/g, '_');

        const title = document.createElement('h3');
        title.textContent = col;

        const select = document.createElement('select');
        select.className = 'chart-control';
        ['bar', 'line', 'pie', 'doughnut'].forEach(type => {
            const opt = document.createElement('option');
            opt.value = type;
            opt.textContent = type.charAt(0).toUpperCase() + type.slice(1);
            select.appendChild(opt);
        });
        select.addEventListener('change', () => updateChart(col, data, select.value));

        const canvas = document.createElement('canvas');
        canvas.id = 'chart-' + col.replace(/\s/g, '_');

        const downloadBtn = document.createElement('button');
        downloadBtn.className = 'chart-control';
        downloadBtn.innerHTML = '<i class="fas fa-download"></i> Download Chart';
        downloadBtn.addEventListener('click', () => downloadSingleChart(col));

        const fullscreenBtn = document.createElement('button');
        fullscreenBtn.className = 'chart-control';
        fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
        fullscreenBtn.title = 'Enter Fullscreen';
        fullscreenBtn.addEventListener('click', () => toggleFullscreen(colDiv, col, data, select.value, fullscreenBtn));

        const statsDiv = document.createElement('div');
        statsDiv.className = 'stats';

        colDiv.appendChild(title);
        colDiv.appendChild(select);
        colDiv.appendChild(canvas);
        colDiv.appendChild(downloadBtn);
        colDiv.appendChild(fullscreenBtn);
        colDiv.appendChild(statsDiv);
        dashboard.appendChild(colDiv);

        updateChart(col, data, 'bar', statsDiv);
    });
}

// Toggle fullscreen for a chart
function toggleFullscreen(container, col, data, chartType, fullscreenBtn) {
    if (!document.fullscreenElement) {
        (container.requestFullscreen || container.webkitRequestFullscreen || container.mozRequestFullScreen || container.msRequestFullscreen).call(container).then(() => {
            container.classList.add('fullscreen');
            fullscreenBtn.innerHTML = '<i class="fas fa-compress"></i>';
            fullscreenBtn.title = 'Exit Fullscreen';
            setTimeout(() => updateChart(col, data, chartType, container.querySelector('.stats')), 100);
        }).catch(err => {
            console.error('Fullscreen request failed:', err);
            alert('Fullscreen mode is not supported in this browser');
        });
    } else {
        (document.exitFullscreen || document.webkitExitFullscreen || document.mozCancelFullScreen || document.msExitFullscreen).call(document).then(() => {
            container.classList.remove('fullscreen');
            fullscreenBtn.innerHTML = '<i class="fas fa-expand"></i>';
            fullscreenBtn.title = 'Enter Fullscreen';
            setTimeout(() => updateChart(col, data, chartType, container.querySelector('.stats')), 100);
        }).catch(err => {
            console.error('Exit fullscreen failed:', err);
        });
    }
}

// Update chart for a column
function updateChart(col, data, type, statsDiv = null) {
    const canvasId = 'chart-' + col.replace(/\s/g, '_');
    const ctx = document.getElementById(canvasId)?.getContext('2d');
    if (!ctx) {
        if (statsDiv) statsDiv.innerHTML = 'Error: Unable to render chart';
        return;
    }

    if (charts[col]) {
        charts[col].destroy();
    }

    const values = data.map(row => row[col]).filter(v => v != null && v !== '');
    if (values.length === 0) {
        if (statsDiv) statsDiv.innerHTML = 'No valid data for this column';
        return;
    }

    let chartData;
    let chartType = type;
    const isNum = isNumerical(data, col);

    if (isNum) {
        const numValues = values.map(v => parseFloat(v)).filter(v => !isNaN(v));
        if (numValues.length === 0) {
            if (statsDiv) statsDiv.innerHTML = 'No valid numerical data';
            return;
        }

        if (statsDiv) {
            const stats = computeStats(numValues);
            statsDiv.innerHTML = `Mean: ${stats.mean.toFixed(2)} | Median: ${stats.median.toFixed(2)} | Min: ${stats.min.toFixed(2)} | Max: ${stats.max.toFixed(2)}`;
        }

        const min = Math.min(...numValues);
        const max = Math.max(...numValues);
        const numBins = Math.min(10, numValues.length);
        const binSize = (max - min) / numBins || 1;
        const bins = Array(numBins).fill(0);

        numValues.forEach(v => {
            let bin = Math.floor((v - min) / binSize);
            if (bin === numBins) bin--;
            if (bin >= 0 && bin < numBins) bins[bin]++;
        });

        const labels = bins.map((_, i) => `${(min + i * binSize).toFixed(2)} - ${(min + (i + 1) * binSize).toFixed(2)}`);

        const colors = generateColors(numBins);
        chartData = {
            labels: labels,
            datasets: [{
                label: col,
                data: bins,
                backgroundColor: colors,
                borderColor: colors.map(c => c.replace('0.5', '1')),
                borderWidth: 1
            }]
        };

        // Allow pie and doughnut for numerical histograms with custom colors
        if (chartType === 'pie' || chartType === 'doughnut') {
            chartData.labels = labels.map(label => label.length > 20 ? label.substring(0, 17) + '...' : label);
        }
    } else {
        const counts = {};
        values.forEach(val => {
            const key = val.toString().trim() || 'Unknown';
            counts[key] = (counts[key] || 0) + 1;
        });

        const labels = Object.keys(counts);
        if (labels.length === 0) {
            if (statsDiv) statsDiv.innerHTML = 'No valid categorical data';
            return;
        }

        const colors = generateColors(labels.length);
        chartData = {
            labels: labels,
            datasets: [{
                label: col,
                data: Object.values(counts),
                backgroundColor: colors,
                borderColor: colors.map(c => c.replace('0.5', '1')),
                borderWidth: 1
            }]
        };

        // For pie/doughnut, ensure labels are not too long
        if (chartType === 'pie' || chartType === 'doughnut') {
            chartData.labels = labels.map(label => label.length > 20 ? label.substring(0, 17) + '...' : label);
        }

        if (statsDiv) statsDiv.innerHTML = '';
    }

    try {
        charts[col] = new Chart(ctx, {
            type: chartType,
            data: chartData,
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: (chartType === 'pie' || chartType === 'doughnut') ? {} : {
                    y: { beginAtZero: true }
                },
                plugins: {
                    legend: {
                        display: chartType === 'pie' || chartType === 'doughnut'
                    }
                }
            }
        });
    } catch (error) {
        if (statsDiv) statsDiv.innerHTML = 'Error rendering chart: ' + error.message;
        console.error('Chart rendering error:', error);
    }
}

// Check if column is numerical
function isNumerical(data, col) {
    return data.every(row => {
        const val = row[col];
        return val == null || val === '' || (!isNaN(parseFloat(val)) && isFinite(val));
    });
}

// Generate muted, professional colors
function generateColors(n) {
    const palette = [
        'rgba(166, 189, 219, 0.5)', // Light blue
        'rgba(186, 215, 166, 0.5)', // Light green
        'rgba(219, 166, 189, 0.5)', // Light pink
        'rgba(219, 189, 166, 0.5)', // Light orange
        'rgba(166, 219, 189, 0.5)', // Light teal
        'rgba(189, 166, 219, 0.5)', // Light purple
        'rgba(219, 219, 166, 0.5)', // Light yellow
        'rgba(166, 166, 219, 0.5)', // Light indigo
        'rgba(189, 219, 166, 0.5)', // Light lime
        'rgba(219, 166, 166, 0.5)', // Light red
        'rgba(166, 219, 219, 0.5)', // Light cyan
        'rgba(219, 189, 219, 0.5)'  // Light magenta
    ];
    const colors = [];
    for (let i = 0; i < n; i++) {
        colors.push(palette[i % palette.length]);
    }
    return colors;
}

// Compute stats for numerical data
function computeStats(values) {
    const sorted = [...values].sort((a, b) => a - b);
    const sum = values.reduce((a, b) => a + b, 0);
    const mean = values.length > 0 ? sum / values.length : 0;
    const median = sorted.length > 0 ? (sorted.length % 2 === 0 ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2 : sorted[Math.floor(sorted.length / 2)]) : 0;
    const min = values.length > 0 ? Math.min(...values) : 0;
    const max = values.length > 0 ? Math.max(...values) : 0;
    return { mean, median, min, max };
}

// Download single chart
function downloadSingleChart(col) {
    if (!charts[col]) return;
    try {
        const link = document.createElement('a');
        link.download = `${col}_chart.png`;
        link.href = charts[col].toBase64Image();
        link.click();
    } catch (error) {
        alert('Error exporting chart: ' + error.message);
        console.error(error);
    }
}

// Export data as Excel
document.getElementById('downloadExcel').addEventListener('click', () => {
    if (globalData.length === 0) return;
    try {
        const ws = XLSX.utils.json_to_sheet(globalData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, 'Data');
        XLSX.writeFile(wb, 'dashboard_data.xlsx');
    } catch (error) {
        alert('Error exporting Excel: ' + error.message);
        console.error(error);
    }
});

// Export dashboard as image, excluding controls
document.getElementById('downloadImage').addEventListener('click', () => {
    const dashboard = document.getElementById('dashboard');
    try {
        html2canvas(dashboard, {
            scale: 2,
            filter: (element) => {
                return !element.classList?.contains('chart-control');
            }
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = 'dashboard.png';
            link.href = canvas.toDataURL('image/png');
            link.click();
        }).catch(err => {
            alert('Error exporting dashboard image: ' + err.message);
            console.error(err);
        });
    } catch (error) {
        alert('Error initiating export: ' + error.message);
        console.error(error);
    }
});

// Theme toggle
document.getElementById('themeToggle').addEventListener('click', () => {
    isDark = !isDark;
    document.body.classList.toggle('dark', isDark);
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.innerHTML = `<i class="fas ${isDark ? 'fa-sun' : 'fa-moon'}"></i> Toggle ${isDark ? 'Light' : 'Dark'} Mode`;
    }
    selectedColumns.forEach(col => {
        const select = document.querySelector(`#col-${col.replace(/\s/g, '_')} select`);
        if (select) {
            updateChart(col, globalData, select.value);
        }
    });
});

// Handle window resize
const handleResize = debounce(() => {
    selectedColumns.forEach(col => {
        const select = document.querySelector(`#col-${col.replace(/\s/g, '_')} select`);
        if (select) {
            updateChart(col, globalData, select.value);
        }
    });
}, 100);
window.addEventListener('resize', handleResize);

// Cleanup on page unload
window.addEventListener('unload', () => {
    window.removeEventListener('resize', handleResize);

});
