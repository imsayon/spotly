import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/index.js';
import api from '../api/client.js';
import '../styles/Home.css';

export const Home = () => {
  const navigate = useNavigate();
  const { setLoading, setError } = useStore();
  const [queues, setQueues] = useState([]);

  useEffect(() => {
    const fetchQueues = async () => {
      setLoading(true);
      try {
        const response = await api.get('/queue/available');
        setQueues(response.data);
      } catch (error) {
        setError('Failed to load queues');
      } finally {
        setLoading(false);
      }
    };

    fetchQueues();
  }, [setLoading, setError]);

  const handleSelectQueue = (queueId) => {
    navigate(`/join/${queueId}`);
  };

  return (
    <div className="home-container">
      <h1>Select a Queue</h1>
      <div className="queues-grid">
        {queues.length > 0 ? (
          queues.map((queue) => (
            <div key={queue.id} className="queue-card">
              <h3>{queue.name}</h3>
              <p>Current Position: {queue.currentPosition}</p>
              <p>Avg Wait: {queue.avgWaitTime} min</p>
              <button onClick={() => handleSelectQueue(queue.id)}>
                Join Queue
              </button>
            </div>
          ))
        ) : (
          <p>No queues available</p>
        )}
      </div>
    </div>
  );
};

export default Home;
