import React, { useState, useEffect, useRef } from "react";
import './App.css';

const WINNING_COMBOS = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

function checkWinner(board) {
  for (const combo of WINNING_COMBOS) {
    const [a, b, c] = combo;
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return { winner: board[a], winningSquares: combo };
    }
  }
  return null;
}

function Square({ value, onClick, highlight, disabled }) {
  return (
    <button
      className={`square ${highlight ? "highlight" : ""}`}
      onClick={onClick}
      disabled={disabled || !!value}
    >
      {value || ""}
    </button>
  );
}

function getRandomMove(board) {
  const emptyIndices = board
    .map((val, idx) => (val === null ? idx : null))
    .filter((v) => v !== null);
  if (emptyIndices.length === 0) return null;
  const randIndex = Math.floor(Math.random() * emptyIndices.length);
  return emptyIndices[randIndex];
}

export default function App() {
  const loadStats = () => {
    const saved = localStorage.getItem("tttStats");
    return saved ? JSON.parse(saved) : { X: 0, O: 0, Draw: 0, totalGames: 0 };
  };

  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winnerInfo, setWinnerInfo] = useState(null);
  const [stats, setStats] = useState(loadStats);
  const [showRules, setShowRules] = useState(false);
  const [playWithAI, setPlayWithAI] = useState(false);

  const [playerXName, setPlayerXName] = useState("Player X");
  const [playerOName, setPlayerOName] = useState("Player O");

  const TIMER_SECONDS = 10;
  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const timerRef = useRef(null);

  useEffect(() => {
    if (winnerInfo) {
      const { winner } = winnerInfo;
      const newStats = { ...stats, totalGames: stats.totalGames + 1 };
      if (winner === "Draw") newStats.Draw++;
      else newStats[winner]++;
      setStats(newStats);
      localStorage.setItem("tttStats", JSON.stringify(newStats));
    }
  }, [winnerInfo]);

  useEffect(() => {
    if (winnerInfo) {
      clearInterval(timerRef.current);
      return;
    }

    setTimeLeft(TIMER_SECONDS);
    clearInterval(timerRef.current);

    timerRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t === 1) {
          clearInterval(timerRef.current);
          handleTimeout();
          return TIMER_SECONDS;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [board, isXNext, winnerInfo]);

  function handleTimeout() {
    if (!winnerInfo) {
      setIsXNext(!isXNext);
    }
  }

  useEffect(() => {
    if (playWithAI && !winnerInfo && !isXNext) {
      const aiMoveTimeout = setTimeout(() => {
        const move = getRandomMove(board);
        if (move !== null) handleClick(move);
      }, 1000);
      return () => clearTimeout(aiMoveTimeout);
    }
  }, [board, isXNext, winnerInfo, playWithAI]);

  function handleClick(idx) {
    if (board[idx] || winnerInfo) return;

    const newBoard = board.slice();
    newBoard[idx] = isXNext ? "X" : "O";
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) setWinnerInfo(result);
    else if (!newBoard.includes(null))
      setWinnerInfo({ winner: "Draw", winningSquares: [] });
    else setIsXNext(!isXNext);
  }

  function resetGame(resetScores = false) {
    setBoard(Array(9).fill(null));
    setIsXNext(true);
    setWinnerInfo(null);
    setTimeLeft(TIMER_SECONDS);

    if (resetScores) {
      const zeroStats = { X: 0, O: 0, Draw: 0, totalGames: 0 };
      setStats(zeroStats);
      localStorage.setItem("tttStats", JSON.stringify(zeroStats));
    }
  }

  function togglePlayWithAI() {
    setPlayWithAI((prev) => {
      const newVal = !prev;
      setPlayerOName(newVal ? "Computer (AI)" : "Player O");
      resetGame();
      return newVal;
    });
  }

  const status = winnerInfo
    ? winnerInfo.winner === "Draw"
      ? "It's a Draw!"
      : `Winner: ${winnerInfo.winner === "X" ? playerXName : playerOName}`
    : `Next player: ${isXNext ? playerXName : playerOName} (Time left: ${timeLeft}s)`;

  return (
    <div className="app-container">
      <h1>Faizoolaa's Tic Tac Toe</h1>

      <button
        className="rules-toggle-btn"
        onClick={() => setShowRules((s) => !s)}
      >
        {showRules ? "Hide Rules" : "Show Rules"}
      </button>

      {showRules && (
        <div className="rules">
          <h3>Game Rules </h3>
          <ul>
            <li>This is a 3x3 battle arena where X’s and O’s fight for glory.</li>
            <li>Take turns placing your marks!</li>
            <li>Get three in a row horizontal, vertical, or diagonal and claim eternal bragging rights.</li>
            <li>
              If the board fills up with no winner, it’s a tie..., everyone loses
              (except me, who’s judging you).
            </li>
            <li>You’ve got 10 seconds per move, blink and you miss it, so don’t fall asleep!</li>
            <li>
              Run out of time? Your opponent’s getting lucky with an extra turn.
              Shems!
            </li>
          </ul>
          <p>Now go forth and conquer (or just have fun, no pressure) jokes Winnn!</p>
        </div>
      )}

      <div className="player-settings">
        <div>
          <label>
            Player X Name:
            <input
              value={playerXName}
              onChange={(e) => setPlayerXName(e.target.value)}
              maxLength={12}
            />
          </label>
        </div>

        <div>
          <label>
            Player O Name:
            <input
              value={playerOName}
              onChange={(e) => setPlayerOName(e.target.value)}
              maxLength={12}
              disabled={playWithAI}
            />
          </label>
        </div>

        <div style={{ marginTop: 10 }}>
          <label>
            <input
              type="checkbox"
              checked={playWithAI}
              onChange={togglePlayWithAI}
            />{" "}
            Play against AI
          </label>
        </div>
      </div>

      <div className="board">
        {board.map((val, idx) => {
          const highlight = winnerInfo?.winningSquares.includes(idx);
          return (
            <Square
              key={idx}
              value={val}
              onClick={() => handleClick(idx)}
              highlight={highlight}
              disabled={playWithAI && !isXNext}
            />
          );
        })}
      </div>

      <h2 className="status">{status}</h2>

      <button className="reset-button" onClick={() => resetGame(false)}>
        Reset Game
      </button>

      <button
        className="reset-scores-button"
        onClick={() => resetGame(true)}
        style={{ marginLeft: "10px" }}
      >
        Reset Scores
      </button>

      <div className="scoreboard">
        <h3>Player Stats</h3>
        <p>
          {playerXName}: {stats.X} wins
        </p>
        <p>
          {playerOName}: {stats.O} wins
        </p>
        <p>Draws: {stats.Draw}</p>
        <p>Total games played: {stats.totalGames}</p>
      </div>
    </div>
  );
}
