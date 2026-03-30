import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useJoinQueue } from '../hooks/useQueue.js';
import { useStore } from '../store/index.js';
import '../styles/JoinQueue.css';

export const JoinQueue = () => {
  const { queueId } = useParams();
  const navigate = useNavigate();
  const { loading, error } = useStore();
  const { joinQueue } = useJoinQueue();
  const [userName, setUserName] = useState('');
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!userName.trim()) {
      setLocalError('Please enter your name');
      return;
    }

    try {
      await joinQueue(queueId, userName);
      navigate(`/queue/${queueId}/status`);
    } catch (error) {
      setLocalError(error.response?.data?.message || 'Failed to join queue');
    }
  };

  return (
    <div className="join-queue-container">
      <div className="join-queue-card">
        <h1>Join Queue</h1>
        
        {(error || localError) && (
          <div className="error-message">
            {error || localError}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="userName">Enter Your Name</label>
            <input
              type="text"
              id="userName"
              value={userName}
              onChange={(e) => {
                setUserName(e.target.value);
                setLocalError('');
              }}
              placeholder="John Doe"
              disabled={loading}
            />
          </div>

          <button type="submit" disabled={loading} className="join-btn">
            {loading ? 'Joining...' : 'Join Queue'}
          </button>
        </form>

        <button 
          onClick={() => navigate('/')} 
          className="back-btn"
          disabled={loading}
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default JoinQueue;
