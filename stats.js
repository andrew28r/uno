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
// LOAD DATA
// =========================

async function loadStats() {

    statsContainer.innerHTML = `
        <div class="no-players">
            Loading...
        </div>
    `;


    try {

        // =========================
        // GET PLAYERS
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
        // GET GAMES
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
// GET PLAYER STATS
// =========================

function getPlayerStats(
    player
) {

    let gamesPlayed = 0;

    let wins = 0;

    let stars = 0;


    // =========================
    // CALCULATE FROM GAMES
    // =========================

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
                        String(player.id)
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
                    String(player.id)
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
                    game.stars[player.id];


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


    // =========================
    // ADD MANUAL ADJUSTMENTS
    // =========================

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


    gamesPlayed +=
        gamesAdjustment;


    wins +=
        winsAdjustment;


    stars +=
        starsAdjustment;


    // =========================
    // DON'T SHOW NEGATIVE TOTALS
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


    return {

        gamesPlayed,

        wins,

        stars

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
    // BUILD STATS
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
    // SORT
    // =========================

    playersWithStats.sort(
        (a, b) => {

            if (
                b.wins !==
                a.wins
            ) {

                return (
                    b.wins -
                    a.wins
                );

            }


            if (
                b.stars !==
                a.stars
            ) {

                return (
                    b.stars -
                    a.stars
                );

            }


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
    // EDIT
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
    // CURRENT DISPLAYED VALUES
    // =========================

    editPlayerName.value =
        player.name;


    editGames.value =
        player.gamesPlayed;


    editWins.value =
        player.wins;


    editStars.value =
        player.stars;


    editPlayerPopup.classList.remove(
        "hidden"
    );


    editPlayerName.focus();


    editPlayerName.select();
}


// =========================
// CLOSE EDIT POPUP
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
    // GET VALUES
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


    if (
        Number.isNaN(desiredGames) ||
        desiredGames < 0
    ) {

        alert(
            "Enter a valid number of games."
        );


        return;
    }


    if (
        Number.isNaN(desiredWins) ||
        desiredWins < 0
    ) {

        alert(
            "Enter a valid number of wins."
        );


        return;
    }


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
    // GET ACTUAL GAME STATS
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
    // DISABLE BUTTON
    // =========================

    savePlayerButton.disabled =
        true;


    savePlayerButton.textContent =
        "Saving...";


    try {

        // =========================
        // UPDATE SUPABASE
        // =========================

        const {
            data,
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
            )
            .select(`
                id,
                name,
                games_played_adjustment,
                wins_adjustment,
                stars_adjustment
            `)
            .single();


        if (error) {

            throw error;

        }


        // =========================
        // UPDATE LOCAL PLAYER
        // =========================

        player.name =
            data.name;


        player.games_played_adjustment =
            data.games_played_adjustment;


        player.wins_adjustment =
            data.wins_adjustment;


        player.stars_adjustment =
            data.stars_adjustment;


        // =========================
        // CLOSE POPUP
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
// GET ACTUAL STATS
// WITHOUT ADJUSTMENTS
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
            // GAMES
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