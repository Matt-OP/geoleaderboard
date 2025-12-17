const binSize = 10;

fetch("https://media.githubusercontent.com/media/Matt-OP/geoleaderboard/refs/heads/main/leaderboard.csv")
    .then(response => response.text())
    .then(csvText => {
        const data = Papa.parse(csvText, {header: true}).data;
        processData(data);
    });

function processData(data) {
    const divisionColors = {};
    divisionColors["Champion"] = `rgb(77,18,154)`
    divisionColors["Master I"] = `rgb(180,40,118)`
    divisionColors["Master II"] = `rgb(138,79,110)`
    divisionColors["Gold I"] = `rgb(255,255,0)`
    divisionColors["Gold II"] = `rgb(120,120,0)`
    divisionColors["Gold III"] = `rgb(80,80,0)`

    const bins = {};
    
    data.forEach(row => {
        const rating = parseInt(row.rating);
        const division = row.divisionName;

        if (isNaN(rating)) return;

        const bin = Math.floor(rating / binSize) * binSize;

        if (!bins[bin]) bins[bin] = {};
        if (!bins[bin][division]) bins[bin][division] = 0;

        bins[bin][division]++;
        if (!divisionColors[division]) {
            divisionColors[division] = `hsl(${Math.random() * 360}, 70%, 50%)`;
        }
    });

    const binKeys = Object.keys(bins).map(Number).sort((a, b) => a - b);
    const divisions = new Set();
    binKeys.forEach(bin => Object.keys(bins[bin]).forEach(div => divisions.add(div)));

    const divisionsOrder = ["Gold III", "Gold II", "Gold I", "Master II", "Master I", "Champion"];
    const sortedDivisions = Array.from(divisions).sort((a, b) => {
        const indexA = divisionsOrder.indexOf(a);
        const indexB = divisionsOrder.indexOf(b);
        return indexA - indexB;
    });

    const minBin = Math.min(...binKeys);
    const maxBin = Math.max(...binKeys);

    const completeBinKeys = [];
    for (let i = minBin; i <= maxBin; i += binSize) {
        completeBinKeys.push(i);
    }

    const datasets = Array.from(sortedDivisions).map(division => ({
        label: division,
        data: completeBinKeys.map(bin => bins[bin]?.[division] || 0),
        backgroundColor: divisionColors[division],
        stack: 'stack1',
        barPercentage: 1.0,
        categoryPercentage: 0.9
    }));

    drawChart(completeBinKeys, datasets);
}

function drawChart(labels, datasets) {
    const ctx = document.getElementById("rating-chart").getContext("2d");
    new Chart(ctx, {
        type: "bar",
        data: {
            labels: labels.map(l => `${l} - ${l + binSize}`),
            datasets: datasets
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { 
                    position: "top", 
                    labels: { 
                        color: 'white'
                    } 
                }
            },
            scales: {
                x: {
                    title: {
                        display: true,
                        text: "Rating",
                        color: 'white'
                    },
                    stacked: true,
                    ticks: {
                        color: 'white',
                        callback: function(value, index) {
                            const minRating = this.getLabelForValue(value).split("-")[0];
                            return minRating % 100 === 0 ? minRating : null;
                        }
                    }
                },
                y: {
                    stacked: true,
                    title: {
                        display: true,
                        text: "Number of Players",
                        color: 'white'
                    },
                    ticks: {
                        color: 'white'
                    }
                }
            },
            interaction: {
                mode: 'index',
                intersect: false
            }
        }
    });
}


