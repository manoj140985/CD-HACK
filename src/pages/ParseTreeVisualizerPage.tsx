import React, { useState, useRef, useEffect } from 'react';
import {
  Network,
  ZoomIn,
  ZoomOut,
  Maximize2,
  RotateCcw,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';
import { useGrammar } from '../context/GrammarContext.tsx';
import { ParseTreeNode, EPSILON } from '../types/compiler.ts';

export const ParseTreeVisualizerPage: React.FC = () => {
  const { simulationResult, activeGrammar } = useGrammar();

  const [selectedNode, setSelectedNode] = useState<ParseTreeNode | null>(null);
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 100, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const svgRef = useRef<SVGSVGElement | null>(null);
  const root = simulationResult?.parseTree;

  // Flatten nodes and edges for SVG rendering
  const nodes: ParseTreeNode[] = [];
  const edges: Array<{
    source: ParseTreeNode;
    target: ParseTreeNode;
  }> = [];

  if (root) {
    const queue = [root];
    while (queue.length > 0) {
      const current = queue.shift()!;
      nodes.push(current);
      if (current.children) {
        for (const child of current.children) {
          edges.push({ source: current, target: child });
          queue.push(child);
        }
      }
    }
  }

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // only left click
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoomIn = () => setZoom((z) => Math.min(2.5, z + 0.15));
  const handleZoomOut = () => setZoom((z) => Math.max(0.4, z - 0.15));
  const handleResetView = () => {
    setZoom(1);
    setPan({ x: 100, y: 50 });
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const factor = e.deltaY < 0 ? 1.08 : 0.92;
    setZoom((z) => Math.min(2.5, Math.max(0.4, z * factor)));
  };

  // Center tree on initial load
  useEffect(() => {
    if (root && root.x) {
      setPan({ x: 150, y: 40 });
    }
  }, [root]);

  if (!simulationResult || !root) {
    return (
      <div className="p-8 text-center text-slate-400 bg-slate-900/60 rounded-xl border border-slate-800 space-y-3">
        <Network className="w-10 h-10 text-slate-600 mx-auto" />
        <p>No parse tree available yet. Run the Predictive Parser on an input string to generate its derivation tree.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header and Controls */}
      <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-100 flex items-center gap-2">
            <Network className="w-4 h-4 text-indigo-400" />
            Interactive Parse Tree Visualizer
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Constructed directly from predictive parsing derivation steps. Drag to pan, scroll to zoom, click nodes to inspect.
          </p>
        </div>

        {/* Canvas Tools */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={handleZoomIn}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={handleZoomOut}
            className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={handleResetView}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium flex items-center gap-1.5 transition cursor-pointer"
            title="Reset Pan & Zoom"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset View ({Math.round(zoom * 100)}%)</span>
          </button>
        </div>
      </div>

      {/* Main Visualizer Area */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* SVG Canvas */}
        <div className="lg:col-span-8 rounded-xl border border-slate-800 bg-[#060810] shadow-2xl overflow-hidden relative min-h-[560px] flex flex-col">
          {/* Canvas Legend */}
          <div className="absolute top-3 left-3 z-10 flex items-center gap-3 p-2 rounded-lg bg-slate-900/90 border border-slate-800 backdrop-blur text-[11px] font-mono pointer-events-none">
            <span className="flex items-center gap-1 text-violet-300">
              <span className="w-2.5 h-2.5 rounded-full bg-violet-600 inline-block" /> Non-Terminal
            </span>
            <span className="flex items-center gap-1 text-emerald-300">
              <span className="w-2.5 h-2.5 rounded-md bg-emerald-600 inline-block" /> Terminal Leaf
            </span>
            <span className="flex items-center gap-1 text-amber-300">
              <span className="w-2.5 h-2.5 rounded-md bg-amber-600 inline-block" /> Epsilon (ε)
            </span>
          </div>

          {/* SVG Viewport */}
          <svg
            ref={svgRef}
            className="w-full h-full flex-1 cursor-grab active:cursor-grabbing select-none"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onWheel={handleWheel}
          >
            <g transform={`translate(${pan.x}, ${pan.y}) scale(${zoom})`}>
              {/* Edges */}
              {edges.map((edge, idx) => {
                const x1 = edge.source.x ?? 0;
                const y1 = edge.source.y ?? 0;
                const x2 = edge.target.x ?? 0;
                const y2 = edge.target.y ?? 0;

                return (
                  <path
                    key={`edge_${idx}`}
                    d={`M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`}
                    stroke="#334155"
                    strokeWidth="2"
                    fill="none"
                  />
                );
              })}

              {/* Nodes */}
              {nodes.map((node) => {
                const nx = node.x ?? 0;
                const ny = node.y ?? 0;
                const isSelected = selectedNode?.id === node.id;
                const isRoot = node.id === root.id;

                if (node.isEpsilon) {
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${nx}, ${ny})`}
                      onClick={() => setSelectedNode(node)}
                      className="cursor-pointer group"
                    >
                      <rect
                        x="-16"
                        y="-14"
                        width="32"
                        height="28"
                        rx="6"
                        fill="#451a03"
                        stroke={isSelected ? '#f59e0b' : '#b45309'}
                        strokeWidth={isSelected ? 3 : 1.5}
                        className="transition-all group-hover:stroke-amber-400"
                      />
                      <text
                        textAnchor="middle"
                        dy="5"
                        fill="#fde68a"
                        fontSize="13"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {EPSILON}
                      </text>
                    </g>
                  );
                }

                if (node.isTerminal) {
                  return (
                    <g
                      key={node.id}
                      transform={`translate(${nx}, ${ny})`}
                      onClick={() => setSelectedNode(node)}
                      className="cursor-pointer group"
                    >
                      <rect
                        x="-20"
                        y="-15"
                        width="40"
                        height="30"
                        rx="6"
                        fill="#064e3b"
                        stroke={isSelected ? '#34d399' : '#059669'}
                        strokeWidth={isSelected ? 3 : 1.5}
                        className="transition-all group-hover:stroke-emerald-300"
                      />
                      <text
                        textAnchor="middle"
                        dy="5"
                        fill="#a7f3d0"
                        fontSize="12"
                        fontWeight="bold"
                        fontFamily="monospace"
                      >
                        {node.symbol}
                      </text>
                    </g>
                  );
                }

                // Non-Terminal Internal Node
                return (
                  <g
                    key={node.id}
                    transform={`translate(${nx}, ${ny})`}
                    onClick={() => setSelectedNode(node)}
                    className="cursor-pointer group"
                  >
                    <circle
                      r={isRoot ? 22 : 19}
                      fill={isRoot ? '#1e1b4b' : '#1e1b4b'}
                      stroke={
                        isSelected
                          ? '#818cf8'
                          : isRoot
                          ? '#6366f1'
                          : '#4f46e5'
                      }
                      strokeWidth={isSelected ? 3 : 2}
                      className="transition-all group-hover:stroke-indigo-300"
                    />
                    <text
                      textAnchor="middle"
                      dy="5"
                      fill="#e0e7ff"
                      fontSize={isRoot ? 13 : 12}
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {node.symbol}
                    </text>
                  </g>
                );
              })}
            </g>
          </svg>
        </div>

        {/* Node Inspector Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-4">
            <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
              <Info className="w-4 h-4 text-indigo-400" />
              Node Inspector
            </h3>

            {selectedNode ? (
              <div className="space-y-3 font-mono text-xs">
                <div className="p-3 rounded-lg bg-[#070a12] border border-slate-800 space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Selected Node Symbol
                  </span>
                  <div className="text-lg font-bold text-indigo-300 flex items-center justify-between">
                    <span>{selectedNode.symbol}</span>
                    <span className="text-[11px] font-normal px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                      Depth: {selectedNode.depth}
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-lg bg-[#070a12] border border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                    Classification
                  </span>
                  <span className="text-slate-200">
                    {selectedNode.isEpsilon
                      ? 'Epsilon Transition Leaf (ε)'
                      : selectedNode.isTerminal
                      ? 'Terminal Leaf (Matched Token)'
                      : 'Non-Terminal Internal Node'}
                  </span>
                </div>

                {selectedNode.ruleDisplay && (
                  <div className="p-3 rounded-lg bg-[#070a12] border border-slate-800 space-y-1">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Production Rule Applied
                    </span>
                    <span className="text-emerald-300 font-bold">
                      {selectedNode.ruleDisplay}
                    </span>
                  </div>
                )}

                {selectedNode.children && selectedNode.children.length > 0 && (
                  <div className="p-3 rounded-lg bg-[#070a12] border border-slate-800 space-y-1.5">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      Direct Children ({selectedNode.children.length}):
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {selectedNode.children.map((child) => (
                        <span
                          key={child.id}
                          className={`px-2 py-0.5 rounded text-[11px] ${
                            child.isTerminal
                              ? 'bg-emerald-950/70 text-emerald-300 border border-emerald-800/60'
                              : child.isEpsilon
                              ? 'bg-amber-950/70 text-amber-300 border border-amber-800/60'
                              : 'bg-indigo-950/70 text-indigo-300 border border-indigo-800/60'
                          }`}
                        >
                          {child.symbol}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-xs text-slate-400 leading-relaxed">
                Click any circle or rectangle in the diagram to inspect its derivation rule, child symbols, depth level, and token match.
              </p>
            )}
          </div>

          {/* Grammar Derivation Summary */}
          <div className="p-5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-2 text-xs">
            <span className="font-semibold text-slate-300 block">
              Derivation Properties:
            </span>
            <div className="text-slate-400 space-y-1 font-mono">
              <div>Total Nodes: <strong className="text-slate-200">{nodes.length}</strong></div>
              <div>Root Symbol: <strong className="text-indigo-400">{root.symbol}</strong></div>
              <div>Leaves (Yield): <strong className="text-emerald-300">{nodes.filter((n) => n.isTerminal || n.isEpsilon).map((n) => n.symbol).join(' ')}</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
