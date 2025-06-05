use tauri::State;
use std::sync::Mutex;
use crate::Config;

#[tauri::command]
pub fn get_config(config_state: State<'_, Config>) -> Config {
    config_state.inner().clone()
}

#[tauri::command]
#[allow(non_snake_case)]
pub fn update_config(newConfig: Config, config_state: State<'_, Mutex<Config>>) -> Result<Config, String> {
    let mut config = config_state.lock().map_err(|e| e.to_string())?;
    *config = newConfig.clone();
    Ok(newConfig)
} 