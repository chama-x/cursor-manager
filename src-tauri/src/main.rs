// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use cursor_manager::Config;
use cursor_manager::commands::*;
use std::sync::Mutex;
use tauri_plugin_shell::ShellExt;
use tracing_subscriber;

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    // Initialize logging
    tracing_subscriber::fmt()
        .with_env_filter(tracing_subscriber::EnvFilter::from_default_env())
        .init();

    tracing::info!("Starting Cursor Session Manager");

    let result = tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Initialize shell plugin with error handling
            let _shell = app.shell();
            tracing::info!("Tauri application setup completed successfully");
            Ok(())
        })
        .manage(Config::default())
        .manage(Mutex::new(Config::default())) // For mutable state
        .invoke_handler(tauri::generate_handler![
            // Config commands
            get_config,
            update_config,
            
            // Session commands
            list_sessions,
            create_session,
            delete_session,
            launch_session_cmd,
            
            // Archive commands
            list_archives,
            archive_session,
            restore_archive,
            delete_archive,
            
            // MAC address commands
            spoof_mac_cmd,
            random_mac,
            
            // System monitoring commands
            get_system_stats,
            get_running_apps,
            get_mcp_servers,
            list_electron_apps,
        ])
        .run(tauri::generate_context!());

    match result {
        Ok(_) => {
            tracing::info!("Application closed successfully");
            Ok(())
        }
        Err(e) => {
            tracing::error!("Application error: {}", e);
            Err(e.into())
        }
    }
}
