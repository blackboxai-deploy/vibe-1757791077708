"use client";

import { useState, useEffect } from "react";
import SnakeGame from "@/components/SnakeGame";

export default function Home() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading Snake Game...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-5xl">
        {/* Game Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center mb-6">
            <div className="text-8xl mr-4 animate-pulse">🐍</div>
            <div>
              <h1 className="text-6xl font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent mb-2 tracking-wide">
                SNAKE GAME
              </h1>
              <div className="flex items-center justify-center text-red-400 text-2xl">
                <span className="mr-2">Collect</span>
                <div className="w-6 h-6 bg-red-500 rounded-full relative">
                  <div className="absolute top-1 left-1 w-2 h-2 bg-red-300 rounded-full"></div>
                  <div className="absolute -top-1 left-2 w-1 h-2 bg-amber-700"></div>
                  <div className="absolute -top-0.5 right-1 w-2 h-1 bg-green-500 rounded-full transform rotate-12"></div>
                </div>
                <span className="ml-2">Apples!</span>
              </div>
            </div>
            <div className="text-8xl ml-4 animate-bounce">🍎</div>
          </div>
          <p className="text-gray-300 text-lg mb-2 font-medium">
            Control with Arrow Keys or WASD • Grow longer by eating apples
          </p>
          <p className="text-gray-400 text-sm">
            Avoid hitting walls or yourself • Speed increases with score • Beat your high score!
          </p>
        </div>

        {/* Game Container */}
        <div className="bg-gradient-to-br from-gray-800 via-gray-900 to-black rounded-3xl shadow-2xl border-2 border-gray-600 p-8 backdrop-blur-sm">
          <SnakeGame />
        </div>

        {/* Enhanced Instructions */}
        <div className="mt-8 text-center">
          <h3 className="text-xl font-semibold text-white mb-4">🎮 Game Controls</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto mb-6">
            <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-4 border border-gray-600 hover:border-green-400 transition-colors">
              <div className="text-green-400 font-bold text-lg mb-1">↑ W</div>
              <div className="text-gray-300 text-sm">Move Up</div>
            </div>
            <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-4 border border-gray-600 hover:border-green-400 transition-colors">
              <div className="text-green-400 font-bold text-lg mb-1">↓ S</div>
              <div className="text-gray-300 text-sm">Move Down</div>
            </div>
            <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-4 border border-gray-600 hover:border-green-400 transition-colors">
              <div className="text-green-400 font-bold text-lg mb-1">← A</div>
              <div className="text-gray-300 text-sm">Move Left</div>
            </div>
            <div className="bg-gradient-to-br from-gray-700 to-gray-800 rounded-xl p-4 border border-gray-600 hover:border-green-400 transition-colors">
              <div className="text-green-400 font-bold text-lg mb-1">→ D</div>
              <div className="text-gray-300 text-sm">Move Right</div>
            </div>
          </div>
          <div className="flex justify-center items-center space-x-6 text-gray-300">
            <div className="flex items-center">
              <kbd className="bg-gradient-to-br from-gray-600 to-gray-700 px-3 py-2 rounded-lg text-sm font-semibold shadow-lg border border-gray-500">SPACE</kbd>
              <span className="ml-2">Pause/Resume</span>
            </div>
            <div className="text-gray-500">•</div>
            <div className="flex items-center">
              <kbd className="bg-gradient-to-br from-gray-600 to-gray-700 px-3 py-2 rounded-lg text-sm font-semibold shadow-lg border border-gray-500">R</kbd>
              <span className="ml-2">Restart Game</span>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}