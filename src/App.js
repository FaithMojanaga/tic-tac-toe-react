import React, { useState, useEffect, useRef } from "react";
import "./App.css";

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
  for (const [a, b, c] of WINNING_COMBOS) {
    if (board[a] && board[a] === board[b] && board[b] === board[c]) {
      return { winner: board[a], winningSquares: [a, b, c] };
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
  const empty = board.map((val, idx) => (val === null ? idx : null)).filter(Boolean);
  return empty.length ? empty[Math.floor(Math.random() * empty.length)] : null;
}

export default function App() {
  const TIMER_SECONDS = 10;
  const [board, setBoard] = useState(Array(9).fill(null));
  const [isXNext, setIsXNext] = useState(true);
  const [winnerInfo, setWinnerInfo] = useState(null);
  const [stats, setStats] = useState(() => {
    const saved = localStorage.getItem("tttStats");
    return saved ? JSON.parse(saved) : { X: 0, O: 0, Draw: 0, totalGames: 0 };
  });

  const [showRules, setShowRules] = useState(false);
  const [playWithAI, setPlayWithAI] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState("easy");

  const [playerXName, setPlayerXName] = useState("Player X");
  const [playerOName, setPlayerOName] = useState("Player O");

  const [timeLeft, setTimeLeft] = useState(TIMER_SECONDS);
  const timerRef = useRef(null);

  useEffect(() => {
    if (winnerInfo) {
      clearInterval(timerRef.current);
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
          setIsXNext((prev) => !prev);
          return TIMER_SECONDS;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [board, isXNext, winnerInfo]);

  useEffect(() => {
    if (playWithAI && !isXNext && !winnerInfo) {
      const timeout = setTimeout(() => {
        const move = getRandomMove(board);
        if (move !== null) handleClick(move);
      }, 1000);
      return () => clearTimeout(timeout);
    }
  }, [board, isXNext, winnerInfo, playWithAI]);

  function handleClick(idx) {
    if (board[idx] || winnerInfo) return;
    const newBoard = board.slice();
    newBoard[idx] = isXNext ? "X" : "O";
    setBoard(newBoard);

    const result = checkWinner(newBoard);
    if (result) setWinnerInfo(result);
    else if (!newBoard.includes(null)) setWinnerInfo({ winner: "Draw", winningSquares: [] });
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

      <button onClick={() => setShowRules((r) => !r)}>
        {showRules ? "Hide Rules" : "Show Rules"}
      </button>

      {showRules && (
        <div className="rules">
          <h3>Game Rules</h3>
          <ul>
            <li>Get 3 in a row to win.</li>
            <li>You have 10 seconds per turn.</li>
            <li>Fail to play? Your turn is skipped.</li>
            <li>AI plays if enabled.</li>
          </ul>
        </div>
      )}

      <div className="player-settings">
        <label>
          Player X Name:
          <input value={playerXName} onChange={(e) => setPlayerXName(e.target.value)} />
        </label>
        <label>
          Player O Name:
          <input
            value={playerOName}
            onChange={(e) => setPlayerOName(e.target.value)}
            disabled={playWithAI}
          />
        </label>
        <label>
          <input type="checkbox" checked={playWithAI} onChange={togglePlayWithAI} />
          Play against AI
        </label>
        {playWithAI && (
          <label>
            Difficulty:
            <select value={aiDifficulty} onChange={(e) => setAiDifficulty(e.target.value)}>
              <option value="easy">Easy</option>
              <option value="medium">Medium</option>
              <option value="hard">Hard</option>
            </select>
          </label>
        )}
      </div>

      <div className="board">
        {board.map((val, idx) => (
          <Square
            key={idx}
            value={val}
            onClick={() => handleClick(idx)}
            highlight={winnerInfo?.winningSquares.includes(idx)}
            disabled={playWithAI && !isXNext}
          />
        ))}
      </div>

      <h2>{status}</h2>

      <button onClick={() => resetGame(false)}>Reset Game</button>
      <button onClick={() => resetGame(true)} style={{ marginLeft: 10 }}>
        Reset Scores
      </button>

      <div className="scoreboard">
        <h3>Player Stats</h3>
        <p>{playerXName}: {stats.X} wins</p>
        <p>{playerOName}: {stats.O} wins</p>
        <p>Draws: {stats.Draw}</p>
        <p>Total games played: {stats.totalGames}</p>
      </div>
    </div>
  );
}
