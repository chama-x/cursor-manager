// Learn more about Tauri commands at https://tauri.app/develop/calling-rust/
use std::fs;
use std::path::{Path, PathBuf};
use tauri::Runtime;
use chrono::Local;
use serde::{Deserialize, Serialize};
use std::error::Error;
use rand::distributions::{Alphanumeric, DistString};
use fs_extra;
use tauri_plugin_shell::ShellExt;

// Module for all command functions
pub mod commands;

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Config {
    cursor_app: String,
    profile_base: String,
    archive_base: String,
    workspace_base: String,
    network_interface: String,
}

impl Default for Config {
    fn default() -> Self {
        let home = dirs::home_dir().unwrap_or_else(|| PathBuf::from("."));
        
        Self {
            cursor_app: "/Applications/Cursor.app/Contents/MacOS/Cursor".to_string(),
            profile_base: home.join("cursor-profiles").to_string_lossy().to_string(),
            archive_base: home.join("cursor-archives").to_string_lossy().to_string(),
            workspace_base: home.join("projects").to_string_lossy().to_string(),
            network_interface: "en0".to_string(),
        }
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct SessionInfo {
    name: String,
    path: String,
    created: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ArchiveInfo {
    name: String,
    path: String,
    created: String,
    original_session: String,
}

pub struct CursorManager {
    config: Config,
}

impl CursorManager {
    pub fn new(config: Option<Config>) -> Self {
        let config = config.unwrap_or_default();
        let profile_dir = Path::new(&config.profile_base);
        let archive_dir = Path::new(&config.archive_base);

        if !profile_dir.exists() {
            let _ = fs::create_dir_all(profile_dir);
        }
        if !archive_dir.exists() {
            let _ = fs::create_dir_all(archive_dir);
        }

        Self { config }
    }

    // Utility functions
    pub fn list_sessions(&self) -> Result<Vec<SessionInfo>, Box<dyn Error>> {
        let profile_dir = Path::new(&self.config.profile_base);
        let mut sessions = Vec::new();

        if !profile_dir.exists() {
            return Ok(sessions);
        }

        for entry in fs::read_dir(profile_dir)? {
            let entry = entry?;
            let path = entry.path();
            
            if path.is_dir() {
                let metadata = fs::metadata(&path)?;
                let created = metadata.created()
                    .map(|_time| {
                        Local::now().date_naive().format("%Y-%m-%d").to_string()
                    })
                    .unwrap_or_else(|_| "Unknown".to_string());
                
                sessions.push(SessionInfo {
                    name: path.file_name().unwrap().to_string_lossy().to_string(),
                    path: path.to_string_lossy().to_string(),
                    created,
                });
            }
        }

        Ok(sessions)
    }

    pub fn list_archives(&self) -> Result<Vec<ArchiveInfo>, Box<dyn Error>> {
        let archive_dir = Path::new(&self.config.archive_base);
        let mut archives = Vec::new();

        if !archive_dir.exists() {
            return Ok(archives);
        }

        for entry in fs::read_dir(archive_dir)? {
            let entry = entry?;
            let path = entry.path();
            
            if path.is_dir() {
                let metadata = fs::metadata(&path)?;
                let created = metadata.created()
                    .map(|_time| {
                        Local::now().date_naive().format("%Y-%m-%d").to_string()
                    })
                    .unwrap_or_else(|_| "Unknown".to_string());
                
                // Try to determine original session name
                let name = path.file_name().unwrap().to_string_lossy();
                let original_session = if let Some(idx) = name.rfind('-') {
                    name[0..idx].to_string()
                } else {
                    "Unknown".to_string()
                };
                
                archives.push(ArchiveInfo {
                    name: name.to_string(),
                    path: path.to_string_lossy().to_string(),
                    created,
                    original_session,
                });
            }
        }

        Ok(archives)
    }

    pub fn random_mac(&self) -> String {
        // Generate a random MAC address with a locally administered address
        let random_part = Alphanumeric.sample_string(&mut rand::thread_rng(), 10);
        format!("02:{:02x}:{:02x}:{:02x}:{:02x}:{:02x}", 
            u8::from(random_part.as_bytes()[0]), 
            u8::from(random_part.as_bytes()[1]),
            u8::from(random_part.as_bytes()[2]),
            u8::from(random_part.as_bytes()[3]),
            u8::from(random_part.as_bytes()[4]))
    }

    pub async fn spoof_mac<R: Runtime>(&self, app: &tauri::AppHandle<R>, interface: Option<String>) -> Result<String, Box<dyn Error>> {
        let iface = interface.unwrap_or(self.config.network_interface.clone());
        let new_mac = self.random_mac();
        
        println!("[DEBUG] Starting MAC spoofing for interface: {}", iface);
        println!("[DEBUG] New MAC address will be: {}", new_mac);
        
        // Check if we can run sudo commands without password prompt
        println!("[DEBUG] Testing sudo access...");
        let sudo_test = app.shell()
            .command("sudo")
            .args(["-n", "echo", "test"])
            .output()
            .await;
            
        match sudo_test {
            Ok(output) => {
                if !output.status.success() {
                    let error_msg = "MAC spoofing requires sudo access. Please run 'sudo visudo' and add: '%admin ALL=(ALL) NOPASSWD: /usr/sbin/networksetup, /sbin/ifconfig'";
                    println!("[ERROR] {}", error_msg);
                    return Err(error_msg.into());
                }
                println!("[DEBUG] Sudo access confirmed");
            }
            Err(e) => {
                let error_msg = format!("Failed to test sudo access: {}", e);
                println!("[ERROR] {}", error_msg);
                return Err(error_msg.into());
            }
        }
        
        // Turn off Wi-Fi with timeout
        println!("[DEBUG] Turning off Wi-Fi for interface: {}", iface);
        let wifi_off_future = app.shell()
            .command("sudo")
            .args(["-n", "networksetup", "-setairportpower", &iface, "off"])
            .output();
            
        let wifi_off_result = tokio::time::timeout(
            tokio::time::Duration::from_secs(10),
            wifi_off_future
        ).await;
            
        match wifi_off_result {
            Ok(Ok(output)) => {
                println!("[DEBUG] Wi-Fi off command completed. Status: {}", output.status.success());
                if !output.status.success() {
                    println!("[WARNING] Wi-Fi off command failed: {}", String::from_utf8_lossy(&output.stderr));
                }
            }
            Ok(Err(e)) => {
                println!("[WARNING] Failed to execute Wi-Fi off command: {}", e);
            }
            Err(_) => {
                println!("[WARNING] Wi-Fi off command timed out");
            }
        }

        // Small delay to ensure Wi-Fi is properly turned off
        tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;

        // Change MAC address with timeout
        println!("[DEBUG] Changing MAC address to: {}", new_mac);
        let mac_change_future = app.shell()
            .command("sudo")
            .args(["-n", "/sbin/ifconfig", &iface, "ether", &new_mac])
            .output();
            
        let mac_change_result = tokio::time::timeout(
            tokio::time::Duration::from_secs(10),
            mac_change_future
        ).await;

        let mut success = false;
        match mac_change_result {
            Ok(Ok(output)) => {
                success = output.status.success();
                println!("[DEBUG] MAC address change command completed. Status: {}", success);
                if !success {
                    println!("[ERROR] MAC address change failed: {}", String::from_utf8_lossy(&output.stderr));
                }
            }
            Ok(Err(e)) => {
                println!("[ERROR] Failed to execute MAC address change command: {}", e);
            }
            Err(_) => {
                println!("[ERROR] MAC address change command timed out");
            }
        }
        
        // Small delay before turning Wi-Fi back on
        tokio::time::sleep(tokio::time::Duration::from_millis(1000)).await;
        
        // Turn Wi-Fi back on with timeout
        println!("[DEBUG] Turning Wi-Fi back on for interface: {}", iface);
        let wifi_on_future = app.shell()
            .command("sudo")
            .args(["-n", "networksetup", "-setairportpower", &iface, "on"])
            .output();
            
        let wifi_on_result = tokio::time::timeout(
            tokio::time::Duration::from_secs(10),
            wifi_on_future
        ).await;
            
        match wifi_on_result {
            Ok(Ok(output)) => {
                println!("[DEBUG] Wi-Fi on command completed. Status: {}", output.status.success());
                if !output.status.success() {
                    println!("[WARNING] Wi-Fi on command failed: {}", String::from_utf8_lossy(&output.stderr));
                }
            }
            Ok(Err(e)) => {
                println!("[WARNING] Failed to execute Wi-Fi on command: {}", e);
            }
            Err(_) => {
                println!("[WARNING] Wi-Fi on command timed out");
            }
        }

        // Wait a bit more for network to stabilize
        tokio::time::sleep(tokio::time::Duration::from_millis(2000)).await;

        // Get current MAC address for verification with timeout
        println!("[DEBUG] Verifying MAC address change...");
        let verify_future = app.shell()
            .command("ifconfig")
            .args([&iface])
            .output();
            
        let verify_result = tokio::time::timeout(
            tokio::time::Duration::from_secs(5),
            verify_future
        ).await;
        
        match verify_result {
            Ok(Ok(verify_output)) => {
                let verify_text = String::from_utf8_lossy(&verify_output.stdout);
                println!("[DEBUG] Current interface status: {}", verify_text);
            }
            Ok(Err(e)) => {
                println!("[WARNING] Failed to verify MAC address: {}", e);
            }
            Err(_) => {
                println!("[WARNING] MAC address verification timed out");
            }
        }

        if success {
            let result_msg = format!("MAC address for {} changed to {}", iface, new_mac);
            println!("[DEBUG] MAC spoofing completed successfully: {}", result_msg);
            Ok(result_msg)
        } else {
            let error_msg = "MAC address change may have failed - check system logs";
            println!("[ERROR] MAC spoofing failed: {}", error_msg);
            Err(error_msg.into())
        }
    }

    // Session management functions
    pub fn create_session(&self, name: &str) -> Result<String, Box<dyn Error>> {
        if name.is_empty() {
            return Err("Session name cannot be empty".into());
        }
        
        let session_dir = Path::new(&self.config.profile_base).join(name);
        if session_dir.exists() {
            return Err(format!("Session '{}' already exists", name).into());
        }
        
        fs::create_dir_all(&session_dir)?;
        Ok(format!("Session '{}' created at {}", name, session_dir.to_string_lossy()))
    }

    pub async fn launch_session<R: Runtime>(&self, app: &tauri::AppHandle<R>, session: &str, spoof_mac: bool, connect_vpn: bool) -> Result<String, Box<dyn Error>> {
        println!("[DEBUG] launch_session called with session: {}, spoof_mac: {}, connect_vpn: {}", session, spoof_mac, connect_vpn);
        
        let session_dir = Path::new(&self.config.profile_base).join(session);
        if !session_dir.exists() {
            let error_msg = format!("Session directory not found: {}", session_dir.to_string_lossy());
            println!("[ERROR] {}", error_msg);
            return Err(error_msg.into());
        }
        
        println!("[DEBUG] Session directory found: {}", session_dir.to_string_lossy());
        let mut result = String::new();
        
        if spoof_mac {
            println!("[DEBUG] Starting MAC address spoofing...");
            match self.spoof_mac(app, None).await {
                Ok(mac_result) => {
                    println!("[DEBUG] MAC spoofing successful: {}", mac_result);
            result.push_str(&format!("{}\n", mac_result));
                }
                Err(e) => {
                    let error_msg = format!("MAC spoofing failed: {}", e);
                    println!("[ERROR] {}", error_msg);
                    result.push_str(&format!("Warning: {}\n", error_msg));
                    // Continue with launch even if MAC spoofing fails
                }
            }
        }
        
        if connect_vpn {
            println!("[DEBUG] VPN connection requested");
            result.push_str("Connect to your VPN now for a new IP before continuing.\n");
            // In a real app, we'd wait for user confirmation here
        }
        
        // Launch Cursor with the profile directory
        let args = vec![
            "--user-data-dir=".to_string() + &session_dir.to_string_lossy(),
            "--new-window".to_string(),
        ];
        
        println!("[DEBUG] Launching Cursor with args: {:?}", args);
        println!("[DEBUG] Cursor app path: {}", self.config.cursor_app);
        
        // Use shell plugin for the actual launch
        match app.shell()
            .command(&self.config.cursor_app)
            .args(args)
            .spawn() {
            Ok(cursor_result) => {
                let pid = cursor_result.1.pid();
                println!("[DEBUG] Cursor launched successfully with PID: {:?}", pid);
        result.push_str(&format!("Launched Cursor with session '{}'\n", session));
                result.push_str(&format!("PID: {:?}", pid));
        Ok(result)
            }
            Err(e) => {
                let error_msg = format!("Failed to launch Cursor: {}", e);
                println!("[ERROR] {}", error_msg);
                Err(error_msg.into())
            }
        }
    }

    pub fn archive_session(&self, session: &str) -> Result<String, Box<dyn Error>> {
        let session_dir = Path::new(&self.config.profile_base).join(session);
        if !session_dir.exists() {
            return Err(format!("Session '{}' not found", session).into());
        }
        
        let timestamp = Local::now().format("%Y%m%d-%H%M%S").to_string();
        let archive_name = format!("{}-{}", session, timestamp);
        let archive_dir = Path::new(&self.config.archive_base).join(&archive_name);
        
        if archive_dir.exists() {
            return Err(format!("Archive destination already exists: {}", archive_dir.to_string_lossy()).into());
        }
        
        // Create the archive directory
        fs::create_dir_all(&archive_dir)?;
        
        // Copy all files from session to archive
        let mut copy_options = fs_extra::dir::CopyOptions::new();
        copy_options.copy_inside = true;
        fs_extra::dir::copy(&session_dir, &archive_dir, &copy_options)?;
        
        Ok(format!("Session '{}' archived to '{}'", session, archive_name))
    }

    pub fn restore_archive(&self, archive: &str, new_session_name: Option<&str>) -> Result<String, Box<dyn Error>> {
        let archive_dir = Path::new(&self.config.archive_base).join(archive);
        if !archive_dir.exists() {
            return Err(format!("Archive '{}' not found", archive).into());
        }
        
        // Determine the target session name
        let session_name = if let Some(name) = new_session_name {
            name.to_string()
        } else {
            // Extract the original session name from the archive name
            if let Some(idx) = archive.rfind('-') {
                archive[0..idx].to_string()
            } else {
                return Err(format!("Cannot determine original session name from archive '{}'", archive).into());
            }
        };
        
        let session_dir = Path::new(&self.config.profile_base).join(&session_name);
        if session_dir.exists() {
            return Err(format!("Session '{}' already exists, cannot restore to this name", session_name).into());
        }
        
        // Create the session directory
        fs::create_dir_all(&session_dir)?;
        
        // Copy all files from archive to session
        let mut copy_options = fs_extra::dir::CopyOptions::new();
        copy_options.copy_inside = true;
        fs_extra::dir::copy(&archive_dir, &session_dir, &copy_options)?;
        
        Ok(format!("Archive '{}' restored to session '{}'", archive, session_name))
    }

    pub fn delete_session(&self, session: &str) -> Result<String, Box<dyn Error>> {
        let session_dir = Path::new(&self.config.profile_base).join(session);
        if !session_dir.exists() {
            return Err(format!("Session '{}' not found", session).into());
        }
        
        fs::remove_dir_all(&session_dir)?;
        Ok(format!("Session '{}' deleted", session))
    }

    pub fn delete_archive(&self, archive: &str) -> Result<String, Box<dyn Error>> {
        let archive_dir = Path::new(&self.config.archive_base).join(archive);
        if !archive_dir.exists() {
            return Err(format!("Archive '{}' not found", archive).into());
        }
        
        fs::remove_dir_all(&archive_dir)?;
        Ok(format!("Archive '{}' deleted", archive))
    }
}
