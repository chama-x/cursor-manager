use tauri::{Runtime, State};
use crate::{Config, CursorManager, SessionInfo, ElectronApp};

#[tauri::command]
pub fn list_sessions(config_state: State<'_, Config>) -> Result<Vec<SessionInfo>, String> {
    let manager = CursorManager::new(Some(config_state.inner().clone()));
    manager.list_sessions().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn create_session(config_state: State<'_, Config>, name: &str, electron_app: ElectronApp) -> Result<String, String> {
    let manager = CursorManager::new(Some(config_state.inner().clone()));
    manager.create_session(name, electron_app).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_session(config_state: State<'_, Config>, session: &str) -> Result<String, String> {
    let manager = CursorManager::new(Some(config_state.inner().clone()));
    manager.delete_session(session).map_err(|e| e.to_string())
}

#[tauri::command]
#[allow(non_snake_case)]
pub async fn launch_session_cmd<R: Runtime>(app: tauri::AppHandle<R>, config_state: State<'_, Config>, session: &str, spoofMac: bool, connectVpn: bool) -> Result<String, String> {
    let manager = CursorManager::new(Some(config_state.inner().clone()));
    manager.launch_session(&app, session, spoofMac, connectVpn).await.map_err(|e| e.to_string())
} 