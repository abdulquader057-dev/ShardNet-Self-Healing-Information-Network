# ShardNet: Survival Communication Ecosystem
## Presentation Guide & Technical Defense

### 1. The Core Innovation (The "Pitch")
ShardNet isn't just a messaging app; it's a **Self-Healing Situational Awareness Hub**. We solve the "Isolation of Control" by turning every individual into a network node that carries fragments of the truth across physical space.

### 2. Key Design Decisions & Trade-offs
*   **Decision: Shamir-inspired Sharding**
    *   *Trade-off*: Adds complexity to message creation.
    *   *Rationale*: Essential for Section 7.2 (Resilience). No single captured device reveals the whole message.
*   **Decision: No Central Identity**
    *   *Trade-off*: No persistent "contacts" or user profiles.
    *   *Rationale*: Protects civilian privacy. Propagation is based on physical proximity, not digital identity.
*   **Decision: Browser-Native (PWA)**
    *   *Trade-off*: Cannot access lower-level OS Bluetooth APIs directly without user intent.
    *   *Rationale*: Maximum accessibility. No app store needed; can be shared as a single `.html` file or via QR "Drops".

### 3. Feature Defense (Judge Q&A)

**Q: How does this work without any internet?**
A: We use strictly local technologies: IndexedDB for storage, Web Crypto for local encryption, and the browser's native sharing and camera APIs. Our Service Worker ensures the app stays available even when the device is fully disconnected.

**Q: What happens if a device is seized?**
A: We implemented the **Stealth Vault**. Reconstructed messages are kept in memory or encrypted with a session-based gesture. Once the app is closed or memory is cleared, the sensitive intelligence is wiped, leaving only unreadable encrypted shards.

**Q: How do you demonstrate Multi-Hop propagation?**
A: We created **Mesh Pulse**. Device A bundles its shards into a high-density "Pulse QR." Device B scans it, carrying the fragments to a new location. Device C scans B and completes the reconstruction. Movement = Data Flow.

**Q: What is the "Killer Feature"?**
A: **The Mesh Whisper**. It’s an experimental acoustic modem. In environments where radio or screen visibility is high-risk, we use near-ultrasonic audio chirps to silently sync node metadata between nearby devices.

### 4. Technical Architecture
1.  **UI**: React + Framer Motion (High-contrast, low-stress).
2.  **Intelligence Layer**: Leaflet (Offline Map), Trust Engine (Probabilistic Mesh Scoring).
3.  **Core**: AES-GCM 256-bit fragment encryption.
4.  **Storage**: IndexedDB (Persistent local vault).

### 5. Final Closing Statement
ShardNet proves that communication is a human right that infrastructure cannot revoke. As long as people move and path-cross, the mesh survives.
