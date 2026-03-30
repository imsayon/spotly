import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect } from 'react';
import Home from './pages/Home';
import JoinQueue from './pages/JoinQueue';
import QueueStatus from './pages/QueueStatus';
import { initializeSocket } from './utils/socket';
import './App.css';

function App() {
  useEffect(() => {
    // Initialize socket connection on app load
    initializeSocket();
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/join/:queueId" element={<JoinQueue />} />
        <Route path="/queue/:queueId/status" element={<QueueStatus />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
