import React, { useState } from 'react';
import { useScheduler } from '../contexts/SchedulerContext';
import { 
  Search, 
  Trash2, 
  RefreshCcw, 
  Info, 
  X, 
  Calendar, 
  Cpu, 
  Clock, 
  FileText, 
  AlertCircle,
  BrainCircuit,
  Filter
} from 'lucide-react';

const JobExplorer = () => {
  const { 
    jobs, 
    queues, 
    workers,
    retryFailedJob, 
    deleteJob 
  } = useScheduler();

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [queueFilter, setQueueFilter] = useState('ALL');
  const [selectedJobId, setSelectedJobId] = useState(null);

  // Filters logic
  const filteredJobs = jobs.filter(job => {
    // Search
    const matchesSearch = job.name.toLowerCase().includes(search.toLowerCase()) || 
                          job.id.toLowerCase().includes(search.toLowerCase());
    
    // Status
    let matchesStatus = true;
    if (statusFilter !== 'ALL') {
      if (statusFilter === 'DLQ') {
        matchesStatus = job.isDlq;
      } else {
        matchesStatus = job.status === statusFilter && !job.isDlq;
      }
    }

    // Queue
    const queue = queues.find(q => q.id === job.queueId);
    const matchesQueue = queueFilter === 'ALL' || (queue && queue.name === queueFilter);

    return matchesSearch && matchesStatus && matchesQueue;
  });

  const getStatusBadge = (job) => {
    if (job.isDlq) {
      return <span className="badge badge-failed">DLQ / Dead</span>;
    }
    switch (job.status) {
      case 'queued': return <span className="badge badge-queued">Queued</span>;
      case 'scheduled': return <span className="badge badge-queued">Scheduled</span>;
      case 'running': return <span className="badge badge-running">Running</span>;
      case 'completed': return <span className="badge badge-completed">Completed</span>;
      case 'failed': return <span className="badge badge-failed">Failed</span>;
      default: return <span className="badge">{job.status}</span>;
    }
  };

  const getPriorityLabel = (priority) => {
    switch (priority) {
      case 0: return { label: 'Low', color: '#9ca3af' };
      case 1: return { label: 'Normal', color: '#fff' };
      case 2: return { label: 'High', color: '#f59e0b' };
      case 3: return { label: 'Critical', color: '#ff6b00', weight: 'bold' };
      default: return { label: priority.toString(), color: '#fff' };
    }
  };

  const selectedJob = jobs.find(j => j.id === selectedJobId);
  const selectedJobQueueName = selectedJob ? queues.find(q => q.id === selectedJob.queueId)?.name : '';
  const selectedJobWorkerName = selectedJob ? workers.find(w => w.id === selectedJob.workerId)?.name : '';

  // AI-generated failure summary simulation
  const getAiSummary = (logs) => {
    const errorLog = logs.find(l => l.includes('Error') || l.includes('fail'));
    if (!errorLog) return 'No distinct errors found in log trace.';
    
    if (errorLog.includes('timeout') || errorLog.includes('Connection timed out')) {
      return 'The target database at 10.0.1.42 is unreachable. This is likely a subnet routing issue or database firewall rule blocking worker CIDR. Recommendation: Check if security groups allow access on port 3306.';
    }
    if (errorLog.includes('rate limit') || errorLog.includes('429')) {
      return 'The downstream endpoint returned HTTP status 429 Too Many Requests. Recommendation: Apply rate limiting on client side or increase request throttling buffers in queue configuration.';
    }
    if (errorLog.includes('validation')) {
      return 'The incoming job payload contains invalid or null parameters which failed parsing. Recommendation: Sanitize caller parameters or update JSON schemas.';
    }
    return `Automatic diagnosis: Execution failed with log trace "${errorLog}". Recommendation: Investigate system host logs during timestamp.`;
  };

  return (
    <div style={{ position: 'relative' }}>
      
      {/* Search & Filter Bar */}
      <div className="glass-panel" style={{ padding: '16px', marginBottom: '20px', display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
        
        {/* Search */}
        <div style={{ flex: 1, minWidth: '200px', position: 'relative' }}>
          <Search size={16} color="var(--text-muted)" style={{ position: 'absolute', left: '12px', top: '13px' }} />
          <input 
            type="text" 
            placeholder="Search by job name or ID..."
            className="glass-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>

        {/* Status Filter */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Filter size={14} color="var(--text-muted)" />
          <select 
            className="glass-select" 
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="ALL" style={{ background: '#0e0e12' }}>All Statuses</option>
            <option value="queued" style={{ background: '#0e0e12' }}>Queued</option>
            <option value="scheduled" style={{ background: '#0e0e12' }}>Scheduled</option>
            <option value="running" style={{ background: '#0e0e12' }}>Running</option>
            <option value="completed" style={{ background: '#0e0e12' }}>Completed</option>
            <option value="failed" style={{ background: '#0e0e12' }}>Failed</option>
            <option value="DLQ" style={{ background: '#0e0e12' }}>DLQ Entries</option>
          </select>
        </div>

        {/* Queue Filter */}
        <div>
          <select 
            className="glass-select" 
            value={queueFilter}
            onChange={(e) => setQueueFilter(e.target.value)}
            style={{ width: '150px' }}
          >
            <option value="ALL" style={{ background: '#0e0e12' }}>All Queues</option>
            {queues.map(q => (
              <option key={q.id} value={q.name} style={{ background: '#0e0e12' }}>{q.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Jobs Table Container */}
      <div className="glass-panel" style={{ padding: '0px', overflow: 'hidden' }}>
        <div className="custom-table-container">
          <table className="custom-table">
            <thead>
              <tr>
                <th>Job ID</th>
                <th>Job Name</th>
                <th>Queue</th>
                <th>Priority</th>
                <th>Attempts</th>
                <th>Scheduled At / Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredJobs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                    No jobs matching current query found. Try triggering a jobs burst!
                  </td>
                </tr>
              ) : (
                filteredJobs.map(job => {
                  const pDetail = getPriorityLabel(job.priority);
                  return (
                    <tr 
                      key={job.id} 
                      onClick={() => setSelectedJobId(job.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--orange-primary)', fontWeight: 500 }}>
                        {job.id}
                      </td>
                      <td style={{ fontWeight: 600, color: '#fff' }}>
                        {job.name}
                      </td>
                      <td>
                        <span style={{ 
                          padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.02)', 
                          border: '1px solid var(--border-subtle)', fontSize: '0.75rem' 
                        }}>
                          {queues.find(q => q.id === job.queueId)?.name || 'default'}
                        </span>
                      </td>
                      <td style={{ color: pDetail.color, fontWeight: pDetail.weight || 400, fontSize: '0.8rem' }}>
                        {pDetail.label}
                      </td>
                      <td style={{ fontSize: '0.8rem' }}>
                        {job.attempts}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {getStatusBadge(job)}
                          {job.status === 'scheduled' && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                              in {Math.max(1, Math.round((new Date(job.scheduledAt) - new Date()) / 1000))}s
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                          {/* Retry button if failed */}
                          {(job.status === 'failed' || job.isDlq) && (
                            <button
                              onClick={() => retryFailedJob(job.id)}
                              className="btn-secondary"
                              style={{ padding: '6px', borderRadius: '4px' }}
                              title="Manual Retry"
                            >
                              <RefreshCcw size={12} color="var(--state-completed)" />
                            </button>
                          )}
                          <button
                            onClick={() => deleteJob(job.id)}
                            className="btn-secondary"
                            style={{ padding: '6px', borderRadius: '4px' }}
                            title="Delete Job"
                          >
                            <Trash2 size={12} color="var(--state-failed)" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Side-Drawer */}
      {selectedJob && (
        <div style={{
          position: 'fixed', top: 0, right: 0, width: '480px', height: '100vh',
          background: 'rgba(12, 12, 18, 0.95)', backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255, 107, 0, 0.2)', boxShadow: '-10px 0 40px rgba(0,0,0,0.8)',
          zIndex: 1000, padding: '24px', display: 'flex', flexDirection: 'column',
          animation: 'slideIn 0.3s ease-out'
        }}>
          {/* Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#fff', fontFamily: 'var(--font-display)' }}>
                  Job Details
                </h3>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {selectedJob.id}
                </span>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Lifecycle analytics and payloads</span>
            </div>
            <button 
              onClick={() => setSelectedJobId(null)}
              style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
            >
              <X size={20} />
            </button>
          </div>

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '20px', paddingRight: '4px' }}>
            
            {/* Status Summary glass panel */}
            <div className="glass-card" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>{selectedJob.name}</span>
                {getStatusBadge(selectedJob)}
              </div>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', fontSize: '0.75rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '8px', marginTop: '4px' }}>
                <div>Queue: <strong style={{ color: '#fff' }}>{selectedJobQueueName}</strong></div>
                <div>Priority: <strong style={{ color: '#fff' }}>{selectedJob.priority}</strong></div>
                <div>Attempts: <strong style={{ color: '#fff' }}>{selectedJob.attempts} / {selectedJob.maxRetries}</strong></div>
                {selectedJobWorkerName && <div>Worker: <strong style={{ color: 'var(--orange-primary)' }}>{selectedJobWorkerName}</strong></div>}
              </div>
            </div>

            {/* Timestamps */}
            <div>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-white)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Clock size={12} /> Timestamps
              </h4>
              <div className="glass-card" style={{ padding: '10px', fontSize: '0.75rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Created At</span>
                  <span style={{ color: '#fff' }}>{new Date(selectedJob.createdAt).toLocaleString()}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Scheduled At</span>
                  <span style={{ color: '#fff' }}>{new Date(selectedJob.scheduledAt).toLocaleString()}</span>
                </div>
                {selectedJob.startedAt && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Started At</span>
                    <span style={{ color: '#fff' }}>{new Date(selectedJob.startedAt).toLocaleString()}</span>
                  </div>
                )}
                {selectedJob.completedAt && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-muted)' }}>Completed At</span>
                    <span style={{ color: '#fff' }}>{new Date(selectedJob.completedAt).toLocaleString()}</span>
                  </div>
                )}
                {selectedJob.failedAt && (
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--text-failed)' }}>Failed At</span>
                    <span style={{ color: 'var(--text-failed)' }}>{new Date(selectedJob.failedAt).toLocaleString()}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Payload Panel */}
            <div>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-white)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <FileText size={12} /> Payload Variables
              </h4>
              <pre className="code-box">{JSON.stringify(selectedJob.payload, null, 2)}</pre>
            </div>

            {/* AI Diagnosis (Only when job failed or DLQ) */}
            {(selectedJob.status === 'failed' || selectedJob.isDlq) && (
              <div className="glass-card" style={{ 
                background: 'rgba(255, 107, 0, 0.02)', 
                border: '1px solid rgba(255, 107, 0, 0.15)',
                padding: '14px' 
              }}>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--orange-primary)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <BrainCircuit size={14} /> AI Failure Diagnosis
                </h4>
                <p style={{ fontSize: '0.75rem', color: 'var(--text-normal)', lineHeight: '1.4' }}>
                  {getAiSummary(selectedJob.logs)}
                </p>
              </div>
            )}

            {/* Retry History (If failed attempts exist) */}
            {selectedJob.retryHistory && selectedJob.retryHistory.length > 0 && (
              <div>
                <h4 style={{ fontSize: '0.8rem', color: 'var(--text-white)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <AlertCircle size={12} /> Backoff Retry History
                </h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {selectedJob.retryHistory.map(hist => (
                    <div key={hist.attempt} className="glass-card" style={{ padding: '10px', fontSize: '0.7rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px', fontWeight: 600 }}>
                        <span style={{ color: 'var(--orange-primary)' }}>Attempt #{hist.attempt}</span>
                        <span style={{ color: 'var(--text-dark)' }}>{new Date(hist.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div style={{ color: 'var(--text-normal)', fontFamily: 'var(--font-mono)' }}>
                        {hist.error}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Console execution traces */}
            <div>
              <h4 style={{ fontSize: '0.8rem', color: 'var(--text-white)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '8px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Terminal size={12} /> Job Execution Logs
              </h4>
              <div className="code-box" style={{ maxHeight: '180px', background: '#040406' }}>
                {selectedJob.logs.map((log, index) => (
                  <div key={index} style={{ padding: '2px 0', borderBottom: '1px solid rgba(255,255,255,0.01)', fontSize: '0.75rem' }}>
                    <span style={{ color: 'var(--text-dark)' }}>&gt;</span> {log}
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Drawer Actions */}
          <div style={{ display: 'flex', gap: '10px', marginTop: '16px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            {(selectedJob.status === 'failed' || selectedJob.isDlq) && (
              <button
                onClick={() => {
                  retryFailedJob(selectedJob.id);
                  setSelectedJobId(null);
                }}
                className="btn-primary"
                style={{ flex: 1, justifyContent: 'center' }}
              >
                <RefreshCcw size={14} /> Retry Job
              </button>
            )}
            <button
              onClick={() => {
                deleteJob(selectedJob.id);
                setSelectedJobId(null);
              }}
              className="btn-secondary"
              style={{ flex: 1, justifyContent: 'center', color: 'var(--state-failed)', borderColor: 'rgba(244, 63, 94, 0.2)' }}
            >
              <Trash2 size={14} /> Remove Job
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default JobExplorer;
