import React, { useState } from 'react';
import { SchedulerProvider, useScheduler } from './contexts/SchedulerContext';
import Sidebar from './components/Sidebar';
import Overview from './components/Overview';
import QueueManager from './components/QueueManager';
import JobExplorer from './components/JobExplorer';
import WorkerMonitor from './components/WorkerMonitor';
import JobCreator from './components/JobCreator';
import { Plus, HelpCircle, Activity } from 'lucide-react';

const DashboardContent = () => {
  const [activeTab, setActiveTab] = useState('overview');
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const { projects, selectedProjectId } = useScheduler();

  const activeProject = projects.find(p => p.id === selectedProjectId) || projects[0];

  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return <Overview setActiveTab={setActiveTab} />;
      case 'queues':
        return <QueueManager />;
      case 'jobs':
        return <JobExplorer />;
      case 'workers':
        return <WorkerMonitor />;
      default:
        return <Overview setActiveTab={setActiveTab} />;
    }
  };

  const getTabTitle = () => {
    switch (activeTab) {
      case 'overview': return 'Engine Dashboard';
      case 'queues': return 'Queue Configurations';
      case 'jobs': return 'Job Lifecycle Explorer';
      case 'workers': return 'Worker Node Cluster';
      default: return 'Dashboard';
    }
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Content Area */}
      <main className="content-area">
        {/* Main Sticky Header */}
        <header className="main-header">
          <div className="header-title">
            <h1>{getTabTitle()}</h1>
            <p>
              Project: <strong style={{ color: '#fff' }}>{activeProject.name}</strong> – {activeProject.description}
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Quick Submit Modal Trigger Button */}
            <button 
              onClick={() => setShowSubmitModal(true)}
              className="btn-primary"
            >
              <Plus size={16} /> Enqueue Job
            </button>
          </div>
        </header>

        {/* Dynamic Tab Body */}
        {renderTabContent()}

        {/* Job Creator Popup Modal Overlay */}
        {showSubmitModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(5, 5, 8, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 10000,
            animation: 'fadeIn 0.2s ease-out'
          }} onClick={() => setShowSubmitModal(false)}>
            <div 
              style={{ width: '90%', maxWidth: '640px', position: 'relative' }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal close button wrapper */}
              <button 
                onClick={() => setShowSubmitModal(false)}
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: 'rgba(255, 255, 255, 0.03)',
                  border: '1px solid rgba(255,255,255,0.05)',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  color: '#fff',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  zIndex: 2
                }}
              >
                ✕
              </button>
              
              <JobCreator onClose={() => setShowSubmitModal(false)} />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

function App() {
  return (
    <SchedulerProvider>
      <DashboardContent />
    </SchedulerProvider>
  );
}

export default App;
