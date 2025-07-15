export function setupGameListeners(socket) {
  document.addEventListener("DOMContentLoaded", () => {
    const questionText = document.getElementById("question");
    const roundNumber = document.getElementById("round-number");
    const answerInput = document.getElementById("answerInput");
    const answerBtn = document.getElementById("answerBtn");
    const stealBtn = document.getElementById("stealBtn");

    const playerResultBox = document.getElementById("player-result");
    const opponentResultBox = document.getElementById("opponent-result");
    const playerScoreEl = document.getElementById("player-score");
    const opponentScoreEl = document.getElementById("opponent-score");

    let currentQuestion = null;
    let currentRound = 1;
    let playerScore = 0;
    let opponentScore = 0;
    let maxRounds = 10;

    socket.on("gameStart", (data) => {
      currentQuestion = data.question;
      questionText.textContent = currentQuestion;
      roundNumber.textContent = currentRound;
      maxRounds = data.totalRounds;
      document.getElementById("max-rounds").textContent = maxRounds;
      answerInput.value = "";
      answerBtn.disabled = false;
      stealBtn.disabled = false;
      answerInput.disabled = false;

      playerResultBox.textContent = "";
      opponentResultBox.textContent = "";
    });

    socket.on("roundResult", (data) => {
      const you = data.you;
      const opponent = data.opponent;

      // Result display for player
      if (you.type === "answer") {
        if (you.response !== null && you.points !== undefined) {
          playerResultBox.textContent =
            "ANSWER - " + you.response + " - " + you.points + " point" + (you.points !== 1 ? "s" : "");
        } else {
          playerResultBox.textContent = "ANSWER - INVALID";
        }
      } else if (you.type === "steal") {
        if (you.points !== undefined) {
          playerResultBox.textContent =
            "STEAL - " + you.points + " POINT" + (you.points !== 1 ? "S" : "");
        } else {
          playerResultBox.textContent = "STEAL - ERROR";
        }
      }

      // Result display for opponent
      if (opponent.type === "answer") {
        if (opponent.response !== null && opponent.points !== undefined) {
          opponentResultBox.textContent =
            "ANSWER - " + opponent.response + " - " + opponent.points + " POINT" + (opponent.points !== 1 ? "S" : "");
        } else {
          opponentResultBox.textContent = "ANSWER - INVALID";
        }
      } else if (opponent.type === "steal") {
        if (opponent.points !== undefined) {
          opponentResultBox.textContent =
            "STEAL - " + opponent.points + " POINT" + (opponent.points !== 1 ? "S" : "");
        } else {
          opponentResultBox.textContent = "STEAL - ERROR";
        }
      }

      console.log("ROUND RESULT:", data);

      let playerPoints = parseInt(you.points);
      let opponentPoints = parseInt(opponent.points);

      if (!isNaN(playerPoints)) {
        playerScore += playerPoints;
      } else {
        console.warn("Invalid player points:", you.points);
      }

      if (!isNaN(opponentPoints)) {
        opponentScore += opponentPoints;
      } else {
        console.warn("Invalid opponent points:", opponent.points);
      }

      playerScoreEl.textContent = playerScore;
      opponentScoreEl.textContent = opponentScore;


      currentRound++;

      // Next round or end game
      if (currentRound <= maxRounds) {
        setTimeout(() => {
          socket.emit("requestNextQuestion");
        }, 2500);
      } else {
        setTimeout(() => {
          questionText.textContent = "Game Over!";
          answerBtn.disabled = true;
          stealBtn.disabled = true;
          answerInput.disabled = true;

          if (playerScore > opponentScore){
            playerResultBox.textContent = "WINNER!"
            opponentResultBox.textContent = "YOU LOSE!"
          }
          else if(opponentScore > playerScore){
            opponentResultBox.textContent = "WINNER!"
            playerResultBox.textContent = "YOU LOSE!"
          }
          else{
            playerResultBox.textContent = "DRAW. You both are just as bad as each other!"
            opponentResultBox.textContent = "DRAW. You both are just as bad as each other!"
          }
        }, 2500);
      }
    });

    answerBtn.addEventListener("click", () => {
      const response = answerInput.value.trim();
      if (response !== "") {
        socket.emit("submitChoice", {
          choice: "answer",
          response: response
        });

        answerBtn.disabled = true;
        stealBtn.disabled = true;
        answerInput.disabled = true;
      }
    });

    stealBtn.addEventListener("click", () => {
      socket.emit("submitChoice", {
        choice: "steal",
        response: null
      });

      answerBtn.disabled = true;
      stealBtn.disabled = true;
      answerInput.disabled = true;
    });
  });
}




