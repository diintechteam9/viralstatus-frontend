import React, { createContext, useContext, useEffect, useRef, useState } from 'react';

const STORAGE_KEY = 'vs-active-jobs-v1';
const JobContext = createContext(null);

export const JobManagerProvider = ({ children }) => {
  const [jobs, setJobs] = useState(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      const parsed = raw ? JSON.parse(raw) : {};
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  });
  const pollersRef = useRef({}); // jobId -> intervalId

  const save = (next) => {
    setJobs(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  const upsertJob = (job) => {
    save({ ...jobs, [job.jobId]: job });
  };

  const removeJob = (jobId) => {
    const next = { ...jobs };
    delete next[jobId];
    save(next);
  };

  const startPolling = (job) => {
    if (pollersRef.current[job.jobId]) return;

    const pollFn = async () => {
      try {
        let endpoint = '';
        if (job.type === 'audio') endpoint = `/api/audio/job-status/${job.jobId}`;
        else if (job.type === 'vts') endpoint = `/api/vts/job-status/${job.jobId}`;
        else if (job.type === 'vtr') endpoint = `/api/vtr/job-status/${job.jobId}`;

        const resp = await fetch(`${job.baseUrl}${endpoint}`);
        if (!resp.ok) throw new Error(`Status ${resp.status}`);
        const json = await resp.json();
        const status = json?.job?.status;
        const progress = json?.job?.progress ?? 0;
        const payload = json?.job || {};

        upsertJob({
          ...job,
          status,
          progress,
          payload,
          updatedAt: Date.now(),
        });

        const hasVideos = Array.isArray(payload?.videos) && payload.videos.some(v => v && v.url);
        const benign = typeof payload?.error?.message === 'string' && /No matching document found for id/i.test(payload.error.message);
        const done = status === 'completed' || (status === 'failed' && (hasVideos || benign));
        if (done) {
          clearInterval(pollersRef.current[job.jobId]);
          delete pollersRef.current[job.jobId];
        }
      } catch {
        clearInterval(pollersRef.current[job.jobId]);
        delete pollersRef.current[job.jobId];
      }
    };

    pollersRef.current[job.jobId] = setInterval(pollFn, 2000);
    pollFn();
  };

  const trackJob = (job) => {
    upsertJob({
      ...job,
      status: 'processing',
      progress: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    startPolling(job);
  };

  const cancelJob = async (jobId) => {
    if (pollersRef.current[jobId]) {
      clearInterval(pollersRef.current[jobId]);
      delete pollersRef.current[jobId];
    }
    removeJob(jobId);
  };

  useEffect(() => {
    Object.values(jobs).forEach((j) => {
      if (j && (j.status === 'pending' || j.status === 'processing')) {
        startPolling(j);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = { jobs, trackJob, cancelJob, removeJob, upsertJob };
  return (
    <JobContext.Provider value={value}>
      {children}
    </JobContext.Provider>
  );
};

export const useJobs = () => useContext(JobContext);


