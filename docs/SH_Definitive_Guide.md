# Shadow Hunter: The Definitive Guide

This document serves as the comprehensive source of truth for the Shadow Hunter Active Defense System. It details the underlying philosophy, system architecture, active defense features, machine learning algorithms, and a grain-to-grain codebase map to assist developers, security engineers, and hackathon judges in understanding the platform.

---

## Table of Contents

1. [System Philosophy & Objectives](#1-system-philosophy--objectives)
2. [Macro System Architecture](#2-macro-system-architecture)
3. [Core Feature Deep Dive](#3-core-feature-deep-dive)
4. [Machine Learning Engine](#4-machine-learning-engine)
5. [Codebase Anatomy Map](#5-codebase-anatomy-map)
6. [Database Schema](#6-database-schema)
7. [API Reference](#7-api-reference)
8. [Demo Walkthrough Script](#8-demo-walkthrough-script)
9. [Setup & Deployment](#9-setup--deployment)

---

## 1. System Philosophy & Objectives

**Shadow Hunter** is an enterprise-grade **Active Defense AI platform**, specifically engineered to counteract the proliferation of "Shadow AI"—the unauthorized, unsanctioned use of Generative AI productivity tools—and to detect sophisticated lateral movement that evades standard signature-based IDSs.

*   **Active Over Passive:** Traditional security systems rely on passive logging and rule matching. Shadow Hunter acts as an autonomous agent, probing suspicious endpoints (Interrogation) and dynamically issuing block commands (Auto-Response).
*   **Cryptographic Verification Over Metadata:** Malicious actors easily spoof `User-Agent` headers. Shadow Hunter relies on **JA3 TLS Fingerprinting** to cryptographically verify the origin client software, instantly flagging impersonation attempts.
*   **Topological Threat Analysis Over Isolated Packet Inspection:** Instead of viewing packets in isolation, the system calculates the entire network as a Force-Directed Graph, using advanced centrality math to pinpoint internal nodes acting as bridges for lateral exfiltration.

---

## 2. Macro System Architecture

Shadow Hunter employs a decoupled, event-driven microservices design, unified into a monolithic runner for simplified deployment (`run_local.py`).

### Data Flow Pipeline

1.  **Capture Layer (`sniffer.py`)**: Intercepts packets natively off the wire, parsing crucial TLS metadata (JA3, SNI) without decrypting payloads.
2.  **Message Broker (`broker.py`)**: An asynchronous Pub/Sub queue decouples high-speed packet capture from computationally intensive machine learning analysis.
3.  **Intelligence Engine (`engine.py`)**: 
    *   **Enrichment**: Appends GeoIP, ASN, and Threat Intel tagging.
    *   **Triad Detection**: Subjects telemetry to ML Models, Boolean rules, and JA3 validation.
    *   **Topography**: Mutates the SQLite-backed network graph structure.
4.  **Active Defense Module (`interrogator.py`)**: Dispatches HTTP probes to verify the nature of unclassified external targets.
5.  **Automated Response (`manager.py`)**: Seamlessly isolates and blocks IP ranges flagged as CRITICAL threats.
6.  **Control Plane (Dashboard)**: Visualizes the topological map and threat telemetry in real-time via WebSockets.

---

## 3. Core Feature Deep Dive

### Feature 1: JA3 TLS Fingerprinting Pipeline
*   **Threat Vector:** Advanced malware or custom Python scripts impersonating standard browsers (e.g., `Mozilla/5.0`) to evade web filtering.
*   **Detection Mechanism:** The sniffer uniquely hashes the TLS ClientHello (Ciphers + Extensions). 
*   **Validation Logic:** `pkg/data/ja3_intel.py` cross-references the hash against known cryptographic signatures (e.g., Cobalt Strike, raw Python requests, Trickbot). If a cryptographic mismatch with the claimed header is detected, an immediate high-confidence alert is generated.

### Feature 2: Active Interrogation Protocols
*   **Threat Vector:** Zero-day or unlisted external AI APIs used for code/data exfiltration.
*   **Detection Mechanism:** The `ActiveProbe` component transitions from passive to active. It dispatches a harmless `HTTP OPTIONS /` or targeted `GET` request to the suspect IP.
*   **Validation Logic:** Based on CORS configurations (`Access-Control-Allow-Origin`) or RESTful headers (`Allow: POST, application/json`), the system confirms the endpoint is an automated API server rather than an HTML website. Strict internal safeguards prevent probing of private subnets.

### Feature 3: Live Graph Centrality Analysis
*   **Threat Vector:** Internal lateral movement; compromised endpoints acting as pivot points.
*   **Detection Mechanism:** `GraphAnalyzer` continuously rebuilds the network topography and calculates **Betweenness Centrality** ($C_B(v) = \sum \sigma_{st}(v) / \sigma_{st}$) for every node at 60-second intervals.
*   **Validation Logic:** A sudden, statistically significant spike in centrality for a specific internal node indicates it has become an illicit relay or collection point, prioritizing it for analyst review.

### Feature 4: Autonomous Response Routing
*   **Threat Vector:** High-velocity data exfiltration necessitating zero-latency disruption.
*   **Detection Mechanism:** `ResponseManager` maintains an active, in-memory firewall blocklist.
*   **Validation Logic:** Any event breaching the CRITICAL threshold triggers an automatic 1-hour IP quarantine, actively dropping packets while cleanly bypassing whitelisted essential infrastructure.

---

## 4. Machine Learning Engine

The intelligence core relies on a Triad architecture to eliminate single points of failure.

### A. Deep Learning Autoencoder
*   **Role:** Zero-Day protocol and behavioral anomaly detection.
*   **Methodology:** Trained exclusively on standard acceptable corporate traffic, the neural network models packet size distributions and inter-arrival timing. When forced to reconstruct the unseen geometry of an unauthorized AI query, the model outputs a massive **Reconstruction Error**, flagging the event immediately.

### B. Random Forest Classifier
*   **Role:** High-confidence telemetry classification.
*   **Methodology:** A supervised model trained to categorize normalized flows into `Normal`, `Suspicious`, or `Shadow_AI` based on features like Server Name Indication (SNI), Entropy, and upstream/downstream byte asymmetry.

### C. Isolation Forest
*   **Role:** Mathematical Outlier Detection.
*   **Methodology:** Operates on the premise that anomalies are "few and different." It excels at identifying statistical deviations in volumetric data without needing prior exposure to the specific threat signature.

---

## 5. Codebase Anatomy Map

This grain-to-grain map connects logical components to physical files.

### Root Execution
*   **`run_local.py`**: The monolithic orchestrator. Launches the `MemoryBroker`, `SQLiteGraphStore`, and unified `FastAPI` instance. Supports `--live` execution for genuine packet inspection or default `DEMO` execution via `TrafficGenerator`.

### `pkg/` — Core Primitives
*   **`pkg/core/interfaces.py`**: Abstract Base Classes ensuring strict contracts for `EventBroker` and `GraphStore`.
*   **`pkg/data/ja3_intel.py`**: Houses the O(1) `JA3Matcher` and the signature database mapping TLS hashes to known software clients.
*   **`pkg/data/cidr_threat_intel.py`**: The fast-filter engine for known major AI providers (OpenAI, Anthropic).
*   **`pkg/models/events.py`**: Pydantic declarations, specifically `NetworkFlowEvent`, the universal telemetry standard internally.
*   **`pkg/infra/local/broker.py`**: The `asyncio.Queue` based event bus driving decoupling.

### `services/listener` — Interception
*   **`sniffer.py`**: Deep Packet Inspection engine utilizing Scapy. Handles `packet_callback` offloading to async queues, parsing Host headers, and extracting the critical Client Hello JA3 data.

### `services/analyzer` — Processing
*   **`engine.py` (`AnalyzerEngine`)**: The central processing loop. Enriches data, dictates Graph updates, runs concurrent Triad Detection pipelines, and manages the lifecycle of generated Alerts.
*   **`detector.py`**: The Boolean rule engine evaluating loaded logic plugins against the `NetworkFlowEvent`.

### `services/active_defense` — Validation
*   **`interrogator.py` (`ActiveProbe`)**: Executes safe external HTTP reconnaissance sequences (`probe_http_options()`, `probe_ai_endpoint()`) to fact-check the ML Engine's suspicions.

### `services/graph` — Topography
*   **`analytics.py` (`GraphAnalyzer`)**: Houses the heavily mathematical `detect_lateral_movement()` function, integrating closely with NetworkX to continuously extract Betweenness measurements.

### `services/intelligence` — ML Wrappers
*   **`engine.py` (`IntelligenceEngine`)**: Vectorizes events and distributes inference loads across the Autoencoder, Random Forest, and Isolation Forest models before fusing the risk scores.

### `services/api` — Integration & Dashboards
*   **`main.py` & Routers (`policy.py`, `discovery.py`)**: The FastAPI infrastructure providing performant REST access to the SQLite backends and WebSocket streams to the React frontend.

---

## 6. Database Schema

**Store:** `shadow_hunter.db` (SQLite3)

### Entity: `nodes`
| Column | Type | Purpose |
| :--- | :--- | :--- |
| `id` | TEXT (PK) | IPv4 Address (e.g., `10.0.0.5`) or FQDN (`api.openai.com`). |
| `labels` | TEXT | JSON Encoded Arrays (e.g., `["Node", "External"]`). |
| `properties` | TEXT | JSON Object detailing type, risk_score, and OS flags. |

### Entity: `edges`
| Column | Type | Purpose |
| :--- | :--- | :--- |
| `source` | TEXT (FK) | Originator Node ID. |
| `target` | TEXT (FK) | Destination Node ID. |
| `relation` | TEXT | Relational context (e.g., `TALKS_TO`). |
| `properties` | TEXT | JSON Object tracking `dst_port`, `byte_count`, protocol, and last active timestamp. |

---

## 7. API Reference

**Base:** `http://localhost:8000/api/v1`

### Policy & Command (`/policy`)
*   `GET /alerts` : Live operational threat feed.
*   `GET /blocked` : Currently isolated IP addresses matrix.
*   `POST /rules` : Apply dynamic firewall and alert configurations.
*   `GET /briefing` : Executive-level, natural language threat digest.

### Topography & State (`/discovery`)
*   `GET /nodes` : Total active network entities for visualization UI.
*   `GET /edges` : Relationship vectors for map rendering.
*   `GET /risk-scores` : Aggregated integer scores mapping threat topology.

---

## 8. Demo Walkthrough Script (Hackathon Judging)

**Prep:** Execute `python run_local.py` to initiate the simulation engine modeling 5 standard corporate employees.

**Phase 1: The Baseline (0:00)**
*   **Action:** Navigate to `http://localhost:5173`.
*   **Visual:** The 3D Force Graph stabilizes. Internal nodes (Blue) communicate with standard external nodes (Green).
*   **Narrative:** "The system maps the environment live. Here, the ML baseline recognizes standard operational traffic—nothing is flagged."

**Phase 2: The Anomaly (0:45)**
*   **Event:** Simulated Data Scientist initiates an unauthorized AI code push. 
*   **Visual:** Alert fires; connection edge shifting to **YELLOW**.
*   **Narrative:** "The Deep Autoencoder detected a structural payload asymmetry. Standard firewalls miss this encoded traffic, but the AI recognized the silhouette of a generative query."

**Phase 3: Active Interrogation (1:15)**
*   **Action:** Review the Intelligence Logs.
*   **Visual:** Log entry `[ACTIVE DEFENSE] Probing host...` followed by `[CONFIRMED]`.
*   **Narrative:** "Shadow Hunter didn't guess. It instantly pivoted, actively probed the destination IP, and cryptographically verified it as an AI endpoint."

**Phase 4: Auto-Remediation (1:45)**
*   **Event:** Risk Score breaches Critical limits.
*   **Visual:** Target node updates to **RED**, traffic terminates.
*   **Narrative:** "Upon verification, the system autonomously updated the internal blocklist, halting data exfiltration milliseconds after detection."

---

## 9. Setup & Deployment

### Environment Prerequisites
*   Python 3.10+
*   Node.js 18+ 
*   Npcap Driver (Windows Live Mode) or `libpcap` (Linux)

### Execution Procedures

```bash
# 1. Initialize Dependency Trees
pip install -r requirements.txt
cd services/dashboard && npm install

# 2. Launch Core Systems
# Option A: Synthetic Evaluation (Demo Mode)
python run_local.py 

# Option B: Raw Interface Capture (Live Mode) - Requires Admin/Root
python run_local.py --live

# 3. Mount Visualization Dashboard
cd services/dashboard
npm run dev
```

---
*Built for the CA Hackathon 2026. Defining the standard for AI-driven Active Network Defense.*
