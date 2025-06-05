# Windows Setup Guide for Cursor Session Manager

## System Requirements

- **OS**: Windows 10 1903+ or Windows 11
- **Architecture**: x64 (64-bit)
- **Memory**: 4GB RAM minimum, 8GB recommended
- **Storage**: 100MB free space

## Installation

### Option 1: MSI Installer (Recommended)
1. Download `Cursor Session Manager_1.0.0_x64_en-US.msi` from releases
2. Right-click the MSI file and select "Run as administrator"
3. Follow the installation wizard
4. Launch from Start Menu or Desktop shortcut

### Option 2: Portable Version
1. Download the portable ZIP file
2. Extract to your preferred location (e.g., `C:\Tools\CursorManager\`)
3. Run `cursor-session-manager.exe`

## Cursor IDE Setup for Windows

### Method 1: Using Windows Package Manager (winget)
```powershell
# Install Cursor IDE
winget install Cursor.Cursor

# Verify installation
cursor --version
```

### Method 2: Manual Installation
1. Download Cursor from [cursor.sh](https://cursor.sh)
2. Install using the Windows installer
3. Add Cursor to PATH:

#### Adding Cursor to PATH (PowerShell as Administrator):
```powershell
# Check current installation path
$cursorPath = "${env:USERPROFILE}\AppData\Local\Programs\cursor"

# Add to system PATH
$currentPath = [Environment]::GetEnvironmentVariable("PATH", "Machine")
$newPath = $currentPath + ";" + $cursorPath
[Environment]::SetEnvironmentVariable("PATH", $newPath, "Machine")

# Verify installation
refreshenv
cursor --version
```

#### Alternative: Using Command Prompt (as Administrator):
```cmd
# Add to PATH
setx PATH "%PATH%;%USERPROFILE%\AppData\Local\Programs\cursor" /M

# Restart command prompt and verify
cursor --version
```

## Windows-Specific Features

### Window Management
- **Drag Window**: Hold and drag the header area (no title bar)
- **Minimize**: Click the `-` button in top-right corner
- **Close**: Click the `×` button in top-right corner
- **Resize**: Drag from any window edge

### Context Menu Protection
- Right-click context menu is disabled in production
- Developer tools (F12, Ctrl+Shift+I) are disabled
- Text selection is limited to form inputs only

### Windows Integration
- Taskbar integration with proper icon
- Start Menu entry after installation
- Windows notification system support
- Native Windows file dialogs

## Configuration

### Default Cursor Paths
The app will automatically detect Cursor in these locations:
- `%USERPROFILE%\AppData\Local\Programs\cursor\cursor.exe`
- `%LOCALAPPDATA%\Programs\cursor\cursor.exe`
- `C:\Program Files\Cursor\cursor.exe`

### Project Paths
Use Windows path format:
```
C:\Users\YourName\Documents\Projects\MyProject
C:\Dev\WebProjects\ReactApp
D:\Work\NodeJS\APIServer
```

### Environment Variables
You can set these environment variables for additional configuration:
```powershell
# Set default projects directory
[Environment]::SetEnvironmentVariable("CURSOR_PROJECTS_DIR", "C:\Dev\Projects", "User")

# Set custom Cursor executable path
[Environment]::SetEnvironmentVariable("CURSOR_EXECUTABLE", "C:\Custom\Path\cursor.exe", "User")
```

## Troubleshooting

### Issue: "Cursor command not found"
**Solution**: Ensure Cursor is properly added to PATH
```powershell
# Check if cursor is in PATH
where cursor

# If not found, reinstall Cursor or manually add to PATH
```

### Issue: "Cannot launch session"
**Solutions**:
1. Verify project paths exist and are accessible
2. Check if Cursor is running as administrator (may conflict)
3. Temporarily disable antivirus software
4. Run Cursor Session Manager as administrator

### Issue: "Window appears transparent/corrupted"
**Solutions**:
1. Update graphics drivers
2. Disable hardware acceleration in Windows settings
3. Check Windows transparency effects settings

### Issue: "MSI installation fails"
**Solutions**:
1. Run installer as administrator
2. Temporarily disable antivirus
3. Check Windows Installer service is running:
   ```powershell
   Get-Service msiserver
   Start-Service msiserver
   ```

## Performance Tips

1. **Exclude from Windows Defender**: Add installation folder to exclusions
2. **Startup Performance**: Pin to taskbar for faster access
3. **Memory Usage**: Close unnecessary sessions to reduce memory footprint
4. **SSD Recommended**: Install on SSD for faster startup times

## Windows Terminal Integration

For enhanced terminal experience with Cursor:

### Windows Terminal Setup
```json
// Add to Windows Terminal settings.json
{
    "name": "Cursor Terminal",
    "commandline": "cursor .",
    "startingDirectory": "%USERPROFILE%\\Projects",
    "icon": "cursor-icon.png"
}
```

### PowerShell Profile Enhancement
Add to your PowerShell profile (`$PROFILE`):
```powershell
# Quick Cursor session launcher
function Start-CursorSession {
    param([string]$Path = ".")
    cursor $Path
}

# Alias
Set-Alias cs Start-CursorSession
```

## Security Considerations

- Application runs with user privileges (not administrator)
- Network access limited to local development servers
- File system access restricted to user directories
- Code execution limited to Cursor IDE integration

## Building from Source (Windows)

### Prerequisites
```powershell
# Install Node.js
winget install OpenJS.NodeJS

# Install Rust
winget install Rustlang.Rustup

# Install Git
winget install Git.Git

# Restart PowerShell to refresh PATH
```

### Build Steps
```powershell
# Clone repository
git clone https://github.com/cursor-session-manager/app.git
cd app

# Install dependencies
npm install

# Build for Windows
npm run tauri:build:windows

# Output will be in src-tauri/target/release/bundle/msi/
```

## Uninstallation

### MSI Installation
1. Go to Settings > Apps & features
2. Search for "Cursor Session Manager"
3. Click "Uninstall"

### Portable Installation
1. Delete the application folder
2. Remove any created shortcuts
3. Clear any cached data from `%APPDATA%\CursorSessionManager\`

## Support

For Windows-specific issues:
- Check Event Viewer for application errors
- Run `winver` to verify Windows version compatibility
- Ensure .NET Framework 4.7.2+ is installed
- Update Windows to latest version

## Advanced Configuration

### Registry Settings (Optional)
```powershell
# Set default behavior (run as administrator required)
New-ItemProperty -Path "HKLM:\SOFTWARE\CursorSessionManager" -Name "DefaultProjectsPath" -Value "C:\Dev" -PropertyType String
```

### Group Policy (Enterprise)
For enterprise deployments, you can configure:
- Default installation paths
- Allowed project directories
- Network restrictions
- Auto-update settings

---

**Note**: This application is optimized for Windows 10 1903+ and Windows 11. Some features may not work on older versions. 