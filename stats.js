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


const deletePlayerButton =
    document.getElementById(
        "deletePlayerButton"
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
        // LOAD ACTIVE PLAYERS
        // =========================

        const {
            data: players,
            error: playersError
        } = await supabaseClient
            .from("players")
            .select(`
                id,
                name,
                active,
                games_played_adjustment,
                wins_adjustment,
                stars_adjustment
            `)
            .eq(
                "active",
                true
            )
            .order(
                "name"
            );


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
// GET PLAYER STATS
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


    // =========================
    // WIN PERCENTAGE
    // =========================

    const winPercentage =
        gamesPlayed > 0
            ? (
                wins /
                gamesPlayed
            ) * 100
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
                No active players found.
            </div>
        `;

        return;
    }


    // =========================
    // ADD STATS
    // =========================

    const playersWithStats =
        allPlayers.map(
            player => {

                return {

                    ...player,

                    ...getPlayerStats(
                        player
                    )

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
    // HEADER
    // =========================

    const header =
        document.createElement(
            "div"
        );


    header.className =
        "stats-header";


    header.innerHTML = `

        <div class="header-player">
            Player
        </div>

        <div>
            Games
        </div>

        <div>
            Wins
        </div>

        <div>
            Win %
        </div>

        <div>
            Stars
        </div>

        <div>
            Edit
        </div>

    `;


    statsContainer.appendChild(
        header
    );


    // =========================
    // PLAYER ROWS
    // =========================

    playersWithStats.forEach(
        player => {

            const row =
                createPlayerRow(
                    player
                );


            statsContainer.appendChild(
                row
            );

        }
    );

}


// =========================
// CREATE PLAYER ROW
// =========================

function createPlayerRow(
    player
) {

    const row =
        document.createElement(
            "div"
        );


    row.className =
        "player-stat";


    row.innerHTML = `

        <div class="player-stat-name">
            ${escapeHtml(player.name)}
        </div>


        <div class="stat">
            <strong>
                ${player.gamesPlayed}
            </strong>
        </div>


        <div class="stat">
            <strong>
                ${player.wins}
            </strong>
        </div>


        <div class="stat">
            <strong>
                ${player.winPercentage.toFixed(1)}%
            </strong>
        </div>


        <div class="stat">
            <strong>
                ${player.stars}
            </strong>
        </div>


        <button
            class="edit-player-button"
            type="button"
        >
            Edit
        </button>

    `;


    const editButton =
        row.querySelector(
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


    return row;

}


// =========================
// OPEN EDIT PLAYER
// =========================

function openEditPlayer(
    player
) {

    editingPlayerId =
        player.id;


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


    const name =
        editPlayerName.value.trim();


    if (!name) {

        alert(
            "Enter a player name."
        );

        editPlayerName.focus();

        return;

    }


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
    // DUPLICATE NAME
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
    // ACTUAL STATS
    // =========================

    const actualStats =
        getActualPlayerStats(
            player.id
        );


    // =========================
    // ADJUSTMENTS
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
                active,
                games_played_adjustment,
                wins_adjustment,
                stars_adjustment
            `);


        if (error) {

            throw error;

        }


        if (
            !data ||
            data.length === 0
        ) {

            throw new Error(
                "No player was updated. Check your Supabase RLS UPDATE policy."
            );

        }


        // =========================
        // UPDATE LOCAL DATA
        // =========================

        player.name =
            name;


        player.games_played_adjustment =
            gamesAdjustment;


        player.wins_adjustment =
            winsAdjustment;


        player.stars_adjustment =
            starsAdjustment;


        closeEditPlayer();


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
// DEACTIVATE PLAYER
// =========================

async function deactivatePlayer() {

    if (!editingPlayerId) {

        return;

    }


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


    const confirmed =
        confirm(
            `Deactivate ${player.name}?\n\nThey will be hidden from the player list, but their historical games and stats will remain in the database.`
        );


    if (!confirmed) {

        return;

    }


    deletePlayerButton.disabled =
        true;


    deletePlayerButton.textContent =
        "Deactivating...";


    try {

        const {
            data,
            error
        } = await supabaseClient
            .from("players")
            .update({

                active: false

            })
            .eq(
                "id",
                editingPlayerId
            )
            .select(
                "id, active"
            );


        if (error) {

            throw error;

        }


        if (
            !data ||
            data.length === 0
        ) {

            throw new Error(
                "Player was not updated. Check your Supabase RLS UPDATE policy."
            );

        }


        // =========================
        // REMOVE FROM ACTIVE LIST
        // =========================

        allPlayers =
            allPlayers.filter(
                player =>

                    String(player.id) !==
                    String(editingPlayerId)
            );


        closeEditPlayer();


        renderStats();

    }

    catch (error) {

        console.error(
            "Error deactivating player:",
            error
        );


        alert(
            "Could not deactivate player."
        );

    }

    finally {

        deletePlayerButton.disabled =
            false;


        deletePlayerButton.textContent =
            "Deactivate Player";

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
// DEACTIVATE BUTTON
// =========================

deletePlayerButton.addEventListener(
    "click",
    deactivatePlayer
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
// CLOSE POPUP OUTSIDE
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