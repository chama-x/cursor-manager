import { invoke } from '@tauri-apps/api/core';

export interface Config {
  cursor_app: string;
  profile_base: string;
  archive_base: string;
  workspace_base: string;
  network_interface: string;
}

export interface SessionInfo {
  name: string;
  path: string;
  created: string;
  electron_app: ElectronApp;
}

export interface ArchiveInfo {
  name: string;
  path: string;
  created: string;
  original_session: string;
}

export interface CursorSession {
  id: string;
  name: string;
  created_date: string;
  modified_date: string;
  projects: string[];
  electron_app: ElectronApp;
}

export interface ElectronApp {
  name: string;
  exec_path: string;
  icon_path?: string | null;
}

// Helper function to add timeout to any promise
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) => 
      setTimeout(() => reject(new Error(`${operation} timed out after ${timeoutMs}ms`)), timeoutMs)
    )
  ]);
}

export async function getConfig(): Promise<Config> {
  try {
    return await invoke<Config>('get_config');
  } catch (error) {
    console.error('Error fetching config:', error);
    throw error;
  }
}

export async function updateConfig(config: Config): Promise<Config> {
  try {
    return await invoke<Config>('update_config', { newConfig: config });
  } catch (error) {
    console.error('Error updating config:', error);
    throw error;
  }
}

export async function listSessions(): Promise<SessionInfo[]> {
  try {
    return await invoke<SessionInfo[]>('list_sessions');
  } catch (error) {
    console.error('Error listing sessions:', error);
    return [];
  }
}

export async function listArchives(): Promise<ArchiveInfo[]> {
  try {
    return await invoke<ArchiveInfo[]>('list_archives');
  } catch (error) {
    console.error('Error listing archives:', error);
    return [];
  }
}

export async function createSession(name: string): Promise<string> {
  try {
    return await invoke<string>('create_session', { name });
  } catch (error) {
    console.error('Error creating session:', error);
    throw error;
  }
}

export async function launchSession(session: CursorSession, spoofMac: boolean = false, connectVpn: boolean = false): Promise<string> {
  console.log(`[API] launchSession called for: ${session.name}`, { spoofMac, connectVpn });
  try {
    // Add timeout protection - 60 seconds for session launch (including MAC spoofing)
    const timeoutMs = spoofMac ? 60000 : 30000; // Longer timeout if MAC spoofing is enabled
    const result = await withTimeout(
      invoke<string>('launch_session_cmd', { 
      session: session.name, 
        spoofMac: spoofMac, 
        connectVpn: connectVpn 
      }),
      timeoutMs,
      `Session launch${spoofMac ? ' with MAC spoofing' : ''}`
    );
    console.log(`[API] launchSession result:`, result);
    return result;
  } catch (error) {
    console.error(`[API] Error launching session:`, error);
    throw error;
  }
}

export async function spoofMac(interfaceName?: string): Promise<string> {
  console.log(`[API] spoofMac called with interface:`, interfaceName);
  try {
    // Add timeout protection - 30 seconds for MAC spoofing
    const result = await withTimeout(
      invoke<string>('spoof_mac_cmd', { 
      interface: interfaceName 
      }),
      30000,
      'MAC address spoofing'
    );
    console.log(`[API] spoofMac result:`, result);
    return result;
  } catch (error) {
    console.error(`[API] Error spoofing MAC address:`, error);
    throw error;
  }
}

export async function archiveSession(session: string): Promise<string> {
  try {
    return await invoke<string>('archive_session', { session });
  } catch (error) {
    console.error('Error archiving session:', error);
    throw error;
  }
}

export async function restoreArchive(archive: string, newSessionName?: string): Promise<string> {
  try {
    return await invoke<string>('restore_archive', { 
      archive, 
      newSessionName: newSessionName 
    });
  } catch (error) {
    console.error('Error restoring archive:', error);
    throw error;
  }
}

export async function deleteSession(session: string): Promise<string> {
  try {
    return await invoke<string>('delete_session', { session });
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  }
}

export async function deleteArchive(archive: string): Promise<string> {
  try {
    return await invoke<string>('delete_archive', { archive });
  } catch (error) {
    console.error('Error deleting archive:', error);
    throw error;
  }
}

export async function randomMac(): Promise<string> {
  try {
    return await invoke<string>('random_mac');
  } catch (error) {
    console.error('Error generating random MAC:', error);
    throw error;
  }
}

export async function getSessions(): Promise<CursorSession[]> {
  console.log(`[API] getSessions called`);
  try {
    const sessions = await invoke<SessionInfo[]>('list_sessions');
    console.log(`[API] Raw sessions from backend:`, sessions);
    const mappedSessions = sessions.map(session => ({
      id: session.name,
      name: session.name,
      created_date: session.created,
      modified_date: session.created,
      projects: [],
      electron_app: session.electron_app,
    }));
    console.log(`[API] Mapped sessions:`, mappedSessions);
    return mappedSessions;
  } catch (error) {
    console.error(`[API] Error fetching sessions:`, error);
    return [];
  }
}

export async function saveSession(name: string, projects: string[], electron_app: ElectronApp): Promise<CursorSession | null> {
  try {
    await invoke<string>('create_session', { name, electron_app });
    return {
      id: name,
      name,
      created_date: new Date().toISOString(),
      modified_date: new Date().toISOString(),
      projects,
      electron_app,
    };
  } catch (error) {
    console.error('Error saving session:', error);
    return null;
  }
}

export async function deleteSessionById(id: string): Promise<boolean> {
  console.log(`[API] deleteSessionById called for: ${id}`);
  try {
    // Add timeout protection - 10 seconds for session deletion
    const result = await withTimeout(
      invoke<string>('delete_session', { session: id }),
      10000,
      'Session deletion'
    );
    console.log(`[API] deleteSessionById result:`, result);
    return true;
  } catch (error) {
    console.error(`[API] Error deleting session:`, error);
    return false;
  }
}

export async function openProjects(projects: string[]): Promise<boolean> {
  try {
    await invoke<void>('open_projects', { projects });
    return true;
  } catch (error) {
    console.error('Error opening projects:', error);
    return false;
  }
} 

export async function listElectronApps(): Promise<ElectronApp[]> {
  try {
    return await invoke<ElectronApp[]>('list_electron_apps');
  } catch (error) {
    console.error('Error listing Electron apps:', error);
    return [];
  }
} 