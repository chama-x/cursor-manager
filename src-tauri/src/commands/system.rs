use crate::{SystemStats, RunningApp, MCPServer};
use std::collections::HashMap;
use chrono::Local;
use rand;
use crate::ElectronApp;
use std::fs;
use std::path::Path;

// Fallback system stats since we can't use real monitoring in this context
#[tauri::command]
#[allow(non_snake_case)]
pub async fn get_system_stats() -> Result<SystemStats, String> {
    println!("[DEBUG] get_system_stats called");
    
    // Create fallback system stats
    let total_memory = 16384; // 16GB in MB
    let used_memory = (total_memory as f32 * (0.4 + rand::random::<f32>() * 0.3)) as u64; // 40-70% usage
    let cpu_usage = 10.0 + rand::random::<f32>() * 30.0; // 10-40% CPU usage
    
    let stats = SystemStats {
        cpu_usage,
        memory_total: total_memory,
        memory_used: used_memory,
        active_sessions: 2,
        running_processes: 120 + (rand::random::<f32>() * 50.0) as u32,
        network_interfaces: vec!["en0".to_string(), "lo0".to_string()],
        disk_usage: {
            let mut map = HashMap::new();
            map.insert("/".to_string(), 75);
            map.insert("/home".to_string(), 60);
            map
        },
    };
    
    println!("[DEBUG] Returning system stats: {:?}", stats);
    Ok(stats)
}

#[tauri::command]
#[allow(non_snake_case)]
pub async fn get_running_apps() -> Result<Vec<RunningApp>, String> {
    println!("[DEBUG] get_running_apps called");
    
    // Create fallback running apps data
    let apps = vec![
        RunningApp {
            id: "app-cursor-1".to_string(),
            name: "Cursor IDE".to_string(),
            pid: 12345,
            cpu_usage: 8.5,
            memory_usage: 512,
            start_time: Local::now() - chrono::Duration::hours(2),
            status: "active".to_string(),
        },
        RunningApp {
            id: "app-vscode-1".to_string(),
            name: "VS Code".to_string(),
            pid: 23456,
            cpu_usage: 5.2,
            memory_usage: 320,
            start_time: Local::now() - chrono::Duration::hours(1),
            status: "active".to_string(),
        },
        RunningApp {
            id: "app-node-1".to_string(),
            name: "Node.js Server".to_string(),
            pid: 34567,
            cpu_usage: 2.1,
            memory_usage: 128,
            start_time: Local::now() - chrono::Duration::minutes(30),
            status: "active".to_string(),
        },
    ];
    
    println!("[DEBUG] Returning {} running apps", apps.len());
    Ok(apps)
}

#[tauri::command]
#[allow(non_snake_case)]
pub async fn get_mcp_servers() -> Result<Vec<MCPServer>, String> {
    println!("[DEBUG] get_mcp_servers called");
    
    // Create fallback MCP servers data
    let servers = vec![
        MCPServer {
            id: "mcp-filesystem".to_string(),
            name: "File System MCP".to_string(),
            port: Some(3001),
            status: "online".to_string(),
            response_time: Some(45),
            server_type: "filesystem".to_string(),
            last_ping: Some(Local::now()),
        },
        MCPServer {
            id: "mcp-database".to_string(),
            name: "Database MCP".to_string(),
            port: Some(3002),
            status: "offline".to_string(),
            response_time: None,
            server_type: "database".to_string(),
            last_ping: Some(Local::now() - chrono::Duration::minutes(5)),
        },
        MCPServer {
            id: "mcp-github".to_string(),
            name: "GitHub MCP".to_string(),
            port: Some(3003),
            status: "online".to_string(),
            response_time: Some(120),
            server_type: "api".to_string(),
            last_ping: Some(Local::now()),
        },
        MCPServer {
            id: "mcp-terminal".to_string(),
            name: "Terminal MCP".to_string(),
            port: Some(3004),
            status: "reconnecting".to_string(),
            response_time: None,
            server_type: "tool".to_string(),
            last_ping: Some(Local::now() - chrono::Duration::minutes(1)),
        },
    ];
    
    println!("[DEBUG] Returning {} MCP servers", servers.len());
    Ok(servers)
} 

#[tauri::command]
pub async fn list_electron_apps() -> Result<Vec<ElectronApp>, String> {
    let mut apps = Vec::new();
    #[cfg(target_os = "macos")]
    {
        let applications_dir = "/Applications";
        if let Ok(entries) = fs::read_dir(applications_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if path.extension().map(|e| e == "app").unwrap_or(false) {
                    // Check for Electron signature
                    let electron_asar = path.join("Contents/Resources/electron.asar");
                    let info_plist = path.join("Contents/Info.plist");
                    if electron_asar.exists() || (info_plist.exists() && fs::read_to_string(&info_plist).map_or(false, |c| c.contains("Electron"))) {
                        let name = path.file_stem().unwrap_or_default().to_string_lossy().to_string();
                        let exec_path = path.join("Contents/MacOS/").join(&name);
                        let icon_path = path.join("Contents/Resources/AppIcon.icns");
                        apps.push(ElectronApp {
                            name,
                            exec_path: exec_path.to_string_lossy().to_string(),
                            icon_path: if icon_path.exists() { Some(icon_path.to_string_lossy().to_string()) } else { None },
                        });
                    }
                }
            }
        }
    }
    #[cfg(target_os = "windows")]
    {
        // TODO: Implement Windows Electron app discovery
    }
    #[cfg(target_os = "linux")]
    {
        // TODO: Implement Linux Electron app discovery
    }
    Ok(apps)
} 