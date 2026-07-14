import React from 'react';
import { stadiumGraph } from '../venueGraph';
import { Compass, Accessibility, RotateCcw, Play, CheckCircle, ArrowRight, ShieldCheck, Clock } from 'lucide-react';

interface NavigationControlsProps {
  origin: string;
  destination: string;
  stepFreeOnly: boolean;
  onOriginChange: (val: string) => void;
  onDestinationChange: (val: string) => void;
  onStepFreeToggle: (val: boolean) => void;
  onCalculate: () => void;
  onReset: () => void;
  pathResult: {
    path: string[];
    total_seconds: number;
    step_free: boolean;
  } | null;
  errorMsg: string | null;
}

export const NavigationControls: React.FC<NavigationControlsProps> = ({
  origin,
  destination,
  stepFreeOnly,
  onOriginChange,
  onDestinationChange,
  onStepFreeToggle,
  onCalculate,
  onReset,
  pathResult,
  errorMsg,
}) => {
  // Sort nodes alphabetically by name for dropdown usability
  const sortedNodes = [...stadiumGraph.nodes].sort((a, b) => a.name.localeCompare(b.name));

  const formatTime = (seconds: number) => {
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return secs > 0 ? `${mins}m ${secs}s` : `${mins}m`;
  };

  const nodesMap = new Map(stadiumGraph.nodes.map((n) => [n.id, n]));

  return (
    <div className="bg-white border border-slate-200 shadow-xl rounded-2xl p-5 space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-slate-800 tracking-tight">Compass26 Router</h2>
            <p className="text-[10px] text-slate-500 font-medium">World Cup Stadium Navigator</p>
          </div>
        </div>
        <button
          onClick={onReset}
          className="text-xs text-slate-500 hover:text-slate-850 font-semibold flex items-center gap-1 cursor-pointer transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" /> Reset
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label htmlFor="origin-select" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            STARTING POINT (ORIGIN)
          </label>
          <select
            id="origin-select"
            value={origin}
            onChange={(e) => onOriginChange(e.target.value)}
            className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-blue-500 cursor-pointer transition-all"
          >
            <option value="">-- Choose location --</option>
            {sortedNodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.name} {!node.step_free ? '⚠️' : ''}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="destination-select" className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
            DESTINATION (WHERE TO?)
          </label>
          <select
            id="destination-select"
            value={destination}
            onChange={(e) => onDestinationChange(e.target.value)}
            className="w-full text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-blue-500 cursor-pointer transition-all"
          >
            <option value="">-- Choose location --</option>
            {sortedNodes.map((node) => (
              <option key={node.id} value={node.id}>
                {node.name} {!node.step_free ? '⚠️' : ''}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Step Free Toggle */}
      <div className="flex items-center justify-between bg-slate-50 hover:bg-slate-100/60 transition-colors rounded-xl p-3 border border-slate-150">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
            <Accessibility className="w-4 h-4" />
          </div>
          <div>
            <span className="text-xs font-bold text-slate-800 block">Step-Free Route Only</span>
            <span className="text-[10px] text-slate-500 font-medium block">Avoid all stairs, elevators, & steps</span>
          </div>
        </div>
        <button
          id="step-free-toggle-button"
          onClick={() => onStepFreeToggle(!stepFreeOnly)}
          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
            stepFreeOnly ? 'bg-blue-600' : 'bg-slate-300'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-xs ring-0 transition duration-200 ease-in-out ${
              stepFreeOnly ? 'translate-x-4' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      <button
        id="calculate-path-button"
        onClick={onCalculate}
        disabled={!origin || !destination}
        className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl text-xs hover:bg-blue-700 disabled:bg-slate-100 disabled:text-slate-400 transition-all cursor-pointer shadow-md shadow-blue-600/10 flex items-center justify-center gap-2"
      >
        <Play className="w-4 h-4 fill-current" /> Calculate Route
      </button>

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl p-3 flex gap-2">
          <span className="font-bold">⚠️ Error:</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {pathResult && (
        <div className="bg-blue-50/40 border border-blue-150 rounded-xl p-4 space-y-3">
          <div className="flex items-center justify-between border-b border-blue-100/40 pb-2">
            <div className="flex items-center gap-1.5 text-blue-900 font-bold text-xs">
              <CheckCircle className="w-4 h-4 text-blue-600" />
              <span>Route Found!</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-slate-600 text-xs font-medium">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Est. Walk:</span>
                <strong className="text-slate-900 font-bold">{formatTime(pathResult.total_seconds)}</strong>
              </div>
            </div>
          </div>

          {/* Step Free confirmation banner */}
          <div className="flex items-center gap-2 py-1">
            {pathResult.step_free ? (
              <span className="flex items-center gap-1.5 text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200 rounded-md px-2 py-1">
                <ShieldCheck className="w-3.5 h-3.5" /> THIS ROUTE IS FULLY ACCESSIBLE (STEP-FREE)
              </span>
            ) : (
              <span className="flex items-center gap-1.5 text-[10px] font-bold bg-amber-500/15 text-amber-850 border border-amber-500/30 rounded-md px-2 py-1">
                ⚠️ THIS ROUTE CONTAINS STAIRS OR ESCALATORS
              </span>
            )}
          </div>

          {/* Breadcrumb Steps */}
          <div>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
              STEP-BY-STEP DIRECTIONS
            </span>
            <div className="flex flex-wrap items-center gap-x-1 gap-y-2 text-xs font-semibold text-slate-700 bg-white border border-slate-100 rounded-lg p-2.5 shadow-xs">
              {pathResult.path.map((nodeId, idx) => {
                const node = nodesMap.get(nodeId);
                const isLast = idx === pathResult.path.length - 1;
                return (
                  <React.Fragment key={nodeId}>
                    <span
                      className={`px-2 py-1 rounded-md text-[11px] ${
                        idx === 0
                          ? 'bg-blue-600 text-white font-bold'
                          : isLast
                          ? 'bg-rose-500 text-white font-bold'
                          : 'bg-slate-150 text-slate-800'
                      }`}
                    >
                      {node?.name || nodeId}
                    </span>
                    {!isLast && <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
