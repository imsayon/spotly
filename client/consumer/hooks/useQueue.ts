import { useEffect } from 'react';
import { queueApi } from '../services/api';
import { joinMerchantRoom, onQueueUpdated } from '../services/socket';
import { useQueueStore } from '../store/queueStore';

export const useQueue = (merchantId: string) => {
  const { entry, loading, error, setEntry, updatePosition, setLoading, setError } =
    useQueueStore();

  const join = async (userId: string) => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await queueApi.join(merchantId, userId);
      setEntry({
        ...data,
        merchantId,
        userId,
        status: 'WAITING',
        createdAt: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to join queue');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    joinMerchantRoom(merchantId);
    return onQueueUpdated((data) => {
      if (data.position !== undefined) updatePosition(data.position);
    });
  }, [merchantId]);

  return { entry, loading, error, join };
};
