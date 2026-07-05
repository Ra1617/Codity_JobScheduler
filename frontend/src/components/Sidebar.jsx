import React from 'react';
import { useScheduler } from '../contexts/SchedulerContext';
import { 
  LayoutDashboard, 
  Layers, 
  Play, 
  Pause, 
  Cpu, 
  Terminal, 
  Activity, 
  Boxes,
  Zap
} from 'lucide-react';

const Sidebar = ({ activeTab, setActiveTab }) => {
  const { 
    projects, 
    selectedProjectId, 
    setSelectedProjectId,
    isSimulating, 
    setIsSimulating,
    simulationSpeed,
    setSimulationSpeed,
    triggerJobBurst
  } = useScheduler();

  const menuItems = [
    { id: 'overview', name: 'Overview', icon: LayoutDashboard },
    { id: 'queues', name: 'Queues & Policies', icon: Layers },
    { id: 'jobs', name: 'Job Explorer', icon: Terminal },
    { id: 'workers', name: 'Workers & Nodes', icon: Cpu }
  ];

  return (
    <aside style={{
      width: '260px',
      background: 'rgba(10, 10, 14, 0.85)',
      backdropFilter: 'blur(16px)',
      borderRight: '1px solid rgba(255, 255, 255, 0.05)',
      padding: '24px 16px',
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      position: 'sticky',
      top: 0
    }}>
      {/* Brand Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '32px', paddingLeft: '8px' }}>
        <div style={{
          width: '36px',
          height: '36px',
          borderRadius: '8px',
          background: 'linear-gradient(135deg, #ff6b00 0%, #ff8c00 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 0 15px rgba(255, 107, 0, 0.4)'
        }}>
          <Activity size={20} color="#fff" />
        </div>
        <div>
          <span style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 800,
            fontSize: '1.2rem',
            letterSpacing: '1px',
            color: '#fff'
          }}>CHRONOS</span>
          <div style={{ fontSize: '0.65rem', color: '#ff6b00', fontWeight: 'bold', letterSpacing: '1.5px', marginTop: '-3px' }}>
            DISTRIBUTED ENGINE
          </div>
        </div>
      </div>

      {/* Project Selector */}
      <div style={{ marginBottom: '28px', padding: '0 8px' }}>
        <label style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block', marginBottom: '8px' }}>
          Active Project
        </label>
        <select 
          className="glass-select"
          value={selectedProjectId}
          onChange={(e) => setSelectedProjectId(e.target.value)}
          style={{ width: '100%' }}
        >
          {projects.map(p => (
            <option key={p.id} value={p.id} style={{ background: '#0e0e12', color: '#fff' }}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      {/* Menu Navigation */}
      <nav style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {menuItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                width: '100%',
                padding: '12px 16px',
                background: isActive ? 'rgba(255, 107, 0, 0.1)' : 'transparent',
                color: isActive ? '#fff' : 'var(--text-muted)',
                border: 'none',
                borderLeft: isActive ? '3px solid var(--orange-primary)' : '3px solid transparent',
                borderRadius: '0 8px 8px 0',
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
                fontWeight: isActive ? 600 : 500,
                fontSize: '0.9rem',
                transition: 'all 0.2s ease',
                textAlign: 'left'
              }}
            >
              <Icon size={18} color={isActive ? 'var(--orange-primary)' : 'var(--text-muted)'} />
              {item.name}
            </button>
          );
        })}
      </nav>

      {/* Simulation Controls Panel (Premium Gloss Card at the bottom) */}
      <div className="glass-panel" style={{
        padding: '16px',
        background: 'rgba(22, 22, 31, 0.45)',
        border: '1px solid rgba(255, 107, 0, 0.12)',
        borderRadius: '12px',
        marginTop: 'auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <span className="pulse-orange-dot" style={{ display: isSimulating ? 'inline-block' : 'none' }}></span>
            <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fff', textTransform: 'uppercase' }}>
              Simulation Engine
            </span>
          </div>
          <button 
            onClick={() => setIsSimulating(!isSimulating)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: isSimulating ? '#ff6b00' : 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center'
            }}
            title={isSimulating ? "Pause Simulation" : "Start Simulation"}
          >
            {isSimulating ? <Pause size={16} /> : <Play size={16} />}
          </button>
        </div>

        {/* Speed Adjustment */}
        {isSimulating && (
          <div style={{ marginBottom: '14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
              <span>Engine Speed</span>
              <span style={{ color: 'var(--orange-primary)', fontWeight: 'bold' }}>{simulationSpeed}x</span>
            </div>
            <div style={{ display: 'flex', gap: '4px' }}>
              {[1, 2, 5].map(speed => (
                <button
                  key={speed}
                  onClick={() => setSimulationSpeed(speed)}
                  style={{
                    flex: 1,
                    padding: '3px 0',
                    fontSize: '0.7rem',
                    background: simulationSpeed === speed ? 'var(--orange-primary)' : 'rgba(0,0,0,0.3)',
                    color: '#fff',
                    border: '1px solid rgba(255,107,0,0.1)',
                    borderRadius: '4px',
                    cursor: 'pointer',
                    fontWeight: 'bold',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {speed}x
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Burst Job Generation Button */}
        <button
          onClick={triggerJobBurst}
          className="btn-primary"
          style={{
            width: '100%',
            padding: '8px',
            fontSize: '0.7rem',
            justifyContent: 'center',
            borderRadius: '6px',
            boxShadow: 'none'
          }}
        >
          <Zap size={12} />
          Trigger 8x Jobs Burst
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
