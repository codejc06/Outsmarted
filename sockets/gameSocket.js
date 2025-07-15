import { v4 as uuidv4 } from 'uuid';
import { getQuestion } from '../controllers/gameController.js';

let waitingPlayer = null;

export function initGameSockets(io) {
  io.on('connection', async (socket) => {
    console.log(`Player connected: ${socket.id}`);

    if (waitingPlayer) {
      const room = `room-${uuidv4()}`;
      const player1 = waitingPlayer;
      const player2 = socket;

      player1.join(room);
      player2.join(room);

      const gameState = {
        room,
        players: {
          [player1.id]: { socket: player1, totalScore: 0 },
          [player2.id]: { socket: player2, totalScore: 0 }
        },
        round: 1,
        maxRounds: 3,
        currentQuestion: null,
        currentAnswers: {}
      };

      player1.emit('roomJoined', `/room/${room}`);
      player2.emit('roomJoined', `/room/${room}`);

      const handleChoice = (playerSocket, data) => {
        if (!gameState.players[playerSocket.id]) return;

        gameState.currentAnswers[playerSocket.id] = {
          choice: data.choice,
          response: data.response
        };

        if (Object.keys(gameState.currentAnswers).length === 2) {
          const [p1Id, p2Id] = Object.keys(gameState.players);
          const p1Data = gameState.currentAnswers[p1Id];
          const p2Data = gameState.currentAnswers[p2Id];

          const roundResults = calculateResults(p1Data, p2Data, gameState.currentQuestion.answer);
          gameState.players[p1Id].totalScore += roundResults.player1.score;
          gameState.players[p2Id].totalScore += roundResults.player2.score;

          const correctAnswer = gameState.currentQuestion.answer;
          const result1 = {
            type: roundResults.player1.choice,
            response: roundResults.player1.response,
            points: roundResults.player1.points,
            netScore: gameState.players[p1Id].totalScore
          };

          const result2 = {
            type: roundResults.player2.choice,
            response: roundResults.player2.response,
            points: roundResults.player2.points,
            netScore: gameState.players[p2Id].totalScore
          };

          gameState.players[p1Id].socket.emit("roundResult", {
            you: result1,
            opponent: result2,
            correctAnswer,
            round: gameState.round,
            totalRounds: gameState.maxRounds
          });

          gameState.players[p2Id].socket.emit("roundResult", {
            you: result2,
            opponent: result1,
            correctAnswer,
            round: gameState.round,
            totalRounds: gameState.maxRounds
          });

          gameState.round++;
          gameState.currentAnswers = {};

          if (gameState.round <= gameState.maxRounds) {
            setTimeout(() => {
              startRound(io, gameState);
            }, 5000);
          } else {
            io.to(gameState.room).emit('gameOver', {
              finalScores: {
                [p1Id]: gameState.players[p1Id].totalScore,
                [p2Id]: gameState.players[p2Id].totalScore
              }
            });
          }
        }
      };

      player1.on('submitChoice', (data) => handleChoice(player1, data));
      player2.on('submitChoice', (data) => handleChoice(player2, data));

      await startRound(io, gameState);
      waitingPlayer = null;
    } else {
      waitingPlayer = socket;
      socket.emit('waiting');
    }

    socket.on('disconnect', () => {
      if (waitingPlayer?.id === socket.id) waitingPlayer = null;
      console.log(`❌ ${socket.id} disconnected`);
    });
  });
}

async function startRound(io, gameState) {
  const question = await getQuestion();
  gameState.currentQuestion = question;

  io.to(gameState.room).emit('gameStart', {
    question: question.question,
    round: gameState.round,
    totalRounds: gameState.maxRounds,
  });
}

function calculateResults(p1, p2, correctAnswer) {
  const isCorrect = (res) =>
    res && res.toLowerCase().trim() === correctAnswer.toLowerCase().trim();

  const getScore = (me, opp) => {
    if (me.choice === 'answer') return isCorrect(me.response) ? 1 : 0;
    if (me.choice === 'steal') return isCorrect(opp.response) ? 2 : -1;
    return 0;
  };

  return {
    player1: { choice: p1.choice, response: p1.response, points: getScore(p1, p2) },
    player2: { choice: p2.choice, response: p2.response, points: getScore(p2, p1) }
  };
}

