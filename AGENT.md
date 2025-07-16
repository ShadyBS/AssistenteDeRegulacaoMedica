# Assistente de Regulação Médica - Agent Guide

## Build/Development Commands
- **Build CSS**: `npm run build:css` - Build Tailwind CSS from src/input.css to dist/output.css
- **Generate ZIPs**: `npm run build:zips` or `node build-zips.js` - Creates Firefox and Chromium extension packages
- **Full Release**: `build-release.bat` - Automated version bump, build, tag, and GitHub release
- **Dependencies**: `npm install archiver fs-extra` - Install required build dependencies

## Project Structure
- **Browser Extension**: WebExtension for Firefox and Chromium-based browsers
- **Medical Regulation**: Assists medical regulators in Brazil's SIGSS system (sigss/regulacao*)
- **Content Scripts**: Inject into specific SIGSS URLs to extract regulation data
- **Background Service**: Handles data persistence and communication between content/sidebar
- **Sidebar Panel**: Main UI showing patient details, timeline, regulations, consultations, exams

## Key Files & Directories
- `manifest.json` - Firefox manifest / `manifest-edge.json` - Chromium manifest
- `sidebar.js` - Main sidebar UI and data display logic
- `MemoryManager.js` - Centralized memory/resource management for event listeners, timeouts, intervals, and global references
- `background.js` - Service worker handling storage and API calls
- `content-script.js` - Injected script to detect and extract regulation data
- `api.js` - Handles CADSUS and regulation data fetching
- `src/` - Tailwind CSS source / `ui/` - Modular UI components
- `dist-zips/` - Built extension packages

## Code Conventions
- **ES6 Modules**: Use import/export, top-level imports from relative paths
- **Naming**: camelCase for variables/functions, kebab-case for CSS classes and file names
- **Comments**: JSDoc for functions, minimal inline comments, Portuguese for user-facing text
- **Storage**: Use browser.storage.local for persistence, avoid storage.session for compatibility
- **API**: Promise-based async/await pattern, proper error handling with try/catch
- **CSS**: Tailwind utility classes, safelist important classes in tailwind.config.js
