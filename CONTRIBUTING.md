# Contributing to Cursor Session Manager

Thank you for considering contributing to Cursor Session Manager! This document outlines the project structure, architecture, and guidelines for contributors.

## Project Structure

```
cursor-manager/
├── src/                 # Frontend React code
│   ├── api.ts           # Tauri API wrappers
│   ├── App.tsx          # Main React component
│   ├── main.tsx         # React entry point
│   └── styles.css       # CSS styles
├── src-tauri/           # Rust backend code
│   ├── capabilities/    # Tauri capabilities definitions
│   ├── icons/           # Application icons
│   ├── src/             # Rust source code
│   │   ├── lib.rs       # Core functionality
│   │   └── main.rs      # Application entry point
│   ├── Cargo.toml       # Rust dependencies
│   └── tauri.conf.json  # Tauri configuration
├── index.html           # HTML entry point
├── vite.config.ts       # Vite configuration
└── package.json         # Frontend dependencies
```

## Architecture

### Frontend (React + TypeScript)

The frontend is built with React and TypeScript. It communicates with the Rust backend through Tauri's API.

Key components:
- `api.ts`: Contains TypeScript functions that call Rust functions via Tauri's invoke API
- `App.tsx`: Main React component implementing the UI
- `styles.css`: CSS styles for the application

### Backend (Rust + Tauri)

The backend is built with Rust and Tauri 2. It provides the core functionality for managing Cursor sessions.

Key components:
- `lib.rs`: Contains the core business logic, including:
  - `CursorManager`: Class that manages sessions, archives, and MAC address spoofing
  - Tauri command functions that expose Rust functionality to the frontend

## Development Guidelines

1. **Code Style**
   - Follow standard Rust and TypeScript code styles
   - Use meaningful variable and function names
   - Add comments for complex logic

2. **Security**
   - Be cautious with file system operations
   - Limit permissions in capabilities to what's strictly necessary
   - Validate all user inputs

3. **Tauri Commands**
   - Keep Tauri commands in `lib.rs` simple and focused
   - Use proper error handling and return consistent types
   - Use State management for shared configuration

4. **Testing**
   - Add tests for core functionality when possible
   - Test both frontend and backend components

## Pull Request Process

1. Fork the repository
2. Create a branch for your feature or bug fix
3. Make your changes
4. Ensure the code builds and tests pass
5. Submit a pull request

Thank you for your contributions! 