
//Used for preventing gameplay before setup is complete
let gameStarted = false;

//globally defines gamemode to allow functions to behave differently with 2-4 players
let gamemode = null;

//tracks rounds for tournament play
let gameCounter = 1;

//tracks if a multi-jump is in play
let multiJumpInProgress = false;

//tracks the square a piece jumped from for multi-jump logic
let jumpOriginSquare = null;

//Initial player/piece allocation
let selectedPiece = null;
let currentPlayer = 'white';
const playerNames = {
  white: 'Player 1',
  black: 'Player 2'
};
let victor1, victor2, victor3 = ' ';

//Used for enforcing jump rules
let forcedJumpSquares = [];

//Game board generation
const board = document.getElementById('board');

for (let row = 0; row < 8; row++) {
  for (let col = 0; col < 8; col++) {
    const square = document.createElement('div');
    square.classList.add('square');
    square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
    square.dataset.row = row;
    square.dataset.col = col;
    board.appendChild(square);

    // Add checkers onto board
    if ((row + col) % 2 === 1) {
      if (row < 3) {
        const piece = document.createElement('div');
        piece.classList.add('piece', 'white');
        square.appendChild(piece);
      } else if (row > 4) {
        const piece = document.createElement('div');
        piece.classList.add('piece', 'black');
        square.appendChild(piece);
      }
    }

    //makes the board clickable
    square.addEventListener('click', () => handleSquareClick(square));
    board.appendChild(square);
    
  }
}

//input UI initialisation/visibility
function updateSetupDisplay() {
  const gamemodeSelect = document.getElementById("gamemode");
  const setup2p = document.getElementById("setup2p");
  const setup4p = document.getElementById("setup4p");

  if (gamemodeSelect.value === "2player") {
    setup2p.style.display = "block";
    setup4p.style.display = "none";
  } else if (gamemodeSelect.value === "4player") {
    setup2p.style.display = "none";
    setup4p.style.display = "block";
  }
}

//page load call for setup UI
document.addEventListener("DOMContentLoaded", function () {
const gamemodeSelect = document.getElementById("gamemode");
  gamemodeSelect.addEventListener("change", updateSetupDisplay);
  updateSetupDisplay();
});

//Completes game setup and initiates game/player tracking
function startGame() {
  gamemode = document.getElementById("gamemode").value;
  let p1, p2;
  //retrieves player names from setup UI
  if (gamemode === "2player") {
    const name1 = document.getElementById('player1_2p').value.trim() || null;
    const name2 = document.getElementById('player2_2p').value.trim() || null;

    if (!name1 || !name2) { //ensures names are entered for both players
    alert("Please enter names for both players."); 
    return;
    }
  
    p1 = name1;
    p2 = name2;

  } else if (gamemode === "4player") {
    const name1 = document.getElementById('player1_4p').value.trim() || null;
    const name2 = document.getElementById('player2_4p').value.trim() || null;
    const name3 = document.getElementById('player3_4p').value.trim() || null;
    const name4 = document.getElementById('player4_4p').value.trim() || null;

    if (!name1 || !name2 || !name3 || !name4) { //ensures names entered for all players
    alert("Please enter names for all players."); 
    return;
    }
  
  //assigns received player names to game based on round of play
    if (gameCounter === 1) {
      p1 = name1;
      p2 = name2;
    } else if (gameCounter === 2) {
        p1 = name3;
        p2 = name4;
    } else if (gameCounter === 3) {
        p1 = victor1;
        p2 = victor2;
    } else {
        alert("Tournament is complete.")
        return;
    }
  }
  //assigns the players to pieces
  playerNames.white = p1;
  playerNames.black = p2;

  currentPlayer = 'white'; //always start with white pieces

  //hides setup options/UI from user in preparation for gameplay
  document.getElementById("setupselect").style.display = "none";
  document.getElementById("gamemode").style.display = "none";
  document.getElementById("setup2p").style.display = "none";
  document.getElementById("setup4p").style.display = "none";

  gameStarted = true; //allows gameplay to start

  alert(`${playerNames.white} (White) goes first.`);
  updateTurnDisplay(); 
}

//mouse-activated gameplay handling & enforcing of jump rule interaction
function handleSquareClick(square) {
  if (!gameStarted) return;

  const piece = square.querySelector('.piece');

  //ensures subsequent jumps can only be completed with the piece that jumped
  if (multiJumpInProgress) {
    if (!isValidMove(jumpOriginSquare, square)) {
      alert(`${playerNames[currentPlayer]}, you must continue jumping with the same piece.`);
      return;
    }
  //keeps jumping piece selected in the event of a multi-jump
  } else {
    forcedJumpSquares = getForcedJumpSquares(currentPlayer);

    if (piece && piece.classList.contains(currentPlayer)) {
      if (forcedJumpSquares.length > 0 && !forcedJumpSquares.includes(square)) {
        alert("You must choose a piece that can jump.");
        return;
      }

      //ensures player can change their initial selection for non-jump moves
      selectedPiece = square;
      highlight(square);
      return;
    }
  }

  //validates general movement of a selected piece
  if (selectedPiece || (multiJumpInProgress && jumpOriginSquare)) {
    const activePieceSquare = selectedPiece || jumpOriginSquare;

    if (isValidMove(activePieceSquare, square)) {
      const isJump = Math.abs(parseInt(activePieceSquare.dataset.row) - parseInt(square.dataset.row)) === 2;

      if (forcedJumpSquares.length > 0 && !isJump) {
        alert("You must jump if able.");
        return;
      }

      movePiece(activePieceSquare, square);

      //Checks for multi-jumps
      if (isJump && canPieceJump(square)) {
        multiJumpInProgress = true;
        jumpOriginSquare = square;
        selectedPiece = square;
        highlight(square);
        return;
      }

      //ends the turn when no more jumps are possible
      multiJumpInProgress = false;
      jumpOriginSquare = null;
      selectedPiece = null;
      forcedJumpSquares = [];
      togglePlayer();
      updateTurnDisplay();
      checkWinCondition();
    } 
    
  }
}
 
//highlighting of squares
function highlight(square) {
  document.querySelectorAll('.square').forEach(sq => sq.classList.remove('highlight'));
  square.classList.add('highlight');
}

//moving pieces
function movePiece(fromSquare, toSquare) {
  const piece = fromSquare.querySelector('.piece');
  const fromRow = parseInt(fromSquare.dataset.row);
  const fromCol = parseInt(fromSquare.dataset.col);
  const toRow = parseInt(toSquare.dataset.row);
  const toCol = parseInt(toSquare.dataset.col);

  // If it's a jump, remove the captured piece
  if (Math.abs(fromRow - toRow) === 2 && Math.abs(fromCol - toCol) === 2) {
    const midRow = (fromRow + toRow) / 2;
    const midCol = (fromCol + toCol) / 2;
    const midSquare = document.querySelector(`[data-row='${midRow}'][data-col='${midCol}']`);
    midSquare.innerHTML = '';
  }

  toSquare.appendChild(piece);
  fromSquare.classList.remove('highlight');

  //king logic
  //(updated to check if piece is already a king and add kinging text pop-up)
  if (((currentPlayer === 'white' && toRow === 7) || (currentPlayer === 'black' && toRow === 0)) && !piece.classList.contains('king')) {
  piece.classList.add('king');
  piece.innerHTML = '<span class="king-label">♔</span>';
  showKingText(currentPlayer); // triggers "King me!" text pop-up
 }
}

//pops up text saying "King me!" for respective piece/player colour being kinged
//(updated to also play "king me" sound)
function showKingText(playerColor) {
  
  //play "king me" sound
  const audio = document.getElementById('kingMeSound');
  if (audio) {
    audio.currentTime = 0; //rewind in case of multiple triggers
    audio.play();
  }
  //pop up "King me!" text
  const container = document.getElementById('kingTextContainer');
  const text = document.createElement('div');
  text.classList.add('king-popup', playerColor);
  text.innerText = 'King me!';

  //semi-random position referencing 480x480 square at center of page
  const x = Math.floor(Math.random() * 480);
  const y = Math.floor(Math.random() * 480);

  text.style.left = `${x}px`;
  text.style.top = `${y}px`;
  text.style.fontSize = `${40 + Math.floor(Math.random() * 20)}px`;

  container.appendChild(text);

  setTimeout(() => container.removeChild(text), 2500);
}

//general move validation
function isValidMove(from, to) {
  const fromRow = parseInt(from.dataset.row);
  const fromCol = parseInt(from.dataset.col);
  const toRow = parseInt(to.dataset.row);
  const toCol = parseInt(to.dataset.col);

  //must be a dark square and empty
  if (!to.classList.contains('dark') || to.querySelector('.piece')) return false;

  const piece = from.querySelector('.piece');
  const isKing = piece.classList.contains('king');
  const direction = currentPlayer === 'white' ? 1 : -1;

  const rowDiff = toRow - fromRow;
  const colDiff = toCol - fromCol;

  //simple diagonal move
  if (Math.abs(rowDiff) === 1 && Math.abs(colDiff) === 1) {
    if (isKing || rowDiff === direction) return true;
  }

  //jump move
  if (Math.abs(rowDiff) === 2 && Math.abs(colDiff) === 2) {
    const midRow = (fromRow + toRow) / 2;
    const midCol = (fromCol + toCol) / 2;
    const midSquare = document.querySelector(`[data-row='${midRow}'][data-col='${midCol}']`);
    const midPiece = midSquare.querySelector('.piece');
    if (midPiece && midPiece.classList.contains(opponent())) {
      return isKing || rowDiff === 2 * direction;
    }
  }

  return false;
}

//jump validation
function canPieceJump(square) {
  const piece = square.querySelector('.piece');
  if (!piece) return false;

  const fromRow = parseInt(square.dataset.row);
  const fromCol = parseInt(square.dataset.col);
  const isKing = piece.classList.contains('king');
  const directions = isKing ? [-1, 1] : [piece.classList.contains('white') ? 1 : -1];

  for (let dr of directions) {
    for (let dc of [-1, 1]) {
      const toRow = fromRow + dr * 2;
      const toCol = fromCol + dc * 2;
      const jumpSquare = document.querySelector(`[data-row='${toRow}'][data-col='${toCol}']`);
      if (jumpSquare && isValidMove(square, jumpSquare)) {
        return true;
      }
    }
  }

  return false;
}

//support
function opponent() {
  return currentPlayer === 'white' ? 'black' : 'white';
}

//toggles between players
function togglePlayer() {
  currentPlayer = opponent();
}


//displays player turn (also shows round for tournament)
function updateTurnDisplay() {

  if (gamemode === "2player") {
    document.getElementById('turnDisplay').innerText = 
    `Player turn: ${playerNames[currentPlayer]} (${currentPlayer})`;

} else document.getElementById('turnDisplay').innerText = 
`Player turn: ${playerNames[currentPlayer]} (${currentPlayer})  -  Round: ${gameCounter}`
}


//checks for a stalemate
function hasAnyLegalMoves(playerColor) {
  const pieces = document.querySelectorAll(`.piece.${playerColor}`);
  for (let piece of pieces) {
    const square = piece.parentElement;
    const fromRow = parseInt(square.dataset.row);
    const fromCol = parseInt(square.dataset.col);
    const isKing = piece.classList.contains('king');
    const directions = isKing ? [-1, 1] : [playerColor === 'white' ? 1 : -1];

    for (let dr of directions) {
      for (let dc of [-1, 1]) {
        const toRow = fromRow + dr;
        const toCol = fromCol + dc;
        const toSquare = document.querySelector(`[data-row='${toRow}'][data-col='${toCol}']`);
        if (toSquare && isValidMove(square, toSquare)) return true;

        const jumpRow = fromRow + dr * 2;
        const jumpCol = fromCol + dc * 2;
        const jumpSquare = document.querySelector(`[data-row='${jumpRow}'][data-col='${jumpCol}']`);
        if (jumpSquare && isValidMove(square, jumpSquare)) return true;
      }
    }
  }
  return false;
}

//forces jump when available
function getForcedJumpSquares(playerColor) {
  const candidates = [];
  const pieces = document.querySelectorAll(`.piece.${playerColor}`);

  for (let piece of pieces) {
    const square = piece.parentElement;
    const fromRow = parseInt(square.dataset.row);
    const fromCol = parseInt(square.dataset.col);
    const isKing = piece.classList.contains('king');
    const directions = isKing ? [-1, 1] : [playerColor === 'white' ? 1 : -1];

    for (let dr of directions) {
      for (let dc of [-1, 1]) {
        const toRow = fromRow + dr * 2;
        const toCol = fromCol + dc * 2;
        const jumpSquare = document.querySelector(`[data-row='${toRow}'][data-col='${toCol}']`);
        if (jumpSquare && isValidMove(square, jumpSquare)) {
          candidates.push(square);
          break; // this piece can jump; no need to check more directions
        }
      }
    }
  }
  return candidates;
}

//wins & stalemate
function checkWinCondition() {
  const whitePieces = document.querySelectorAll('.piece.white');
  const blackPieces = document.querySelectorAll('.piece.black');

  if (whitePieces.length === 0) {
    alert(`${playerNames.black} (black) wins!`);
    storeVictor(playerNames.black);
    endGame();
    return;
  }

  if (blackPieces.length === 0) {
    alert(`${playerNames.white} (white) wins!`);
    storeVictor(playerNames.white);
    endGame();
    return;
  }

  if (!hasAnyLegalMoves('white') && !hasAnyLegalMoves('black')) {
    if (gamemode === "4player") {
      alert("Stalemate! Tournament cannot continue.");
      victor3 = ' '; //force draw
      gameCounter = 4; //skip to end
    } else {
      alert("Stalemate! It's a draw.");
    }
    endGame();
  }
}


//stores the winner of each round
function storeVictor(winner) {
  if (gameCounter === 1) {
    victor1 = winner;
  } else if (gameCounter === 2) {
    victor2 = winner;
  } else if (gameCounter === 3) {
    victor3 = winner;
  }
}


//end game or round
function endGame() {
  document.querySelectorAll('.square').forEach(sq => {
    sq.replaceWith(sq.cloneNode(true)); //removes event listeners
  });

  document.getElementById('turnDisplay').innerText = 'Game over';

  if (gamemode === "2player") {
    document.getElementById('resetButton').style.display = 'inline-block';
  } else if (gameCounter < 3) {
    gameCounter++;
    document.getElementById('roundButton').style.display = 'inline-block';
  } else {
    const winner = victor3 !== ' ' ? victor3 : null;
    alert(winner ? `Tournament complete - ${winner} wins!` : `Tournament complete - it's a draw!`);
    document.getElementById('resetButton').style.display = 'inline-block';
  }
}

//initialises the next round of play in a tournament
function resetRound() {
  resetBoard();  // Just resets board, keeps winners and names
  startGame();
}

//reset board between rounds without resetting all game info
function resetBoard() {
  board.innerHTML = '';
  selectedPiece = null;
  currentPlayer = 'white';
  forcedJumpSquares = [];
  multiJumpInProgress = false;
  jumpOriginSquare = null;

  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement('div');
      square.classList.add('square');
      square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
      square.dataset.row = row;
      square.dataset.col = col;

      if ((row + col) % 2 === 1) {
        if (row < 3) {
          const piece = document.createElement('div');
          piece.classList.add('piece', 'white');
          square.appendChild(piece);
        } else if (row > 4) {
          const piece = document.createElement('div');
          piece.classList.add('piece', 'black');
          square.appendChild(piece);
        }
      }

      square.addEventListener('click', () => handleSquareClick(square));
      board.appendChild(square);
    }
  }

  updateTurnDisplay();
  document.getElementById('resetButton').style.display = 'none';
  document.getElementById('roundButton').style.display = 'none';
}

//fully resets the player/game info and allows for a new game to be set up
function resetGame() {
  board.innerHTML = '';
  selectedPiece = null;
  currentPlayer = 'white';
  gameCounter = 1;
  gameStarted = false;
  multiJumpInProgress = false;
  jumpOriginSquare = null;
  victor1 = '';
  victor2 = '';
  victor3 = ' ';


  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement('div');
      square.classList.add('square');
      square.classList.add((row + col) % 2 === 0 ? 'light' : 'dark');
      square.dataset.row = row;
      square.dataset.col = col;

      if ((row + col) % 2 === 1) {
        if (row < 3) {
          const piece = document.createElement('div');
          piece.classList.add('piece', 'white');
          square.appendChild(piece);
        } else if (row > 4) {
          const piece = document.createElement('div');
          piece.classList.add('piece', 'black');
          square.appendChild(piece);
        }
      }

      square.addEventListener('click', () => handleSquareClick(square));
      board.appendChild(square);
    }
  }

  //resets the displaying of setup UI
  document.getElementById("setupselect").style.display = "block";
  document.getElementById('resetButton').style.display = 'none';
  document.getElementById('roundButton').style.display = 'none';
  document.getElementById("gamemode").style.display = "inline-block";
  document.getElementById("startButton").style.display = "inline-block";
  document.getElementById("turnDisplay").style.display = 'none';
}




