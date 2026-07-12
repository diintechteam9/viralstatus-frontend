import { useState, useCallback, useRef, useEffect } from 'react';
import ugcJobService from '../services/ugcJobService';

/**
 * Custom hook for managing UGC video generation jobs
 * Handles job creation, polling, cancellation, and state management
 */
export const useUGCJob = () => {
  const [jobId, setJobId] = useState(null);
  const [status, setStatus] = useState('idle'); // idle, creating, processing, completed, failed, cancelled
  const [progress, setProgress] = useState(0);
  const [outputUrl, setOutputUrl] = useState(null);
  const [error, setError] = useState(null);
  const [data, setData] = useState(null);
  const pollingRef = useRef(null);

  /**
   * Create a new UGC job
   */
  const createJob = useCallback(async (videoId, settings = {}) => {
    setStatus('creating');
    setError(null);
    setProgress(0);

    const result = await ugcJobService.createJob(videoId, settings);

    if (result.success) {
      setJobId(result.jobId);
      setStatus('processing');
      setData(result.data);
      return result;
    } else {
      setStatus('failed');
      setError(result.error);
      return result;
    }
  }, []);

  /**
   * Poll job status
   */
  const pollStatus = useCallback(async (id, maxAttempts = 120, interval = 5000) => {
    if (!id) return;

    const result = await ugcJobService.pollJobStatus(id, maxAttempts, interval);

    if (result.success) {
      setStatus('completed');
      setProgress(100);
      setOutputUrl(result.outputUrl);
      setData(result.data);
    } else if (result.status === 'timeout') {
      setStatus('processing');
      setProgress(result.progress || 50);
      setError(result.error);
    } else {
      setStatus('failed');
      setError(result.error);
      setData(result.data);
    }

    return result;
  }, []);

  /**
   * Start polling for a job
   */
  const startPolling = useCallback((id, interval = 5000) => {
    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(async () => {
      const result = await ugcJobService.getJobStatus(id);

      if (result.success) {
        setProgress(result.progress || 0);

        if (result.status === 'completed' || result.outputUrl) {
          setStatus('completed');
          setProgress(100);
          setOutputUrl(result.outputUrl);
          setData(result.data);
          clearInterval(pollingRef.current);
        } else if (result.status === 'failed' || result.error) {
          setStatus('failed');
          setError(result.error);
          setData(result.data);
          clearInterval(pollingRef.current);
        }
      } else {
        setError(result.error);
        clearInterval(pollingRef.current);
      }
    }, interval);
  }, []);

  /**
   * Cancel the job
   */
  const cancelJob = useCallback(async () => {
    if (!jobId) return;

    if (pollingRef.current) clearInterval(pollingRef.current);

    const result = await ugcJobService.cancelJob(jobId);

    if (result.success) {
      setStatus('cancelled');
      setJobId(null);
    } else {
      setError(result.error);
    }

    return result;
  }, [jobId]);

  /**
   * Reset state
   */
  const reset = useCallback(() => {
    if (pollingRef.current) clearInterval(pollingRef.current);
    setJobId(null);
    setStatus('idle');
    setProgress(0);
    setOutputUrl(null);
    setError(null);
    setData(null);
  }, []);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, []);

  return {
    jobId,
    status,
    progress,
    outputUrl,
    error,
    data,
    createJob,
    pollStatus,
    startPolling,
    cancelJob,
    reset,
  };
};

export default useUGCJob;
