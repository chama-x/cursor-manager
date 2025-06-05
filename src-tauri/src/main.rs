// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use cursor_manager::Config;
use cursor_manager::commands::*;
use std::sync::Mutex;
use tauri_plugin_shell::ShellExt;

#[tokio::main]
async fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_shell::init())
        .setup(|app| {
            // Initialize shell plugin if needed
            let _shell = app.shell();
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
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
