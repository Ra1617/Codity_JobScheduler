import React, { createContext, useContext, useState, useEffect, useRef } from 'react';

const SchedulerContext = createContext();

export const useScheduler = () => {
  const context = useContext(SchedulerContext);
  if (!context) {
    throw new Error('useScheduler must be used within a SchedulerProvider');
  }
  return context;
};

// Initial data helper to make the dashboard look populated and alive immediately
const getInitialState = () => {
  const now = new Date();
  
  const initialProjects = [
    { id: 'proj-1', name: 'Stripe Billing Sync', description: 'Handles subscriptions, invoicing, and webhook delivery' },
    { id: 'proj-2', name: 'Data Warehousing', description: 'Processes big data analytics, backups, and reports' }
  ];

  const initialQueues = [
    { 
      id: 'q-default', 
      projectId: 'proj-1',
      name: 'default', 
      priority: 1, 
      concurrencyLimit: 2, 
      isPaused: false, 
      retryPolicy: { maxRetries: 3, delay: 5, strategy: 'exponential' },
      stats: { processed: 42, failed: 3 }
    },
    { 
      id: 'q-critical', 
      projectId: 'proj-1',
      name: 'critical-notifications', 
      priority: 3, 
      concurrencyLimit: 3, 
      isPaused: false, 
      retryPolicy: { maxRetries: 5, delay: 2, strategy: 'fixed' },
      stats: { processed: 128, failed: 0 }
    },
    { 
      id: 'q-background', 
      projectId: 'proj-2',
      name: 'report-generator', 
      priority: 0, 
      concurrencyLimit: 1, 
      isPaused: false, 
      retryPolicy: { maxRetries: 2, delay: 10, strategy: 'linear' },
      stats: { processed: 18, failed: 4 }
    }
  ];

  const initialWorkers = [
    { id: 'worker-us-1', name: 'worker-us-east-1a', region: 'us-east-1', status: 'online', cpuUsage: 12, ramUsage: 38, activeJobId: null, lastHeartbeat: now.toISOString() },
    { id: 'worker-eu-1', name: 'worker-eu-west-1a', region: 'eu-west-1', status: 'online', cpuUsage: 5, ramUsage: 45, activeJobId: null, lastHeartbeat: now.toISOString() },
    { id: 'worker-ap-1', name: 'worker-ap-southeast-1b', region: 'ap-southeast-1', status: 'offline', cpuUsage: 0, ramUsage: 0, activeJobId: null, lastHeartbeat: new Date(now - 120000).toISOString() }
  ];

  const initialJobs = [
    {
      id: 'job-101',
      name: 'stripe_sync_customers',
      queueId: 'q-default',
      status: 'completed',
      payload: { sync_mode: 'delta', limit: 100 },
      priority: 1,
      maxRetries: 3,
      attempts: 1,
      createdAt: new Date(now - 30 * 60 * 1000).toISOString(),
      scheduledAt: new Date(now - 30 * 60 * 1000).toISOString(),
      startedAt: new Date(now - 29 * 60 * 1000).toISOString(),
      completedAt: new Date(now - 29 * 60 * 1000 + 4200).toISOString(),
      workerId: 'worker-us-1',
      logs: ['Sync started for 100 customers', 'Fetched 42 records from Stripe API', 'Updated database entities', 'Sync completed successfully'],
      retryHistory: []
    },
    {
      id: 'job-102',
      name: 'send_welcome_email_user_992',
      queueId: 'q-critical',
      status: 'completed',
      payload: { user_id: 992, email: 'alex@example.com', template: 'welcome_v2' },
      priority: 3,
      maxRetries: 5,
      attempts: 1,
      createdAt: new Date(now - 15 * 60 * 1000).toISOString(),
      scheduledAt: new Date(now - 15 * 60 * 1000).toISOString(),
      startedAt: new Date(now - 14 * 60 * 1000 - 58 * 1000).toISOString(),
      completedAt: new Date(now - 14 * 60 * 1000 - 57 * 1000).toISOString(),
      workerId: 'worker-eu-1',
      logs: ['SMTP Connection Established', 'Rendering email body', 'Email sent via Sendgrid', 'Message ID: <msg-982847@sendgrid.com>'],
      retryHistory: []
    },
    {
      id: 'job-103',
      name: 'db_weekly_backup',
      queueId: 'q-background',
      status: 'scheduled',
      payload: { compression: 'gzip', destination: 's3://chronos-backups' },
      priority: 0,
      maxRetries: 2,
      attempts: 0,
      createdAt: new Date(now - 5 * 60 * 1000).toISOString(),
      scheduledAt: new Date(now + 120 * 1000).toISOString(), // 2 minutes from now
      workerId: null,
      logs: ['Job created and scheduled'],
      retryHistory: []
    },
    {
      id: 'job-104',
      name: 'legacy_data_migration',
      queueId: 'q-background',
      status: 'failed',
      payload: { batch_id: 8, source_db: 'mysql://legacy_prod' },
      priority: 0,
      maxRetries: 2,
      attempts: 3,
      createdAt: new Date(now - 45 * 60 * 1000).toISOString(),
      scheduledAt: new Date(now - 40 * 60 * 1000).toISOString(),
      startedAt: new Date(now - 38 * 60 * 1000).toISOString(),
      completedAt: null,
      failedAt: new Date(now - 38 * 60 * 1000 + 12000).toISOString(),
      workerId: 'worker-us-1',
      isDlq: true,
      logs: [
        'Connecting to legacy database...',
        'Error: Dial tcp 10.0.1.42:3306: i/o timeout',
        'Attempt 1 failed. Scheduling retry.',
        'Attempt 2: Connection timed out.',
        'Attempt 3: Connection timed out. Max retries (2) exceeded. Routing to DLQ.'
      ],
      retryHistory: [
        { attempt: 1, error: 'Dial tcp 10.0.1.42:3306: i/o timeout', timestamp: new Date(now - 44 * 60 * 1000).toISOString() },
        { attempt: 2, error: 'Connection timed out', timestamp: new Date(now - 41 * 60 * 1000).toISOString() },
        { attempt: 3, error: 'Connection timed out (Final)', timestamp: new Date(now - 38 * 60 * 1000).toISOString() }
      ]
    }
  ];

  const initialLogs = [
    { id: 1, timestamp: new Date(now - 60 * 60 * 1000).toISOString(), source: 'SYSTEM', message: 'Chronos Distributed Job Scheduler Engine initialized successfully.' },
    { id: 2, timestamp: new Date(now - 59 * 60 * 1000).toISOString(), source: 'QUEUE', message: 'Loaded 3 registered job queues: [default, critical-notifications, report-generator]' },
    { id: 3, timestamp: new Date(now - 58 * 60 * 1000).toISOString(), source: 'WORKER', message: 'Worker node worker-us-east-1a registered and online. Region: us-east-1.' },
    { id: 4, timestamp: new Date(now - 58 * 60 * 1000).toISOString(), source: 'WORKER', message: 'Worker node worker-eu-west-1a registered and online. Region: eu-west-1.' },
    { id: 5, timestamp: new Date(now - 30 * 60 * 1000).toISOString(), source: 'JOB', message: 'Job job-101 (stripe_sync_customers) queued on [default].' },
    { id: 6, timestamp: new Date(now - 29 * 60 * 1000).toISOString(), source: 'ENGINE', message: 'Worker worker-us-east-1a claimed job-101. Executing...' },
    { id: 7, timestamp: new Date(now - 29 * 60 * 1000 + 4200).toISOString(), source: 'ENGINE', message: 'Job job-101 (stripe_sync_customers) finished successfully in 4.2s.' }
  ];

  return { initialProjects, initialQueues, initialWorkers, initialJobs, initialLogs };
};

export const SchedulerProvider = ({ children }) => {
  const data = getInitialState();

  const [projects, setProjects] = useState(data.initialProjects);
  const [selectedProjectId, setSelectedProjectId] = useState(data.initialProjects[0].id);
  const [queues, setQueues] = useState(data.initialQueues);
  const [workers, setWorkers] = useState(data.initialWorkers);
  const [jobs, setJobs] = useState(data.initialJobs);
  const [logs, setLogs] = useState(data.initialLogs);
  const [isSimulating, setIsSimulating] = useState(true);
  const [simulationSpeed, setSimulationSpeed] = useState(1); // 1x, 2x, 5x
  const [useRealAPI, setUseRealAPI] = useState(false);
  const [metrics, setMetrics] = useState({
    successCount: 170,
    failedCount: 7,
    runningCount: 0,
    throughput: [12, 18, 15, 24, 30, 28, 35, 42, 38, 45, 41, 48]
  });

  const nextLogId = useRef(data.initialLogs.length + 1);
  const nextJobId = useRef(200);

  // Helper to add logs to console
  const addSystemLog = (source, message) => {
    const newLog = {
      id: nextLogId.current++,
      timestamp: new Date().toISOString(),
      source,
      message
    };
    setLogs(prev => [newLog, ...prev.slice(0, 199)]);
  };

  // Job Submission Function
  const submitJob = (jobDetails) => {
    const now = new Date();
    
    // Determine schedule time
    let scheduledTime = now;
    if (jobDetails.type === 'delayed') {
      scheduledTime = new Date(now.getTime() + jobDetails.delaySeconds * 1000);
    } else if (jobDetails.type === 'scheduled') {
      scheduledTime = new Date(jobDetails.scheduledTime);
    }

    const newJob = {
      id: `job-${nextJobId.current++}`,
      name: jobDetails.name,
      queueId: jobDetails.queueId,
      status: scheduledTime > now ? 'scheduled' : 'queued',
      payload: jobDetails.payload || {},
      priority: jobDetails.priority || 1,
      maxRetries: jobDetails.maxRetries || 3,
      attempts: 0,
      createdAt: now.toISOString(),
      scheduledAt: scheduledTime.toISOString(),
      startedAt: null,
      completedAt: null,
      workerId: null,
      isDlq: false,
      logs: [`Job submitted via ${jobDetails.type} trigger`],
      retryHistory: [],
      // Recurring configurations
      cronExpression: jobDetails.type === 'cron' ? jobDetails.cronExpression : null,
      // For delay or runtime simulation
      simulatedDuration: jobDetails.simulatedDuration || 3000,
      failProbability: jobDetails.failProbability || 0
    };

    setJobs(prev => [newJob, ...prev]);
    
    const queue = queues.find(q => q.id === jobDetails.queueId);
    const queueName = queue ? queue.name : 'unknown';
    addSystemLog('JOB', `Job ${newJob.id} (${newJob.name}) submitted to queue [${queueName}] (${newJob.status}).`);
    
    return newJob;
  };

  // Create new queue
  const createQueue = (queueDetails) => {
    const newQueue = {
      id: `q-${Date.now()}`,
      projectId: selectedProjectId,
      name: queueDetails.name,
      priority: parseInt(queueDetails.priority) || 1,
      concurrencyLimit: parseInt(queueDetails.concurrencyLimit) || 2,
      isPaused: false,
      retryPolicy: {
        maxRetries: parseInt(queueDetails.maxRetries) || 3,
        delay: parseInt(queueDetails.retryDelay) || 5,
        strategy: queueDetails.retryStrategy || 'exponential'
      },
      stats: { processed: 0, failed: 0 }
    };
    
    setQueues(prev => [...prev, newQueue]);
    addSystemLog('QUEUE', `Created new queue [${newQueue.name}] with concurrency limit ${newQueue.concurrencyLimit}.`);
  };

  // Update/Configure Queue
  const configureQueue = (queueId, updates) => {
    setQueues(prev => prev.map(q => {
      if (q.id === queueId) {
        const updated = { ...q, ...updates };
        addSystemLog('QUEUE', `Updated queue [${q.name}] configuration: paused=${updated.isPaused}, concurrency=${updated.concurrencyLimit}`);
        return updated;
      }
      return q;
    }));
  };

  // Trigger manual retry for a failed job
  const retryFailedJob = (jobId) => {
    setJobs(prev => prev.map(j => {
      if (j.id === jobId) {
        addSystemLog('JOB', `Manual retry triggered for Job ${j.id} (${j.name}). Re-queuing.`);
        return {
          ...j,
          status: 'queued',
          attempts: 0,
          scheduledAt: new Date().toISOString(),
          isDlq: false,
          logs: [...j.logs, `Manual retry triggered. Resubmitted to queue.`]
        };
      }
      return j;
    }));
  };

  // Remove/Delete Job
  const deleteJob = (jobId) => {
    setJobs(prev => prev.filter(j => j.id !== jobId));
    addSystemLog('JOB', `Deleted Job ${jobId} from system.`);
  };

  // Spawn Worker
  const spawnWorker = () => {
    const workerNames = ['worker-core-node', 'worker-compute-instance', 'worker-daemon-process', 'worker-sub-host'];
    const regions = ['us-east-1', 'eu-central-1', 'ap-southeast-1', 'us-west-2'];
    const randomName = `${workerNames[Math.floor(Math.random() * workerNames.length)]}-${Math.floor(Math.random() * 900 + 100)}`;
    const randomRegion = regions[Math.floor(Math.random() * regions.length)];
    
    const newWorker = {
      id: `worker-gen-${Date.now()}`,
      name: randomName,
      region: randomRegion,
      status: 'online',
      cpuUsage: 1,
      ramUsage: 12,
      activeJobId: null,
      lastHeartbeat: new Date().toISOString()
    };

    setWorkers(prev => [...prev, newWorker]);
    addSystemLog('WORKER', `Spawned new worker node [${randomName}] in region ${randomRegion}.`);
  };

  // Gracefully shutdown/Terminate worker
  const terminateWorker = (workerId, gracefully = true) => {
    setWorkers(prev => prev.map(w => {
      if (w.id === workerId) {
        if (gracefully && w.activeJobId) {
          addSystemLog('WORKER', `Initiated graceful shutdown for worker [${w.name}]. Waiting for active task to finish.`);
          return { ...w, status: 'terminating' };
        } else {
          // Hard stop
          addSystemLog('WORKER', `Terminated worker [${w.name}] immediately.`);
          
          // Re-queue active job if worker killed immediately
          if (w.activeJobId) {
            setJobs(prevJobs => prevJobs.map(j => {
              if (j.id === w.activeJobId) {
                return { 
                  ...j, 
                  status: 'queued', 
                  workerId: null,
                  logs: [...j.logs, `Worker host was terminated abruptly. Job returned to queued state.`] 
                };
              }
              return j;
            }));
          }
          return { ...w, status: 'offline', activeJobId: null };
        }
      }
      return w;
    }).filter(w => w.status !== 'offline' || w.id.includes('worker-ap-1'))); // Keep standard offline ap-1 as placeholder
  };

  // Trigger massive job burst for testing
  const triggerJobBurst = () => {
    addSystemLog('SYSTEM', 'Triggering test job burst: Submitting 8 random background tasks.');
    const names = ['scrape_web_catalog', 'compress_user_assets', 'reindex_search_elasticsearch', 'process_video_transcode', 'generate_pdf_invoices', 'prune_stale_sessions', 'calculate_referral_payouts', 'verify_domain_mx'];
    
    names.forEach((name, i) => {
      setTimeout(() => {
        const randomQueue = queues[Math.floor(Math.random() * queues.length)];
        submitJob({
          name,
          queueId: randomQueue.id,
          type: 'immediate',
          priority: Math.floor(Math.random() * 4),
          maxRetries: 3,
          simulatedDuration: Math.floor(Math.random() * 4000) + 2000,
          failProbability: name.includes('transcode') || name.includes('elasticsearch') ? 0.35 : 0.05
        });
      }, i * 200);
    });
  };

  // MAIN SIMULATION LOOP (Runs every 1000ms divided by simulation speed)
  useEffect(() => {
    if (!isSimulating || useRealAPI) return;

    const interval = setInterval(() => {
      const now = new Date();

      // 1. Process Scheduled Jobs (Scheduled -> Queued)
      setJobs(prevJobs => {
        let changed = false;
        const updated = prevJobs.map(j => {
          if (j.status === 'scheduled' && new Date(j.scheduledAt) <= now) {
            // Check if cron job. Cron jobs are recurring.
            // When cron triggers, it creates a NEW queued job, and update cron's scheduledAt.
            if (j.cronExpression) {
              // Simulating cron schedule update (add 15s for visual simulation of next execution)
              const nextRun = new Date(now.getTime() + 15000);
              // Spawn a clone instance of the cron job that is immediate
              setTimeout(() => {
                submitJob({
                  name: `${j.name}_run`,
                  queueId: j.queueId,
                  type: 'immediate',
                  priority: j.priority,
                  maxRetries: j.maxRetries,
                  simulatedDuration: j.simulatedDuration,
                  failProbability: j.failProbability,
                  payload: { ...j.payload, trigger_type: 'cron', executed_at: now.toISOString() }
                });
              }, 10);
              
              changed = true;
              return {
                ...j,
                scheduledAt: nextRun.toISOString(),
                logs: [...j.logs, `Cron triggered. Spawned runtime instance. Next execution scheduled for ${nextRun.toLocaleTimeString()}`]
              };
            } else {
              // Regular scheduled or delayed job. Simply transition to queued.
              changed = true;
              addSystemLog('ENGINE', `Scheduled job ${j.id} (${j.name}) is now due. Moving to Queued.`);
              return {
                ...j,
                status: 'queued',
                logs: [...j.logs, 'Schedule delay elapsed. Job moved to Queued state.']
              };
            }
          }
          return j;
        });
        return changed ? updated : prevJobs;
      });

      // 2. Claim Jobs (Queued -> Running)
      setWorkers(prevWorkers => {
        let workersUpdated = false;
        
        const newWorkersState = prevWorkers.map(worker => {
          // Worker must be online and idle
          if (worker.status !== 'online') return worker;
          if (worker.activeJobId) return worker;

          // Find the highest priority queue that this worker can process, and retrieve its first queued job
          // Filter queues, order by Priority DESC
          const activeQueuesSorted = [...queues]
            .filter(q => !q.isPaused)
            .sort((a, b) => b.priority - a.priority);

          for (const queue of activeQueuesSorted) {
            // Count currently running jobs on this queue to enforce concurrency limit
            let runningJobsOnQueue = 0;
            // Need reference to latest jobs state
            // Since we are inside setWorkers state setter, we have to look up from outer scope or wait.
            // For simple single thread simulation, we fetch jobs count directly from current jobs state.
            // Let's do it safely
            // We find queued jobs on this queue
            // Order jobs by Priority DESC, then createdAt ASC
            const nextJob = jobs
              .filter(j => j.status === 'queued' && j.queueId === queue.id)
              .sort((a, b) => (b.priority - a.priority) || (new Date(a.createdAt) - new Date(b.createdAt)))[0];

            if (nextJob) {
              // Check concurrency
              const queueRunningCount = jobs.filter(j => j.status === 'running' && j.queueId === queue.id).length;
              if (queueRunningCount < queue.concurrencyLimit) {
                // Claim it!
                workersUpdated = true;
                worker.activeJobId = nextJob.id;
                worker.cpuUsage = Math.floor(Math.random() * 40) + 30; // Spikes during work
                worker.ramUsage = Math.min(95, worker.ramUsage + Math.floor(Math.random() * 8) + 2);
                
                // Atomically update job state
                setJobs(prevJobs => prevJobs.map(job => {
                  if (job.id === nextJob.id) {
                    addSystemLog('ENGINE', `Worker [${worker.name}] claimed Job ${job.id} (${job.name}) from queue [${queue.name}].`);
                    
                    // Simulate execution completion timer
                    setTimeout(() => {
                      completeOrFailJob(job.id, worker.id);
                    }, job.simulatedDuration / simulationSpeed);

                    return {
                      ...job,
                      status: 'running',
                      workerId: worker.id,
                      attempts: job.attempts + 1,
                      startedAt: new Date().toISOString(),
                      logs: [...job.logs, `Claimed by worker: ${worker.name}. Starting execution (Attempt ${job.attempts + 1}).`]
                    };
                  }
                  return job;
                }));
                break; // One job per worker per tick
              }
            }
          }
          return worker;
        });

        return workersUpdated ? newWorkersState : prevWorkers;
      });

      // 3. Heartbeats & System Metrics updates
      setWorkers(prevWorkers => 
        prevWorkers.map(w => {
          if (w.status === 'online' || w.status === 'terminating') {
            const cpuBase = w.activeJobId ? 50 : 2;
            const updatedCpu = Math.max(1, Math.min(100, Math.floor(cpuBase + (Math.random() * 15 - 7))));
            const updatedRam = Math.max(10, Math.min(98, Math.floor(w.ramUsage + (Math.random() * 4 - 2))));
            
            return {
              ...w,
              cpuUsage: updatedCpu,
              ramUsage: updatedRam,
              lastHeartbeat: new Date().toISOString()
            };
          }
          return w;
        })
      );

      // Generate randomized metrics fluctuations for dashboard graphs
      setMetrics(prev => {
        const runCount = jobs.filter(j => j.status === 'running').length;
        const totalSuccess = jobs.filter(j => j.status === 'completed').length + 150;
        const totalFailed = jobs.filter(j => j.status === 'failed' || j.isDlq).length + 4;
        
        // Push a new point to throughput and drop the oldest
        const latestSuccessCount = jobs.filter(j => j.status === 'completed').length;
        const throughputFactor = Math.floor(latestSuccessCount * 0.8) + Math.floor(Math.random() * 8) + 12;
        const newThroughput = [...prev.throughput.slice(1), throughputFactor];

        return {
          successCount: totalSuccess,
          failedCount: totalFailed,
          runningCount: runCount,
          throughput: newThroughput
        };
      });

    }, 1000 / simulationSpeed);

    return () => clearInterval(interval);
  }, [isSimulating, simulationSpeed, jobs, queues, useRealAPI]);

  // Handle job execution result (Completion / Failure)
  const completeOrFailJob = (jobId, workerId) => {
    // Look up job properties
    setJobs(prevJobs => {
      let workerToFree = workerId;
      
      const updatedJobs = prevJobs.map(j => {
        if (j.id === jobId && j.status === 'running') {
          const isSuccess = Math.random() >= (j.failProbability || 0);
          const now = new Date();
          
          if (isSuccess) {
            // SUCCESS!
            addSystemLog('ENGINE', `Job ${j.id} (${j.name}) completed successfully on worker.`);
            
            // Increment Queue stats
            setQueues(prevQ => prevQ.map(q => q.id === j.queueId ? { ...q, stats: { ...q.stats, processed: q.stats.processed + 1 } } : q));
            
            return {
              ...j,
              status: 'completed',
              completedAt: now.toISOString(),
              logs: [...j.logs, `Job logic executed successfully. Return code: 0`, `Job execution completed.`]
            };
          } else {
            // FAILURE!
            const errorMessages = [
              'API rate limit exceeded on destination gateway.',
              'Database transaction deadlock detected; aborting transaction.',
              'Network socket hang up while awaiting HTTP response.',
              'JSON payload validation error: field "user_id" cannot be null.'
            ];
            const errorMsg = errorMessages[Math.floor(Math.random() * errorMessages.length)];
            const attempt = j.attempts;
            
            // Queue specs for retry policy
            const queue = queues.find(q => q.id === j.queueId);
            const policy = queue?.retryPolicy || { maxRetries: 3, delay: 5, strategy: 'fixed' };
            const maxRetries = j.maxRetries || policy.maxRetries;
            
            const newHistoryItem = {
              attempt,
              error: errorMsg,
              timestamp: now.toISOString()
            };
            const updatedHistory = [...j.retryHistory, newHistoryItem];

            // If we have retries left
            if (attempt <= maxRetries) {
              // Calculate Backoff
              let delaySec = policy.delay;
              if (policy.strategy === 'linear') {
                delaySec = policy.delay * attempt;
              } else if (policy.strategy === 'exponential') {
                delaySec = policy.delay * Math.pow(2, attempt - 1);
              }
              
              const nextSchedule = new Date(now.getTime() + delaySec * 1000);
              
              addSystemLog('JOB', `Job ${j.id} failed: "${errorMsg}". Retrying in ${delaySec}s (Attempt ${attempt}/${maxRetries}).`);
              
              return {
                ...j,
                status: 'scheduled',
                scheduledAt: nextSchedule.toISOString(),
                startedAt: null,
                workerId: null,
                retryHistory: updatedHistory,
                logs: [...j.logs, `Error encountered: ${errorMsg}`, `Scheduling attempt ${attempt + 1} of ${maxRetries + 1} at ${nextSchedule.toLocaleTimeString()} (Backoff: ${policy.strategy}, Delay: ${delaySec}s).`]
              };
            } else {
              // No retries left -> DLQ
              addSystemLog('DLQ', `Job ${j.id} failed permanently after ${attempt} attempts. Routing to Dead Letter Queue (DLQ).`);
              
              // Increment failed stats
              setQueues(prevQ => prevQ.map(q => q.id === j.queueId ? { ...q, stats: { ...q.stats, failed: q.stats.failed + 1 } } : q));
              
              return {
                ...j,
                status: 'failed',
                isDlq: true,
                failedAt: now.toISOString(),
                workerId: null,
                retryHistory: updatedHistory,
                logs: [...j.logs, `Error encountered: ${errorMsg}`, `Maximum retries (${maxRetries}) exhausted. Moved to Dead Letter Queue (DLQ).`]
              };
            }
          }
        }
        return j;
      });

      // Free the worker
      setWorkers(prevWorkers => 
        prevWorkers.map(w => {
          if (w.id === workerToFree) {
            const nextStatus = w.status === 'terminating' ? 'offline' : 'online';
            return {
              ...w,
              status: nextStatus,
              activeJobId: null,
              cpuUsage: nextStatus === 'online' ? 2 : 0,
              ramUsage: nextStatus === 'online' ? Math.max(10, w.ramUsage - 10) : 0
            };
          }
          return w;
        })
      );

      return updatedJobs;
    });
  };

  return (
    <SchedulerContext.Provider value={{
      projects,
      selectedProjectId,
      setSelectedProjectId,
      queues,
      workers,
      jobs,
      logs,
      isSimulating,
      setIsSimulating,
      simulationSpeed,
      setSimulationSpeed,
      useRealAPI,
      setUseRealAPI,
      metrics,
      submitJob,
      createQueue,
      configureQueue,
      retryFailedJob,
      deleteJob,
      spawnWorker,
      terminateWorker,
      triggerJobBurst
    }}>
      {children}
    </SchedulerContext.Provider>
  );
};
