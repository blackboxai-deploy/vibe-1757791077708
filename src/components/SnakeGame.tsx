"use client";

import { useEffect, useRef, useState, useCallback } from "react";

// Game configuration
const GRID_SIZE = 20;
const CELL_SIZE = 20;
const CANVAS_WIDTH = GRID_SIZE * CELL_SIZE;
const CANVAS_HEIGHT = GRID_SIZE * CELL_SIZE;
const INITIAL_SPEED = 150; // milliseconds
const SPEED_INCREASE = 10; // decrease interval by this amount per level
const MIN_SPEED = 50;

// Direction vectors
const DIRECTIONS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
};

type Direction = keyof typeof DIRECTIONS;
type GameState = "menu" | "playing" | "paused" | "gameOver";
type Position = { x: number; y: number };

export default function SnakeGame() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | undefined>(undefined);
  const lastMoveTimeRef = useRef<number>(0);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Game state
  const [gameState, setGameState] = useState<GameState>("menu");
  const [snake, setSnake] = useState<Position[]>([{ x: 10, y: 10 }]);
  const [direction, setDirection] = useState<Direction>("RIGHT");
  const [food, setFood] = useState<Position>({ x: 15, y: 15 });
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [speed, setSpeed] = useState(INITIAL_SPEED);
  const [level, setLevel] = useState(1);

  // Initialize audio context
  useEffect(() => {
    if (typeof window !== "undefined") {
      try {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      } catch (error) {
        console.log("Audio not supported");
      }
      
      // Load high score from localStorage
      const savedHighScore = localStorage.getItem("snakeHighScore");
      if (savedHighScore) {
        setHighScore(parseInt(savedHighScore));
      }
    }
  }, []);

  // Play sound effect
  const playSound = useCallback((frequency: number, duration: number, type: OscillatorType = "square") => {
    if (!audioContextRef.current) return;
    
    try {
      const oscillator = audioContextRef.current.createOscillator();
      const gainNode = audioContextRef.current.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContextRef.current.destination);
      
      oscillator.frequency.value = frequency;
      oscillator.type = type;
      
      gainNode.gain.setValueAtTime(0.1, audioContextRef.current.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContextRef.current.currentTime + duration);
      
      oscillator.start(audioContextRef.current.currentTime);
      oscillator.stop(audioContextRef.current.currentTime + duration);
    } catch (error) {
      // Silent fail for audio errors
    }
  }, []);

  // Generate random food position
  const generateFood = useCallback((snakePositions: Position[]): Position => {
    let newFood: Position;
    do {
      newFood = {
        x: Math.floor(Math.random() * GRID_SIZE),
        y: Math.floor(Math.random() * GRID_SIZE),
      };
    } while (snakePositions.some(segment => segment.x === newFood.x && segment.y === newFood.y));
    return newFood;
  }, []);

  // Check collision with walls or self
  const checkCollision = useCallback((head: Position, body: Position[]): boolean => {
    // Wall collision
    if (head.x < 0 || head.x >= GRID_SIZE || head.y < 0 || head.y >= GRID_SIZE) {
      return true;
    }
    // Self collision
    return body.some(segment => segment.x === head.x && segment.y === head.y);
  }, []);

  // Move snake
  const moveSnake = useCallback(() => {
    if (gameState !== "playing") return;

    setSnake(prevSnake => {
      const newSnake = [...prevSnake];
      const head = { ...newSnake[0] };
      const dir = DIRECTIONS[direction];
      
      head.x += dir.x;
      head.y += dir.y;

      // Check collisions
      if (checkCollision(head, newSnake)) {
        setGameState("gameOver");
        playSound(150, 0.5, "sawtooth");
        
        // Update high score
        if (score > highScore) {
          setHighScore(score);
          localStorage.setItem("snakeHighScore", score.toString());
        }
        return prevSnake;
      }

      newSnake.unshift(head);

      // Check food collision
      if (head.x === food.x && head.y === food.y) {
        const newScore = score + 1;
        setScore(newScore);
        setFood(generateFood(newSnake));
        playSound(800, 0.1);
        
        // Increase speed and level
        const newLevel = Math.floor(newScore / 5) + 1;
        if (newLevel !== level) {
          setLevel(newLevel);
          const newSpeed = Math.max(MIN_SPEED, INITIAL_SPEED - (newLevel - 1) * SPEED_INCREASE);
          setSpeed(newSpeed);
        }
      } else {
        newSnake.pop();
      }

      return newSnake;
    });
  }, [gameState, direction, food, score, level, highScore, checkCollision, generateFood, playSound]);

  // Game loop
  const gameLoop = useCallback((currentTime: number) => {
    if (gameState === "playing" && currentTime - lastMoveTimeRef.current >= speed) {
      moveSnake();
      lastMoveTimeRef.current = currentTime;
    }
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, speed, moveSnake]);

  // Start game loop
  useEffect(() => {
    if (gameState === "playing") {
      lastMoveTimeRef.current = performance.now();
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    } else {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);

  // Render game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#1a1a1a";
    ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);

    // Draw grid
    ctx.strokeStyle = "#2a2a2a";
    ctx.lineWidth = 1;
    for (let i = 0; i <= GRID_SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * CELL_SIZE, 0);
      ctx.lineTo(i * CELL_SIZE, CANVAS_HEIGHT);
      ctx.stroke();
      
      ctx.beginPath();
      ctx.moveTo(0, i * CELL_SIZE);
      ctx.lineTo(CANVAS_WIDTH, i * CELL_SIZE);
      ctx.stroke();
    }

    // Draw snake
    snake.forEach((segment, index) => {
      ctx.fillStyle = index === 0 ? "#10B981" : "#34D399"; // Head is darker green
      ctx.fillRect(
        segment.x * CELL_SIZE + 1,
        segment.y * CELL_SIZE + 1,
        CELL_SIZE - 2,
        CELL_SIZE - 2
      );
      
      // Add eyes to head
      if (index === 0) {
        ctx.fillStyle = "#000";
        const eyeSize = 3;
        const eyeOffset = 6;
        
        switch (direction) {
          case "RIGHT":
            ctx.fillRect(segment.x * CELL_SIZE + eyeOffset + 4, segment.y * CELL_SIZE + 4, eyeSize, eyeSize);
            ctx.fillRect(segment.x * CELL_SIZE + eyeOffset + 4, segment.y * CELL_SIZE + 12, eyeSize, eyeSize);
            break;
          case "LEFT":
            ctx.fillRect(segment.x * CELL_SIZE + 4, segment.y * CELL_SIZE + 4, eyeSize, eyeSize);
            ctx.fillRect(segment.x * CELL_SIZE + 4, segment.y * CELL_SIZE + 12, eyeSize, eyeSize);
            break;
          case "UP":
            ctx.fillRect(segment.x * CELL_SIZE + 4, segment.y * CELL_SIZE + 4, eyeSize, eyeSize);
            ctx.fillRect(segment.x * CELL_SIZE + 12, segment.y * CELL_SIZE + 4, eyeSize, eyeSize);
            break;
          case "DOWN":
            ctx.fillRect(segment.x * CELL_SIZE + 4, segment.y * CELL_SIZE + 12, eyeSize, eyeSize);
            ctx.fillRect(segment.x * CELL_SIZE + 12, segment.y * CELL_SIZE + 12, eyeSize, eyeSize);
            break;
        }
      }
    });

    // Draw apple (food)
    const appleX = food.x * CELL_SIZE + CELL_SIZE / 2;
    const appleY = food.y * CELL_SIZE + CELL_SIZE / 2;
    const appleRadius = (CELL_SIZE - 4) / 2;
    
    // Apple body (red circle)
    ctx.fillStyle = "#DC2626";
    ctx.beginPath();
    ctx.arc(appleX, appleY, appleRadius, 0, 2 * Math.PI);
    ctx.fill();
    
    // Apple highlight (lighter red)
    ctx.fillStyle = "#EF4444";
    ctx.beginPath();
    ctx.arc(appleX - 2, appleY - 2, appleRadius * 0.6, 0, 2 * Math.PI);
    ctx.fill();
    
    // Apple shine (white highlight)
    ctx.fillStyle = "#FECACA";
    ctx.beginPath();
    ctx.arc(appleX - 3, appleY - 3, appleRadius * 0.3, 0, 2 * Math.PI);
    ctx.fill();
    
    // Apple stem (brown)
    ctx.fillStyle = "#92400E";
    ctx.fillRect(appleX - 1, appleY - appleRadius - 3, 2, 4);
    
    // Apple leaf (green)
    ctx.fillStyle = "#16A34A";
    ctx.beginPath();
    ctx.ellipse(appleX + 2, appleY - appleRadius - 1, 3, 2, Math.PI / 4, 0, 2 * Math.PI);
    ctx.fill();

  }, [snake, food, direction]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      e.preventDefault();
      
      if (gameState === "menu" && (e.code === "Space" || e.code === "Enter")) {
        startGame();
        return;
      }
      
      if (gameState === "gameOver" && e.code === "KeyR") {
        resetGame();
        return;
      }
      
      if (gameState === "playing" || gameState === "paused") {
        switch (e.code) {
          case "Space":
            togglePause();
            break;
          case "KeyR":
            resetGame();
            break;
          case "ArrowUp":
          case "KeyW":
            if (direction !== "DOWN") setDirection("UP");
            break;
          case "ArrowDown":
          case "KeyS":
            if (direction !== "UP") setDirection("DOWN");
            break;
          case "ArrowLeft":
          case "KeyA":
            if (direction !== "RIGHT") setDirection("LEFT");
            break;
          case "ArrowRight":
          case "KeyD":
            if (direction !== "LEFT") setDirection("RIGHT");
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [gameState, direction]);

  const startGame = () => {
    setGameState("playing");
    playSound(440, 0.1);
  };

  const togglePause = () => {
    if (gameState === "playing") {
      setGameState("paused");
    } else if (gameState === "paused") {
      setGameState("playing");
    }
  };

  const resetGame = () => {
    setSnake([{ x: 10, y: 10 }]);
    setDirection("RIGHT");
    setFood({ x: 15, y: 15 });
    setScore(0);
    setSpeed(INITIAL_SPEED);
    setLevel(1);
    setGameState("playing");
    playSound(660, 0.1);
  };

  return (
    <div className="flex flex-col items-center space-y-8">
      {/* Enhanced Game Stats */}
      <div className="grid grid-cols-4 gap-6 w-full max-w-2xl">
        <div className="bg-gradient-to-br from-green-600 to-green-700 rounded-xl px-4 py-3 border border-green-500 shadow-lg">
          <div className="text-white text-2xl font-bold">{score}</div>
          <div className="text-green-100 text-xs font-medium flex items-center">
            <span className="mr-1">🍎</span>SCORE
          </div>
        </div>
        <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-xl px-4 py-3 border border-blue-500 shadow-lg">
          <div className="text-white text-2xl font-bold">{highScore}</div>
          <div className="text-blue-100 text-xs font-medium flex items-center">
            <span className="mr-1">🏆</span>BEST
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-600 to-purple-700 rounded-xl px-4 py-3 border border-purple-500 shadow-lg">
          <div className="text-white text-2xl font-bold">{level}</div>
          <div className="text-purple-100 text-xs font-medium flex items-center">
            <span className="mr-1">⚡</span>LEVEL
          </div>
        </div>
        <div className="bg-gradient-to-br from-orange-600 to-orange-700 rounded-xl px-4 py-3 border border-orange-500 shadow-lg">
          <div className="text-white text-2xl font-bold">{snake.length}</div>
          <div className="text-orange-100 text-xs font-medium flex items-center">
            <span className="mr-1">🐍</span>LENGTH
          </div>
        </div>
      </div>

      {/* Game Canvas with Enhanced Border */}
      <div className="relative">
        <div className="absolute -inset-2 bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 rounded-xl blur opacity-30 animate-pulse"></div>
        <canvas
          ref={canvasRef}
          width={CANVAS_WIDTH}
          height={CANVAS_HEIGHT}
          className="relative border-4 border-gray-700 rounded-xl bg-gray-900 shadow-2xl"
        />
        
        {/* Enhanced Game State Overlays */}
        {gameState === "menu" && (
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black bg-opacity-90 flex items-center justify-center rounded-xl backdrop-blur-sm">
            <div className="text-center bg-gray-800 bg-opacity-50 p-8 rounded-2xl border border-gray-600">
              <div className="text-6xl mb-4 animate-bounce">🚀</div>
              <h2 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-emerald-400 bg-clip-text text-transparent mb-4">Ready to Play?</h2>
              <p className="text-gray-300 mb-2 text-lg">Collect apples and grow your snake!</p>
              <p className="text-gray-400 mb-8">Press SPACE or ENTER to start your adventure</p>
              <div className="flex justify-center space-x-4">
                <div className="animate-pulse text-green-400 text-2xl">🎮</div>
                <div className="animate-pulse text-red-400 text-2xl">🍎</div>
                <div className="animate-pulse text-green-400 text-2xl">🐍</div>
              </div>
            </div>
          </div>
        )}
        
        {gameState === "paused" && (
          <div className="absolute inset-0 bg-gradient-to-br from-black via-gray-900 to-black bg-opacity-90 flex items-center justify-center rounded-xl backdrop-blur-sm">
            <div className="text-center bg-gray-800 bg-opacity-50 p-8 rounded-2xl border border-gray-600">
              <div className="text-6xl mb-4">⏸️</div>
              <h2 className="text-4xl font-bold text-yellow-400 mb-4">PAUSED</h2>
              <p className="text-gray-300 text-lg">Take a break, your snake is waiting!</p>
              <p className="text-gray-400 mt-2">Press SPACE to resume the action</p>
            </div>
          </div>
        )}
        
        {gameState === "gameOver" && (
          <div className="absolute inset-0 bg-gradient-to-br from-red-950 via-gray-900 to-black bg-opacity-95 flex items-center justify-center rounded-xl backdrop-blur-sm">
            <div className="text-center bg-gray-800 bg-opacity-50 p-8 rounded-2xl border border-red-600">
              <div className="text-6xl mb-4 animate-bounce">💀</div>
              <h2 className="text-4xl font-bold text-red-400 mb-4">GAME OVER</h2>
              <div className="bg-gray-900 rounded-lg p-4 mb-4 border border-gray-700">
                <p className="text-gray-300 mb-2 text-lg">Final Score: <span className="text-green-400 font-bold text-2xl">{score}</span> 🍎</p>
                <p className="text-gray-400">Snake Length: <span className="text-orange-400 font-semibold">{snake.length}</span> segments</p>
                <p className="text-gray-400">Level Reached: <span className="text-purple-400 font-semibold">{level}</span></p>
              </div>
              {score === highScore && score > 0 && (
                <div className="mb-4">
                  <p className="text-2xl text-yellow-400 mb-2 animate-pulse">🏆 NEW HIGH SCORE! 🏆</p>
                  <p className="text-yellow-300">Congratulations on your achievement!</p>
                </div>
              )}
              <p className="text-gray-400 mb-6">Press R to challenge yourself again</p>
              <div className="flex justify-center space-x-4">
                <div className="animate-bounce text-red-400 text-2xl">💥</div>
                <div className="animate-pulse text-gray-400 text-2xl">😵</div>
                <div className="animate-bounce text-red-400 text-2xl">💥</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Enhanced Game Controls */}
      <div className="flex flex-wrap justify-center gap-4">
        {gameState === "menu" && (
          <button
            onClick={startGame}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-200 border border-green-400"
          >
            <span className="mr-2">🚀</span>Start Game
          </button>
        )}
        
        {(gameState === "playing" || gameState === "paused") && (
          <>
            <button
              onClick={togglePause}
              className="bg-gradient-to-r from-yellow-500 to-orange-600 hover:from-yellow-600 hover:to-orange-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-200 border border-yellow-400"
            >
              <span className="mr-2">{gameState === "paused" ? "▶️" : "⏸️"}</span>
              {gameState === "paused" ? "Resume" : "Pause"}
            </button>
            <button
              onClick={resetGame}
              className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-200 border border-blue-400"
            >
              <span className="mr-2">🔄</span>Restart
            </button>
          </>
        )}
        
        {gameState === "gameOver" && (
          <button
            onClick={resetGame}
            className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg transform hover:scale-105 transition-all duration-200 border border-green-400 animate-pulse"
          >
            <span className="mr-2">🎮</span>Play Again
          </button>
        )}
      </div>
      
      {/* Enhanced Speed Indicator */}
      <div className="text-center bg-gray-800 rounded-xl p-4 border border-gray-600 w-full max-w-md">
        <div className="flex justify-between items-center mb-2">
          <span className="text-gray-300 font-medium">🚄 Speed</span>
          <span className="text-white font-bold">{Math.round((1000 / speed) * 10) / 10} moves/sec</span>
        </div>
        <div className="relative">
          <div className="w-full bg-gray-700 rounded-full h-3 shadow-inner">
            <div
              className="bg-gradient-to-r from-green-400 via-yellow-400 to-red-500 h-3 rounded-full transition-all duration-500 shadow-lg relative overflow-hidden"
              style={{
                width: `${Math.min(100, ((INITIAL_SPEED - speed) / (INITIAL_SPEED - MIN_SPEED)) * 100)}%`,
              }}
            >
              <div className="absolute inset-0 bg-white bg-opacity-20 animate-pulse"></div>
            </div>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Slow</span>
            <span>Lightning ⚡</span>
          </div>
        </div>
      </div>
    </div>
  );
}