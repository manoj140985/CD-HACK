import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar.tsx';
import { Header } from './Header.tsx';
import { PipelineStepper } from './PipelineStepper.tsx';

const PAGE_META: Record<string, { title: string; subtitle: string }> = {
  '/': {
    title: 'Compiler Pipeline Dashboard',
    subtitle: 'Overview of context-free grammar analysis, transformations, and predictive parsing status.',
  },
  '/editor': {
    title: 'Grammar Editor & Validator',
    subtitle: 'Define CFG productions with epsilon support, multi-character terminals, and real-time syntax checking.',
  },
  '/transformations': {
    title: 'Grammar Transformations',
    subtitle: 'Immediate Left Recursion Elimination and Left Factoring with step-by-step mathematical explanations.',
  },
  '/first-follow': {
    title: 'FIRST & FOLLOW Sets',
    subtitle: 'Fixed-point iterative computation with round-by-round convergence tracking.',
  },
  '/table': {
    title: 'LL(1) Parsing Table',
    subtitle: 'Predictive matrix construction M[A, a], conflict detection (FIRST/FIRST & FIRST/FOLLOW), and LL(1) verification.',
  },
  '/simulator': {
    title: 'Predictive Parser Simulator',
    subtitle: 'Interactive stack-based simulator with step-by-step trace, remaining input, and error position diagnostics.',
  },
  '/tree': {
    title: 'Parse Tree Visualizer',
    subtitle: 'Interactive SVG tree diagram generated from the predictive parsing derivation with pan, zoom, and node inspector.',
  },
  '/practice': {
    title: 'Practice Arena',
    subtitle: 'Interactive compiler design challenges, test string acceptance quizzes, and real-time scoring.',
  },
  '/docs': {
    title: 'LL(1) Compiler Theory & Documentation',
    subtitle: 'Comprehensive guide to CFGs, left recursion, left factoring, FIRST/FOLLOW, and LL(1) parser design.',
  },
};

export const Layout: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const currentMeta = PAGE_META[location.pathname] || {
    title: 'ParseViz Studio',
    subtitle: 'LL(1) Grammar Practice Studio',
  };

  return (
    <div className="min-h-screen bg-[#050807] text-[#F5F7F5] flex">
      {/* Persistent Sidebar */}
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(!collapsed)} />

      {/* Main Content Area */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-all duration-300 ease-in-out ${
          collapsed ? 'ml-20' : 'ml-64'
        }`}
      >
        <Header title={currentMeta.title} subtitle={currentMeta.subtitle} />
        <PipelineStepper />
        <main className="flex-1 p-4 md:p-6 overflow-y-auto bg-[#050807]">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
