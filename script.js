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
// GAME STATE
// =========================

let players = [];

let selectedWinnerId = null;


// =========================
// DOM ELEMENTS
// =========================

const playersContainer =
    document.getElementById("players");

const recordGameButton =
    document.getElementById(
        "recordGameButton"
    );

const playerPopup =
    document.getElementById(
        "playerPopup"
    );

const existingPlayersContainer =
    document.getElementById(
        "existingPlayers"
    );

const createPlayerButton =
    document.getElementById(
        "createPlayerButton"
    );

const closePlayerPopupButton =
    document.getElementById(
        "closePlayerPopup"
    );

const newPlayerPopup =
    document.getElementById(
        "newPlayerPopup"
    );

const newPlayerName =
    document.getElementById(
        "newPlayerName"
    );

const saveNewPlayerButton =
    document.getElementById(
        "saveNewPlayerButton"
    );

const closeNewPlayerPopupButton =
    document.getElementById(
        "closeNewPlayerPopup"
    );

const winnerPopup =
    document.getElementById(
        "winnerPopup"
    );

const winnerPlayersContainer =
    document.getElementById(
        "winnerPlayers"
    );

const starPlayersContainer =
    document.getElementById(
        "starPlayers"
    );

const saveGameButton =
    document.getElementById(
        "saveGameButton"
    );

const cancelWinnerButton =
    document.getElementById(
        "cancelWinnerButton"
    );


const gameMessage =
    document.getElementById(
        "gameMessage"
    );


const newPlayerMessage =
    document.getElementById(
        "newPlayerMessage"
    );


const gameResultMessage =
    document.getElementById(
        "gameResultMessage"
    );

// =========================
// SHOW MESSAGE
// =========================

function showMessage(
    element,
    message
) {

    if (!element) {
        return;
    }


    element.textContent =
        message;
}


// =========================
// CLEAR MESSAGE
// =========================

function clearMessage(
    element
) {

    if (!element) {
        return;
    }


    element.textContent =
        "";
}

// =========================
// GET ACTIVE PLAYERS
// =========================

async function getPlayers() {

    const {
        data,
        error
    } = await supabaseClient
        .from("players")
        .select("id, name, active")
        .eq("active", true)
        .order("name");

    if (error) {

        console.error(
            "Error loading players:",
            error
        );

        showMessage(
            gameMessage,
            "Could not load players."
        );

        return [];
    }

    return data || [];
}


// =========================
// GET WIN COUNTS
// =========================

async function getWinCounts() {

    const {
        data,
        error
    } = await supabaseClient
        .from("games")
        .select("winner_id");

    if (error) {

        console.error(
            "Error loading wins:",
            error
        );

        return {};
    }

    const winCounts = {};

    (data || []).forEach(
        game => {

            if (!game.winner_id) {
                return;
            }

            if (
                !winCounts[game.winner_id]
            ) {

                winCounts[game.winner_id] =
                    0;

            }

            winCounts[game.winner_id]++;

        }
    );

    return winCounts;
}


// =========================
// GET STAR COUNTS
// =========================

async function getStarCounts() {

    const {
        data,
        error
    } = await supabaseClient
        .from("games")
        .select("stars");

    if (error) {

        console.error(
            "Error loading stars:",
            error
        );

        return {};
    }

    const starCounts = {};

    (data || []).forEach(
        game => {

            if (!game.stars) {
                return;
            }

            Object.entries(
                game.stars
            ).forEach(
                ([playerId, stars]) => {

                    const numberOfStars =
                        Number(stars) || 0;

                    if (
                        !starCounts[playerId]
                    ) {

                        starCounts[playerId] =
                            0;

                    }

                    starCounts[playerId] +=
                        numberOfStars;

                }
            );

        }
    );

    return starCounts;
}


// =========================
// RENDER PLAYERS
// =========================

async function renderPlayers() {

    playersContainer.innerHTML = "";

    const [
        winCounts,
        starCounts
    ] = await Promise.all([

        getWinCounts(),

        getStarCounts()

    ]);


    // =========================
    // PLAYER CARDS
    // =========================

    players.forEach(
        (player, index) => {

            const wins =
                winCounts[player.id] || 0;

            const stars =
                starCounts[player.id] || 0;

            const card =
                createPlayerCard(
                    player,
                    index,
                    wins,
                    stars
                );

            playersContainer.appendChild(
                card
            );

        }
    );


    // =========================
    // ADD PLAYER CARD
    // =========================

    const emptyCard =
        document.createElement("div");

    emptyCard.className =
        "player empty-player";

    emptyCard.innerHTML = `
        <div class="add-text">
            Add Player
        </div>
    `;

    emptyCard.addEventListener(
        "click",
        openAddPlayerPopup
    );

    playersContainer.appendChild(
        emptyCard
    );
}


// =========================
// CREATE PLAYER CARD
// =========================

function createPlayerCard(
    player,
    index,
    wins,
    stars
) {

    const card =
        document.createElement("div");

    card.className =
        "player";

    card.innerHTML = `

        <button
            class="remove-button"
            type="button"
            aria-label="Remove player"
        >
            X
        </button>

        <div class="player-info">

            <div class="name">
                ${escapeHtml(player.name)}
            </div>

            <div class="wins">
                Wins: ${wins}
            </div>

            <div class="stars">
                Stars: ${stars}
            </div>

        </div>

    `;


    // =========================
    // REMOVE FROM CURRENT GAME
    // =========================

    const removeButton =
        card.querySelector(
            ".remove-button"
        );

    removeButton.addEventListener(
        "click",
        function(event) {

            event.stopPropagation();

            removePlayer(index);

        }
    );

    return card;
}


// =========================
// REMOVE PLAYER
// FROM CURRENT GAME ONLY
// =========================

function removePlayer(index) {

    if (!players[index]) {
        return;
    }

    players.splice(
        index,
        1
    );

    renderPlayers();
}


// =========================
// OPEN ADD PLAYER POPUP
// =========================

async function openAddPlayerPopup() {

    const databasePlayers =
        await getPlayers();

    existingPlayersContainer.innerHTML =
        "";


    // =========================
    // REMOVE PLAYERS ALREADY
    // IN CURRENT GAME
    // =========================

    const availablePlayers =
        databasePlayers.filter(
            databasePlayer => {

                return !players.some(
                    currentPlayer =>

                        String(
                            currentPlayer.id
                        ) ===
                        String(
                            databasePlayer.id
                        )
                );

            }
        );


    // =========================
    // NO AVAILABLE PLAYERS
    // =========================

    if (
        availablePlayers.length === 0
    ) {

        const message =
            document.createElement("p");

        message.textContent =
            "No available players.";

        existingPlayersContainer
            .appendChild(
                message
            );

    }


    // =========================
    // SHOW ACTIVE PLAYERS
    // =========================

    else {

        availablePlayers.forEach(
            player => {

                const button =
                    document.createElement(
                        "button"
                    );

                button.type =
                    "button";

                button.textContent =
                    player.name;

                button.addEventListener(
                    "click",
                    function() {

                        addExistingPlayer(
                            player
                        );

                    }
                );

                existingPlayersContainer
                    .appendChild(
                        button
                    );

            }
        );

    }


    playerPopup.classList.remove(
        "hidden"
    );
}


// =========================
// ADD EXISTING PLAYER
// =========================

function addExistingPlayer(
    player
) {

    // Safety check:
    // Only active players can be added.

    if (player.active === false) {
        return;
    }


    const alreadyPlaying =
        players.some(
            currentPlayer =>

                String(
                    currentPlayer.id
                ) ===
                String(
                    player.id
                )
        );

    if (alreadyPlaying) {
        return;
    }


    players.push({

        id: player.id,

        name: player.name

    });


    closeAddPlayerPopup();

    renderPlayers();
}


// =========================
// CREATE NEW PLAYER
// =========================

createPlayerButton.addEventListener(
    "click",
    function() {

        closeAddPlayerPopup();

        newPlayerName.value = "";

        newPlayerPopup.classList.remove(
            "hidden"
        );

        newPlayerName.focus();

    }
);


// =========================
// SAVE NEW PLAYER
// =========================

async function createNewPlayer() {


    clearMessage(
        newPlayerMessage
    );


    const name =
        newPlayerName.value.trim();

    if (!name) {

        showMessage(
            newPlayerMessage,
            "Enter a player name."
        );

        newPlayerName.focus();

        return;
    }


    // =========================
    // CHECK EXISTING PLAYERS
    // =========================

    const {
        data: existingPlayers,
        error: existingPlayersError
    } = await supabaseClient
        .from("players")
        .select("id, name, active");

    if (existingPlayersError) {

        console.error(
            "Error checking players:",
            existingPlayersError
        );

        showMessage(
            newPlayerMessage,
            "Could not check existing players."
        );

        return;
    }


    const alreadyExists =
        (existingPlayers || []).some(
            player =>

                player.name
                    .trim()
                    .toLowerCase() ===
                name.toLowerCase()
        );


    if (alreadyExists) {

        showMessage(
            newPlayerMessage,
            "That player already exists."
        );

        return;
    }


    // =========================
    // INSERT ACTIVE PLAYER
    // =========================

    const {
        data,
        error
    } = await supabaseClient
        .from("players")
        .insert({

            name: name,

            active: true

        })
        .select("id, name, active")
        .single();


    if (error) {

        console.error(
            "Error creating player:",
            error
        );

        showMessage(
            newPlayerMessage,
            "Could not create player."
        );

        return;
    }


    // =========================
    // ADD NEW PLAYER
    // DIRECTLY TO CURRENT GAME
    // =========================

    players.push({

        id: data.id,

        name: data.name,

        active: data.active

    });


    newPlayerName.value = "";


    closeNewPlayerPopupWindow();


    // =========================
    // REFRESH IMMEDIATELY
    // =========================

    await renderPlayers();
}


// =========================
// SAVE NEW PLAYER BUTTON
// =========================

saveNewPlayerButton.addEventListener(
    "click",
    createNewPlayer
);


// =========================
// ENTER TO CREATE PLAYER
// =========================

newPlayerName.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Enter"
        ) {

            createNewPlayer();

        }

    }
);


// =========================
// CLOSE ADD PLAYER POPUP
// =========================

closePlayerPopupButton.addEventListener(
    "click",
    closeAddPlayerPopup
);


function closeAddPlayerPopup() {

    playerPopup.classList.add(
        "hidden"
    );
}


// =========================
// CLOSE NEW PLAYER POPUP
// =========================

closeNewPlayerPopupButton.addEventListener(
    "click",
    closeNewPlayerPopupWindow
);


function closeNewPlayerPopupWindow() {

    newPlayerPopup.classList.add(
        "hidden"
    );

    newPlayerName.value = "";
}


// =========================
// RECORD GAME
// =========================

recordGameButton.addEventListener(
    "click",
    openWinnerPopup
);


// =========================
// OPEN RECORD GAME POPUP
// =========================

function openWinnerPopup() {

    clearMessage(
        gameMessage
    );


    // =========================
    // REQUIRE AT LEAST 2 PLAYERS
    // =========================

    if (players.length < 2) {

        showMessage(
            gameMessage,
            "You need at least 2 players to start a game."
        );

        return;
    }


    selectedWinnerId = null;

    winnerPlayersContainer.innerHTML = "";

    starPlayersContainer.innerHTML = "";


    // =========================
    // WINNER BUTTONS
    // =========================

    players.forEach(
        player => {

            const button =
                document.createElement("button");

            button.type = "button";

            button.textContent =
                player.name;

            button.addEventListener(
                "click",
                function() {

                    selectWinner(
                        player.id,
                        button
                    );

                }
            );

            winnerPlayersContainer.appendChild(
                button
            );

        }
    );


    // =========================
    // STAR CONTROLS
    // =========================

    players.forEach(
        player => {

            const row =
                document.createElement("div");

            row.className =
                "star-row";

            row.dataset.playerId =
                player.id;

            row.innerHTML = `

                <div class="star-player-name">
                    ${escapeHtml(player.name)}
                </div>

                <div class="star-controls">

                    <button
                        type="button"
                        class="star-minus"
                    >
                        -
                    </button>

                    <div class="star-count">

                        <span class="star-value">
                            0
                        </span>

                    </div>

                    <button
                        type="button"
                        class="star-plus"
                    >
                        +
                    </button>

                </div>

            `;


            const minusButton =
                row.querySelector(
                    ".star-minus"
                );

            const plusButton =
                row.querySelector(
                    ".star-plus"
                );

            const starValue =
                row.querySelector(
                    ".star-value"
                );


            let starCount = 0;


            // =========================
            // MINUS STAR
            // =========================

            minusButton.addEventListener(
                "click",
                function() {

                    if (starCount > 0) {

                        starCount--;

                        starValue.textContent =
                            starCount;

                    }

                }
            );


            // =========================
            // PLUS STAR
            // =========================

            plusButton.addEventListener(
                "click",
                function() {

                    starCount++;

                    starValue.textContent =
                        starCount;

                }
            );


            starPlayersContainer.appendChild(
                row
            );

        }
    );


    winnerPopup.classList.remove(
        "hidden"
    );
}


// =========================
// SELECT WINNER
// =========================

function selectWinner(
    playerId,
    button
) {

    selectedWinnerId =
        playerId;


    const buttons =
        winnerPlayersContainer
            .querySelectorAll(
                "button"
            );


    buttons.forEach(
        currentButton => {

            currentButton.classList.remove(
                "selected"
            );

        }
    );


    button.classList.add(
        "selected"
    );
}


// =========================
// SAVE GAME
// =========================

async function saveRecordedGame() {

    clearMessage(
        gameResultMessage
    );
    // =========================
    // VALIDATE WINNER
    // =========================

    if (!selectedWinnerId) {

        showMessage(
            gameResultMessage,
            "Select a winner first."
        );

        return;
    }


    if (players.length === 0) {

        showMessage(
            gameResultMessage,
            "There are no players in the game."
        );

        return;
    }


    // =========================
    // DISABLE SAVE
    // =========================

    saveGameButton.disabled =
        true;

    saveGameButton.textContent =
        "Saving...";


    try {

        // =========================
        // PLAYER IDS
        // =========================

        const playerIds =
            players.map(
                player => player.id
            );


        // =========================
        // BUILD STARS OBJECT
        // =========================

        const stars = {};

        const starRows =
            starPlayersContainer
                .querySelectorAll(
                    ".star-row"
                );


        starRows.forEach(
            row => {

                const playerId =
                    row.dataset.playerId;


                const starValue =
                    row.querySelector(
                        ".star-value"
                    );


                const starCount =
                    parseInt(
                        starValue.textContent,
                        10
                    ) || 0;


                stars[playerId] =
                    starCount;

            }
        );


        // =========================
        // SAVE ONE GAME ROW
        // =========================

        const {
            data: game,
            error
        } = await supabaseClient
            .from("games")
            .insert({

                player_ids: playerIds,

                winner_id: selectedWinnerId,

                stars: stars

            })
            .select()
            .single();


        if (error) {

            throw error;

        }


        console.log(
            "Game saved:",
            game
        );


        // =========================
        // CLOSE POPUP
        // =========================

        winnerPopup.classList.add(
            "hidden"
        );

        selectedWinnerId = null;


        // =========================
        // REFRESH PLAYER TOTALS
        // =========================

        await renderPlayers();


        // =========================
        // FIND WINNER
        // =========================

        const winner =
            players.find(
                player =>

                    String(
                        player.id
                    ) ===
                    String(
                        game.winner_id
                    )
            );


        if (winner) {

            /*
            alert(
                `${winner.name} won!`
            );
            */

        }

    }

    catch (error) {

        console.error(
            "Error recording game:",
            error
        );

        showMessage(
            gameResultMessage,
            "Could not save the game."
        );

    }

    finally {

        saveGameButton.disabled =
            false;

        saveGameButton.textContent =
            "Save Game";

    }
}


// =========================
// SAVE GAME BUTTON
// =========================

saveGameButton.addEventListener(
    "click",
    saveRecordedGame
);


// =========================
// CANCEL RECORD GAME
// =========================

cancelWinnerButton.addEventListener(
    "click",
    function() {

        winnerPopup.classList.add(
            "hidden"
        );

        selectedWinnerId = null;

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

players = [];

renderPlayers();

