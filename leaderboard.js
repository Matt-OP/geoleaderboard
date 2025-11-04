document.addEventListener('DOMContentLoaded', () => {
    let allRows = [];
    let displayedRows = [];
    let searchResults = [];
    const limit = 2500;
    let offset = 0;
    let loading = false;
    let sortOrder = {};
    let inSearchMode = false;

    const customDivisionOrder = ['Gold III', 'Gold II', 'Gold I', 'Master II',  'Master I', 'Champion'];

    const selectedHeaders = [
        "positionDuelsLeaderboard", "nick", "countryCode", "rating", "divisionName", 
        "gameModeRatingsStandardduels", "gameModeRatingsNomoveduels", "gameModeRatingsNmpzduels"
    ];

    const htmlHeaders = [
        "Rank", "Username", "Country", "Rating", "Division", 
        "Moving Rating", "No Move Rating", "NMPZ Rating"
    ];

    const tableBody = document.querySelector('#leaderboard tbody');

    htmlHeaders.forEach(header => {
        sortOrder[header] = true; // true -> ascending, false -> descending
    });

    function loadAllRecords() {
        if (loading) return;
        loading = true;
    
        fetch('https://media.githubusercontent.com/media/Matt-OP/geoleaderboard/refs/heads/main/leaderboard.csv')
            .then(response => response.text())
            .then(data => {
                Papa.parse(data, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    complete: function(results) {
                        const rows = results.data;
                        const headers = results.meta.fields;
    
                        // Clean up headers by trimming whitespace and control characters
                        const cleanHeaders = headers.map(header => header.trim());
    
                        // Extract and clean up the 'current_time' value from the first data row
                        const firstRow = rows[0];
                        const currentTimeValue = firstRow['current_time'].trim();
                        const allDataLength = rows.length;
    
                        var leaderboardContainer = document.getElementById("leaderboardContainer");
                        var h2 = document.createElement("h2");
                        h2.innerHTML = `
                            Total Players on Leaderboard: <span class="highlight">${allDataLength}</span><br>
                            Data Updated: <span class="highlight">${currentTimeValue} UTC</span> (Updates Every 24 Hours)
                        `;
                        leaderboardContainer.appendChild(h2);

                        rows.forEach(row => {
                            const tr = document.createElement('tr');
                            selectedHeaders.forEach((header, i) => {
                                const index = cleanHeaders.indexOf(header);
                                if (index > -1) {
                                    const td = document.createElement('td');
                                    if (i === 1) {
                                        const username = row[header];
                                        const userId = row['id'];
                                        const link = document.createElement('a');
                                        link.href = `profile.html?username=${encodeURIComponent(username)}&id=${userId}`;
                                        link.textContent = username;
                                        link.target = '_blank'; // open in a new tab
                                        td.appendChild(link);
                                    } else {
                                        td.textContent = row[header];
                                    }
                                    tr.appendChild(td);
                                } else {
                                    console.error(`Header "${header}" not found in CSV headers`);
                                }
                            });
                            allRows.push(tr); // Save all rows
                        });
    
                        displayInitialRows();
                    }
                });
            })
            .finally(() => loading = false);
    }

    function displayInitialRows() {
        tableBody.innerHTML = '';
        displayedRows = allRows.slice(0, limit);
        displayedRows.forEach(row => tableBody.appendChild(row));
        offset = limit;
    }

    function loadMore() {
        const newRows = allRows.slice(offset, offset + limit);
        newRows.forEach(row => {
            tableBody.appendChild(row);
            displayedRows.push(row);
        });
        offset += limit;
    }

    function sortTable(header) {
        const headerIndex = htmlHeaders.indexOf(header);
        const rowsToSort = inSearchMode ? searchResults : displayedRows;
        const validRows = rowsToSort.filter(row => {
            const cellValue = row.cells[headerIndex].textContent;
            return !(cellValue === "" || cellValue.toLowerCase() === "nan");
        });
        const nanRows = rowsToSort.filter(row => {
            const cellValue = row.cells[headerIndex].textContent;
            return cellValue === "" || cellValue.toLowerCase() === "nan";
        });
    
        validRows.sort((a, b) => {
            let cellA = a.cells[headerIndex].textContent;
            let cellB = b.cells[headerIndex].textContent;
            if (header === 'Division') {
                cellA = customDivisionOrder.indexOf(cellA);
                cellB = customDivisionOrder.indexOf(cellB);
            } else if (!isNaN(cellA) && !isNaN(cellB)) {
                cellA = parseFloat(cellA);
                cellB = parseFloat(cellB);
            }
            if (header === "Username" || header === "Country") {
                return cellA.localeCompare(cellB);
            }
            return cellA - cellB;
        });
    
        if (!sortOrder[header]) {
            validRows.reverse();
        }
        const sortedRows = [...validRows, ...nanRows];
        tableBody.innerHTML = ''; // Clear existing data
        sortedRows.forEach(row => tableBody.appendChild(row));
        
        // Toggle sort order
        sortOrder[header] = !sortOrder[header];
    
        // Clear previous sort classes
        document.querySelectorAll('#leaderboard thead th').forEach(th => {
            th.classList.remove('sort-asc', 'sort-desc');
            th.innerHTML = th.innerHTML.replace(/ ▲| ▼/, '');
        });
    
        // Update the column header with a sort symbol class
        const symbol = sortOrder[header] ? ' ▲' : ' ▼';
        document.querySelectorAll('#leaderboard thead th')[headerIndex].innerHTML += `<span class="highlight">${symbol}</span>`;
        document.querySelectorAll('#leaderboard thead th')[headerIndex].classList.add(sortOrder[header] ? 'sort-asc' : 'sort-desc');
    }

    function doSearch(searchValue) {
        searchResults = allRows.filter(row => {
                const usernameCell = row.cells[1].textContent.toLowerCase();
                return usernameCell.includes(searchValue);
        });
        tableBody.innerHTML = '';
        searchResults.forEach(row => tableBody.appendChild(row));
    }

    let searchInputUpdateDebounceTimer = null;
    const DEBOUNCE_DELAY = 300; // This is in milliseconds.

    // Add event listener for the search bar
    document.getElementById('search-input').addEventListener('input', function () {
        const searchValue = this.value.toLowerCase();
        if (searchValue) {
            inSearchMode = true;
            // Only run the actual search after the input has been stable for
            // at least DEBOUNCE_DELAY milliseconds.
            clearTimeout(searchInputUpdateDebounceTimer);
            searchInputUpdateDebounceTimer = setTimeout(() => {
                doSearch(searchValue);
            }, DEBOUNCE_DELAY);
        } else {
            inSearchMode = false;
            tableBody.innerHTML = '';
            displayedRows = allRows.slice(0, offset); // Display the number of rows scrolled
            displayedRows.forEach(row => tableBody.appendChild(row));
        }
    });

    window.onscroll = function () {
        if (!inSearchMode && window.innerHeight + window.scrollY >= document.body.offsetHeight && offset < allRows.length) {
            loadMore();
        }
    };

    // Add click listeners to headers for sorting
    document.querySelectorAll('#leaderboard thead th').forEach((th, index) => {
        th.addEventListener('click', () => sortTable(htmlHeaders[index]));
    });

    loadAllRecords();
});
