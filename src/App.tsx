import React from 'react';
import { useState, useEffect } from 'react';
import { 
  CursorSession, 
  getSessions, 
  saveSession, 
  deleteSessionById,
  openProjects, 
  launchSession,
  ElectronApp,
  listElectronApps
} from './api';
import { 
  Monitor, 
  Settings, 
  Plus, 
  Rocket, 
  Trash2, 
  FolderOpen, 
  Calendar,
  X,
  Sparkles,
  Server,
  Globe,
  Circle,
  Activity,
  Database,
  Cloud,
  Terminal,
  Cpu,
  Network,
  StopCircle,
  RotateCcw,
  MemoryStick,
  Gauge
} from 'lucide-react';
import { systemMonitor, RunningApp, MCPServer, SystemStats } from './services/systemMonitor';
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

  // Real monitoring data
  const [runningApps, setRunningApps] = useState<RunningApp[]>([]);
  const [mcpServers, setMcpServers] = useState<MCPServer[]>([]);
  const [systemStats, setSystemStats] = useState<SystemStats>({
    totalMemory: 0,
    usedMemory: 0,
    cpuUsage: 0,
    activeConnections: 0
  });
  const [monitoringError, setMonitoringError] = useState<string>('');

  // Mock time tracking data
  const [sessionUsageData] = useState<Record<string, { totalMinutes: number; weeklyData: number[] }>>({
    'personal': { totalMinutes: 1247, weeklyData: [45, 67, 23, 89, 56, 78, 34] },
    'CHAMATH': { totalMinutes: 234, weeklyData: [12, 23, 8, 34, 18, 28, 11] },
    'work': { totalMinutes: 2156, weeklyData: [78, 89, 67, 123, 89, 98, 45] },
    'CHX': { totalMinutes: 89, weeklyData: [5, 8, 3, 12, 7, 9, 4] }
  });

  // Electron app selection state
  const [availableApps, setAvailableApps] = useState<ElectronApp[]>([]);
  const [selectedApp, setSelectedApp] = useState<ElectronApp | null>(null);

  // Initialize system monitoring
  useEffect(() => {
    const initializeMonitoring = async () => {
      try {
        console.log('[App] Initializing system monitoring...');
        await systemMonitor.startMonitoring();
        
        // Set up periodic data refresh
        const refreshInterval = setInterval(() => {
          setRunningApps(systemMonitor.getRunningApps());
          setMcpServers(systemMonitor.getMCPServers());
          setSystemStats(systemMonitor.getSystemStats());
        }, 2000);

        // Initial data load
        setRunningApps(systemMonitor.getRunningApps());
        setMcpServers(systemMonitor.getMCPServers());
        setSystemStats(systemMonitor.getSystemStats());

        return () => {
          clearInterval(refreshInterval);
          systemMonitor.stopMonitoring();
        };
      } catch (error) {
        console.error('[App] Error initializing monitoring:', error);
        setMonitoringError('Failed to initialize system monitoring');
      }
    };

    initializeMonitoring();
  }, []);

  // Disable context menu and keyboard shortcuts
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
      return false;
    };

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

    const handleSelectStart = (e: Event) => {
      const target = e.target as HTMLElement;
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

  const calculateGridSize = (sessionId: string) => {
    const usage = sessionUsageData[sessionId];
    if (!usage) return 'normal';
    
    const totalMinutes = usage.totalMinutes;
    if (totalMinutes > 1500) return 'large';
    if (totalMinutes > 600) return 'normal';
    return 'small';
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

  // Load Electron apps when form is shown
  useEffect(() => {
    if (formVisible) {
      listElectronApps().then(setAvailableApps);
    }
  }, [formVisible]);

  const handleCreateSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionName.trim()) {
      showNotification('Please enter a session name', 'error');
      return;
    }
    if (!selectedApp) {
      showNotification('Please select an Electron app', 'error');
      return;
    }

    const projects = projectPaths.trim()
      ? projectPaths.split('\n').map((path: string) => path.trim()).filter(Boolean)
      : [];

    if (projects.length === 0) {
      showNotification('Please add at least one project path', 'error');
      return;
    }

    setLoading(true);
    setCurrentStatus('Creating new session...');
    
    try {
      const result = await saveSession(sessionName, projects, selectedApp);
      if (result) {
        showNotification('Session created successfully!', 'success');
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
        setCurrentStatus('Spoofing MAC address... (this may take up to 60 seconds)');
      } else {
        setCurrentStatus('Launching Cursor session...');
      }
      
      const launchResult = await launchSession(session, spoofMacAddress, false);
      console.log(`[DEBUG] Launch result:`, launchResult);
      
      setCurrentStatus('Session launched successfully!');
      showNotification(`Session launched: ${session.name}`, 'success');
      
      if (session.projects.length > 0) {
        setCurrentStatus('Opening projects...');
        console.log(`[DEBUG] Opening ${session.projects.length} projects`);
        await openProjects(session.projects);
        console.log(`[DEBUG] Projects opened successfully`);
        setCurrentStatus('Projects opened successfully!');
      } else {
        console.log(`[DEBUG] No projects to open for this session`);
      }
    } catch (error) {
      console.error(`[ERROR] Failed to launch session:`, error);
      setCurrentStatus('Launch failed!');
      
      let errorMessage = 'Failed to launch session';
      const errorStr = String(error);
      
      if (errorStr.includes('timed out')) {
        errorMessage = 'Operation timed out. Please check your network connection and permissions.';
      } else if (errorStr.includes('sudo access')) {
        errorMessage = 'MAC spoofing requires admin access. Please check the settings tab for setup instructions.';
      } else if (errorStr.includes('Session directory not found')) {
        errorMessage = 'Session directory not found. Please try creating the session again.';
      } else {
        errorMessage = `Failed to launch session: ${error}`;
      }
      
      showNotification(errorMessage, 'error');
    } finally {
      setLoading(false);
      setTimeout(() => setCurrentStatus(''), 5000);
    }
  };

  const handleDeleteSession = async (sessionId: string, sessionName: string) => {
    console.log(`[DEBUG] handleDeleteSession called for: ${sessionId}`);
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
    setCurrentStatus(`Deleting session: ${sessionName}...`);
    
    try {
      console.log(`[DEBUG] Calling deleteSessionById for: ${sessionId}`);
      const result = await deleteSessionById(sessionId);
      console.log(`[DEBUG] Delete result:`, result);
      
      if (result) {
        showNotification(`Session "${sessionName}" deleted successfully!`, 'success');
        setCurrentStatus('Session deleted successfully!');
        await loadSessions();
      } else {
        throw new Error('Delete operation returned false');
      }
    } catch (error) {
      console.error(`[ERROR] Failed to delete session:`, error);
      showNotification(`Failed to delete session: ${error}`, 'error');
      setCurrentStatus('Failed to delete session');
    } finally {
      setLoading(false);
      setTimeout(() => setCurrentStatus(''), 3000);
    }
  };

  const cancelDelete = () => {
    console.log(`[DEBUG] Delete cancelled by user`);
    setDeleteConfirmation({ visible: false, sessionId: '', sessionName: '' });
  };

  // Control functions for apps and servers
  const handleStopApp = async (appId: string) => {
    try {
      const success = await systemMonitor.stopApp(appId);
      if (success) {
        showNotification('Application stopped successfully', 'success');
        // Update the UI immediately
        setRunningApps(prev => prev.filter((app: RunningApp) => app.id !== appId));
      } else {
        showNotification('Failed to stop application', 'error');
      }
    } catch (error) {
      console.error('Error stopping app:', error);
      showNotification('Error stopping application', 'error');
    }
  };

  const handleRestartMCPServer = async (serverId: string) => {
    try {
      const success = await systemMonitor.restartMCPServer(serverId);
      if (success) {
        showNotification('MCP Server restart initiated', 'success');
        // Update server status to show reconnecting
        setMcpServers(prev => prev.map((server: MCPServer) => 
          server.id === serverId 
            ? { ...server, status: 'reconnecting' as const }
            : server
        ));
      } else {
        showNotification('Failed to restart MCP server', 'error');
      }
    } catch (error) {
      console.error('Error restarting MCP server:', error);
      showNotification('Error restarting MCP server', 'error');
    }
  };

  const handleRefreshMCPServer = async (serverId: string) => {
    try {
      showNotification('Refreshing MCP server status...', 'success');
      console.log(`[App] Refreshing MCP server: ${serverId}`);
      // Force refresh of system monitoring data
      await systemMonitor.refreshData();
      setMcpServers(systemMonitor.getMCPServers());
    } catch (error) {
      console.error('Error refreshing MCP server:', error);
      showNotification('Error refreshing MCP server', 'error');
    }
  };

  const handleStopMCPServer = async (serverId: string) => {
    try {
      const success = await systemMonitor.stopMCPServer(serverId);
      if (success) {
        showNotification('MCP Server stopped successfully', 'success');
        // Update server status to offline
        setMcpServers(prev => prev.map((server: MCPServer) => 
          server.id === serverId 
            ? { ...server, status: 'offline' as const }
            : server
        ));
      } else {
        showNotification('Failed to stop MCP server', 'error');
      }
    } catch (error) {
      console.error('Error stopping MCP server:', error);
      showNotification('Error stopping MCP server', 'error');
    }
  };

  const handleRefreshApp = async (appId: string) => {
    try {
      showNotification('Refreshing application status...', 'success');
      console.log(`[App] Refreshing application: ${appId}`);
      // Force refresh of system monitoring data
      await systemMonitor.refreshData();
      setRunningApps(systemMonitor.getRunningApps());
    } catch (error) {
      console.error('Error refreshing app:', error);
      showNotification('Error refreshing application', 'error');
    }
  };

  const handleRestartApp = async (appId: string) => {
    try {
      const success = await systemMonitor.restartApp(appId);
      if (success) {
        showNotification('Application restart initiated', 'success');
        // Update app status to show starting
        setRunningApps(prev => prev.map((app: RunningApp) => 
          app.id === appId 
            ? { ...app, status: 'active' as const }
            : app
        ));
      } else {
        showNotification('Failed to restart application', 'error');
      }
    } catch (error) {
      console.error('Error restarting app:', error);
      showNotification('Error restarting application', 'error');
    }
  };

  const showNotification = (message: string, type: string) => {
    setNotification({ message, type });
    setTimeout(() => {
      setNotification({ message: '', type: '' });
    }, 5000);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'active':
        return <Circle className="status-icon online" size={8} />;
      case 'offline':
        return <Circle className="status-icon offline" size={8} />;
      case 'reconnecting':
      case 'idle':
        return <Circle className="status-icon idle" size={8} />;
      case 'error':
        return <Circle className="status-icon error" size={8} />;
      default:
        return <Circle className="status-icon offline" size={8} />;
    }
  };

  const getAppTypeIcon = (type: string) => {
    switch (type) {
      case 'web':
        return <Globe size={14} />;
      case 'api':
        return <Server size={14} />;
      case 'database':
        return <Database size={14} />;
      default:
        return <Terminal size={14} />;
    }
  };

  const getMCPTypeIcon = (type: string) => {
    switch (type) {
      case 'filesystem':
        return <FolderOpen size={14} />;
      case 'database':
        return <Database size={14} />;
      case 'api':
        return <Cloud size={14} />;
      case 'tool':
        return <Terminal size={14} />;
      default:
        return <Cpu size={14} />;
    }
  };

  return (
    <div className="app-container">
      <div className="window-frame">
        <header className="compact-header">
          <div className="header-content">
            <div className="header-text">
              <div className="header-logo-section">
                <img src="/logo.svg" alt="Cursor Session Manager" className="header-logo" />
                <div className="header-titles">
        <h1>Cursor Session Manager</h1>
                  <p>Manage your Cursor IDE sessions with style and efficiency</p>
                </div>
              </div>
            </div>
            <nav className="header-nav">
        <button
                className={`nav-button ${activeTab === 'sessions' ? 'active' : ''}`}
          onClick={() => setActiveTab('sessions')}
        >
                <Monitor size={16} /> Sessions
        </button>
        <button
                className={`nav-button ${activeTab === 'settings' ? 'active' : ''}`}
          onClick={() => setActiveTab('settings')}
        >
                <Settings size={16} /> Settings
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
                  <Plus size={16} /> New Session
          </button>
        </div>

              {currentStatus && (
                <div className="status-display">
                  <Activity size={16} />
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
                      <Monitor size={48} className="empty-icon" />
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
                                  <div className="session-icon">
                                    <Monitor size={20} />
                                  </div>
                                  <h4 className="session-name">{session.name}</h4>
                                </div>
                                <div className="session-details">
                                  <div className="session-stat">
                                    <FolderOpen size={14} />
                                    <span>Projects: {session.projects.length}</span>
                                  </div>
                                  <div className="session-stat">
                                    <Calendar size={14} />
                                    <span>Created: {formatDate(session.created_date)}</span>
                                  </div>
                                </div>
                                <div className="session-actions">
                      <button
                                    className="btn-launch"
                        onClick={() => handleLaunchSession(session)}
                                    disabled={loading}
                                    title="Launch Session"
                      >
                                    {loading && <div className="loading-spinner-small"></div>}
                                    <Rocket size={16} />
                        Launch
                      </button>
                      <button
                                    className="btn-delete"
                                    onClick={() => handleDeleteSession(session.id, session.name)}
                                    disabled={loading}
                                    title="Delete Session"
                                  >
                                    <Trash2 size={14} />
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
                <Settings size={20} /> Settings
              </h3>
        
        <div className="form-group">
                <label className="flex items-center">
            <input
              type="checkbox"
              checked={spoofMacAddress}
              onChange={(e) => setSpoofMacAddress(e.target.checked)}
            />
                  <Network size={16} />
                  <span>Spoof MAC address when launching sessions</span>
          </label>
          <p className="help-text">
            This will change your device's MAC address each time you launch a session, 
            helping to avoid detection of multiple Cursor instances.
          </p>
        </div>
        
              {spoofMacAddress && (
                <div className="safety-warning">
                  <div className="safety-warning-content">
                    <h4>⚠️ Critical Security Setup Required</h4>
                    <p>
                      <strong>MAC spoofing requires elevated system privileges and can affect your network security.</strong> 
                      Please read all warnings carefully before proceeding.
                    </p>
                    
                    <ul className="warning-list">
                      <li>This feature modifies your network interface configuration</li>
                      <li>Requires administrator/sudo access to your system</li>
                      <li>May temporarily disconnect your internet connection</li>
                      <li>Could interfere with VPN or security software</li>
                      <li>Should only be used on personal development machines</li>
                      <li>Corporate or shared computers should NOT use this feature</li>
                    </ul>

                    <div style={{ marginTop: 'var(--space-lg)' }}>
                      <h5>🍎 macOS Setup Instructions:</h5>
                      <div className="code-block">
                        <code>sudo visudo</code>
                      </div>
                      <p>Add this line at the end of the sudoers file:</p>
                      <div className="code-block">
                        <code>%admin ALL=(ALL) NOPASSWD: /usr/sbin/networksetup, /sbin/ifconfig</code>
                      </div>
                      <p className="help-text">
                        <strong>⚠️ Security Note:</strong> This allows passwordless execution of network commands for admin users.
                      </p>
                    </div>

                    <div style={{ marginTop: 'var(--space-lg)' }}>
                      <h5>🪟 Windows Setup Instructions:</h5>
                      <p>Run Command Prompt as Administrator and execute these commands:</p>
                      <div className="code-block">
                        <code>netsh interface show interface</code>
                      </div>
                      <p>Note your Wi-Fi interface name, then run:</p>
                      <div className="code-block">
                        <code>netsh interface set interface "Wi-Fi" admin=disable</code>
                      </div>
                      <div className="code-block">
                        <code>reg add "HKEY_LOCAL_MACHINE\SYSTEM\CurrentControlSet\Control\Class\{'{4d36e972-e325-11ce-bfc1-08002be10318}'}\0001" /v NetworkAddress /t REG_SZ /d "NEW_MAC_ADDRESS" /f</code>
                      </div>
                      <div className="code-block">
                        <code>netsh interface set interface "Wi-Fi" admin=enable</code>
                      </div>
                      <p className="help-text">
                        <strong>⚠️ Security Note:</strong> Modifying the Windows Registry can affect system stability.
                      </p>
                    </div>
                    
                    <div className="error-state" style={{ marginTop: 'var(--space-xl)' }}>
                      <div className="error-state-icon">
                        <X size={24} />
                      </div>
                      <div className="error-state-content">
                        <h4>⛔ Do NOT Use MAC Spoofing If:</h4>
                        <ul className="warning-list">
                          <li>You're on a corporate or work computer</li>
                          <li>You're using a shared or public machine</li>
                          <li>You don't understand networking implications</li>
                          <li>Your organization has policies against network modifications</li>
                          <li>You're connected to monitored or managed networks</li>
                        </ul>
                        <div className="error-state-actions">
                          <button 
                            className="btn secondary"
                            onClick={() => setSpoofMacAddress(false)}
                          >
                            <X size={16} />
                            Disable MAC Spoofing
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="safety-warning" style={{ marginTop: 'var(--space-xl)' }}>
                <div className="safety-warning-content">
                  <h4>🔒 Privacy & Security Information</h4>
                  <p>
                    This application helps manage multiple Cursor IDE instances by creating isolated profiles.
                    Here's what you should know about privacy and security:
                  </p>
                  
                  <ul className="warning-list">
                    <li><strong>Local Data:</strong> All session data is stored locally on your device</li>
                    <li><strong>No Telemetry:</strong> This app doesn't send data to external servers</li>
                    <li><strong>File Access:</strong> The app only accesses directories you specify</li>
                    <li><strong>Network Changes:</strong> MAC spoofing (if enabled) modifies network settings</li>
                    <li><strong>Process Monitoring:</strong> System monitoring tracks running applications for display</li>
                  </ul>
                  
                  <p style={{ marginTop: 'var(--space-md)', fontWeight: 600 }}>
                    🛡️ <strong>Recommendation:</strong> Only use this application on personal development machines
                    where you have full control and administrative access.
                  </p>
                </div>
              </div>

              {monitoringError && (
                <div className="error-state">
                  <div className="error-state-icon">
                    <X size={20} />
                  </div>
                  <div className="error-state-content">
                    <h4>System Monitoring Error</h4>
                    <p>{monitoringError}</p>
                    <div className="error-state-actions">
                      <button 
                        className="btn secondary"
                        onClick={() => setMonitoringError('')}
                      >
                        Dismiss
                      </button>
                      <button 
                        className="btn btn-primary"
                        onClick={() => window.location.reload()}
                      >
                        <RotateCcw size={16} />
                        Restart App
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* System Stats Section */}
              <div className="system-stats-section" style={{ marginTop: 'var(--space-xl)' }}>
                <h4><Gauge size={18} /> System Statistics</h4>
                <div className="stats-grid">
                  <div className="stat-card">
                    <MemoryStick size={16} />
                    <div className="stat-info">
                      <span className="stat-label">Memory Usage</span>
                      <span className="stat-value">{Math.round((systemStats.usedMemory / systemStats.totalMemory) * 100)}%</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <Cpu size={16} />
                    <div className="stat-info">
                      <span className="stat-label">CPU Usage</span>
                      <span className="stat-value">{Math.round(systemStats.cpuUsage)}%</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <Activity size={16} />
                    <div className="stat-info">
                      <span className="stat-label">Active Apps</span>
                      <span className="stat-value">{runningApps.length}</span>
                    </div>
                  </div>
                  <div className="stat-card">
                    <Server size={16} />
                    <div className="stat-info">
                      <span className="stat-label">MCP Servers</span>
                      <span className="stat-value">{mcpServers.filter(s => s.status === 'online').length}/{mcpServers.length}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Two-Row Status Bar */}
        <div className="status-bar-modern">
          {/* First Row - MCP Servers */}
          <div className="status-row">
            <div className="status-section-compact">
              <Server size={14} />
              <span>MCP</span>
              <span className="count">{mcpServers.filter((s: MCPServer) => s.status === 'online').length}/{mcpServers.length}</span>
            </div>
            <div className="status-tiles-section">
              {mcpServers.length === 0 ? (
                <div className="empty-tile-enhanced">
                  <Server size={14} />
                  <span>No Servers</span>
                </div>
              ) : (
                mcpServers.map((server: MCPServer) => (
                  <div key={server.id} className={`server-card ${server.status}`}>
                    <div className="card-main-content">
                      <div className="card-status-indicator">
                        {getStatusIcon(server.status)}
                      </div>
                      <div className="card-icon">
                        {getMCPTypeIcon(server.type)}
                      </div>
                      <div className="card-info">
                        <div className="card-name">{server.name}</div>
                        <div className="card-status">{server.status.toUpperCase()}</div>
                      </div>
                    </div>
                    
                    {/* Detailed Hover Popup */}
                    <div className="card-hover-popup">
                      <div className="popup-header">
                        <div className="popup-title">
                          {getMCPTypeIcon(server.type)}
                          <span>{server.name}</span>
                        </div>
                        <div className={`popup-status ${server.status}`}>
                          {getStatusIcon(server.status)}
                          <span>{server.status.toUpperCase()}</span>
                        </div>
                      </div>
                      
                      <div className="popup-details">
                        <div className="detail-row">
                          <span className="detail-label">Type:</span>
                          <span className="detail-value">{server.type}</span>
                        </div>
                        {server.port && (
                          <div className="detail-row">
                            <span className="detail-label">Port:</span>
                            <span className="detail-value">{server.port}</span>
                          </div>
                        )}
                        {server.endpoint && (
                          <div className="detail-row">
                            <span className="detail-label">Endpoint:</span>
                            <span className="detail-value">{server.endpoint}</span>
                          </div>
                        )}
                        {server.responseTime && (
                          <div className="detail-row">
                            <span className="detail-label">Response Time:</span>
                            <span className="detail-value">{server.responseTime}ms</span>
                          </div>
                        )}
                        <div className="detail-row">
                          <span className="detail-label">Last Active:</span>
                          <span className="detail-value">{server.lastActive}</span>
                        </div>
                      </div>
                      
                      <div className="popup-actions">
                        <button
                          className="popup-action-btn refresh"
                          onClick={() => handleRefreshMCPServer(server.id)}
                          title="Refresh Server"
                        >
                          <RotateCcw size={12} />
                          <span>Refresh</span>
                        </button>
                        {server.status === 'online' ? (
                          <button
                            className="popup-action-btn stop"
                            onClick={() => handleStopMCPServer(server.id)}
                            title="Stop Server"
                          >
                            <StopCircle size={12} />
                            <span>Stop</span>
                          </button>
                        ) : (
                          <button
                            className="popup-action-btn restart"
                            onClick={() => handleRestartMCPServer(server.id)}
                            title="Start Server"
                          >
                            <RotateCcw size={12} />
                            <span>Start</span>
                          </button>
                        )}
                        {server.endpoint && (
                          <button
                            className="popup-action-btn visit"
                            onClick={() => window.open(server.endpoint, '_blank')}
                            title="Visit Endpoint"
                          >
                            <Globe size={12} />
                            <span>Visit</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Second Row - Running Apps */}
          <div className="status-row">
            <div className="status-section-compact">
              <Activity size={14} />
              <span>APPS</span>
              <span className="count">{runningApps.filter((a: RunningApp) => a.status === 'active').length}/{runningApps.length}</span>
            </div>
            <div className="status-tiles-section">
              {runningApps.length === 0 ? (
                <div className="empty-tile-enhanced">
                  <Globe size={14} />
                  <span>No Apps</span>
                </div>
              ) : (
                runningApps.map((app: RunningApp) => (
                  <div key={app.id} className={`server-card ${app.status}`}>
                    <div className="card-main-content">
                      <div className="card-status-indicator">
                        {getStatusIcon(app.status)}
                      </div>
                      <div className="card-icon">
                        {getAppTypeIcon(app.type)}
                      </div>
                      <div className="card-info">
                        <div className="card-name">{app.name}</div>
                        <div className="card-status">{app.status.toUpperCase()}</div>
                      </div>
                    </div>
                    
                    {/* Detailed Hover Popup */}
                    <div className="card-hover-popup">
                      <div className="popup-header">
                        <div className="popup-title">
                          {getAppTypeIcon(app.type)}
                          <span>{app.name}</span>
                        </div>
                        <div className={`popup-status ${app.status}`}>
                          {getStatusIcon(app.status)}
                          <span>{app.status.toUpperCase()}</span>
                        </div>
                      </div>
                      
                      <div className="popup-details">
                        <div className="detail-row">
                          <span className="detail-label">Type:</span>
                          <span className="detail-value">{app.type}</span>
                        </div>
                        {app.port > 0 && (
                          <div className="detail-row">
                            <span className="detail-label">Port:</span>
                            <span className="detail-value">{app.port}</span>
                          </div>
                        )}
                        {app.pid > 0 && (
                          <div className="detail-row">
                            <span className="detail-label">PID:</span>
                            <span className="detail-value">{app.pid}</span>
                          </div>
                        )}
                        <div className="detail-row">
                          <span className="detail-label">Uptime:</span>
                          <span className="detail-value">{app.uptime}</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">Memory:</span>
                          <span className="detail-value">{app.memoryUsage}MB</span>
                        </div>
                        <div className="detail-row">
                          <span className="detail-label">CPU:</span>
                          <span className="detail-value">{app.cpuUsage.toFixed(1)}%</span>
                        </div>
                        {app.responseTime > 0 && (
                          <div className="detail-row">
                            <span className="detail-label">Response Time:</span>
                            <span className="detail-value">{app.responseTime}ms</span>
                          </div>
                        )}
                      </div>
                      
                      <div className="popup-actions">
                        <button
                          className="popup-action-btn refresh"
                          onClick={() => handleRefreshApp(app.id)}
                          title="Refresh App"
                        >
                          <RotateCcw size={12} />
                          <span>Refresh</span>
                        </button>
                        {app.status === 'active' ? (
                          <button
                            className="popup-action-btn stop"
                            onClick={() => handleStopApp(app.id)}
                            title="Stop Application"
                          >
                            <StopCircle size={12} />
                            <span>Stop</span>
                          </button>
                        ) : (
                          <button
                            className="popup-action-btn restart"
                            onClick={() => handleRestartApp(app.id)}
                            title="Start Application"
                          >
                            <RotateCcw size={12} />
                            <span>Start</span>
                          </button>
                        )}
                        {(app.type === 'web' && app.port > 0) && (
                          <button
                            className="popup-action-btn visit"
                            onClick={() => window.open(`http://localhost:${app.port}`, '_blank')}
                            title="Visit Web App"
                          >
                            <Globe size={12} />
                            <span>Visit</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Redesigned Create Session Modal */}
      <div className={`modal ${formVisible ? 'active' : ''}`}>
        <div className="modal-content modern">
          <div className="modal-header modern">
            <div className="modal-title">
              <Sparkles size={20} />
            <h3>Create New Session</h3>
            </div>
            <button className="close modern" onClick={() => setFormVisible(false)}>
              <X size={18} />
            </button>
          </div>

          <form onSubmit={handleCreateSession} className="modern-form">
            <div className="form-group modern">
              <label htmlFor="sessionName" className="modern-label">
                <Monitor size={16} />
                Session Name
              </label>
              <input
                type="text"
                id="sessionName"
                className="form-control modern"
                value={sessionName}
                onChange={(e) => setSessionName(e.target.value)}
                placeholder="e.g., MyProject, WorkSession, PersonalDev"
                required
              />
            </div>

            <div className="form-group modern">
              <label htmlFor="projectPaths" className="modern-label">
                <FolderOpen size={16} />
                Project Paths
              </label>
              <textarea
                id="projectPaths"
                className="form-control modern"
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

            <div className="form-group modern">
              <label htmlFor="selectedApp" className="modern-label">
                <Terminal size={16} />
                Electron App
              </label>
              <select
                id="selectedApp"
                className="form-control modern"
                value={selectedApp?.exec_path || ''}
                onChange={e => setSelectedApp(availableApps.find(app => app.exec_path === e.target.value) || null)}
                required
              >
                <option value="">Select Electron App...</option>
                {availableApps.map(app => (
                  <option key={app.exec_path} value={app.exec_path}>{app.name}</option>
                ))}
              </select>
              <p className="help-text">
                Select the Electron app you want to launch this session with.
              </p>
            </div>

            <div className="modal-footer modern">
              <button 
                type="button" 
                className="btn secondary" 
                onClick={() => setFormVisible(false)}
                disabled={loading}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn primary modern" 
                disabled={loading}
              >
                {loading && <div className="loading-spinner"></div>}
                <Sparkles size={16} />
                {loading ? 'Creating...' : 'Create Session'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Redesigned Delete Confirmation Modal */}
      <div className={`modal ${deleteConfirmation.visible ? 'active' : ''}`}>
        <div className="modal-content modern danger">
          <div className="modal-header modern">
            <div className="modal-title">
              <Trash2 size={20} />
              <h3>Confirm Delete</h3>
            </div>
            <button className="close modern" onClick={cancelDelete}>
              <X size={18} />
            </button>
          </div>

          <div className="modal-body modern">
            <p className="danger-text">
              Are you sure you want to delete session <strong>"{deleteConfirmation.sessionName}"</strong>?
            </p>
            <p className="help-text">
              This action cannot be undone. All session data will be permanently removed.
            </p>
          </div>

          <div className="modal-footer modern">
            <button 
              type="button" 
              className="btn secondary" 
              onClick={cancelDelete}
              disabled={loading}
            >
              Cancel
            </button>
            <button 
              type="button" 
              className="btn danger modern" 
              onClick={confirmDelete}
              disabled={loading}
            >
              {loading && <div className="loading-spinner"></div>}
              <Trash2 size={16} />
              {loading ? 'Deleting...' : 'Delete Session'}
            </button>
          </div>
        </div>
      </div>

      {/* Professional Notification */}
      {notification.message && (
        <div className={`notification ${notification.type || 'info'}`}>
          <div className="notification-content">
            {notification.type === 'success' && <Sparkles size={16} />}
            {notification.type === 'error' && <X size={16} />}
            {notification.type === 'info' && <Activity size={16} />}
            <span>{notification.message}</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 