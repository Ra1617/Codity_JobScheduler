import React, { useState } from 'react';
import { useScheduler } from '../contexts/SchedulerContext';
import { 
  Plus, 
  Clock, 
  Calendar, 
  Repeat, 
  Layers, 
  Sparkles,
  PlayCircle
} from 'lucide-react';

const JobCreator = ({ onClose }) => {
  const { queues, submitJob } = useScheduler();

  const [jobName, setJobName] = useState('');
  const [selectedQueueId, setSelectedQueueId] = useState(queues[0]?.id || '');
  const [jobType, setJobType] = useState('immediate'); // immediate, delayed, scheduled, cron, batch
  const [delaySeconds, setDelaySeconds] = useState(10);
  const [scheduledTime, setScheduledTime] = useState('');
  const [cronExpression, setCronExpression] = useState('*/15 * * * * *');
  const [priority, setPriority] = useState(1);
  const [maxRetries, setMaxRetries] = useState(3);
  const [simulatedDuration, setSimulatedDuration] = useState(3); // 3s execution duration
  const [failProbability, setFailProbability] = useState(0); // 0% failure
  const [payloadText, setPayloadText] = useState('{\n  "tenant_id": 42,\n  "action": "export_csv"\n}');
  
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!jobName.trim()) {
      setErrorMsg('Job name is required.');
      return;
    }

    let parsedPayload = {};
    try {
      if (payloadText.trim()) {
        parsedPayload = JSON.parse(payloadText);
      }
    } catch (err) {
      setErrorMsg('Payload must be valid JSON.');
      return;
    }

    if (jobType === 'scheduled' && !scheduledTime) {
      setErrorMsg('Please select a valid date & time.');
      return;
    }

    setErrorMsg('');

    if (jobType === 'batch') {
      // Create a batch of 4 linked jobs
      const batchId = `batch-${Date.now().toString().slice(-4)}`;
      for (let i = 1; i <= 4; i++) {
        submitJob({
          name: `${jobName}_part_${i}`,
          queueId: selectedQueueId,
          type: 'immediate',
          priority,
          maxRetries,
          simulatedDuration: simulatedDuration * 1000,
          failProbability: failProbability / 100,
          payload: { ...parsedPayload, batch_id: batchId, part: i, total_parts: 4 }
        });
      }
      setSuccessMsg(`Created a batch of 4 tasks (Batch ID: ${batchId})!`);
    } else {
      // Standard Job Submission
      submitJob({
        name: jobName.trim(),
        queueId: selectedQueueId,
        type: jobType,
        delaySeconds: parseInt(delaySeconds),
        scheduledTime,
        cronExpression,
        priority: parseInt(priority),
        maxRetries: parseInt(maxRetries),
        simulatedDuration: simulatedDuration * 1000,
        failProbability: failProbability / 100,
        payload: parsedPayload
      });
      setSuccessMsg('Job created successfully!');
    }

    // Reset fields
    setJobName('');
    setTimeout(() => {
      setSuccessMsg('');
      if (onClose) onClose();
    }, 1500);
  };

  const autofillTemplate = (templateName) => {
    switch (templateName) {
      case 'invoice':
        setJobName('render_invoice_pdf');
        setPayloadText('{\n  "invoice_id": 8472,\n  "customer_uuid": "stripe-cus_J384",\n  "amount": 250.00,\n  "currency": "usd"\n}');
        setSimulatedDuration(4);
        setPriority(2);
        break;
      case 'backup':
        setJobName('s3_database_backup');
        setPayloadText('{\n  "database": "production_replica",\n  "compression": "zstd",\n  "upload_endpoint": "s3://backups/db/"\n}');
        setSimulatedDuration(10);
        setPriority(1);
        break;
      case 'webhook':
        setJobName('dispatch_event_webhook');
        setPayloadText('{\n  "event": "user.subscription.deleted",\n  "endpoint": "https://client-api.com/webhook",\n  "retry_mode": "exponential"\n}');
        setSimulatedDuration(2);
        setPriority(3);
        setFailProbability(35); // Visual tests for failures
        break;
      default:
        break;
    }
  };

  return (
    <div className="glass-panel" style={{ padding: '24px', background: 'var(--bg-secondary)', border: '1px solid var(--orange-border)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <div>
          <h2 style={{ fontSize: '1.25rem', fontFamily: 'var(--font-display)', fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <PlayCircle size={22} color="var(--orange-primary)" />
            Enqueue New Task
          </h2>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Submit immediate, delayed, scheduled, recurring cron, or batch jobs to workers.
          </span>
        </div>
      </div>

      {/* Templates autofill */}
      <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Templates:</span>
        {['invoice', 'backup', 'webhook'].map(t => (
          <button
            key={t}
            type="button"
            onClick={() => autofillTemplate(t)}
            style={{
              padding: '3px 8px',
              fontSize: '0.7rem',
              borderRadius: '4px',
              border: '1px solid rgba(255, 107, 0, 0.2)',
              background: 'rgba(255, 107, 0, 0.05)',
              color: 'var(--orange-primary)',
              cursor: 'pointer',
              textTransform: 'capitalize'
            }}
          >
            {t}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* Name & Queue */}
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-normal)', display: 'block', marginBottom: '6px' }}>Job Name</label>
            <input 
              type="text" 
              className="glass-input" 
              placeholder="e.g. process_video_render"
              value={jobName}
              onChange={(e) => setJobName(e.target.value)}
            />
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-normal)', display: 'block', marginBottom: '6px' }}>Target Queue</label>
            <select 
              className="glass-select"
              value={selectedQueueId}
              onChange={(e) => setSelectedQueueId(e.target.value)}
            >
              {queues.map(q => (
                <option key={q.id} value={q.id} style={{ background: '#0e0e12' }}>{q.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Job Type selection tabs */}
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-normal)', display: 'block', marginBottom: '6px' }}>Trigger Mechanism</label>
          <div style={{ display: 'flex', gap: '4px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
            {[
              { id: 'immediate', name: 'Immediate', icon: PlayCircle },
              { id: 'delayed', name: 'Delayed', icon: Clock },
              { id: 'scheduled', name: 'Scheduled', icon: Calendar },
              { id: 'cron', name: 'Cron (Recurring)', icon: Repeat },
              { id: 'batch', name: 'Batch (4x)', icon: Sparkles }
            ].map(type => {
              const Icon = type.icon;
              const isSelected = jobType === type.id;
              return (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setJobType(type.id)}
                  style={{
                    flex: 1,
                    padding: '8px 4px',
                    fontSize: '0.7rem',
                    borderRadius: '6px',
                    border: 'none',
                    background: isSelected ? 'var(--orange-primary)' : 'transparent',
                    color: isSelected ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '4px',
                    fontWeight: isSelected ? 600 : 500,
                    transition: 'all 0.15s ease'
                  }}
                >
                  <Icon size={14} />
                  {type.name}
                </button>
              );
            })}
          </div>
        </div>

        {/* Dynamic Inputs based on type */}
        {jobType === 'delayed' && (
          <div className="glass-card" style={{ padding: '12px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-normal)', display: 'block', marginBottom: '6px' }}>Delay Duration (seconds)</label>
            <input 
              type="number" 
              className="glass-input" 
              min="1" 
              max="600"
              value={delaySeconds}
              onChange={(e) => setDelaySeconds(e.target.value)}
            />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              The job will enter the queue scheduled for execution in {delaySeconds} seconds.
            </span>
          </div>
        )}

        {jobType === 'scheduled' && (
          <div className="glass-card" style={{ padding: '12px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-normal)', display: 'block', marginBottom: '6px' }}>Execution Time</label>
            <input 
              type="datetime-local" 
              className="glass-input" 
              value={scheduledTime}
              onChange={(e) => setScheduledTime(e.target.value)}
              style={{ colorScheme: 'dark' }}
            />
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              The scheduler will automatically queue this job when the specified time is reached.
            </span>
          </div>
        )}

        {jobType === 'cron' && (
          <div className="glass-card" style={{ padding: '12px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-normal)', display: 'block', marginBottom: '6px' }}>Cron Expression</label>
                <input 
                  type="text" 
                  className="glass-input" 
                  value={cronExpression}
                  onChange={(e) => setCronExpression(e.target.value)}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-normal)', display: 'block', marginBottom: '6px' }}>Standard Interval</label>
                <select 
                  className="glass-select" 
                  onChange={(e) => setCronExpression(e.target.value)}
                  defaultValue="*/15 * * * * *"
                >
                  <option value="*/5 * * * * *" style={{ background: '#0e0e12' }}>Every 5s (Simulation)</option>
                  <option value="*/15 * * * * *" style={{ background: '#0e0e12' }}>Every 15s (Simulation)</option>
                  <option value="0 */5 * * * *" style={{ background: '#0e0e12' }}>Every 5 mins (Real)</option>
                  <option value="0 0 * * * *" style={{ background: '#0e0e12' }}>Hourly (Real)</option>
                </select>
              </div>
            </div>
            <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block', marginTop: '4px' }}>
              Cron format uses six columns: seconds (simulation only), minutes, hours, day-of-month, month, day-of-week.
            </span>
          </div>
        )}

        {/* Concurrency parameters and payloads */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-normal)', display: 'block', marginBottom: '6px' }}>
              Job Priority
            </label>
            <select 
              className="glass-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value={0} style={{ background: '#0e0e12' }}>Low (0)</option>
              <option value={1} style={{ background: '#0e0e12' }}>Default (1)</option>
              <option value={2} style={{ background: '#0e0e12' }}>High (2)</option>
              <option value={3} style={{ background: '#0e0e12' }}>Critical (3)</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-normal)', display: 'block', marginBottom: '6px' }}>
              Retry Limit Override
            </label>
            <input 
              type="number" 
              min="0" 
              max="10" 
              className="glass-input" 
              value={maxRetries}
              onChange={(e) => setMaxRetries(e.target.value)}
            />
          </div>
        </div>

        {/* Simulation variables */}
        <div className="glass-card" style={{ padding: '14px', background: 'rgba(255, 107, 0, 0.01)', border: '1px solid rgba(255, 107, 0, 0.08)' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--orange-primary)', display: 'block', marginBottom: '10px' }}>
            Simulation Engine Parameters
          </span>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-normal)', display: 'block', marginBottom: '4px' }}>
                Runtime Duration: <strong style={{ color: '#fff' }}>{simulatedDuration}s</strong>
              </label>
              <input 
                type="range" 
                min="1" 
                max="15" 
                value={simulatedDuration}
                onChange={(e) => setSimulatedDuration(e.target.value)}
                style={{ width: '100%', accentColor: 'var(--orange-primary)' }}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.7rem', color: 'var(--text-normal)', display: 'block', marginBottom: '4px' }}>
                Failure Chance: <strong style={{ color: failProbability > 0 ? 'var(--state-failed)' : '#fff' }}>{failProbability}%</strong>
              </label>
              <input 
                type="range" 
                min="0" 
                max="100" 
                step="5"
                value={failProbability}
                onChange={(e) => setFailProbability(e.target.value)}
                style={{ width: '100%', accentColor: failProbability > 0 ? 'var(--state-failed)' : 'var(--orange-primary)' }}
              />
            </div>
          </div>
        </div>

        {/* Payload JSON */}
        <div>
          <label style={{ fontSize: '0.75rem', color: 'var(--text-normal)', display: 'block', marginBottom: '6px' }}>
            Payload Parameters (JSON)
          </label>
          <textarea
            className="glass-input"
            rows="4"
            value={payloadText}
            onChange={(e) => setPayloadText(e.target.value)}
            style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', resize: 'vertical' }}
          />
        </div>

        {errorMsg && (
          <div style={{ color: 'var(--state-failed)', fontSize: '0.75rem', fontWeight: 500 }}>
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div style={{ color: 'var(--state-completed)', fontSize: '0.75rem', fontWeight: 500 }}>
            {successMsg}
          </div>
        )}

        <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '12px' }}>
          <Plus size={16} /> Enqueue Job
        </button>
      </form>
    </div>
  );
};

export default JobCreator;
