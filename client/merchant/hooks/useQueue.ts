import { useEffect } from 'react';
import { queueApi } from '../services/api';
import { joinMerchantRoom, onQueueUpdated } from '../services/socket';
import { useQueueStore } from '../store/queueStore';

export const useMerchantQueue = (merchantId: string) => {
  const { queueState, loading, error, setQueueState, setLoading, setError } = useQueueStore();

  const advance = async () => {
    setLoading(true);
    setError(null);
    try {
      await queueApi.advance(merchantId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to advance queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    joinMerchantRoom(merchantId);
    return onQueueUpdated((data) => {
      if (data.currentToken !== undefined && queueState) {
        setQueueState({ ...queueState, currentToken: data.currentToken });
      }
    });
  }, [merchantId]);

  return { queueState, loading, error, advance };
};
