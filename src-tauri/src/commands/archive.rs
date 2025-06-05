use tauri::State;
use crate::{Config, CursorManager, ArchiveInfo};

#[tauri::command]
pub fn list_archives(config_state: State<'_, Config>) -> Result<Vec<ArchiveInfo>, String> {
    let manager = CursorManager::new(Some(config_state.inner().clone()));
    manager.list_archives().map_err(|e| e.to_string())
}

#[tauri::command]
pub fn archive_session(config_state: State<'_, Config>, session: &str) -> Result<String, String> {
    let manager = CursorManager::new(Some(config_state.inner().clone()));
    manager.archive_session(session).map_err(|e| e.to_string())
}

#[tauri::command]
#[allow(non_snake_case)]
pub fn restore_archive(config_state: State<'_, Config>, archive: &str, newSessionName: Option<&str>) -> Result<String, String> {
    let manager = CursorManager::new(Some(config_state.inner().clone()));
    manager.restore_archive(archive, newSessionName).map_err(|e| e.to_string())
}

#[tauri::command]
pub fn delete_archive(config_state: State<'_, Config>, archive: &str) -> Result<String, String> {
    let manager = CursorManager::new(Some(config_state.inner().clone()));
    manager.delete_archive(archive).map_err(|e| e.to_string())
} 