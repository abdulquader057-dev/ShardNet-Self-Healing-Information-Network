import React, { useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import CreateMessage from './pages/CreateMessage';
import StorageView from './pages/StorageView';
import ScanPage from './pages/ScanPage';
import ReconstructedView from './pages/ReconstructedView';
import Inbox from './pages/Inbox';
import BluetoothMesh from './pages/BluetoothMesh';
import MeshPulse from './pages/MeshPulse';
import MeshWhisper from './pages/MeshWhisper';
import SilentRelay from './pages/SilentRelay';
import Help from './pages/Help';
import SurvivalKit from './pages/SurvivalKit';
import { performSelfHealing } from './storage/db';
import { messageManager } from './core/messageManager';
import { safeInit, safeInterval, isLowBattery, safeCall } from './core/stability';
import ErrorBoundary from './components/ErrorBoundary';
import SOSButtonFlow from './components/SOSButtonFlow';

function App() {
  useEffect(() => {
    // 1. Initialize Core Engines
    safeInit("Message Manager", () => {
      messageManager.init();
    });

    // 2. Scheduled Self-Healing (Harnessed)
    const cleanup = safeInterval(async () => {
      await performSelfHealing();
    }, 300000); // 5 minutes

    return () => safeCall(cleanup, "Interval Cleanup");
  }, []);

  return (
    <Router>
      <div className="app-container">
        <div className="noise-overlay" />
        <Navbar />
        <SOSButtonFlow />
        <main className="ui-overlay">
          <ErrorBoundary>
            <Routes>
              <Route path="/"            element={<Home />} />
              <Route path="/create"      element={<CreateMessage />} />
              <Route path="/storage"     element={<StorageView />} />
              <Route path="/scan"        element={<ScanPage />} />
              <Route path="/bluetooth"   element={<BluetoothMesh />} />
              <Route path="/reconstructed" element={<ReconstructedView />} />
              <Route path="/hub"         element={<ReconstructedView />} />
              <Route path="/inbox"       element={<Inbox />} />
              <Route path="/pulse"       element={<MeshPulse />} />
              <Route path="/whisper"     element={<MeshWhisper />} />
              <Route path="/relay"       element={<SilentRelay />} />
              <Route path="/help"        element={<Help />} />
              <Route path="/survival"    element={<SurvivalKit />} />
              <Route path="/index.html"  element={<Home />} />
            </Routes>
          </ErrorBoundary>
        </main>
      </div>
    </Router>
  );
}

export default App;
