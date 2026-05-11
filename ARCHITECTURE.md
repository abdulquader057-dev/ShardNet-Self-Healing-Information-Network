# ShardNet: Self-Healing Architecture

This document defines the modular architecture of ShardNet, designed for absolute reliability in zero-internet disaster conditions.

## 1. Modular Layers

### 🏛️ UI Layer (`src/pages/`, `src/components/`)
- **Responsibility**: Stress-optimized presentation and user interaction.
- **Rules**: Never handles raw shard logic or decryption directly. Listens for events from the Core Engine.
- **Components**: High-contrast dashboard, Unified Inbox, Scan Reveal card.

### 🧠 Core Engine (`src/core/`)
- **Responsibility**: The central brain of the ecosystem.
- **Modules**:
  - **Message Manager**: Orchestrates the lifecycle (Scan → Group → Trigger Reconstruction).
  - **Shard Handler**: Manages shard structure, dynamic splitting, and cryptographic integrity.
  - **Reconstruction Engine**: Handles decryption and SHA-256 hash validation (Worker-compatible).
- **Communication**: Uses a dedicated `EventBus` to notify UI of state changes without tight coupling.

### 💾 Storage Layer (`src/storage/`)
- **Responsibility**: Persistent state management using IndexedDB (Dexie).
- **Rules**: Operates strictly offline. Implements "Self-Healing" (purging expired signals, optimizing vault space).
- **Fallback**: Includes a "Zero-Storage" mock for environments where IndexedDB is locked.

### 📡 Proximity Layer (`src/utils/geo.js`, `src/utils/sharing.js`)
- **Responsibility**: Hardware integration (GPS, Web Share API).
- **Purpose**: Attaching precision metadata and bridging to native OS-level local transfer (Nearby Share / AirDrop).

## 2. Event-Driven Flow
ShardNet uses a strictly unidirectional, event-based internal flow to keep the UI decoupled from the heavy sharding logic:

1. **`SHARD_RECEIVED`**: Triggered when a new signal enters the vault (Scan/Beam).
2. **`MESSAGE_UPDATED`**: Emitted during partial signal collection (triggers Inbox progress bars).
3. **`MESSAGE_COMPLETE`**: Emitted when a message passes integrity checks and is ready for reading.

## 3. Future Extension Map (Safe Modules)

- **Bluetooth Low Energy (BLE) Module**: A future standalone module to handle continuous background mesh discovery.
- **Voice-to-Shard Module**: A media processing layer to split audio recordings into fragments.
- **Mesh Map Overlay**: A visual layer to plot "Verified" message locations on a local, offline-cached coordinate grid.

---
**Standard**: Modular, Lightweight, Browser-Native.
**Goal**: Unbreakable offline communication.
