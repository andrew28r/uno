// =========================
// SUPABASE
// =========================

const SUPABASE_URL =
    "https://imglcipdppttweycvcjk.supabase.co";


const SUPABASE_KEY =
    "sb_publishable_yXgJT5rluBoDaw_EjAKyGA_nlQzhPUw";


const supabaseClient =
    supabase.createClient(
        SUPABASE_URL,
        SUPABASE_KEY
    );


// =========================
// STATE
// =========================

let allPlayers = [];

let allGames = [];

let editingPlayerId = null;


// =========================
// DOM ELEMENTS
// =========================

const statsContainer =
    document.getElementById(
        "stats"
    );


const editPlayerPopup =
    document.getElementById(
        "editPlayerPopup"
    );


const editPlayerName =
    document.getElementById(
        "editPlayerName"
    );


const editGames =
    document.getElementById(
        "editGames"
    );


const editWins =
    document.getElementById(
        "editWins"
    );


const editStars =
    document.getElementById(
        "editStars"
    );


const savePlayerButton =
    document.getElementById(
        "savePlayerButton"
    );


const closeEditPlayerButton =
    document.getElementById(
        "closeEditPlayerButton"
    );


// =========================
// LOAD STATS
// =========================

async function loadStats() {

    statsContainer.innerHTML = `
        <div class="no-players">
            Loading...
        </div>
    `;


    try {

        // =========================
        // LOAD PLAYERS
        // =========================

        const {
            data: players,
            error: playersError
        } = await supabaseClient
            .from("players")
            .select(`
                id,
                name,
                games_played_adjustment,
                wins_adjustment,
                stars_adjustment
            `)
            .order("name");


        if (playersError) {

            throw playersError;

        }


        // =========================
        // LOAD GAMES
        // =========================

        const {
            data: games,
            error: gamesError
        } = await supabaseClient
            .from("games")
            .select(
                "id, player_ids, winner_id, stars"
            );


        if (gamesError) {

            throw gamesError;

        }


        allPlayers =
            players || [];


        allGames =
            games || [];


        renderStats();

    }

    catch (error) {

        console.error(
            "Error loading stats:",
            error
        );


        statsContainer.innerHTML = `
            <div class="no-players">
                Could not load player stats.
            </div>
        `;

    }
}


// =========================
// GET ACTUAL PLAYER STATS
// =========================

function getActualPlayerStats(
    playerId
) {

    let gamesPlayed = 0;

    let wins = 0;

    let stars = 0;


    allGames.forEach(
        game => {

            // =========================
            // GAMES PLAYED
            // =========================

            const playerIds =
                Array.isArray(
                    game.player_ids
                )
                    ? game.player_ids
                    : [];


            const played =
                playerIds.some(
                    id =>

                        String(id) ===
                        String(playerId)
                );


            if (played) {

                gamesPlayed++;

            }


            // =========================
            // WINS
            // =========================

            if (
                game.winner_id &&
                String(game.winner_id) ===
                    String(playerId)
            ) {

                wins++;

            }


            // =========================
            // STARS
            // =========================

            if (
                game.stars &&
                typeof game.stars ===
                    "object"
            ) {

                const playerStars =
                    game.stars[playerId];


                if (
                    playerStars !== undefined
                ) {

                    stars +=
                        Number(
                            playerStars
                        ) || 0;

                }

            }

        }
    );


    return {

        gamesPlayed,

        wins,

        stars

    };
}


// =========================
// GET DISPLAYED PLAYER STATS
// =========================

function getPlayerStats(
    player
) {

    const actualStats =
        getActualPlayerStats(
            player.id
        );


    const gamesAdjustment =
        Number(
            player.games_played_adjustment
        ) || 0;


    const winsAdjustment =
        Number(
            player.wins_adjustment
        ) || 0;


    const starsAdjustment =
        Number(
            player.stars_adjustment
        ) || 0;


    let gamesPlayed =
        actualStats.gamesPlayed +
        gamesAdjustment;


    let wins =
        actualStats.wins +
        winsAdjustment;


    let stars =
        actualStats.stars +
        starsAdjustment;


    // =========================
    // PREVENT NEGATIVE VALUES
    // =========================

    gamesPlayed =
        Math.max(
            0,
            gamesPlayed
        );


    wins =
        Math.max(
            0,
            wins
        );


    stars =
        Math.max(
            0,
            stars
        );

    
    const winPercentage =
    gamesPlayed > 0
        ? (wins / gamesPlayed) * 100
        : 0;

        


    return {
        gamesPlayed,
        wins,
        stars,
        winPercentage
    };
}


// =========================
// RENDER STATS
// =========================

function renderStats() {

    statsContainer.innerHTML = "";


    if (
        allPlayers.length === 0
    ) {

        statsContainer.innerHTML = `
            <div class="no-players">
                No players found.
            </div>
        `;


        return;
    }


    // =========================
    // ADD STATS TO PLAYERS
    // =========================

    const playersWithStats =
        allPlayers.map(
            player => {

                const stats =
                    getPlayerStats(
                        player
                    );


                return {

                    ...player,

                    ...stats

                };

            }
        );


    // =========================
    // SORT PLAYERS
    // =========================

    playersWithStats.sort(
        (a, b) => {

            // Wins

            if (
                b.wins !==
                a.wins
            ) {

                return (
                    b.wins -
                    a.wins
                );

            }


            // Stars

            if (
                b.stars !==
                a.stars
            ) {

                return (
                    b.stars -
                    a.stars
                );

            }


            // Name

            return a.name.localeCompare(
                b.name
            );

        }
    );


    // =========================
    // CREATE CARDS
    // =========================

    playersWithStats.forEach(
        player => {

            const card =
                createPlayerCard(
                    player
                );


            statsContainer.appendChild(
                card
            );

        }
    );
}


// =========================
// CREATE PLAYER CARD
// =========================

function createPlayerCard(
    player
) {

    const card =
        document.createElement(
            "div"
        );


    card.className =
        "player-stat";


    card.innerHTML = `

        <div class="player-stat-name">
            ${escapeHtml(player.name)}
        </div>


        <div class="stat-row">

            <div class="stat">
                Games:
                <strong>
                    ${player.gamesPlayed}
                </strong>
            </div>


            <div class="stat">
                Wins:
                <strong>
                    ${player.wins}
                </strong>
            </div>

            <div class="stat">
                Win %:
                <strong>
                    ${player.winPercentage.toFixed(1)}%
                </strong>
            </div>


            <div class="stat">
                Stars:
                <strong>
                    ${player.stars}
                </strong>
            </div>

        </div>


        <button
            class="edit-player-button"
            type="button"
        >
            Edit
        </button>

    `;


    // =========================
    // EDIT BUTTON
    // =========================

    const editButton =
        card.querySelector(
            ".edit-player-button"
        );


    editButton.addEventListener(
        "click",
        function() {

            openEditPlayer(
                player
            );

        }
    );


    return card;
}


// =========================
// OPEN EDIT PLAYER
// =========================

function openEditPlayer(
    player
) {

    editingPlayerId =
        player.id;


    // =========================
    // PLAYER NAME
    // =========================

    editPlayerName.value =
        player.name;


    // =========================
    // CURRENT STATS
    // =========================

    editGames.value =
        player.gamesPlayed;


    editWins.value =
        player.wins;


    editStars.value =
        player.stars;


    // =========================
    // OPEN POPUP
    // =========================

    editPlayerPopup.classList.remove(
        "hidden"
    );


    editPlayerName.focus();


    editPlayerName.select();
}


// =========================
// CLOSE EDIT PLAYER
// =========================

function closeEditPlayer() {

    editPlayerPopup.classList.add(
        "hidden"
    );


    editingPlayerId =
        null;


    editPlayerName.value =
        "";


    editGames.value =
        "";


    editWins.value =
        "";


    editStars.value =
        "";
}


// =========================
// SAVE PLAYER
// =========================

async function savePlayer() {

    if (!editingPlayerId) {

        return;
    }


    // =========================
    // NAME
    // =========================

    const name =
        editPlayerName.value.trim();


    if (!name) {

        alert(
            "Enter a player name."
        );


        editPlayerName.focus();


        return;
    }


    // =========================
    // NUMBERS
    // =========================

    const desiredGames =
        parseInt(
            editGames.value,
            10
        );


    const desiredWins =
        parseInt(
            editWins.value,
            10
        );


    const desiredStars =
        parseInt(
            editStars.value,
            10
        );


    // =========================
    // VALIDATE GAMES
    // =========================

    if (
        Number.isNaN(desiredGames) ||
        desiredGames < 0
    ) {

        alert(
            "Enter a valid number of games."
        );


        return;
    }


    // =========================
    // VALIDATE WINS
    // =========================

    if (
        Number.isNaN(desiredWins) ||
        desiredWins < 0
    ) {

        alert(
            "Enter a valid number of wins."
        );


        return;
    }


    // =========================
    // VALIDATE STARS
    // =========================

    if (
        Number.isNaN(desiredStars) ||
        desiredStars < 0
    ) {

        alert(
            "Enter a valid number of stars."
        );


        return;
    }


    // =========================
    // CHECK DUPLICATE NAME
    // =========================

    const duplicate =
        allPlayers.some(
            player =>

                String(player.id) !==
                    String(editingPlayerId) &&

                player.name
                    .trim()
                    .toLowerCase() ===
                name.toLowerCase()
        );


    if (duplicate) {

        alert(
            "That player already exists."
        );


        return;
    }


    // =========================
    // FIND PLAYER
    // =========================

    const player =
        allPlayers.find(
            player =>

                String(player.id) ===
                String(editingPlayerId)
        );


    if (!player) {

        alert(
            "Player could not be found."
        );


        return;
    }


    // =========================
    // GET REAL GAME TOTALS
    // =========================

    const actualStats =
        getActualPlayerStats(
            player.id
        );


    // =========================
    // CALCULATE ADJUSTMENTS
    // =========================

    const gamesAdjustment =
        desiredGames -
        actualStats.gamesPlayed;


    const winsAdjustment =
        desiredWins -
        actualStats.wins;


    const starsAdjustment =
        desiredStars -
        actualStats.stars;


    // =========================
    // SAVE
    // =========================

    savePlayerButton.disabled =
        true;


    savePlayerButton.textContent =
        "Saving...";


    try {

        const {
            error
        } = await supabaseClient
            .from("players")
            .update({

                name: name,

                games_played_adjustment:
                    gamesAdjustment,

                wins_adjustment:
                    winsAdjustment,

                stars_adjustment:
                    starsAdjustment

            })
            .eq(
                "id",
                editingPlayerId
            );


        // =========================
        // CHECK ERROR
        // =========================

        if (error) {

            throw error;

        }


        // =========================
        // UPDATE LOCAL PLAYER
        // =========================

        player.name =
            name;


        player.games_played_adjustment =
            gamesAdjustment;


        player.wins_adjustment =
            winsAdjustment;


        player.stars_adjustment =
            starsAdjustment;


        // =========================
        // CLOSE
        // =========================

        closeEditPlayer();


        // =========================
        // REFRESH
        // =========================

        renderStats();

    }

    catch (error) {

        console.error(
            "Error updating player:",
            error
        );


        alert(
            "Could not update player."
        );

    }

    finally {

        savePlayerButton.disabled =
            false;


        savePlayerButton.textContent =
            "Save";

    }
}


// =========================
// SAVE BUTTON
// =========================

savePlayerButton.addEventListener(
    "click",
    savePlayer
);


// =========================
// CANCEL BUTTON
// =========================

closeEditPlayerButton.addEventListener(
    "click",
    closeEditPlayer
);


// =========================
// ENTER / ESCAPE
// =========================

editPlayerName.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter"
        ) {

            savePlayer();

        }


        if (
            event.key === "Escape"
        ) {

            closeEditPlayer();

        }

    }
);


// =========================
// CLOSE POPUP BY CLICKING
// OUTSIDE
// =========================

editPlayerPopup.addEventListener(
    "click",
    function(event) {

        if (
            event.target ===
            editPlayerPopup
        ) {

            closeEditPlayer();

        }

    }
);


// =========================
// ESCAPE HTML
// =========================

function escapeHtml(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        value;


    return div.innerHTML;
}


// =========================
// INITIAL LOAD
// =========================

loadStats();