import { useState, useEffect } from 'react';
import { 
  CursorSession, 
  getSessions, 
  saveSession, 
  deleteSessionById,
  openProjects, 
  launchSession
} from './api';
import './styles.css';

function App() {
  const [sessions, setSessions] = useState<CursorSession[]>([]);
  const [activeTab, setActiveTab] = useState('sessions');
  const [loading, setLoading] = useState(false);
  const [formVisible, setFormVisible] = useState(false);
  const [notification, setNotification] = useState({ message: '', type: '' });
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [deleteConfirmation, setDeleteConfirmation] = useState<{
    visible: boolean;
    sessionId: string;
    sessionName: string;
  }>({ visible: false, sessionId: '', sessionName: '' });
  
  // Form state
  const [sessionName, setSessionName] = useState('');
  const [projectPaths, setProjectPaths] = useState('');
  const [spoofMacAddress, setSpoofMacAddress] = useState(false);

  // Mock time tracking data - in real implementation, this would come from backend
  const [sessionUsageData] = useState<Record<string, { totalMinutes: number; weeklyData: number[] }>>({
    'personal': { totalMinutes: 1247, weeklyData: [45, 67, 23, 89, 56, 78, 34] },
    'CHAMATH': { totalMinutes: 234, weeklyData: [12, 23, 8, 34, 18, 28, 11] },
    'work': { totalMinutes: 2156, weeklyData: [78, 89, 67, 123, 89, 98, 45] },
    'CHX': { totalMinutes: 89, weeklyData: [5, 8, 3, 12, 7, 9, 4] }
  });

  // Disable context menu and keyboard shortcuts
  useEffect(() => {
    // Disable context menu
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

    // Disable F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === 'F12' ||
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J')) ||
        (e.ctrlKey && e.key === 'U')
      ) {
        e.preventDefault();
        return false;
      }
    };

    // Disable selection of text in production
    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
      // Allow selection in form inputs
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        return true;
      }
      e.preventDefault();
      return false;
    };

    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('selectstart', handleSelectStart);

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('selectstart', handleSelectStart);
    };
  }, []);

  // Window control handlers for desktop app
  const handleMinimize = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const window = getCurrentWindow();
      await window.minimize();
    } catch (error) {
      console.error('Failed to minimize window:', error);
    }
  };

  const handleClose = async () => {
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      const window = getCurrentWindow();
      await window.close();
    } catch (error) {
      console.error('Failed to close window:', error);
    }
  };

  // Calculate Bento grid size based on usage
  const calculateGridSize = (sessionId: string) => {
    const usage = sessionUsageData[sessionId];
    if (!usage) return 'normal';
    
    const totalMinutes = usage.totalMinutes;
    
    // Dynamic sizing algorithm
    if (totalMinutes > 1500) return 'large'; // Heavy users get big cards
    if (totalMinutes > 600) return 'normal'; // Regular users get normal cards
    return 'small'; // Light users get small cards
  };

  const formatUsageTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    
    if (hours === 0) return `${remainingMinutes}m`;
    if (remainingMinutes === 0) return `${hours}h`;
    return `${hours}h ${remainingMinutes}m`;
  };

  useEffect(() => {
    loadSessions();
  }, []);

  const loadSessions = async () => {
    console.log(`[DEBUG] loadSessions called`);
    setLoading(true);
    try {
      const data = await getSessions();
      console.log(`[DEBUG] loadSessions received ${data.length} sessions:`, data);
      setSessions(data);
    } catch (error) {
      console.error(`[ERROR] loadSessions failed:`, error);
      showNotification('Failed to load sessions', 'error');
    } finally {
      setLoading(false);
      console.log(`[DEBUG] loadSessions completed`);
    }
  };

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName.trim()) {
      showNotification('Please enter a session name', 'error');
      return;
    }

    const projects = projectPaths.trim()
      ? projectPaths.split('\n').map(path => path.trim()).filter(Boolean)
      : [];

    if (projects.length === 0) {
      showNotification('Please add at least one project path', 'error');
      return;
    }

    setLoading(true);
    setCurrentStatus('Creating new session...');
    
    try {
      const result = await saveSession(sessionName, projects);
      if (result) {
        showNotification('Session created successfully! 🎉', 'success');
        setFormVisible(false);
        setSessionName('');
        setProjectPaths('');
        loadSessions();
        setCurrentStatus('Session created successfully!');
        setTimeout(() => setCurrentStatus(''), 3000);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      showNotification('Failed to create session', 'error');
      setCurrentStatus('Failed to create session');
    } finally {
      setLoading(false);
    }
  };

  const handleLaunchSession = async (session: CursorSession) => {
    console.log(`[DEBUG] Starting launch for session: ${session.name}`);
    console.log(`[DEBUG] Spoof MAC enabled: ${spoofMacAddress}`);
    console.log(`[DEBUG] Session projects:`, session.projects);
    
    setLoading(true);
    setCurrentStatus('Initializing session launch...');
    
    try {
      if (spoofMacAddress) {
        setCurrentStatus('🔄 Spoofing MAC address... (this may take up to 60 seconds)');
      } else {
        setCurrentStatus('🚀 Launching Cursor session...');
      }
      
      const launchResult = await launchSession(session, spoofMacAddress, false);
      console.log(`[DEBUG] Launch result:`, launchResult);
      
      setCurrentStatus('✅ Session launched successfully!');
      showNotification(`Session launched: ${session.name} 🚀`, 'success');
      
      // Also open projects using the existing function
      if (session.projects.length > 0) {
        setCurrentStatus('📂 Opening projects...');
        console.log(`[DEBUG] Opening ${session.projects.length} projects`);
        await openProjects(session.projects);
        console.log(`[DEBUG] Projects opened successfully`);
        setCurrentStatus('🎯 Projects opened successfully!');
      } else {
        console.log(`[DEBUG] No projects to open for this session`);
      }
    } catch (error) {
      console.error(`[ERROR] Failed to launch session:`, error);
      setCurrentStatus('❌ Launch failed!');
      
      // Provide specific error messages for common issues
      let errorMessage = 'Failed to launch session';
      const errorStr = String(error);
      
      if (errorStr.includes('timed out')) {
        errorMessage = '⏱️ Operation timed out. Please check your network connection and permissions.';
      } else if (errorStr.includes('sudo access')) {
        errorMessage = '🔐 MAC spoofing requires admin access. Please check the settings tab for setup instructions.';
      } else if (errorStr.includes('Session directory not found')) {
        errorMessage = '📁 Session directory not found. Please try creating the session again.';
      } else {
        errorMessage = `❌ Failed to launch session: ${error}`;
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
      setTimeout(() => setCurrentStatus(''), 5000); // Clear status after 5 seconds
    }
  };

  const handleDeleteSession = async (sessionId: string, sessionName: string) => {
    console.log(`[DEBUG] handleDeleteSession called for: ${sessionId}`);
    
    // Show custom confirmation modal instead of window.confirm
    setDeleteConfirmation({
      visible: true,
      sessionId,
      sessionName
    });
  };

  const confirmDelete = async () => {
    const { sessionId, sessionName } = deleteConfirmation;
    console.log(`[DEBUG] Confirmed delete for: ${sessionId}`);
    
    setDeleteConfirmation({ visible: false, sessionId: '', sessionName: '' });
    setLoading(true);
    setCurrentStatus(`🗑️ Deleting session: ${sessionName}...`);
    
    try {
      console.log(`[DEBUG] Calling deleteSessionById for: ${sessionId}`);
      const result = await deleteSessionById(sessionId);
      console.log(`[DEBUG] Delete result:`, result);
      
      if (result) {
        showNotification(`Session "${sessionName}" deleted successfully! 🗑️`, 'success');
        setCurrentStatus('✅ Session deleted successfully!');
        // Reload sessions to update the UI
        await loadSessions();
      } else {
        throw new Error('Delete operation returned false');
      }
    } catch (error) {
      console.error(`[ERROR] Failed to delete session:`, error);
      showNotification(`Failed to delete session: ${error}`, 'error');
      setCurrentStatus('❌ Failed to delete session');
    } finally {
      setLoading(false);
      setTimeout(() => setCurrentStatus(''), 3000);
    }
  };

  const cancelDelete = () => {
    console.log(`[DEBUG] Delete cancelled by user`);
    setDeleteConfirmation({ visible: false, sessionId: '', sessionName: '' });
  };

  const showNotification = (message: string, type: string) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: '', type: '' });
    }, 5000); // Increased duration for better UX
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  return (
    <div className="app-container">
      {/* Transparent Window Frame */}
      <div className="window-frame">
        {/* Custom Window Controls for Desktop App */}
        <div className="window-controls">
          <button className="window-control minimize" onClick={handleMinimize} title="Minimize">
            −
          </button>
          <button className="window-control close" onClick={handleClose} title="Close">
            ×
          </button>
        </div>

        <header className="compact-header">
          <div className="header-content">
            <div className="header-text">
              <h1>Cursor Session Manager</h1>
              <p>Manage your Cursor IDE sessions with style and efficiency</p>
            </div>
            <nav className="header-nav">
              <button
                className={`nav-button ${activeTab === 'sessions' ? 'active' : ''}`}
                onClick={() => setActiveTab('sessions')}
              >
                <span>🖥️</span> Sessions
              </button>
              <button
                className={`nav-button ${activeTab === 'settings' ? 'active' : ''}`}
                onClick={() => setActiveTab('settings')}
              >
                <span>⚙️</span> Settings
              </button>
            </nav>
          </div>
        </header>

        <div className="main-content">
          {/* Sessions Tab */}
          {activeTab === 'sessions' && (
            <div className="card no-hover">
              <div className="flex justify-between items-center" style={{ marginBottom: 'var(--space-xl)' }}>
                <h3 className="text-gradient">My Sessions</h3>
                <button 
                  className="btn btn-primary"
                  onClick={() => setFormVisible(true)}
                  disabled={loading}
                >
                  {loading && <div className="loading-spinner"></div>}
                  <span>➕</span> New Session
                </button>
              </div>

              {currentStatus && (
                <div className="status-display">
                  <strong>Status:</strong> {currentStatus}
                </div>
              )}

              {loading && !currentStatus ? (
                <div className="text-center" style={{ padding: 'var(--space-2xl)' }}>
                  <div className="loading-spinner" style={{ margin: '0 auto var(--space-md)' }}></div>
                  <p>Loading sessions...</p>
                </div>
              ) : (
                <div className="sessions-container">
                  {sessions.length === 0 ? (
                    <div className="text-center" style={{ padding: 'var(--space-2xl)' }}>
                      <div style={{ fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-md)' }}>🎯</div>
                      <h3 style={{ marginBottom: 'var(--space-sm)' }}>No sessions found</h3>
                      <p className="help-text">Create your first session to get started with Cursor Session Manager</p>
                    </div>
                  ) : (
                    <div className="sessions-grid">
                      {sessions.map((session) => {
                        const gridSize = calculateGridSize(session.id);
                        const usageData = sessionUsageData[session.id];
                        
                        return (
                          <div key={session.id} className={`session-card ${gridSize}`}>
                            <div className="session-content">
                              <div className="session-info">
                                <div className="session-header">
                                  <span className="session-icon">🖥️</span>
                                  <h4 className="session-name">{session.name}</h4>
                                </div>
                                <div className="session-details">
                                  <div className="session-stat">
                                    <span>📁 Projects: {session.projects.length}</span>
                                  </div>
                                  <div className="session-stat">
                                    <span>📅 Created: {formatDate(session.created_date)}</span>
                                  </div>
                                </div>
                                <div className="session-actions">
                                  <button
                                    className="btn-compact btn-primary"
                                    onClick={() => handleLaunchSession(session)}
                                    disabled={loading}
                                    title="Launch Session"
                                  >
                                    {loading && <div className="loading-spinner-small"></div>}
                                    <span>🚀</span>
                                  </button>
                                  <button
                                    className="btn-compact btn-danger"
                                    onClick={() => handleDeleteSession(session.id, session.name)}
                                    disabled={loading}
                                    title="Delete Session"
                                  >
                                    {loading && <div className="loading-spinner-small"></div>}
                                    <span>🗑️</span>
                                  </button>
                                </div>
                              </div>
                              <div className="session-analytics">
                                <div className="usage-chart">
                                  <div className="chart-header">
                                    <span className="chart-title">Weekly Usage</span>
                                  </div>
                                  <div className="pulse-chart">
                                    {usageData?.weeklyData.map((value, index) => {
                                      const maxValue = Math.max(...usageData.weeklyData);
                                      const height = maxValue > 0 ? (value / maxValue) * 100 : 10;
                                      return (
                                        <div 
                                          key={index} 
                                          className="pulse-bar" 
                                          style={{ height: `${Math.max(height, 8)}%` }}
                                          title={`Day ${index + 1}: ${value}min`}
                                        ></div>
                                      );
                                    })}
                                  </div>
                                  <div className="usage-time">
                                    <span className="time-label">Total This Week</span>
                                    <span className="time-value">{formatUsageTime(sessionUsageData[session.id]?.totalMinutes || 0)}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="card no-hover">
              <h3 className="text-gradient" style={{ marginBottom: 'var(--space-xl)' }}>
                <span>⚙️</span> Settings
              </h3>
              
              <div className="form-group">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={spoofMacAddress}
                    onChange={(e) => setSpoofMacAddress(e.target.checked)}
                  />
                  <span>🔐 Spoof MAC address when launching sessions</span>
                </label>
                <p className="help-text">
                  This will change your device's MAC address each time you launch a session, 
                  helping to avoid detection of multiple Cursor instances.
                </p>
              </div>
              
              {spoofMacAddress && (
                <div className="setup-instructions">
                  <h4>🔧 MAC Spoofing Setup Required</h4>
                  <p>To enable MAC spoofing, you need to configure admin permissions. Run this command in Terminal (macOS) or Command Prompt as Administrator (Windows):</p>
                  
                  <div style={{ marginTop: 'var(--space-md)' }}>
                    <h5>macOS:</h5>
                    <div className="code-block">
                      <code>sudo visudo</code>
                    </div>
                    <p>Then add this line at the end of the file:</p>
                    <div className="code-block">
                      <code>%admin ALL=(ALL) NOPASSWD: /usr/sbin/networksetup, /sbin/ifconfig</code>
                    </div>
                  </div>

                  <div style={{ marginTop: 'var(--space-lg)' }}>
                    <h5>Windows:</h5>
                    <div className="code-block">
                      <code>netsh interface show interface</code>
                    </div>
                    <p>Note the interface name, then run:</p>
                    <div className="code-block">
                      <code>netsh interface set interface "Your Interface Name" admin=disable</code>
                    </div>
                    <div className="code-block">
                      <code>reg add "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Class\{'{4d36e972-e325-11ce-bfc1-08002be10318}'}\0001" /v NetworkAddress /t REG_SZ /d "NEW_MAC_ADDRESS" /f</code>
                    </div>
                    <div className="code-block">
                      <code>netsh interface set interface "Your Interface Name" admin=enable</code>
                    </div>
                  </div>
                  
                  <p className="warning-text">
                    <strong>⚠️ Warning:</strong> This allows elevated access to network commands. 
                    Only do this on your personal machine.
                  </p>
                </div>
              )}
              
              <div className="warning-text" style={{ marginTop: 'var(--space-xl)' }}>
                <strong>💡 Note:</strong> If you're experiencing issues with Cursor instances, you may need to
                clear machine-id or fingerprints. This functionality will be added in a future update.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Create Session Modal */}
      <div className={`modal ${formVisible ? 'active' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="text-gradient">
              <span>➕</span> Create New Session
            </h3>
            <button className="close" onClick={() => setFormVisible(false)}>
              ×
            </button>
          </div>

          <form onSubmit={handleCreateSession}>
            <div className="form-group">
              <label htmlFor="sessionName">
                <span>🏷️</span> Session Name
              </label>
              <input
                type="text"
                id="sessionName"
                className="form-control"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g., MyProject, WorkSession, PersonalDev"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="projectPaths">
                <span>📁</span> Project Paths (one per line)
              </label>
              <textarea
                id="projectPaths"
                className="form-control"
                value={projectPaths}
                onChange={(e) => setProjectPaths(e.target.value)}
                rows={5}
                placeholder="/path/to/project1&#10;/path/to/project2&#10;~/Documents/my-app"
                required
                style={{ minHeight: '120px', resize: 'vertical' }}
              ></textarea>
              <p className="help-text">
                Add absolute paths to your project directories. Each path should be on a new line.
              </p>
            </div>

            <div className="modal-footer">
              <button 
                type="button" 
                className="btn" 
                onClick={() => setFormVisible(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={loading}
              >
                {loading && <div className="loading-spinner"></div>}
                <span>✨</span> {loading ? 'Creating...' : 'Create Session'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <div className={`modal ${deleteConfirmation.visible ? 'active' : ''}`}>
        <div className="modal-content">
          <div className="modal-header">
            <h3 className="text-gradient">
              <span>🗑️</span> Confirm Delete
            </h3>
            <button className="close" onClick={cancelDelete}>
              ×
            </button>
          </div>

          <div style={{ padding: 'var(--space-lg) 0' }}>
            <p style={{ marginBottom: 'var(--space-md)', fontSize: 'var(--text-lg)' }}>
              Are you sure you want to delete session <strong>"{deleteConfirmation.sessionName}"</strong>?
            </p>
            <p className="help-text">
              This action cannot be undone. All session data will be permanently removed.
            </p>
          </div>

          <div className="modal-footer">
            <button 
              type="button" 
              className="btn" 
              onClick={cancelDelete}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn btn-danger" 
              onClick={confirmDelete}
              disabled={loading}
            >
              {loading && <div className="loading-spinner"></div>}
              <span>🗑️</span> {loading ? 'Deleting...' : 'Delete Session'}
            </button>
          </div>
        </div>
      </div>

      {/* Notification */}
      {notification.message && (
        <div className={`notification ${notification.type || 'info'}`}>
          {notification.message}
        </div>
      )}
    </div>
  );
}

export default App; 