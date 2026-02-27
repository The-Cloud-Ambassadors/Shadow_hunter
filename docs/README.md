# Shadow Hunter: Deep Dive Technical Documentation

This document provides a highly granular, completely exhaustive explanation of the Shadow Hunter platform. It covers every minute detail: how data is generated, where the traffic comes from, exactly how it is processed, enriched by rules and plugins, analyzed by machine learning engines, and actioned upon by the SOAR response mechanisms.

---

## 1. Core Entry Point: `run_local.py`

The system initiates from `run_local.py`, which offers two primary operational modes:

- **LIVE MODE (`--live`)**: Uses `ListenerService` to capture actual network traffic from the host machine using Scapy and Npcap/libpcap.
- **DEMO MODE**: Uses the `TrafficGenerator` to simulate realistic corporate traffic.

**Initialization Flow:**

1. **Shared Infrastructure**: It sets up `MemoryBroker` (async event pub/sub) and the Graph Store (either `SQLiteGraphStore` for persistence or `NetworkXStore` for in-memory).
2. **Analyzer Engine**: The core "Brain" (`AnalyzerEngine`) is instantiated and subscribed to the `sh.telemetry.traffic.v1` broker topic.
3. **Traffic Sources**: Depending on the mode, it starts either the Simulator or the Listener.
4. **API Server**: Starts a FastAPI application (`uvicorn`) on port `8000` (or `PORT` env var).

---

## 2. Traffic Generation & Ingestion (Where Data Comes From)

Shadow Hunter ingests network packets unified into `NetworkFlowEvent` objects.

### A. Demo Mode (Simulated Traffic)

The simulator (`services/simulator/traffic_generator.py`) generates highly realistic synthetic traffic mimicking a small corporate office.

- **Personas**: It runs 5 specific virtual employees (`Dev_Ravi`, `Designer_Priya`, `Manager_Arjun`, `DataSci_Meera`, `Intern_Kiran`).
- **Behavior Loop**: Every 2-5 seconds, an employee performs an action.
  - **Normal Web Traffic (60%+)**: Visits standard sites (GitHub, Figma, Google) simulating standard HTTPS traffic (`destination_port=443`, small requests, large responses).
  - **Internal Server Traffic**: Occasionally simulates internal subnet communication (e.g., reaching a Jira server or Database).
  - **Shadow AI Temptation (The Threat)**: Depending on their role, they have a probability of "sneaking" unauthorized AI usage. This generates events with destination domains mapped to known AI tool IPs (e.g., ChatGPT, Copilot, Cursor).

### B. Live Mode (Real Traffic)

- Powered by `ListenerService` (`services/listener/main.py`), utilizing Scapy on raw sockets.
- It captures live packets on the network interface and runs them through `PacketProcessor`.
- The processor extracts IPs, ports, protocols, byte sizes, and deep-packet metadata (like DNS SNI, HTTP headers, and JA3 TLS fingerprints), condensing them into raw `NetworkFlowEvent` payloads.

**The Output**: Regardless of the source, `NetworkFlowEvent` payloads are published to the async `MemoryBroker`.

---

## 3. The Processing Pipeline (`AnalyzerEngine`)

The `AnalyzerEngine` (`services/analyzer/engine.py`) intercepts every single network flow event and processes it through a strict pipeline.

### Step 3.1: Event Parsing & Basic Enrichment

- Converts raw dictionaries into validated `NetworkFlowEvent` schemas.
- **Node Classification**: Determines if `source_ip` and `destination_ip` are `internal` or `external`. If the destination matches recognized AI domains, it is flagged as `shadow`.
- **GeoIP Lookup**: Appends geographical context to the `destination_ip` node.

### Step 3.2: Graph Injection

- Graph edges and nodes are upserted efficiently.
- **Nodes Created**: `source_id` and `destination_id`.
- **Edge Created**: `TALKS_TO` containing properties like `protocol`, `dst_port`, `byte_count`, and `last_seen`.

### Step 3.3: Static Threat Intelligence & Plugins (`services/analyzer/plugins`)

Before hitting ML, traffic is evaluated by absolute intelligence plugins:

- **CIDR Threat Intelligence (`cidr_intel.py`)**: Checks the destination IP against a local database of known provider IP ranges (e.g., Cloudflare, Azure, AWS) and mapping them to known enterprise or shadow services.
- **JA3 Fingerprint Matching (`ja3_plugin.py`)**: Evaluates the TLS JA3 hash against a database of known malicious or unsanctioned client fingerprints. Crucially, it detects **Spoofing**—if the traffic says it is Chrome (`User-Agent`) but the JA3 signature belongs to a raw Python `requests` library, it instantly triggers a critical alert.
- **Core Heuristics (`core_heuristics.py`)**: Acts as a first-pass rule engine to drop obvious noise and flag deterministic protocol abnormalities.

---

## 4. Machine Learning Models (`IntelligenceEngine`)

If `use_ml=True`, the Analyzer pipes the event into the `IntelligenceEngine` (`services/intelligence/engine.py`).

### A. Feature Extraction

The `NetworkFlowEvent` is converted into a numeric NumPy feature vector representing byte ratios, port classifications, and payload structures.

### B. Session Tracking

A sliding **60-minute window tracker** tracks the behavioral history of the `source_ip`. It calculates cumulative bytes, request frequency, and checks if time-series data exfiltration patterns match against known thresholds.

### C. ML Inference (The Models)

The feature vector is passed to three concurrent models:

1. **`AnomalyModel` (Isolation Forest)**: Looks for generalized structural outliers. Scored between -1.0 and 1.0 (Lower than `-0.2` triggers a flag).
2. **`TrafficClassifier` (Random Forest Classifier)**: Specifically trained to categorize flows into classes (`normal`, `suspicious`, `shadow_ai`). It returns the classification alongside a probability (`confidence`).
3. **`ShadowAutoencoder` (Deep Learning / TensorFlow)**: Reconstructs the input feature vector. If the `reconstruction_error` is higher than the 95th percentile threshold learned during training, the event is flagged, catching novel zero-day shadow tools.

**Verdict Aggregation:** The engine unifies these results into a `risk_score` (0.0 to 1.0) and generates `reasons` string arrays to explain the flag.

---

## 5. Active Defense & Interrogation (`ActiveProbe`)

When the main engine generates a `CRITICAL` or `HIGH` severity alert, it delegates to `ActiveProbe` (`services/active_defense/interrogator.py`) to actively probe the suspicious destination IP.

### Protective Guards
- Never probes internal IP ranges (`10.0.0.0/8`, `192.168.0.0/16`, etc.).
- Strict rate-limiting and a 5-minute cooldown per target IP to prevent triggering external IDS.

### Probing Strategy
1. **HTTP OPTIONS Check**: Analyzes rate-limit headers or server attributes typical of AI infrastructure.
2. **AI Endpoint Verification**: Attempts `GET` requests against known AI paths (`/v1/models`, `/api/generate`) looking for terminology matching AI generation layers or 401 Unauthorized API responses.

**Result**: Changes speculative alerts ("Suspicious HTTPS Outbound") into confirmed factual alerts ("CONFIRMED AI API Hit").

---

## 6. Graph Topology Analytics (`GraphAnalyzer`)

Parallel to real-time events, the `GraphAnalyzer` (`services/graph/analytics.py`) runs asynchronously mapping network traffic as a 3D Force-Directed Graph.

- **Objective**: Detect stealthy Lateral Movement and internal bridge nodes.
- **Mechanism**: Calculates **Betweenness Centrality** of every node. If a standard workstation suddenly acquires a high centrality score (acting like a router) and connects segregated subnets, it fires a "Suspicious Bridge Node" lateral movement alert.
- **Whitelists**: Centrality logic aggressively whitelists recognized Gateways avoiding false positives.

---

## 7. Security Orchestration & Automated Response (SOAR)

Once an alert is completely enriched, the system engages the automated response tier (`services/intelligence/soar.py` and `services/response/manager.py`).

### 7.1 SOAR Engine (`soar.py`)
 Evaluates the final alert payload against predefined Playbooks:
- **Playbook 1 (Auto-Quarantine Critical Threats)**: Immediately isolates any node generating a `CRITICAL` severity event (like a DLP violation).
- **Playbook 2 (Block Active Shadow AI Anomalies)**: Blocks nodes flagged with `HIGH` severity and confirmed `shadow_ai` classification.

### 7.2 Response Manager (`manager.py`)
Executes the physical isolation logic initiated by the SOAR engine:
- Maintains an active **Blocklist** of quarantined IPs in-memory (simulating a physical firewall integration).
- **Time-to-Live (TTL)**: Auto-blocks expire after a configured time (e.g., 3600 seconds) to prevent permanent accidental lockdown.
- **Fail-Safes**: Implements an un-bypassable whitelist preventing the system from ever blocking essential infra (`8.8.8.8`, `192.168.1.1`, gateways, and multicast addresses).
- **Audit Logging**: maintains a strict, API-exposed audit log of all automated blocking and unblocking operations.

### 7.3 Frontend Presentation (`transceiver.py`)
The dictionary payload, now including its block status, is dispatched to the FastAPI WebSocket router (`services/api/transceiver.py`), broadcasting in real-time to the React frontend dashboard where it updates the global state.
