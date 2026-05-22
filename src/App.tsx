import { useState, useEffect } from 'react';
import { Zap, Code2, Scan, Activity, ArrowRight, Skull, FileCode } from 'lucide-react';

const MOCK_CODE = `function debounce(func, wait) {
  let timeout;
  return function(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func.apply(this, args);
    }, wait);
  };
}`;

export default function App() {
  const [appState, setAppState] = useState<'IDLE' | 'SCANNING' | 'FOUND' | 'ANALYZING' | 'DONE'>('IDLE');
  const [typedExplanation, setTypedExplanation] = useState('');
  
  const fullExplanation = `[ STAND ABILITY ]
The "Debounce" Stand delays a function's execution until a set amount of time (wait) has passed since it was last called.

[ BATTLE BREAKDOWN ]
1. "let timeout;" -> Creates a memory void to capture incoming attacks (function calls).
2. "clearTimeout(timeout);" -> If a new attack comes in before the timer finishes, it ERASES the previous timer! MUDA MUDA MUDA!
3. "timeout = setTimeout(...)" -> Starts a new countdown. Only when the barrage STOPS and the timer hits zero does the function finally strike!`;

  useEffect(() => {
    if (appState === 'SCANNING') {
      const timer = setTimeout(() => setAppState('FOUND'), 1500);
      return () => clearTimeout(timer);
    }
    
    if (appState === 'ANALYZING') {
      let currentLength = 0;
      const typeInterval = setInterval(() => {
        currentLength += 3;
        if (currentLength <= fullExplanation.length) {
          setTypedExplanation(fullExplanation.substring(0, currentLength));
        } else {
          clearInterval(typeInterval);
          setAppState('DONE');
        }
      }, 20); // Fast dramatic typing
      return () => clearInterval(typeInterval);
    }
  }, [appState]);

  const handleAction = () => {
    if (appState === 'IDLE') setAppState('SCANNING');
    if (appState === 'FOUND') setAppState('ANALYZING');
    if (appState === 'DONE') {
      setAppState('IDLE');
      setTypedExplanation('');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-900 flex flex-col md:flex-row items-center justify-center p-4 gap-12 font-sans overflow-hidden relative">
      
      {/* Background Decor */}
      <div className="fixed inset-0 manga-bg opacity-20 pointer-events-none" />
      <div className="fixed -left-10 text-[180px] font-black text-purple-900/40 pointer-events-none select-none tracking-tighter" style={{ writingMode: 'vertical-rl' }}>
        MENACING
      </div>

      {/* 
        MOCK BROWSER CONTEXT (Left Side) - Simulating what the user is looking at.
        This provides context for the chrome extension mock.
      */}
      <div className="hidden md:flex flex-col w-[500px] border-4 border-neutral-700 bg-neutral-950 rounded-lg shadow-2xl relative z-10 transition-transform duration-500 hover:rotate-1">
        <div className="h-10 bg-neutral-800 flex items-center px-4 gap-2 border-b-4 border-neutral-700">
          <div className="w-3 h-3 bg-red-500 rounded-full" />
          <div className="w-3 h-3 bg-yellow-500 rounded-full" />
          <div className="w-3 h-3 bg-green-500 rounded-full" />
          <div className="flex-1 ml-4 bg-neutral-900 rounded-sm h-6 px-3 flex items-center text-xs text-neutral-500 font-mono">
             github.com/dio/world-repo
          </div>
        </div>
        <div className="p-8 text-neutral-300 font-mono text-sm leading-relaxed">
          <h2 className="text-white text-xl font-bold mb-4 font-sans border-b border-neutral-700 pb-2">utils.js</h2>
          <div className={`p-4 rounded transition-all duration-500 ${appState !== 'IDLE' ? 'ring-4 ring-pink-500 bg-pink-500/10' : ''}`}>
            <pre className="text-emerald-400">
              <code>{MOCK_CODE}</code>
            </pre>
          </div>
          <div className="mt-8 opacity-50">
            {`// more code down here...
export const throttle = (fn) => {...};
export const memoize = (fn) => {...};`}
          </div>
        </div>
        {appState !== 'IDLE' && (
          <div className="absolute top-[100px] -right-4 w-8 h-8 bg-pink-500 rounded-full animate-ping" />
        )}
      </div>

      {/* 
        CHROME EXTENSION POPUP PREVIEW (Right Side) 
        This is the actual JoJo themed requested UI.
      */}
      <div className="relative group z-20">
        
        {/* Floating Menacing Text purely for aesthetics */}
        <div className="absolute -top-12 -right-8 text-pink-500 font-black text-4xl animate-menacing z-0 hidden md:block">
          ゴゴゴゴ
        </div>
        <div className="absolute -bottom-8 -left-12 text-yellow-500 font-black text-5xl animate-menacing z-0 hidden md:block" style={{ animationDelay: '1s' }}>
          ドギャーン
        </div>

        {/* Extension Container (Simulating the 400x600 extension popup) */}
        <div className="w-[380px] h-[600px] bg-[#1a0b2e] border-8 border-black flex flex-col relative shadow-[16px_16px_0px_#FF0055] hover:shadow-[20px_20px_0px_#FCD34D] transition-shadow duration-300">
          
          {/* Header */}
          <header className="bg-yellow-400 border-b-8 border-black p-4 relative overflow-hidden z-10 shrink-0">
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0IiBoZWlnaHQ9IjQiPjxyZWN0IHdpZHRoPSI0IiBoZWlnaHQ9IjQiIHZhbHVlPSIjZmZmIiBmaWxsPSIjMDAwIiBmaWxsLW9wYWNpdHk9IjAuMiIvPjwvc3ZnPg==')] opacity-20" />
            <h1 className="text-3xl font-display uppercase tracking-widest text-black flex items-center gap-2 transform -skew-x-12 relative z-10 drop-shadow-[2px_2px_0px_#fff]">
              <Skull className="w-8 h-8" />
              Code Stand
            </h1>
          </header>

          <div className="flex-1 overflow-y-auto p-5 pb-24 relative flex flex-col gap-6">
            
            {/* Status Area */}
            <div className="bg-black text-white border-4 border-neutral-700 p-3 transform skew-x-[-2deg] font-mono uppercase text-sm font-bold flex justify-between items-center shrink-0">
              <span className="text-pink-500 flex items-center gap-2">
                <Activity className={`w-4 h-4 ${appState === 'SCANNING' || appState === 'ANALYZING' ? 'animate-pulse' : ''}`} /> 
                {appState === 'IDLE' ? 'STANDBY MODE' : 
                 appState === 'SCANNING' ? 'SEARCHING FOR AURAS...' : 
                 appState === 'FOUND' ? 'TARGET ACQUIRED' :
                 appState === 'ANALYZING' ? 'EXECUTING FLURRY...' : 'ANALYSIS COMPLETE' }
              </span>
              <span className="text-yellow-500">v1.0.0</span>
            </div>

            {/* Target Code Block Area */}
            {(appState === 'FOUND' || appState === 'ANALYZING' || appState === 'DONE') && (
              <div className="border-4 border-pink-500 bg-pink-950/30 p-4 relative transform translate-x-2 shrink-0 shadow-[4px_4px_0px_#FF0055]">
                <div className="absolute -top-3 -left-3 bg-pink-500 text-black font-black text-xs px-2 py-1 transform -rotate-6 border-2 border-black">
                  TARGET LOCK
                </div>
                <pre className="text-xs text-pink-200 mt-2 font-mono whitespace-pre-wrap overflow-x-hidden">
                  {`function debounce(func, wait) {\n  let timeout;\n  return function(...args) {\n    ...`}
                </pre>
              </div>
            )}

            {/* Empty State / Initial Instructions */}
            {appState === 'IDLE' && (
              <div className="flex-1 flex flex-col items-center justify-center text-center opacity-70">
                <Scan className="w-16 h-16 text-yellow-500 mb-4 opacity-50" />
                <p className="font-bold text-white uppercase tracking-widest font-mono text-lg mb-2">No Target Selected</p>
                <p className="text-purple-300 text-sm">Activate the stand to scan the current webpage for complex code blocks.</p>
              </div>
            )}

            {/* Analysis Output */}
            {(appState === 'ANALYZING' || appState === 'DONE') && (
              <div className="mt-4 bg-[#2D0A4E] border-l-4 border-yellow-400 p-4 shrink-0 shadow-lg">
                <div className="font-mono text-sm text-yellow-100 whitespace-pre-wrap leading-relaxed">
                  {typedExplanation}
                  {appState === 'ANALYZING' && <span className="inline-block w-2 h-4 bg-yellow-400 animate-pulse ml-1 align-middle" />}
                </div>
              </div>
            )}

          </div>

          {/* Bottom Action Area */}
          <div className="absolute bottom-0 inset-x-0 p-4 bg-gradient-to-t from-[#0B0413] via-[#1a0b2e] to-transparent pt-12">
            <button 
              onClick={handleAction}
              disabled={appState === 'SCANNING' || appState === 'ANALYZING'}
              className={`w-full font-display text-2xl tracking-widest py-4 px-6 border-4 border-black transform transition-all duration-200 font-bold uppercase flex items-center justify-center gap-3 relative overflow-hidden group
                ${appState === 'IDLE' ? 'bg-yellow-400 text-black hover:bg-yellow-300 hover:skew-x-[-2deg] hover:scale-[1.02] shadow-[6px_6px_0px_#FF0055]' : 
                  appState === 'SCANNING' ? 'bg-neutral-600 text-neutral-400 cursor-wait' :
                  appState === 'FOUND' ? 'bg-pink-500 text-white hover:bg-pink-400 hover:-translate-y-1 shadow-[4px_4px_0px_#FCD34D]' :
                  appState === 'ANALYZING' ? 'bg-purple-600 text-purple-300 italic scale-95' :
                  'bg-white text-black hover:bg-gray-200 shadow-[6px_6px_0px_#000]'
                }`}
            >
              {/* Action Button Text States */}
              {appState === 'IDLE' && <><Scan className="w-6 h-6" /> Scan Page</>}
              {appState === 'SCANNING' && 'Scanning...'}
              {appState === 'FOUND' && <><Zap className="w-6 h-6 fill-white" /> ORA! (Analyze)</>}
              {appState === 'ANALYZING' && 'Explaining...'}
              {appState === 'DONE' && <><ArrowRight className="w-6 h-6" /> Clear Target</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
