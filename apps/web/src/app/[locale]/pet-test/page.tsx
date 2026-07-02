"use client";

import React, { useState } from "react";
import { notFound } from "next/navigation";
import { RabbitCompanion, CompanionAction, STAGES_CONFIG } from "@/components/pet/RabbitCompanion";

export default function PetTestPage() {
  // Dev-only tooling: ẩn hoàn toàn (404) ở bản production.
  if (process.env.NODE_ENV === "production") notFound();

  const [stage, setStage] = useState<number>(4); // Default to Stage 4 (Bunny Child) which has the most actions
  const [action, setAction] = useState<CompanionAction>("idle");
  const [scale, setScale] = useState<number>(1); // Zoom control for testing

  const currentConfig = STAGES_CONFIG[stage] || STAGES_CONFIG[0];
  const availableActions = currentConfig.actions ? Object.keys(currentConfig.actions) as CompanionAction[] : [];

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex p-8 font-sans">
      
      {/* Sidebar Controls */}
      <div className="w-1/3 max-w-sm bg-neutral-800 p-6 rounded-2xl shadow-xl border border-neutral-700 flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold mb-1 text-white">Pet Dev Tester</h1>
          <p className="text-neutral-400 text-sm">Test all animations and evolution stages.</p>
        </div>

        {/* Stage Selector */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold text-neutral-300 uppercase tracking-wider">Evolution Stage</label>
          <div className="flex flex-col gap-1">
            {[0, 1, 2, 3, 4, 5, 6].map((s) => (
              <button
                key={s}
                onClick={() => {
                  setStage(s);
                  setAction("idle"); // Reset action on stage change
                }}
                className={`text-left px-4 py-3 rounded-lg text-sm transition-all duration-200 ${
                  stage === s 
                    ? "bg-blue-600 text-white shadow-md font-medium" 
                    : "bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600 hover:text-white"
                }`}
              >
                Stage {s}: {STAGES_CONFIG[s]?.name}
              </button>
            ))}
          </div>
        </div>

        {/* Action Selector */}
        <div className="flex flex-col gap-2 flex-grow overflow-y-auto pr-2">
          <label className="text-sm font-semibold text-neutral-300 uppercase tracking-wider flex justify-between items-center">
            <span>Actions ({availableActions.length})</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {availableActions.map((a) => (
              <button
                key={a}
                onClick={() => setAction(a)}
                className={`px-3 py-2 rounded-lg text-xs transition-all duration-200 text-center break-words ${
                  action === a 
                    ? "bg-pink-600 text-white shadow-md font-medium" 
                    : "bg-neutral-700/50 text-neutral-300 hover:bg-neutral-600 hover:text-white"
                }`}
              >
                {a.replace(/_/g, " ")}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Display Area */}
      <div className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-hidden ml-8 bg-neutral-950 rounded-2xl border border-neutral-800 shadow-inner">
        
        {/* Environment Background Mock */}
        <div className={`absolute inset-0 opacity-40 transition-colors duration-1000 ${currentConfig.roomBackground}`} />
        
        {/* Zoom Controls */}
        <div className="absolute top-6 right-6 z-10 flex gap-2 bg-neutral-900/80 p-2 rounded-xl border border-neutral-700 backdrop-blur-sm">
          <button onClick={() => setScale(s => Math.max(0.5, s - 0.25))} className="w-10 h-10 flex items-center justify-center bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors text-white font-mono">-</button>
          <div className="w-16 h-10 flex items-center justify-center font-mono text-sm text-neutral-300">{(scale * 100).toFixed(0)}%</div>
          <button onClick={() => setScale(s => Math.min(3, s + 0.25))} className="w-10 h-10 flex items-center justify-center bg-neutral-800 rounded-lg hover:bg-neutral-700 transition-colors text-white font-mono">+</button>
        </div>

        {/* The Pet */}
        <div 
          className="relative z-10 flex items-end justify-center transition-transform duration-300 ease-out"
          // eslint-disable-next-line react/forbid-dom-props
          style={{ transform: `scale(${scale})` }}
        >
          {/* Ground shadow */}
          <div className="absolute -bottom-4 w-48 h-8 bg-black/20 rounded-full blur-xl" />
          
          <RabbitCompanion 
            stage={stage} 
            action={action} 
            className="filter drop-shadow-2xl"
          />
        </div>

        {/* Status Bar */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 bg-neutral-900/80 px-6 py-3 rounded-full border border-neutral-700 backdrop-blur-sm shadow-xl flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-sm font-mono text-neutral-300">Stage: <strong className="text-white">{stage}</strong></span>
          </div>
          <div className="w-px h-4 bg-neutral-700" />
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-pink-500 animate-pulse" />
            <span className="text-sm font-mono text-neutral-300">Action: <strong className="text-white">{action}</strong></span>
          </div>
        </div>

      </div>
    </div>
  );
}
