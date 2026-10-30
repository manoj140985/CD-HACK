import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GrammarProvider } from './context/GrammarContext.tsx';
import { Layout } from './components/Layout.tsx';
import { DashboardPage } from './pages/DashboardPage.tsx';
import { GrammarEditorPage } from './pages/GrammarEditorPage.tsx';
import { TransformationsPage } from './pages/TransformationsPage.tsx';
import { FirstFollowPage } from './pages/FirstFollowPage.tsx';
import { ParsingTablePage } from './pages/ParsingTablePage.tsx';
import { ParsingSimulatorPage } from './pages/ParsingSimulatorPage.tsx';
import { ParseTreeVisualizerPage } from './pages/ParseTreeVisualizerPage.tsx';
import { DocumentationPage } from './pages/DocumentationPage.tsx';

export default function App() {
  return (
    <GrammarProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<DashboardPage />} />
            <Route path="editor" element={<GrammarEditorPage />} />
            <Route path="transformations" element={<TransformationsPage />} />
            <Route path="first-follow" element={<FirstFollowPage />} />
            <Route path="table" element={<ParsingTablePage />} />
            <Route path="simulator" element={<ParsingSimulatorPage />} />
            <Route path="tree" element={<ParseTreeVisualizerPage />} />
            <Route path="docs" element={<DocumentationPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </GrammarProvider>
  );
}
