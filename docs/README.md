# Shadow Hunter: Deep Dive Technical Documentation

This document provides a highly granular, completely exhausted explanation of the Shadow Hunter platform. It covers every minute detail: how data is generated, where the traffic comes from, and exactly how it is processed and analyzed by the rule-based and machine-learning engines.

---

## 1. Core Entry Point: `run_local.py`

The system initiates from `run_local.py`, which offers two primary operational modes:

- **LIVE MODE (`--live`)**: Uses `ListenerService` to capture actual network traffic from the host machine using Scapy and Npcap.
- **DEMO MODE**: Uses the `TrafficGenerator` to simulate realistic corporate traffic.

**Initialization Flow:**

1. **Shared Infrastructure**: It sets up `MemoryBroker` (async event pub/sub) and the Graph Store (either `SQLiteGraphStore` for persistence or `NetworkXStore` for in-memory).
2. **Analyzer Engine**: The core "Brain" (`AnalyzerEngine`) is instantiated and subscribed to the `sh.telemetry.traffic.v1` broker topic.
3. **Traffic Sources**: Depending on the mode, it starts either the Simulator or the Listener.
4. **API Server**: Starts a FastAPI application (`uvicorn`) on port `8000` (or `PORT` env var).

---

## 2. Traffic Generation (Where Data Comes From)

Shadow Hunter ingests network packets unified into `NetworkFlowEvent` objects.

### A. Demo Mode (Simulated Traffic)

The simulator (`services/simulator/traffic_generator.py`) generates highly realistic synthetic traffic mimicking a small corporate office.

- **Personas**: It runs 5 specific virtual employees (`Dev_Ravi`, `Designer_Priya`, `Manager_Arjun`, `DataSci_Meera`, `Intern_Kiran`).
- **Behavior Loop**: Every 2-5 seconds, an employee performs an action.
  - **Normal Web Traffic (60%+)**: Visits standard sites (GitHub, Figma, Google) simulating standard HTTPS traffic (`destination_port=443`, small requests, large responses).
  - **Internal Server Traffic**: Occasionally simulates internal subnet communication (e.g., reaching a Jira server or Database).
  - **Shadow AI Temptation (The Threat)**: Depending on their role (Interns 30%, Data Scientists 25%), they have a probability of "sneaking" unauthorized AI usage. This generates events with destination domains mapped to known AI tool IPs (e.g., ChatGPT, Copilot, Cursor).

### B. Live Mode (Real Traffic)

- Powered by `ListenerService` (`services/listener/main.py`), utilizing Scapy.
- It captures live packets on the network interface and runs them through `PacketProcessor`.
- The processor extracts IPs, ports, protocols, byte sizes, and metadata (like DNS SNI and JA3 fingerprints), condensing them into raw `NetworkFlowEvent` payloads.

**The Output**: Regardless of the source, `NetworkFlowEvent` payloads are published to the `MemoryBroker` under the topic `sh.telemetry.traffic.v1`.

---

## 3. The Processing Pipeline (`AnalyzerEngine`)

The `AnalyzerEngine` (`services/analyzer/engine.py`) sits in the middle. It subscribes to the broker and acts on every single network flow event.

### Step 3.1: Event Parsing & Basic Enrichment

- Converts raw dictionaries into `NetworkFlowEvent` schemas.
- **Node Classification**: Determines if `source_ip` and `destination_ip` are `internal` or `external`. If the destination matches recognized AI domains, it is reclassified as `shadow`.
- **GeoIP Lookup**: If the destination is external, it queries `GeoIPService` to append geographical context to the `destination_ip` node.

### Step 3.2: Graph Injection

- Graph edges and nodes are upserted efficiently using `asyncio.gather`.
- **Nodes Created**: `source_id` and `destination_id`.
- **Edge Created**: `TALKS_TO` containing properties like `protocol`, `dst_port`, `byte_count`, and `last_seen`.

### Step 3.3: Static Threat Intelligence Enrichments

If anomalous activity is detected, static enrichment occurs before alerting:

- **CIDR Threat Intelligence (`CIDRMatcher`)**: Checks the destination IP against a local database of known provider IP ranges (e.g., Microsoft Azure, Cloudflare) and retrieves compliance risk, provider name, and service type.
- **JA3 Fingerprint Matching (`JA3Matcher`)**: Evaluates the TLS JA3 hash (if present) against known malicious or unauthorized client fingerprints. It cross-references the JA3 hash with the `User-Agent` to detect **Spoofing** (e.g., a Python script pretending to be a Chrome browser).

---

## 4. Machine Learning Models (`IntelligenceEngine`)

If `use_ml=True`, the Analyzer pipes the event into the `IntelligenceEngine` (`services/intelligence/engine.py`).

### A. Feature Extraction (`FeatureExtractor`)

The `NetworkFlowEvent` is stripped of raw IPs and converted into a numeric NumPy feature vector representing byte ratios, port classifications, and payload structures.

### B. Session Tracking (`SessionAnalyzer`)

A sliding 60-minute window tracks the behavioral history of the `source_ip`. It calculates cumulative bytes, request frequency, and checks if data exfiltration patterns match against time.

### C. ML Inference (The Models)

The extracted feature vector is passed to three concurrent models:

1. **`AnomalyModel` (Isolation Forest)**: Looks for generalized structural outliers in network flow sizes/ratios. It produces a negative-to-positive float score. Lower than `-0.2` triggers a flag.
2. **`TrafficClassifier` (Random Forest Classifier)**: Specifically trained to categorize flows into classes (`normal`, `suspicious`, `shadow_ai`). It returns the classification alongside a statistical probability (`confidence`).
3. **`ShadowAutoencoder` (Deep Learning / TensorFlow)**: Reconstructs the input feature vector. If the `reconstruction_error` is higher than the 95th percentile threshold learned during training, the event is flagged. This catches completely novel zero-day shadow tools.

**Verdict Aggregation:** The engine combines these results into a unified `risk_score` (0.0 to 1.0) and generates `reasons` string arrays to explain _why_ it flagged the traffic.

**SHAP Explanations**: If the risk score exceeds `0.7`, the system utilizes SHAP (SHapley Additive exPlanations) to identify exactly which feature (e.g., "high bytes_sent on port 443") influenced the Random Forest the most.

---

## 5. Active Defense & Interrogation (`ActiveProbe`)

When the main engine generates a `CRITICAL` or `HIGH` severity alert, it delegates to `ActiveProbe` (`services/active_defense/interrogator.py`) to actively poke the suspicious destination IP.

### Protective Guards

- Never probes internal IP ranges.
- Capped at maximum probes per minute to prevent generating outbound flood patterns.
- Applies a strict 5-minute cooldown per target IP.

### Probe 1: HTTP OPTIONS

The probe does a lightweight `OPTIONS` request. It analyzes the specific headers returned (e.g., `x-ratelimit-limit`, `x-request-id`, or specific Server attributes) to identify AI-API infrastructure patterns.

### Probe 2: AI Endpoints

If the `OPTIONS` check is inconclusive, the interrogator attempts GET requests against known AI API paths (e.g., `/v1/models` or `/api/generate`). It looks for a JSON response containing terminology like `"model"`, `"completion"`, or a HTTP 401 Authorization request.

**Result**: Active Interrogation intelligence is glued onto the final alert payload, changing a "Suspicious HTTPS Outbound" alert into a "CONFIRMED AI API Hit".

---

## 6. Graph Topology Analytics (`GraphAnalyzer`)

Parallel to the real-time event flow, the `GraphAnalyzer` (`services/graph/analytics.py`) runs periodically (every ~60 seconds).
It takes the entire graph state and calculates the **Betweenness Centrality** of every node.

- **Objective**: Detect Lateral Movement.
- **Mechanism**: If a standard internal workstation suddenly maintains a top 1% centrality score matching that of a router, and communicates with heavily shielded subnets, the system fires a "Suspicious Bridge Node" lateral movement alert.
- **Whitelists**: Centrality logic aggressively whitelists recognized Gateways (e.g., `192.168.1.1` or `8.8.8.8`).

---

## 7. Reporting and Response (`ResponseManager` & `Transceiver`)

Once an alert is completely enriched (Rules + ML + JA3 + CIDR + Graph + Probe), two things happen:

1. **Auto-Response**: If the `ResponseManager` is enabled and the alert is `CRITICAL`, it automatically issues OS-level blocking commands to isolate the internal IP.
2. **Presentation**: The dictionary payload is dispatched to the FastAPI WebSocket router (`services/api/transceiver.py`), broadcasting in real-time to the React frontend dashboard where it is rendered to the user.
