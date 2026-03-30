import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQueueUpdates, useLeaveQueue } from '../hooks/useQueue.js';
import { useStore } from '../store/index.js';
import '../styles/QueueStatus.css';

export const QueueStatus = () => {
  const { queueId } = useParams();
  const navigate = useNavigate();
  
  const { position, currentQueue, status, loading } = useStore();
  const { leaveQueue } = useLeaveQueue();
  
  // Listen for real-time updates
  useQueueUpdates();

  useEffect(() => {
    if (!currentQueue && !loading) {
      navigate('/');
    }
  }, [currentQueue, loading, navigate]);

  const handleLeaveQueue = async () => {
    if (window.confirm('Are you sure you want to leave the queue?')) {
      try {
        await leaveQueue(null); // Pass userId if available
        navigate('/');
      } catch (error) {
        console.error('Failed to leave queue:', error);
      }
    }
  };

  const handleNotificationSound = () => {
    const audio = new Audio('data:audio/wav;base64,UklGRiYAAABXQVZFZm10IBAAAAABAAEAQB8AAAB9AAACABAAZGF0YQIAAAAAAA==');
    audio.play();
  };

  if (loading) {
    return <div className="loading">Loading queue status...</div>;
  }

  if (!currentQueue) {
    return <div className="error">Queue not found</div>;
  }

  const isNearTurn = position <= 3;

  return (
    <div className="queue-status-container">
      <div className="status-card">
        <h1>{currentQueue.name}</h1>

        <div className={`position-display ${isNearTurn ? 'near-turn' : ''}`}>
          <div className="position-number">{position}</div>
          <p className="position-label">Your Position</p>
        </div>

        {isNearTurn && (
          <>
            <div className="notification-banner">
              <p>🎉 You're next! Please be ready.</p>
            </div>
            <button onClick={handleNotificationSound} className="notify-btn">
              Play Notification Sound
            </button>
          </>
        )}

        <div className="queue-stats">
          <div className="stat">
            <label>Avg Wait Time</label>
            <span>{currentQueue.avgWaitTime} min</span>
          </div>
          <div className="stat">
            <label>Total in Queue</label>
            <span>{currentQueue.totalUsers}</span>
          </div>
          <div className="stat">
            <label>Status</label>
            <span className={`status-badge ${status}`}>{status}</span>
          </div>
        </div>

        <div className="queue-info">
          <p>Your position will update in real-time as others are served.</p>
        </div>

        <button 
          onClick={handleLeaveQueue} 
          className="leave-btn"
          disabled={loading}
        >
          Leave Queue
        </button>
      </div>
    </div>
  );
};

export default QueueStatus;
