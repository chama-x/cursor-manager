# Cursor Session Manager

A desktop application for managing multiple Cursor IDE sessions with different profiles, built with Tauri 2, React, Vite, and TypeScript.

## Features

- Create and manage multiple Cursor IDE sessions
- Assign projects to each session for easy access
- Spoof MAC address to avoid detection of multiple Cursor instances
- Launch Cursor with specific profiles

## Development

### Prerequisites

- [Node.js](https://nodejs.org/) (v16 or newer)
- [pnpm](https://pnpm.io/) (v7 or newer)
- [Rust](https://www.rust-lang.org/) (stable)
- [Tauri CLI](https://tauri.app/v2/guides/getting-started/prerequisites)

### Setup

1. Clone the repository
2. Install dependencies:

```bash
pnpm install
```

3. Run the development server:

```bash
pnpm tauri dev
```

### Building

To build the application:

```bash
pnpm tauri build
```

## Security

This application uses Tauri's capabilities system to restrict access to system resources. The application requests the following permissions:

- File system access to the Cursor profiles and archives directories
- Shell execution for launching Cursor and managing MAC addresses
- Network interface access for MAC address spoofing (requires sudo on macOS)

## License

MIT
