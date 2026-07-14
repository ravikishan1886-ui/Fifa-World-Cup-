import React, { useState } from 'react';
import { stadiumGraph } from '../venueGraph';
import { VenueNode } from '../types';
import { 
  Compass, 
  MapPin, 
  Flame, 
  Accessibility, 
  Navigation,
  Utensils, 
  Activity, 
  Info, 
  LogIn, 
  LogOut, 
  Armchair,
  CheckCircle,
  Clock
} from 'lucide-react';

interface StadiumMapProps {
  activePath: string[] | null;
  originNodeId: string;
  destNodeId: string;
  onSelectNode: (nodeId: string) => void;
  stepFreeOnly: boolean;
}

export const StadiumMap: React.FC<StadiumMapProps> = ({
  activePath,
  originNodeId,
  destNodeId,
  onSelectNode,
  stepFreeOnly,
}) => {
  const [hoveredNode, setHoveredNode] = useState<VenueNode | null>(null);

  // Helper to get node color
  const getNodeColor = (node: VenueNode) => {
    const isOrigin = node.id === originNodeId;
    const isDest = node.id === destNodeId;
    const isPartOfPath = activePath?.includes(node.id);

    if (isOrigin) return 'bg-blue-600 text-white border-blue-700 scale-125 ring-4 ring-blue-100 animate-pulse';
    if (isDest) return 'bg-rose-500 text-white border-rose-600 scale-125 ring-4 ring-rose-100';
    if (isPartOfPath) return 'bg-blue-400 text-slate-950 border-blue-500 scale-110 shadow-md ring-2 ring-blue-100';

    switch (node.type) {
      case 'gate':
        return 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100';
      case 'exit':
        return 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100';
      case 'seating':
        return node.step_free 
          ? 'bg-blue-50 text-blue-800 border-blue-100 hover:bg-blue-100'
          : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200';
      case 'restroom':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100';
      case 'concession':
        return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100';
      case 'medical':
        return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 animate-pulse';
      case 'guest_services':
        return 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100';
      default:
        return 'bg-slate-50 text-slate-600 border-slate-200';
    }
  };

  // Helper to render type-specific icons
  const renderNodeIcon = (type: string, size = 12) => {
    switch (type) {
      case 'gate':
        return <LogIn size={size} />;
      case 'exit':
        return <LogOut size={size} />;
      case 'seating':
        return <Armchair size={size} />;
      case 'restroom':
        return <Accessibility size={size} />;
      case 'concession':
        return <Utensils size={size} />;
      case 'medical':
        return <Activity size={size} />;
      case 'guest_services':
        return <Info size={size} />;
      default:
        return <MapPin size={size} />;
    }
  };

  // Build coordinate lines for the active path
  const pathLines: { x1: number; y1: number; x2: number; y2: number }[] = [];
  if (activePath && activePath.length > 1) {
    const nodesMap = new Map(stadiumGraph.nodes.map((n) => [n.id, n]));
    for (let i = 0; i < activePath.length - 1; i++) {
      const n1 = nodesMap.get(activePath[i]);
      const n2 = nodesMap.get(activePath[i + 1]);
      if (n1 && n2) {
        pathLines.push({ x1: n1.x, y1: n1.y, x2: n2.x, y2: n2.y });
      }
    }
  }

  return (
    <div className="relative w-full aspect-square md:aspect-[4/3] bg-slate-900 rounded-2xl overflow-hidden shadow-xl border border-slate-800">
      {/* Dynamic Watermark / Background Field */}
      <div className="absolute inset-0 opacity-15 pointer-events-none flex items-center justify-center">
        <div className="w-[80%] h-[70%] border-4 border-dashed border-blue-500/30 rounded-[50%] flex items-center justify-center">
          <div className="w-[50%] h-[50%] border-4 border-solid border-blue-500/20 rounded-[50%] flex items-center justify-center">
            <div className="w-10 h-10 rounded-full bg-blue-500/10"></div>
          </div>
        </div>
      </div>

      {/* Grid Overlay */}
      <div className="absolute inset-0 grid grid-cols-10 grid-rows-10 opacity-5 pointer-events-none">
        {Array.from({ length: 100 }).map((_, i) => (
          <div key={i} className="border-[0.5px] border-slate-600"></div>
        ))}
      </div>

      {/* Central Soccer Field Illustration */}
      <div className="absolute left-[35%] top-[40%] w-[30%] h-[20%] border border-blue-500/30 rounded-xs bg-blue-950/20 flex items-center justify-center pointer-events-none">
        <div className="w-[50%] h-full border-r border-blue-500/30 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border border-blue-500/30"></div>
        </div>
      </div>

      {/* Custom Header with Compass Branding */}
      <div className="absolute top-4 left-4 z-10 flex items-center gap-2 bg-slate-950/80 backdrop-blur-md border border-slate-800 rounded-lg px-3 py-1.5 shadow-lg">
        <Compass className="w-4 h-4 text-blue-400 animate-spin-slow" />
        <span className="text-xs font-semibold text-slate-100 tracking-wider">MAP VIEW</span>
        {stepFreeOnly && (
          <span className="flex items-center gap-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded px-1.5 py-0.2">
            <Accessibility className="w-3 h-3" /> STEP-FREE
          </span>
        )}
      </div>

      {/* SVG Canvas for Map Lines & Route Path */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 100 100" preserveAspectRatio="none">
        {/* Render connections of the entire stadium in subtle gray */}
        {stadiumGraph.edges.map((edge, index) => {
          const fromNode = stadiumGraph.nodes.find((n) => n.id === edge.from);
          const toNode = stadiumGraph.nodes.find((n) => n.id === edge.to);
          if (!fromNode || !toNode) return null;
          return (
            <line
              key={`edge-${index}`}
              x1={fromNode.x}
              y1={fromNode.y}
              x2={toNode.x}
              y2={toNode.y}
              stroke="#334155"
              strokeWidth="0.4"
              strokeDasharray="1,1"
              opacity="0.4"
            />
          );
        })}

        {/* Render Shortest Route Path */}
        {pathLines.map((line, index) => (
          <g key={`path-${index}`}>
            {/* Soft background glow */}
            <line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#60a5fa"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.25"
            />
            {/* Active pulsing path line */}
            <line
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="#2563eb"
              strokeWidth="1.2"
              strokeLinecap="round"
              strokeDasharray="2,2"
              className="animate-pulse"
              opacity="0.9"
            />
          </g>
        ))}
      </svg>

      {/* Interactive Node Markers */}
      {stadiumGraph.nodes.map((node) => {
        const isHovered = hoveredNode?.id === node.id;
        const isOrigin = node.id === originNodeId;
        const isDest = node.id === destNodeId;
        const isPartOfPath = activePath?.includes(node.id);

        return (
          <div
            key={node.id}
            style={{ left: `${node.x}%`, top: `${node.y}%` }}
            className="absolute transform -translate-x-1/2 -translate-y-1/2 z-20"
          >
            {/* Accessible / Step-Free Badge indicator */}
            {!node.step_free && (
              <span className="absolute -top-1.5 -right-1.5 z-30 flex h-3 w-3 items-center justify-center rounded-full bg-slate-800 text-[8px] font-black border border-slate-700 text-slate-300">
                ⚠️
              </span>
            )}
            
            <button
              id={`node-${node.id}`}
              onClick={() => onSelectNode(node.id)}
              onMouseEnter={() => setHoveredNode(node)}
              onMouseLeave={() => setHoveredNode(null)}
              className={`flex items-center justify-center w-7 h-7 rounded-full border transition-all duration-300 cursor-pointer ${getNodeColor(node)}`}
              title={`${node.name} (${node.type})`}
            >
              {renderNodeIcon(node.type, 13)}
            </button>

            {/* Hover tooltip */}
            {isHovered && (
              <div className="absolute top-8 left-1/2 transform -translate-x-1/2 z-40 bg-slate-950 border border-slate-800 text-white rounded-lg p-2.5 shadow-2xl min-w-44 text-xs pointer-events-none">
                <div className="font-bold flex items-center justify-between gap-2 border-b border-slate-800 pb-1 mb-1">
                  <span>{node.name}</span>
                  <span className="text-[9px] uppercase font-mono px-1 py-0.2 bg-slate-800 text-slate-400 rounded">
                    {node.type}
                  </span>
                </div>
                <div className="space-y-0.5 text-slate-400 text-[10px]">
                  <p className="flex items-center gap-1">
                    <span>Coordinates:</span>
                    <span className="font-mono text-slate-300">({node.x}, {node.y})</span>
                  </p>
                  <p className="flex items-center gap-1">
                    <span>Step-Free Access:</span>
                    {node.step_free ? (
                      <span className="text-emerald-400 font-bold flex items-center gap-0.5">
                        <CheckCircle size={10} /> Yes
                      </span>
                    ) : (
                      <span className="text-rose-400 font-bold">⚠️ Stairs Req.</span>
                    )}
                  </p>
                </div>
                <div className="text-[9px] text-slate-500 mt-1 border-t border-slate-900 pt-1">
                  Click to select as Origin/Destination
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Bottom Information Legend */}
      <div className="absolute bottom-4 left-4 right-4 bg-slate-950/80 backdrop-blur-md border border-slate-800/80 rounded-xl p-3 flex flex-wrap gap-x-4 gap-y-2 justify-between items-center text-[11px] text-slate-300">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-blue-500 rounded-full"></span>
            <span>Gates</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-sky-400 rounded-full"></span>
            <span>Accessible Seats</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-slate-400 rounded-full"></span>
            <span>Standard Seats</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-amber-500 rounded-full"></span>
            <span>Food / Beer</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-2.5 h-2.5 bg-rose-500 rounded-full animate-pulse"></span>
            <span>Medical</span>
          </div>
        </div>

        {activePath && (
          <div className="flex items-center gap-1 text-blue-400 font-bold border-l border-slate-800/80 pl-3">
            <Navigation className="w-3.5 h-3.5 rotate-45" />
            <span>Path Active ({activePath.length} nodes)</span>
          </div>
        )}
      </div>
    </div>
  );
};
