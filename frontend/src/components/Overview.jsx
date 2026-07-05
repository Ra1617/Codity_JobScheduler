import React, { useState } from 'react';
import { useScheduler } from '../contexts/SchedulerContext';
import { 
  CheckCircle2, 
  XCircle, 
  Activity, 
  Cpu, 
  Terminal, 
  Clock, 
  Layers, 
  ArrowUpRight 
} from 'lucide-react';

const Overview = ({ setActiveTab }) => {
  const { 
    jobs, 
    queues, 
    workers, 
    logs, 
    metrics 
  } = useScheduler();

  const [logFilter, setLogFilter] = useState('ALL');

  // Filter logs based on source
  const filteredLogs = logs.filter(log => {
    if (logFilter === 'ALL') return true;
    return log.source === logFilter;
  });

  const getLogStyle = (source) => {
    switch (source) {
      case 'SYSTEM': return { color: '#6b7280' }; // Grey
      case 'QUEUE': return { color: '#a78bfa' }; // Purple
      case 'WORKER': return { color: '#00b0ff' }; // Cyan
      case 'JOB': return { color: '#f59e0b' }; // Amber
      case 'ENGINE': return { color: '#ff6b00' }; // Chronos Orange
      case 'DLQ': return { color: '#f43f5e', fontWeight: 'bold' }; // Red
      default: return { color: '#d1d5db' };
    }
  };

  // SVG Chart Calculations
  const chartHeight = 120;
  const chartWidth = 500;
  const dataPoints = metrics.throughput;
  const maxVal = Math.max(...dataPoints, 10);
  const minVal = Math.min(...dataPoints, 0);
  const range = maxVal - minVal;

  const points = dataPoints.map((val, idx) => {
    const x = (idx / (dataPoints.length - 1)) * chartWidth;
    const y = chartHeight - ((val - minVal) / range) * chartHeight * 0.8 - 10;
    return { x, y, value: val };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = points.length > 0 
    ? `${pathD} L ${points[points.length - 1].x} ${chartHeight} L ${points[0].x} ${chartHeight} Z`
    : '';

  // Calculate quick stats
  const activeQueuesCount = queues.length;
  const onlineWorkersCount = workers.filter(w => w.status === 'online' || w.status === 'busy').length;
  const totalJobsCount = jobs.length;
  const completedJobsCount = jobs.filter(j => j.status === 'completed').length;
  const failedJobsCount = jobs.filter(j => j.status === 'failed' || j.isDlq).length;
  const runningJobsCount = jobs.filter(j => j.status === 'running').length;
  
  // Calculate success rate
  const successRate = totalJobsCount > 0 
    ? Math.round((completedJobsCount / (completedJobsCount + failedJobsCount || 1)) * 100) 
    : 100;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* 4 Stats Cards */}
      <div className="metrics-grid">
        {/* Completed Jobs */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '10px',
            background: 'var(--state-completed-glow)', border: '1px solid rgba(16, 185, 129, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <CheckCircle2 color="var(--state-completed)" size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Jobs Completed</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-display)' }}>
              {metrics.successCount}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--state-completed)' }}>
              Live execution pool active
            </div>
          </div>
        </div>

        {/* Failed Jobs & DLQ */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '10px',
            background: 'var(--state-failed-glow)', border: '1px solid rgba(244, 63, 94, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <XCircle color="var(--state-failed)" size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Failed (DLQ)</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-display)' }}>
              {metrics.failedCount}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--state-failed)' }}>
              Success Rate: {successRate}%
            </div>
          </div>
        </div>

        {/* Running Jobs */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '10px',
            background: 'var(--state-running-glow)', border: '1px solid rgba(0, 176, 255, 0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Activity className="icon-running" color="var(--state-running)" size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Executing Now</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-display)' }}>
              {metrics.runningCount}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--state-running)' }}>
              Distributed claims processing
            </div>
          </div>
        </div>

        {/* Workers */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{
            width: '48px', height: '48px', borderRadius: '10px',
            background: 'rgba(255, 107, 0, 0.08)', border: '1px solid var(--orange-border)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Cpu color="var(--orange-primary)" size={24} />
          </div>
          <div>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Active Workers</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#fff', fontFamily: 'var(--font-display)' }}>
              {onlineWorkersCount}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--orange-primary)' }}>
              Online nodes: {workers.filter(w => w.status === 'online').length}
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Chart & Queues */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '24px' }}>
        
        {/* Real-time Throughput Chart */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div>
              <h2 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', fontWeight: 600, color: '#fff' }}>
                Throughput Timeline
              </h2>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                Jobs completed per minute interval
              </span>
            </div>
            <div style={{ fontSize: '0.75rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--orange-primary)' }}>
              Live monitoring <span className="pulse-orange-dot"></span>
            </div>
          </div>

          <div style={{ position: 'relative', flex: 1, minHeight: '140px', display: 'flex', alignItems: 'flex-end' }}>
            <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--orange-primary)" stopOpacity="0.3" />
                  <stop offset="100%" stopColor="var(--orange-primary)" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid Lines */}
              <line x1="0" y1={chartHeight * 0.25} x2={chartWidth} y2={chartHeight * 0.25} stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
              <line x1="0" y1={chartHeight * 0.5} x2={chartWidth} y2={chartHeight * 0.5} stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
              <line x1="0" y1={chartHeight * 0.75} x2={chartWidth} y2={chartHeight * 0.75} stroke="rgba(255, 255, 255, 0.03)" strokeWidth="1" />
              <line x1="0" y1={chartHeight} x2={chartWidth} y2={chartHeight} stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />

              {/* Area */}
              {areaD && <path d={areaD} fill="url(#chartGradient)" />}

              {/* Line */}
              {pathD && <path d={pathD} fill="none" stroke="var(--orange-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />}

              {/* Dots */}
              {points.map((p, idx) => (
                <circle 
                  key={idx} 
                  cx={p.x} 
                  cy={p.y} 
                  r="3.5" 
                  fill="#08080a" 
                  stroke="var(--orange-primary)" 
                  strokeWidth="2" 
                />
              ))}
            </svg>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '10px', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
            <span>12m ago</span>
            <span>6m ago</span>
            <span>Now</span>
          </div>
        </div>

        {/* Queues Fast Summary */}
        <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', fontWeight: 600, color: '#fff' }}>
              Queue Health
            </h2>
            <button 
              onClick={() => setActiveTab('queues')}
              style={{
                background: 'transparent',
                border: 'none',
                color: 'var(--orange-primary)',
                fontSize: '0.75rem',
                fontWeight: 600,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '2px'
              }}
            >
              Configure <ArrowUpRight size={14} />
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
            {queues.map(q => (
              <div key={q.id} className="glass-card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: '#fff' }}>{q.name}</span>
                    {q.isPaused ? (
                      <span className="badge" style={{ background: 'rgba(107,114,128,0.1)', color: '#9ca3af', border: '1px solid rgba(107,114,128,0.2)', padding: '2px 6px', fontSize: '0.6rem' }}>
                        Paused
                      </span>
                    ) : (
                      <span className="badge" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981', border: '1px solid rgba(16,185,129,0.2)', padding: '2px 6px', fontSize: '0.6rem' }}>
                        Active
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Priority: {q.priority} | Concurrency: {q.concurrencyLimit}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 'bold', color: '#fff' }}>
                    {q.stats.processed + q.stats.failed} <span style={{ fontSize: '0.7rem', fontWeight: 'normal', color: 'var(--text-muted)' }}>jobs</span>
                  </div>
                  <div style={{ fontSize: '0.65rem', color: q.stats.failed > 0 ? 'var(--state-failed)' : 'var(--state-completed)' }}>
                    {q.stats.failed} failed
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Console Feed logs */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Terminal size={18} color="var(--orange-primary)" />
            <h2 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', fontWeight: 600, color: '#fff' }}>
              Scheduler Execution Console
            </h2>
          </div>

          {/* Log Filters */}
          <div style={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
            {['ALL', 'SYSTEM', 'QUEUE', 'WORKER', 'JOB', 'ENGINE', 'DLQ'].map(filter => (
              <button
                key={filter}
                onClick={() => setLogFilter(filter)}
                style={{
                  padding: '4px 8px',
                  fontSize: '0.7rem',
                  background: logFilter === filter ? 'rgba(255, 107, 0, 0.15)' : 'rgba(0, 0, 0, 0.3)',
                  color: logFilter === filter ? 'var(--orange-primary)' : 'var(--text-muted)',
                  border: '1px solid',
                  borderColor: logFilter === filter ? 'var(--orange-primary)' : 'var(--border-subtle)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  transition: 'all 0.15s ease'
                }}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {/* Live log feed box */}
        <div className="code-box" style={{
          height: '240px',
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '6px',
          background: '#040406',
          border: '1px solid rgba(255, 255, 255, 0.03)'
        }}>
          {filteredLogs.length === 0 ? (
            <div style={{ color: 'var(--text-dark)', textAlign: 'center', marginTop: '90px', fontStyle: 'italic' }}>
              No console outputs found matching filter.
            </div>
          ) : (
            filteredLogs.map(log => (
              <div key={log.id} style={{ display: 'flex', gap: '10px', fontSize: '0.8rem', whiteSpace: 'pre-wrap' }}>
                <span style={{ color: 'var(--text-dark)' }}>
                  [{new Date(log.timestamp).toLocaleTimeString()}]
                </span>
                <span style={getLogStyle(log.source)}>
                  [{log.source}]
                </span>
                <span style={{ color: '#e5e7eb' }}>{log.message}</span>
              </div>
            ))
          )}
        </div>
      </div>
      
    </div>
  );
};

export default Overview;
