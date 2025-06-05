use tauri::{Runtime, State};
use crate::{Config, CursorManager};

#[tauri::command]
pub async fn spoof_mac_cmd<R: Runtime>(app: tauri::AppHandle<R>, config_state: State<'_, Config>, interface: Option<String>) -> Result<String, String> {
    let manager = CursorManager::new(Some(config_state.inner().clone()));
    manager.spoof_mac(&app, interface).await.map_err(|e| e.to_string())
}

#[tauri::command]
pub fn random_mac(config_state: State<'_, Config>) -> String {
    let manager = CursorManager::new(Some(config_state.inner().clone()));
    manager.random_mac()
} 