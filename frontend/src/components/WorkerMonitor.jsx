import React from 'react';
import { useScheduler } from '../contexts/SchedulerContext';
import { 
  Cpu, 
  Plus, 
  Activity, 
  Trash2, 
  Power, 
  PowerOff,
  Signal,
  Boxes
} from 'lucide-react';

const WorkerMonitor = () => {
  const { 
    workers, 
    jobs,
    spawnWorker, 
    terminateWorker 
  } = useScheduler();

  const getStatusColor = (status) => {
    switch (status) {
      case 'online': return 'var(--state-completed)'; // Emerald green
      case 'busy': return 'var(--state-running)'; // Pulsing blue
      case 'terminating': return 'var(--state-queued)'; // Amber warning
      case 'offline': return 'var(--text-dark)'; // Muted grey
      default: return '#fff';
    }
  };

  const getCpuColor = (cpu) => {
    if (cpu > 80) return 'var(--state-failed)';
    if (cpu > 50) return 'var(--state-queued)';
    return 'var(--state-completed)';
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Worker Stats & Control Bar */}
      <div className="glass-panel" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Cpu size={18} color="var(--orange-primary)" />
            Distributed Worker Nodes
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Monitor active worker processes, CPU load factors, and claim metrics.
          </span>
        </div>

        <button 
          onClick={spawnWorker}
          className="btn-primary"
        >
          <Plus size={16} /> Spawn Worker Node
        </button>
      </div>

      {/* Workers Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
        gap: '20px'
      }}>
        {workers.map(w => {
          const activeJob = w.activeJobId ? jobs.find(j => j.id === w.activeJobId) : null;
          
          return (
            <div key={w.id} className="glass-panel" style={{ 
              padding: '20px',
              borderTop: `3px solid ${getStatusColor(w.status)}`
            }}>
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px' }}>
                <div>
                  <h3 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {w.name}
                  </h3>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginTop: '2px' }}>
                    Region: {w.region} | ID: {w.id.slice(0, 12)}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span 
                    className="badge" 
                    style={{ 
                      background: 'rgba(255,255,255,0.02)', 
                      color: getStatusColor(w.status),
                      borderColor: 'rgba(255,255,255,0.05)',
                      fontSize: '0.65rem'
                    }}
                  >
                    <span style={{ 
                      display: 'inline-block', width: '6px', height: '6px', borderRadius: '50%', 
                      background: getStatusColor(w.status), marginRight: '4px',
                      animation: w.status === 'busy' ? 'pulse-orange 1.5s infinite' : 'none'
                    }}></span>
                    {w.status}
                  </span>
                </div>
              </div>

              {/* Resource meters (CPU / RAM) */}
              {w.status !== 'offline' ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '16px' }}>
                  {/* CPU Meter */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>CPU Workload</span>
                      <span style={{ color: getCpuColor(w.cpuUsage), fontWeight: 'bold' }}>{w.cpuUsage}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(0,0,0,0.4)', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${w.cpuUsage}%`, 
                        background: getCpuColor(w.cpuUsage),
                        transition: 'width 0.8s ease'
                      }}></div>
                    </div>
                  </div>

                  {/* RAM Meter */}
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', marginBottom: '4px' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Memory Allocation</span>
                      <span style={{ color: '#fff', fontWeight: 'bold' }}>{w.ramUsage}%</span>
                    </div>
                    <div style={{ height: '6px', background: 'rgba(0,0,0,0.4)', borderRadius: '3px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.03)' }}>
                      <div style={{ 
                        height: '100%', 
                        width: `${w.ramUsage}%`, 
                        background: 'var(--orange-primary)',
                        transition: 'width 0.8s ease'
                      }}></div>
                    </div>
                  </div>
                </div>
              ) : (
                <div style={{ 
                  height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', 
                  background: 'rgba(0,0,0,0.2)', border: '1px solid var(--border-subtle)', 
                  borderRadius: '6px', color: 'var(--text-dark)', fontSize: '0.75rem', fontStyle: 'italic',
                  marginBottom: '16px'
                }}>
                  Host offline. No heartbeats received.
                </div>
              )}

              {/* Active claimed task info */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px', marginBottom: '14px' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '6px' }}>
                  Current Execution Claim
                </span>
                {activeJob ? (
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#fff' }}>{activeJob.name}</span>
                      <span style={{ display: 'block', fontSize: '0.65rem', color: 'var(--orange-primary)', fontFamily: 'var(--font-mono)' }}>
                        {activeJob.id}
                      </span>
                    </div>
                    <span className="badge badge-running" style={{ fontSize: '0.6rem' }}>Running</span>
                  </div>
                ) : (
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dark)', fontStyle: 'italic' }}>
                    {w.status === 'online' ? 'Idle. Polling database queues...' : 'None.'}
                  </span>
                )}
              </div>

              {/* Actions & Heartbeat timestamps */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '0.65rem', color: 'var(--text-dark)' }}>
                  <Signal size={10} color={w.status !== 'offline' ? 'var(--state-completed)' : 'var(--text-dark)'} />
                  {w.status !== 'offline' ? (
                    <span>Last heartbeat: <strong style={{ color: 'var(--text-muted)' }}>just now</strong></span>
                  ) : (
                    <span>Last seen: 2m ago</span>
                  )}
                </div>

                {w.status !== 'offline' && (
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {/* Graceful Shutdown button */}
                    <button
                      onClick={() => terminateWorker(w.id, true)}
                      className="btn-secondary"
                      style={{ padding: '6px', borderRadius: '4px' }}
                      title="Graceful Shutdown"
                      disabled={w.status === 'terminating'}
                    >
                      <PowerOff size={12} color="var(--state-queued)" />
                    </button>
                    {/* Hard Terminate button */}
                    <button
                      onClick={() => terminateWorker(w.id, false)}
                      className="btn-secondary"
                      style={{ padding: '6px', borderRadius: '4px', borderColor: 'rgba(244, 63, 94, 0.2)' }}
                      title="Hard Terminate (Kill Process)"
                    >
                      <Power size={12} color="var(--state-failed)" />
                    </button>
                  </div>
                )}
              </div>

            </div>
          );
        })}
      </div>
      
    </div>
  );
};

export default WorkerMonitor;
