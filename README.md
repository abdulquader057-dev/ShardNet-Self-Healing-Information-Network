# 🛰️ Shared Net — Self-Healing Information Network

> **Decentralised, offline-first emergency mesh network for information sharing in network blackout scenarios.**

[![Vercel](https://img.shields.io/badge/Live%20Demo-Vercel-black?logo=vercel)](https://shard-net-self-healing-information.vercel.app)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)](https://react.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?logo=vite)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-green)](LICENSE)

---

## 📖 What is Shared Net?

**Shared Net** is a Progressive Web App (PWA) designed to function as a self-healing peer-to-peer information network — even when the internet is completely unavailable.

It solves a real-world problem: **during disasters, conflicts, or infrastructure failures, how do people share critical information when there is no internet?**

Shared Net does this by:
- **Sharding** messages into encrypted QR-code fragments
- **Propagating** those fragments via physical proximity (camera scanning, optical beam, ultrasonic relay)
- **Reconstructing** the original message when enough fragments are collected
- **Mapping** message origins with live GPS coordinates on a mesh map

---

## ✨ Features

### 🔐 Message Sharding & Reconstruction
- Messages are split into **N encrypted fragments (shards)** using a custom sharding algorithm
- Each shard is independently shareable as a **QR code**
- When enough shards are collected by any node, the original message is **automatically reconstructed**
- Supports text and **compressed voice recordings** as payloads

### 🗺️ Live Mesh Map
- Real-time **GPS location tracking** using the browser Geolocation API (`watchPosition`)
- Displays your current position as a pulsing **"You Are Here"** blue dot
- Shows **accuracy radius** around your position
- Message origins plotted as map markers with popups
- **Lat/Lng coordinate HUD** with one-tap copy button
- Dark-themed OpenStreetMap tiles (invert + hue-rotate filter)

### 📡 Multi-Channel Propagation
| Channel | Description |
|---|---|
| **QR Code** | Scan shards between devices using any camera |
| **Optical Beam** | Flash/strobe data transfer via screen brightness modulation |
| **Acoustic Whisper** | Ultrasonic data relay (planned) |
| **Bluetooth Mesh** | Direct device-to-device proximity sharing |
| **Web Share API** | Native OS share sheet for bundle propagation |

### 📬 Unified Inbox
- Collects both **complete messages** and **partial shard fragments**
- TTL (Time-To-Live) decay bar per message
- Trust score and consensus verification badges
- Clickable Google Maps links for geo-tagged messages
- Audio playback for voice payloads

### 🔒 Stealth Vault
- Memory-only encryption — data never written to persistent storage when vault is active
- Session key prompt for unlocking encrypted fragments
- Auto-wipes on session exit

### 📦 Mesh Vault (Storage)
- Local IndexedDB storage of all received shards (via **Dexie.js**)
- Shard lifecycle tracking: Propagating → Ready → Reconstructed → Expired
- Rebroadcast any shard as a new QR code
- Bundle propagation (all shards for a message in one QR)
- Bluetooth beam for proximity transfer

### 🔄 Self-Healing Engine
- Automatic **shard expiry and cleanup** every 5 minutes
- **Consensus verification** via multi-node witnessing
- Trust scoring based on relay count and device density
- Message versioning (update/supersede previous signals)

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────┐
│                     SHARED NET PWA                       │
├──────────────┬──────────────┬──────────────┬────────────┤
│   UI Layer   │  Core Layer  │ Storage Layer│  Utils     │
│  (React 19)  │              │  (IndexedDB) │            │
│              │  sharding.js │              │  geo.js    │
│  Home        │  messageMan. │  db.js       │  qr.js     │
│  CreateMsg   │  consensus   │  (Dexie)     │  audio.js  │
│  Inbox       │  Engine.js   │              │  sharing.js│
│  StorageView │  events.js   │              │  bluetooth │
│  ScanPage    │              │              │            │
│  MeshPulse   ├──────────────┴──────────────┴────────────┤
│  MeshWhisper │           Intelligence Layer              │
│  SilentRelay │  mapModule · flashTransfer · trustEngine  │
└──────────────┴─────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|---|---|
| **Framework** | React 19 + Vite 8 |
| **Routing** | React Router v7 |
| **Animation** | Framer Motion v12 |
| **Map** | Leaflet + React-Leaflet v5 |
| **Tiles** | OpenStreetMap (dark-filtered) |
| **Storage** | Dexie.js (IndexedDB wrapper) |
| **QR** | `qrcode` + `html5-qrcode` + `react-qr-code` |
| **Styling** | Tailwind CSS v4 + Vanilla CSS |
| **Icons** | Lucide React |
| **Deploy** | Vercel (PWA) |

---

## 📱 Responsive Design

Shared Net is designed to work on **all screen sizes**:

| Breakpoint | Layout |
|---|---|
| **Mobile** (< 640px) | Single-column stacked, touch-optimised (44px min targets) |
| **Tablet** (640px – 1024px) | 2-column grid |
| **Desktop** (> 1024px) | Main content + sidebar layout |

- Dynamic viewport height (`100dvh`) for iOS Safari
- iOS safe-area-inset support for home bar notch
- Fluid typography via `clamp()`
- Responsive map height: `clamp(240px, 50vw, 400px)`

---

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18
- npm >= 9

### Installation

```bash
# Clone the repository
git clone https://github.com/abdulquader057-dev/ShardNet-Self-Healing-Information-Network.git
cd ShardNet-Self-Healing-Information-Network

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Build for Production

```bash
npm run build
npm run preview
```

---

## 📂 Project Structure

```
sharednet/
├── public/
│   └── sw.js                    # Service Worker (offline caching)
├── src/
│   ├── components/
│   │   └── Navbar.jsx           # Responsive bottom navigation bar
│   ├── core/
│   │   ├── sharding.js          # Message sharding & reconstruction
│   │   ├── messageManager.js    # Lifecycle management & TTL
│   │   ├── consensusEngine.js   # Multi-node verification
│   │   └── events.js            # Cross-component event bus
│   ├── intelligence/
│   │   ├── mapModule.jsx        # Live GPS mesh map (Leaflet)
│   │   ├── flashTransfer.jsx    # Optical data transmission
│   │   └── trustEngine.js       # Trust scoring algorithm
│   ├── pages/
│   │   ├── Home.jsx             # Dashboard with map, stats, channels
│   │   ├── CreateMessage.jsx    # SOS message + GPS + voice recording
│   │   ├── ScanPage.jsx         # QR code scanner
│   │   ├── Inbox.jsx            # Unified message inbox
│   │   ├── StorageView.jsx      # Shard vault management
│   │   ├── MeshPulse.jsx        # Batch shard relay
│   │   ├── MeshWhisper.jsx      # Acoustic relay
│   │   ├── BluetoothMesh.jsx    # Bluetooth proximity mesh
│   │   └── SilentRelay.jsx      # Background relay protocol
│   ├── storage/
│   │   └── db.js                # Dexie IndexedDB schema & queries
│   ├── utils/
│   │   ├── geo.js               # GPS, watchPosition, location sharing
│   │   ├── qr.js                # QR generation & trust scoring
│   │   ├── audio.js             # Voice capture & compression
│   │   ├── sharing.js           # Web Share API / proximity beam
│   │   └── bluetooth.js         # BLE utility functions
│   ├── App.jsx                  # Router + global page container
│   ├── main.jsx                 # Entry point + SW registration
│   └── index.css                # Design system + responsive CSS
├── index.html
├── vite.config.js
└── package.json
```

---

## 🗂️ How Message Sharding Works

```
User types message
        │
        ▼
  createShards()      Split message into N fragments
        │             Attach: category, priority, GPS, TTL, nodeId
        │
        ▼
  saveShard()         Store each fragment in IndexedDB
        │
        ▼
  generateShardQR()   Encode each shard as a QR code image
        │
        [Physical Transfer — scan, flash, beam, proximity]
        │
        ▼
  scanShard()         Recipient scans QR → extracts shard JSON
        │
        ▼
  reconstructMessage() When all N shards collected → decode original
        │
        ▼
  Inbox / Map         Display to recipient + plot on mesh map
```

---

## 📍 Location Sharing

GPS coordinates are embedded in every outgoing message:

```
Payload format:  LOC:lat,lng,accuracy
Example:         LOC:17.385044,78.486671,15
```

Recipients can:
1. See the sender's location on the mesh map
2. Tap to open in Google Maps
3. Copy exact coordinates from the map HUD

---

## 🔐 Security & Privacy

- All message data is stored **locally on-device** (IndexedDB)
- No server, no cloud — purely peer-to-peer
- **Stealth Vault** mode uses memory-only storage (wiped on exit)
- Node identities are randomly generated and ephemeral
- No analytics, no tracking, no network calls (except map tiles)

---

## 🌐 Live Demo

**[https://shard-net-self-healing-information.vercel.app](https://shard-net-self-healing-information.vercel.app)**

> **Note:** GPS location requires HTTPS (automatically satisfied on Vercel). Allow location permission when prompted for full functionality.

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature`
3. Commit your changes: `git commit -m 'feat: add your feature'`
4. Push to the branch: `git push origin feat/your-feature`
5. Open a Pull Request

---

## 📄 License

MIT © 2026 Abdul Quader

---

<div align="center">
  <p><strong>Built for resilience. Designed for emergencies. Works without internet.</strong></p>
  <sub>Shared Net — Self-Healing Information Network · v2.5.0</sub>
</div>
