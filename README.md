# Cursor Session Manager

A professional desktop application for managing and launching Cursor IDE sessions with premium design and cross-platform support.

![Version](https://img.shields.io/badge/version-1.0.0-blue.svg)
![Platform](https://img.shields.io/badge/platform-macOS%20%7C%20Windows%20%7C%20Linux-lightgrey.svg)
![License](https://img.shields.io/badge/license-MIT-green.svg)

## ✨ Features

- **🎯 Session Management**: Create, organize, and launch multiple Cursor IDE sessions
- **🚀 Quick Launch**: One-click session launching with customizable commands
- **📁 Project Organization**: Manage multiple projects per session
- **📊 Usage Analytics**: Visual analytics with time tracking and usage patterns
- **🎨 Premium Design**: Apple-inspired UI with transparent window borders
- **🖥️ Native Desktop**: True desktop app experience with custom window controls
- **🔒 Production-Ready**: Disabled developer tools and context menus for security
- **🌐 Cross-Platform**: Full support for macOS, Windows, and Linux

## 🖼️ Screenshot

*Beautiful, modern interface with transparent borders and custom window controls*

## 📋 System Requirements

### macOS
- macOS 10.13 High Sierra or later
- 4GB RAM minimum, 8GB recommended
- 100MB free disk space

### Windows
- Windows 10 1903+ or Windows 11
- x64 (64-bit) architecture
- 4GB RAM minimum, 8GB recommended
- 100MB free disk space

### Linux
- Ubuntu 18.04+ / Debian 10+ / Fedora 32+ / Arch Linux
- x64 (64-bit) architecture
- 4GB RAM minimum, 8GB recommended
- 100MB free disk space

## 🚀 Installation

### macOS
1. Download `Cursor Session Manager_1.0.0_aarch64.dmg` from [Releases](https://github.com/cursor-session-manager/app/releases)
2. Open the DMG file and drag the app to Applications folder
3. Launch from Applications or Spotlight

### Windows
1. Download `Cursor Session Manager_1.0.0_x64_en-US.msi` from [Releases](https://github.com/cursor-session-manager/app/releases)
2. Run as administrator and follow installation wizard
3. Launch from Start Menu or Desktop shortcut

**📖 For detailed Windows setup instructions, see [WINDOWS_SETUP.md](WINDOWS_SETUP.md)**

### Linux
```bash
# Download and install .deb package (Ubuntu/Debian)
sudo dpkg -i cursor-session-manager_1.0.0_amd64.deb

# Or use AppImage (Universal)
chmod +x cursor-session-manager_1.0.0_amd64.AppImage
./cursor-session-manager_1.0.0_amd64.AppImage
```

## ⚙️ Cursor IDE Setup

### macOS/Linux
```bash
# Add Cursor to PATH (if not already done)
echo 'export PATH="/Applications/Cursor.app/Contents/Resources/app/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc

# Verify installation
cursor --version
```

### Windows
```powershell
# Using Windows Package Manager (Recommended)
winget install Cursor.Cursor

# Verify installation
cursor --version
```

For manual Windows setup, see the [Windows Setup Guide](WINDOWS_SETUP.md).

## 🎯 Quick Start

1. **Launch the App**: Open Cursor Session Manager from your applications
2. **Create First Session**: Click "✨ New Session" to create your first session
3. **Add Projects**: Enter project paths (comma-separated for multiple projects)
4. **Launch Session**: Click on any session card to launch it instantly
5. **Organize**: Use the dynamic Bento grid layout that adapts to your usage patterns

## 🔧 Features Overview

### Session Management
- **Create Sessions**: Define custom sessions with multiple projects
- **Quick Launch**: One-click launching with customizable commands
- **Smart Organization**: Dynamic grid layout based on usage frequency
- **Project Grouping**: Manage multiple related projects in one session

### Analytics & Insights
- **Usage Tracking**: Visual charts showing session usage patterns
- **Time Analytics**: Track time spent in different sessions
- **Activity Visualization**: Pulse charts for session activity
- **Smart Recommendations**: Sessions resize based on usage patterns

### Desktop Experience
- **Transparent Borders**: Professional appearance with system integration
- **Custom Window Controls**: Native macOS/Windows style controls
- **Draggable Interface**: Drag window by header area
- **No Title Bar**: Clean, modern desktop app experience
- **Resizable Window**: Adaptive layout with minimum/maximum constraints

### Security & Production
- **Context Menu Disabled**: Right-click menus disabled in production
- **Developer Tools Blocked**: F12, Ctrl+Shift+I, etc. disabled
- **Text Selection Control**: Limited to form inputs only
- **Secure Execution**: Sandboxed environment for safe operation

## 🛠️ Development

### Prerequisites
- Node.js 18+
- Rust 1.70+
- Tauri CLI v2+

### Setup
```bash
# Clone repository
git clone https://github.com/cursor-session-manager/app.git
cd cursor-session-manager

# Install dependencies
npm install

# Start development server
npm run tauri:dev
```

### Building
```bash
# Build for production
npm run build

# Build Tauri app
npm run tauri:build

# Build for specific platforms
npm run tauri:build:windows    # Windows MSI
npm run tauri:build:macos      # macOS Apple Silicon
npm run tauri:build:macos-intel # macOS Intel
npm run tauri:build:linux      # Linux DEB/AppImage
```

## 📖 Documentation

- **[Windows Setup Guide](WINDOWS_SETUP.md)** - Comprehensive Windows installation and configuration
- **[Development Guide](DEVELOPMENT.md)** - Setup development environment
- **[API Documentation](API.md)** - Session management API reference
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and solutions

## 🎨 Design System

Built with Apple's Human Interface Guidelines in mind:
- **Color Palette**: Premium grayish design with Apple Intelligence accents
- **Typography**: SF Pro Display font family with proper weight hierarchy
- **Spacing**: Apple's 4pt grid system for consistent spacing
- **Animations**: Apple's signature easing curves and micro-interactions
- **Shadows**: Depth-aware shadow system for visual hierarchy

## 🔒 Privacy & Security

- **Local Storage**: All data stored locally on your machine
- **No Telemetry**: No tracking or analytics sent to external servers
- **Sandboxed**: Runs in secure Tauri environment
- **Minimal Permissions**: Only requests necessary file system access
- **Open Source**: Full source code available for audit

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **Tauri Team** - For the amazing desktop app framework
- **Cursor Team** - For creating an incredible AI-powered IDE
- **React Team** - For the robust UI library
- **Apple Design Team** - For inspiration on premium UI/UX design

## 📞 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/cursor-session-manager/app/issues)
- **Discussions**: [Join community discussions](https://github.com/cursor-session-manager/app/discussions)
- **Documentation**: [Browse the docs](https://cursor-session-manager.github.io/docs)

---

<div align="center">
  <strong>Built with ❤️ for the developer community</strong>
  <br />
  <br />
  <a href="https://cursor.sh">Cursor IDE</a> •
  <a href="https://tauri.app">Tauri</a> •
  <a href="https://reactjs.org">React</a> •
  <a href="https://github.com/cursor-session-manager/app">GitHub</a>
</div>
