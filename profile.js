document.addEventListener('DOMContentLoaded', () => {
    const params = new URLSearchParams(window.location.search);
    const username = params.get('username');

    if (username) {
        fetchCSVData(username);
    }
});

document.addEventListener('DOMContentLoaded', function() {
    const profileImage = document.getElementById('profileImage');
    if (profileImage) {
        profileImage.onerror = function() {
            profileImage.src = './geoguessr_profile_pictures/default.png';
        };
    }
});

function fetchCSVData(username) {
    Papa.parse('leaderboard.csv', {
        download: true,
        header: true,
        complete: function(results) {
            console.log("CSV Data:", results.data); // Log the CSV data
            const user = results.data.find(row => row.nick === username);
            if (user) {
                displayProfile(user, results.data);
            } else {
                console.error('User not found in CSV data');
            }
        }
    });
}

function displayProfile(user, allData) {
    // data subsets
    const numericRatings = allData.map(row => Number(row.rating)).filter(rating => !isNaN(rating));

    const countryRatings = allData
        .filter(row => row.countryCode === user.countryCode)
        .map(row => Number(row.rating))
        .filter(rating => !isNaN(rating));

    const countryPlayers = allData.filter(row => row.countryCode === user.countryCode);

    function getPosition(user, data) {
        data.sort((a, b) => b.rating - a.rating);
        return data.findIndex(row => row.nick === user.nick) + 1;
    }
    
    const lbPositionCountry = getPosition(user, countryPlayers);

    function filterGamemodeData(data, column) {
        return data
            .filter(row => row[column] !== undefined && !isNaN(parseFloat(row[column])))
            .sort((a, b) => b[column] - a[column]);
    }

    const movingDuelsRatings = filterGamemodeData(allData, "gameModeRatingsStandardduels");
    const noMoveDuelsRatings = filterGamemodeData(allData, "gameModeRatingsNomoveduels");
    const nmpzDuelsRatings = filterGamemodeData(allData, "gameModeRatingsNmpzduels");

    function getGameModePosition(user, data) {
        return data.findIndex(row => row.nick === user.nick) + 1;
    }

    const lbPositionMovingDuels = getGameModePosition(user, movingDuelsRatings);
    const lbPositionNoMoveDuels = getGameModePosition(user, noMoveDuelsRatings);
    const lbPositionNmpzDuels = getGameModePosition(user, nmpzDuelsRatings);

    // display gamemode specific ratings
    let leaderboardContent = '<div class="leaderboard-line">⭐&nbsp;Gamemode&nbsp;Specific&nbsp;Ratings&nbsp;⭐<br></div>';

    function addRankEmoji(rank) {
        if (rank === 1) return '🥇';
        if (rank === 2) return '🥈';
        if (rank === 3) return '🥉';
        return '';
    }

    if (user.gameModeRatingsStandardduels && !isNaN(user.gameModeRatingsStandardduels)) {
        const movingEmoji = addRankEmoji(lbPositionMovingDuels);
        leaderboardContent += `<div class="leaderboard-line">${movingEmoji}&nbsp;Moving:&nbsp;<span class="highlight">${user.gameModeRatingsStandardduels}</span>&nbsp;
        (Rank&nbsp;<span class="highlight">${lbPositionMovingDuels}</span>&nbsp;of&nbsp;${movingDuelsRatings.length})&nbsp;
        Top&nbsp;${(lbPositionMovingDuels / movingDuelsRatings.length * 100).toFixed(2)}%<br></div>`;
    }
    
    if (user.gameModeRatingsNomoveduels && !isNaN(user.gameModeRatingsNomoveduels)) {
        const noMoveEmoji = addRankEmoji(lbPositionNoMoveDuels);
        leaderboardContent += `<div class="leaderboard-line">${noMoveEmoji}&nbsp;No Move:&nbsp;<span class="highlight">${user.gameModeRatingsNomoveduels}</span>&nbsp;
        (Rank&nbsp;<span class="highlight">${lbPositionNoMoveDuels}</span>&nbsp;of&nbsp;${noMoveDuelsRatings.length})&nbsp;
        Top&nbsp;${(lbPositionNoMoveDuels / noMoveDuelsRatings.length * 100).toFixed(2)}%<br></div>`;
    }
    
    if (user.gameModeRatingsNmpzduels && !isNaN(user.gameModeRatingsNmpzduels)) {
        const nmpzEmoji = addRankEmoji(lbPositionNmpzDuels);
        leaderboardContent += `<div class="leaderboard-line">${nmpzEmoji}&nbsp;NMPZ:&nbsp;<span class="highlight">${user.gameModeRatingsNmpzduels}</span>&nbsp;
        (Rank&nbsp;<span class="highlight">${lbPositionNmpzDuels}</span>&nbsp;of&nbsp;${nmpzDuelsRatings.length})&nbsp;
        Top&nbsp;${(lbPositionNmpzDuels / nmpzDuelsRatings.length * 100).toFixed(2)}%<br></div>`;
    }
    
    if (!leaderboardContent.includes("highlight")) {leaderboardContent += `No ratings to display`;}

    const globalEmoji = addRankEmoji(Number(user.positionDuelsLeaderboard));
    const countryEmoji = addRankEmoji(lbPositionCountry);

    // documents
    document.title = `${user.nick} Profile`
    document.getElementById('username').textContent = `${user.nick}`;
    document.getElementById('userInfo').innerHTML = `
    <span class="highlight">(${user.lifeTimeXpProgressionCurrenttitleName}, Level ${user.lifeTimeXpProgressionCurrentlevelLevel})</span><br>
    Number of perfect rounds: <span class="highlight">${user.perfectRounds}</span><br>
    Account created: ${user.created}
    `;
    document.getElementById('geoguessrProfile').innerHTML = `<a href="https://www.geoguessr.com/${user.url}" target="_blank">Geoguessr Profile</a>`;
    document.getElementById('profileImage').src = `./geoguessr_profile_pictures/${user.pinUrl.replace(/^pin\//, '')}`;
    document.getElementById('divisionImage').src = `./division_icons/${user.divisionName}.webp`;
    document.getElementById('leaderboardPosition').innerHTML = `
        <div class="leaderboard-line">${globalEmoji}&nbsp;Rating:&nbsp;<span class="highlight">${user.rating}</span>&nbsp;(${user.divisionName})</div>
        <div class="leaderboard-line">${globalEmoji}&nbsp;Global Rank&nbsp;<span class="highlight">${user.positionDuelsLeaderboard}</span>&nbsp;of&nbsp;${allData.length - 1}</div>
        <div class="leaderboard-line">${countryEmoji}&nbsp;Rank&nbsp;<span class="highlight">${lbPositionCountry}</span>&nbsp;of&nbsp;${countryPlayers.length}&nbsp;(${user.countryCode})</div>
    `;
    document.getElementById('leaderboardGamemodePosition').innerHTML = leaderboardContent;

    // more data subsets
    function calculateAvgGuessDistance(data, gamesPlayed, guessDistance) {      
        return data
            .filter(row => Number(row[gamesPlayed]) > 10)
            .map(row => Number(row[guessDistance]))
            .filter(distance => !isNaN(distance));
    }

    function calculateWinRatio(data, gamesPlayed, variable) {
        return data
            .filter(row => Number(row[gamesPlayed]) > 10)
            .map(row => Number(row[variable]))
            .filter(rating => !isNaN(rating));
    }
    
    // duels avg guess distance data
    const movingDuelsAvgGuessDistance = calculateAvgGuessDistance(allData, 'duelsNumgamesplayed', 'duelsAvgguessdistance');
    const noMoveDuelsAvgGuessDistance = calculateAvgGuessDistance(allData, 'duelsNoMoveNumgamesplayed', 'duelsNoMoveAvgguessdistance');
    const nmpzDuelsAvgGuessDistance = calculateAvgGuessDistance(allData, 'duelsNmpzNumgamesplayed', 'duelsNmpzAvgguessdistance');

    // br avg guess distance data
    const battleRoyaleDistanceAvgGuessDistance = calculateAvgGuessDistance(allData, 'battleRoyaleDistanceNumgamesplayed', 'battleRoyaleDistanceAvgguessdistance');
    const battleRoyaleCountryAvgCorrectGuess = calculateAvgGuessDistance(allData, 'battleRoyaleCountryNumgamesplayed', 'battleRoyaleCountryAvgcorrectguesses');

    // duels wr data
    const movingDuelsWinRatio = calculateWinRatio(allData, 'duelsNumgamesplayed', 'duelsWinratio');
    const noMoveDuelsWinRatio = calculateWinRatio(allData, 'duelsNoMoveNumgamesplayed', 'duelsNoMoveWinratio');
    const nmpzDuelsWinRatio = calculateWinRatio(allData, 'duelsNmpzNumgamesplayed', 'duelsNmpzWinratio');

    // br wr data
    const battleRoyaleDistanceWinRatio = calculateWinRatio(allData, 'battleRoyaleDistanceNumgamesplayed', 'battleRoyaleDistanceWinratio');
    const battleRoyaleCountryWinRatio = calculateAvgGuessDistance(allData, 'battleRoyaleCountryNumgamesplayed', 'battleRoyaleCountryWinratio');

    // calculating top percentages
    const percentageGlobal = (numericRatings.filter(rating => rating < user.rating).length / numericRatings.length) * 100;
    const percentageCountry = (countryRatings.filter(rating => rating < user.rating).length / countryRatings.length) * 100;
    
    // duels avg guess distance %
    const percentageMovingDuelsAvgGuessDistance = (movingDuelsAvgGuessDistance.filter(distance => distance < Number(user.duelsAvgguessdistance)).length / movingDuelsAvgGuessDistance.length) * 100 - 100 * -1;
    const percentageNoMoveDuelsAvgGuessDistance = (noMoveDuelsAvgGuessDistance.filter(distance => distance < Number(user.duelsNoMoveAvgguessdistance)).length / noMoveDuelsAvgGuessDistance.length) * 100 - 100 * -1;
    const percentageNmpzDuelsAvgGuessDistance = (nmpzDuelsAvgGuessDistance.filter(distance => distance < Number(user.duelsNmpzAvgguessdistance)).length / nmpzDuelsAvgGuessDistance.length) * 100 - 100 * -1;

    // br avg guess distance %
    const percentageBattleRoyaleDistanceAvgGuessDistance = (battleRoyaleDistanceAvgGuessDistance.filter(distance => distance < Number(user.battleRoyaleDistanceAvgguessdistance)).length / battleRoyaleDistanceAvgGuessDistance.length) * 100 - 100 * -1;
    const percentageBattleRoyaleCountryAvgCorrectGuess = (battleRoyaleCountryAvgCorrectGuess.filter(distance => distance < Number(user.battleRoyaleCountryAvgcorrectguesses)).length / battleRoyaleCountryAvgCorrectGuess.length) * 100;

    // duels wr %
    const percentageMovingWinRatio = (movingDuelsWinRatio.filter(rating => rating < user.duelsWinratio).length / movingDuelsWinRatio.length) * 100;
    const percentageNoMoveWinRatio = (noMoveDuelsWinRatio.filter(rating => rating < user.duelsNoMoveWinratio).length / noMoveDuelsWinRatio.length) * 100;
    const percentageNmpzWinRatio = (nmpzDuelsWinRatio.filter(rating => rating < user.duelsNmpzWinratio).length / nmpzDuelsWinRatio.length) * 100;

    // br wr %
    const percentageBattleRoyaleDistanceWinRatio = (battleRoyaleDistanceWinRatio.filter(distance => distance < Number(user.battleRoyaleDistanceWinratio)).length / battleRoyaleDistanceWinRatio.length) * 100;
    const percentageBattleRoyaleCountryWinRatio = (battleRoyaleCountryWinRatio.filter(distance => distance < Number(user.battleRoyaleCountryWinratio)).length / battleRoyaleCountryWinRatio.length) * 100;

    // create histograms
    createHistogram(
        "ratingsHistogram", Number(user.rating), Number(user.positionDuelsLeaderboard), 
        numericRatings, user.nick, percentageGlobal.toFixed(2), 
        'Global Leaderboard Ranking', 'Rating', '#cc302e'
    );
    createHistogram(
        "countryRatingsHistogram", Number(user.rating), Number(lbPositionCountry), 
        countryRatings, user.nick, percentageCountry.toFixed(2), 
        `${user.countryCode} Leaderboard Ranking`, 'Rating', '#cc302e'
    );
    createHistogram(
        "movingDuelsAvgGuessDistanceHistogram", Number(user.duelsAvgguessdistance), '',
        movingDuelsAvgGuessDistance, user.nick, percentageMovingDuelsAvgGuessDistance.toFixed(2), 
        'Moving Duels Average Guess Distance', 'Average Guess Distance (km)', '#d8aa00'
    );
    createHistogram(
        "movingDuelsWinRatioHistogram", Number(user.duelsWinratio), '',
        movingDuelsWinRatio, user.nick, percentageMovingWinRatio.toFixed(2), 
        'Moving Duels Win Percentage', 'Win Percentage', '#6cb928'
    );

    // create histograms if there is sufficient data
    function createHistogramOrDisplayMessage(elementId, gamesPlayed, createHistogramParams, message) {
        const element = document.getElementById(elementId);
        if (gamesPlayed > 10) {
            createHistogram(...createHistogramParams);
        } else {
            element.style.display = 'flex';
            element.style.justifyContent = 'center';
            element.style.alignItems = 'center';
            element.innerHTML = message;
        }
    }

    createHistogramOrDisplayMessage(
        'noMoveDuelsAvgGuessDistanceHistogram', user.duelsNoMoveNumgamesplayed, 
        ["noMoveDuelsAvgGuessDistanceHistogram", Number(user.duelsNoMoveAvgguessdistance), '', 
         noMoveDuelsAvgGuessDistance, user.nick, percentageNoMoveDuelsAvgGuessDistance.toFixed(2), 
         'No Move Duels Average Guess Distance', 'Average Guess Distance (km)', '#d8aa00'], 
        'Insufficient No Move Duels data to display'
    );
    
    createHistogramOrDisplayMessage(
        'noMoveDuelsWinRatioHistogram', user.duelsNoMoveNumgamesplayed, 
        ["noMoveDuelsWinRatioHistogram", Number(user.duelsNoMoveWinratio), '', 
         noMoveDuelsWinRatio, user.nick, percentageNoMoveWinRatio.toFixed(2), 
         'No Move Duels Win Percentage', 'Win Percentage', '#6cb928'], 
        'Insufficient No Move Duels data to display'
    );

    createHistogramOrDisplayMessage(
        'nmpzDuelsAvgGuessDistanceHistogram', user.duelsNmpzNumgamesplayed, 
        ["nmpzDuelsAvgGuessDistanceHistogram", Number(user.duelsNmpzAvgguessdistance), '', 
         nmpzDuelsAvgGuessDistance, user.nick, percentageNmpzDuelsAvgGuessDistance.toFixed(2), 
         'NMPZ Duels Average Guess Distance', 'Average Guess Distance (km)', '#d8aa00'], 
         'Insufficient NMPZ Duels data to display'
    );
    
    createHistogramOrDisplayMessage(
        'nmpzDuelsWinRatioHistogram', user.duelsNmpzNumgamesplayed, 
        ["nmpzDuelsWinRatioHistogram", Number(user.duelsNmpzWinratio), '', 
         nmpzDuelsWinRatio, user.nick, percentageNmpzWinRatio.toFixed(2), 
         'NMPZ Duels Win Percentage', 'Win Percentage', '#6cb928'], 
         'Insufficient NMPZ Duels data to display'
    );
    
    createHistogramOrDisplayMessage(
        'battleRoyaleDistanceAvgGuessDistanceHistogram', user.battleRoyaleDistanceNumgamesplayed, 
        ["battleRoyaleDistanceAvgGuessDistanceHistogram", Number(user.battleRoyaleDistanceAvgguessdistance), '', 
         battleRoyaleDistanceAvgGuessDistance, user.nick, percentageBattleRoyaleDistanceAvgGuessDistance.toFixed(2), 
         'BR Distance Average Guess Distance', 'Average Guess Distance (km)', '#d8aa00'], 
         'Insufficient Battle Royale Distance data to display'
    );
    
    createHistogramOrDisplayMessage(
        'battleRoyaleDistanceWinRatioHistogram', user.battleRoyaleDistanceNumgamesplayed, 
        ["battleRoyaleDistanceWinRatioHistogram", Number(user.battleRoyaleDistanceWinratio), '', 
         battleRoyaleDistanceWinRatio, user.nick, percentageBattleRoyaleDistanceWinRatio.toFixed(2), 
         'BR Distance Win Percentage', 'Win Percentage', '#6cb928'], 
         'Insufficient Battle Royale Distance data to display'
    );

    createHistogramOrDisplayMessage(
        'battleRoyaleCountryAvgCorrectGuessHistogram', user.battleRoyaleCountryNumgamesplayed, 
        ["battleRoyaleCountryAvgCorrectGuessHistogram", Number(user.battleRoyaleCountryAvgcorrectguesses), '', 
         battleRoyaleCountryAvgCorrectGuess, user.nick, percentageBattleRoyaleCountryAvgCorrectGuess.toFixed(2), 
         'BR Country Average Correct Guesses', 'Average Correct Guesses Percentage', '#d8aa00'], 
         'Insufficient Battle Royale Country data to display'
    );

    createHistogramOrDisplayMessage(
        'battleRoyaleCountryWinRatioHistogram', user.battleRoyaleCountryNumgamesplayed, 
        ["battleRoyaleCountryWinRatioHistogram", Number(user.battleRoyaleCountryWinratio), '', 
         battleRoyaleCountryWinRatio, user.nick, percentageBattleRoyaleCountryWinRatio.toFixed(2), 
         'BR Country Win Percentage', 'Win Percentage', '#6cb928'], 
         'Insufficient Battle Royale Country data to display'
    );

}

function createHistogram(elementId, userMetric, lbPosition, allMetrics, userNick, percentage, title, xaxisTitle, barColor) {

    const trace = {
        x: allMetrics,
        type: 'histogram',
        marker: {
            color: barColor,
            line: {
                color: '#FFFFFF',
                width: 0.2
            }
        }
    };

    const layout = {
        title: `${title} - Top ${Math.abs(100 - percentage).toFixed(2)}%`,
        xaxis: {
            title: xaxisTitle,
            color: 'white'
        },
        yaxis: {
            title: 'Number of Users',
            color: 'white',
            gridcolor: '#444444'
        },
        paper_bgcolor: '#1d1835', // Background color
        plot_bgcolor: '#0f0a26', // Plot area background color
        font: {
            color: 'white'
        },
        shapes: [{
            type: 'line',
            x0: userMetric,
            y0: 0,
            x1: userMetric,
            y1: 1,
            yref: 'paper',
            line: {
                color: 'white',
                width: 2,
                opacity: 0.3
            }
        }],
        annotations: [{
            x: userMetric,
            y: 1.12,
            yref: 'paper',
            text: `${title.includes('Percentage') ? `${userNick}<br>${userMetric}%` : 
                     title.includes('Guesses') ? `${userNick}<br>${userMetric}%` : 
                     title.includes('Leaderboard') ? `${userNick}<br>${userMetric} (Rank ${lbPosition})` : 
                     `${userNick}<br>${userMetric}`}`,
            showarrow: false,
            font: {
                color: 'white',
                size: 12
            }
        }]
    };

    Plotly.newPlot(elementId, [trace], layout);
}
