import React, { useState } from 'react';
import { useScheduler } from '../contexts/SchedulerContext';
import { 
  Layers, 
  Settings2, 
  Pause, 
  Play, 
  Sliders, 
  Plus, 
  ArrowRightLeft, 
  Info 
} from 'lucide-react';

const QueueManager = () => {
  const { 
    queues, 
    createQueue, 
    configureQueue 
  } = useScheduler();

  const [activeConfigId, setActiveConfigId] = useState(queues[0]?.id || null);
  const [newQueueName, setNewQueueName] = useState('');
  const [newPriority, setNewPriority] = useState(1);
  const [newConcurrency, setNewConcurrency] = useState(2);
  const [newMaxRetries, setNewMaxRetries] = useState(3);
  const [newRetryDelay, setNewRetryDelay] = useState(5);
  const [newRetryStrategy, setNewRetryStrategy] = useState('exponential');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleCreateQueue = (e) => {
    e.preventDefault();
    if (!newQueueName.trim()) {
      setErrorMsg('Queue name is required.');
      return;
    }
    
    // Check duplication
    if (queues.some(q => q.name.toLowerCase() === newQueueName.trim().toLowerCase())) {
      setErrorMsg('Queue name already exists.');
      return;
    }

    createQueue({
      name: newQueueName.trim(),
      priority: parseInt(newPriority),
      concurrencyLimit: parseInt(newConcurrency),
      maxRetries: parseInt(newMaxRetries),
      retryDelay: parseInt(newRetryDelay),
      retryStrategy: newRetryStrategy
    });

    setNewQueueName('');
    setErrorMsg('');
    setSuccessMsg('Queue registered successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const selectedQueue = queues.find(q => q.id === activeConfigId);

  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '24px' }}>
      
      {/* Left Column: Queues List & Settings */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', fontWeight: 600, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Layers size={18} color="var(--orange-primary)" />
            Active Job Queues
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {queues.map(q => {
              const isSelected = q.id === activeConfigId;
              return (
                <div 
                  key={q.id} 
                  className="glass-card" 
                  onClick={() => setActiveConfigId(q.id)}
                  style={{ 
                    cursor: 'pointer',
                    borderColor: isSelected ? 'var(--orange-primary)' : 'rgba(255, 255, 255, 0.05)',
                    background: isSelected ? 'rgba(255, 107, 0, 0.03)' : 'rgba(14, 14, 18, 0.65)',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '0.95rem', fontWeight: 600, color: '#fff' }}>{q.name}</span>
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
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                      Priority: <span style={{ color: '#fff', fontWeight: 500 }}>{q.priority}</span> | Concurrency Limit: <span style={{ color: '#fff', fontWeight: 500 }}>{q.concurrencyLimit}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                      Processed: <span style={{ color: 'var(--state-completed)', fontWeight: 'bold' }}>{q.stats.processed}</span>
                      <br />
                      Failed: <span style={{ color: 'var(--state-failed)' }}>{q.stats.failed}</span>
                    </div>
                    <Settings2 size={16} color={isSelected ? 'var(--orange-primary)' : 'var(--text-muted)'} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Queue Configuration details */}
        {selectedQueue && (
          <div className="glass-panel" style={{ padding: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div>
                <h3 style={{ fontSize: '1rem', fontFamily: 'var(--font-display)', fontWeight: 600, color: '#fff' }}>
                  Queue Configurator: <span style={{ color: 'var(--orange-primary)' }}>{selectedQueue.name}</span>
                </h3>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Configure real-time throttle parameters and retry schemas</span>
              </div>
              
              {/* Pause/Resume Toggle */}
              <button
                onClick={() => configureQueue(selectedQueue.id, { isPaused: !selectedQueue.isPaused })}
                className={selectedQueue.isPaused ? "btn-primary" : "btn-secondary"}
                style={{
                  padding: '6px 12px',
                  fontSize: '0.75rem',
                  borderRadius: '4px',
                  background: selectedQueue.isPaused ? 'var(--state-completed)' : 'rgba(255,255,255,0.05)',
                  borderColor: selectedQueue.isPaused ? 'var(--state-completed)' : 'rgba(255,255,255,0.1)'
                }}
              >
                {selectedQueue.isPaused ? (
                  <><Play size={12} /> Resume Queue</>
                ) : (
                  <><Pause size={12} /> Pause Queue</>
                )}
              </button>
            </div>

            {/* Slider Settings */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '8px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginBottom: '6px' }}>
                  <span style={{ color: 'var(--text-normal)' }}>Concurrency Limit</span>
                  <span style={{ color: 'var(--orange-primary)', fontWeight: 'bold' }}>{selectedQueue.concurrencyLimit} active claims</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={selectedQueue.concurrencyLimit} 
                  onChange={(e) => configureQueue(selectedQueue.id, { concurrencyLimit: parseInt(e.target.value) })}
                  style={{
                    width: '100%',
                    accentColor: 'var(--orange-primary)',
                    background: 'rgba(0,0,0,0.4)',
                    height: '5px',
                    borderRadius: '5px',
                    cursor: 'pointer'
                  }}
                />
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
                  Controls maximum concurrent executions assigned to workers from this queue.
                </span>
              </div>

              {/* Retry Policy settings display */}
              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                <h4 style={{ fontSize: '0.85rem', color: '#fff', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Sliders size={14} color="var(--orange-primary)" />
                  Default Retry Policy Schema
                </h4>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1.2fr', gap: '12px', fontSize: '0.8rem' }}>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Max Retries</div>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem', marginTop: '2px' }}>
                      {selectedQueue.retryPolicy.maxRetries} attempts
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Base Delay</div>
                    <div style={{ color: '#fff', fontWeight: 600, fontSize: '0.9rem', marginTop: '2px' }}>
                      {selectedQueue.retryPolicy.delay} seconds
                    </div>
                  </div>
                  <div style={{ background: 'rgba(0,0,0,0.2)', padding: '10px', borderRadius: '6px', border: '1px solid var(--border-subtle)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.7rem' }}>Backoff Strategy</div>
                    <div style={{ color: 'var(--orange-primary)', fontWeight: 600, fontSize: '0.9rem', marginTop: '2px', textTransform: 'uppercase' }}>
                      {selectedQueue.retryPolicy.strategy}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right Column: Register Queue Form */}
      <div>
        <div className="glass-panel" style={{ padding: '20px' }}>
          <h2 style={{ fontSize: '1.1rem', fontFamily: 'var(--font-display)', fontWeight: 600, color: '#fff', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Plus size={18} color="var(--orange-primary)" />
            Register Queue
          </h2>

          <form onSubmit={handleCreateQueue} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ fontSize: '0.75rem', color: 'var(--text-normal)', display: 'block', marginBottom: '6px' }}>
                Queue Name
              </label>
              <input 
                type="text" 
                className="glass-input"
                placeholder="e.g. data-sync-webhooks"
                value={newQueueName}
                onChange={(e) => setNewQueueName(e.target.value)}
              />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-normal)', display: 'block', marginBottom: '6px' }}>
                  Queue Priority
                </label>
                <select 
                  className="glass-select"
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                >
                  <option value={0} style={{ background: '#0e0e12' }}>Low (0)</option>
                  <option value={1} style={{ background: '#0e0e12' }}>Default (1)</option>
                  <option value={2} style={{ background: '#0e0e12' }}>High (2)</option>
                  <option value={3} style={{ background: '#0e0e12' }}>Critical (3)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-normal)', display: 'block', marginBottom: '6px' }}>
                  Max Concurrency
                </label>
                <input 
                  type="number" 
                  min="1" 
                  max="20"
                  className="glass-input"
                  value={newConcurrency}
                  onChange={(e) => setNewConcurrency(e.target.value)}
                />
              </div>
            </div>

            <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', marginTop: '4px' }}>
              <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', display: 'block', marginBottom: '10px' }}>
                Retry & Failover Schema
              </span>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Max Retries
                  </label>
                  <input 
                    type="number" 
                    min="0" 
                    max="10"
                    className="glass-input"
                    value={newMaxRetries}
                    onChange={(e) => setNewMaxRetries(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                    Retry Delay (sec)
                  </label>
                  <input 
                    type="number" 
                    min="1" 
                    max="60"
                    className="glass-input"
                    value={newRetryDelay}
                    onChange={(e) => setNewRetryDelay(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>
                  Backoff Strategy
                </label>
                <select 
                  className="glass-select"
                  value={newRetryStrategy}
                  onChange={(e) => setNewRetryStrategy(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="fixed" style={{ background: '#0e0e12' }}>Fixed Delay</option>
                  <option value="linear" style={{ background: '#0e0e12' }}>Linear Backoff</option>
                  <option value="exponential" style={{ background: '#0e0e12' }}>Exponential Backoff</option>
                </select>
              </div>
            </div>

            {errorMsg && (
              <div style={{ color: 'var(--state-failed)', fontSize: '0.75rem', marginTop: '4px' }}>
                {errorMsg}
              </div>
            )}

            {successMsg && (
              <div style={{ color: 'var(--state-completed)', fontSize: '0.75rem', marginTop: '4px' }}>
                {successMsg}
              </div>
            )}

            <button 
              type="submit" 
              className="btn-primary"
              style={{ width: '100%', justifyContent: 'center', marginTop: '8px' }}
            >
              <Plus size={16} /> Register Queue
            </button>
          </form>
        </div>

        {/* Explain color theories & system constraints */}
        <div className="glass-panel" style={{ padding: '16px', marginTop: '16px', background: 'rgba(255, 107, 0, 0.02)', border: '1px solid rgba(255, 107, 0, 0.08)' }}>
          <div style={{ display: 'flex', gap: '10px' }}>
            <Info size={18} color="var(--orange-primary)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', lineHeight: '1.4' }}>
              <strong style={{ color: '#fff', display: 'block', marginBottom: '4px' }}>Distributed Concurrency & Queuing Model</strong>
              Chronos pulls jobs using an atomic SELECT FOR UPDATE or CAS matching mechanism on claims. Higher queue priority (e.g. Critical 3) pushes scheduled tasks to nodes ahead of standard queues. Paused queues inhibit claims immediately.
            </div>
          </div>
        </div>
      </div>
      
    </div>
  );
};

export default QueueManager;
