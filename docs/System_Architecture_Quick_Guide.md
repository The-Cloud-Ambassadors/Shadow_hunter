# 🏗️ Shadow Hunter: Detailed System Architecture

Shadow Hunter is a real-time, AI-driven cybersecurity pipeline built to detect unauthorized "Shadow AI" usage (e.g., employees using ChatGPT, Claude, or unauthorized code assistants).

Because employees often use these AI tools via APIs, Python scripts, or browser extensions, traditional firewalls looking for "web browsing" miss them. Shadow Hunter solves this by analyzing the _behavioral shape_ of the network traffic.

---

## 🏗️ The Four-Stage Architecture

### 1. The Capture Layer (Listener & Simulator)

**Purpose:** Sniff raw network packets off the wire and convert them into structured JSON events that the rest of the system can understand.

- **Live Mode (`services/listener`):** Uses Python's `scapy` library to hook directly into the computer's network interface (e.g., Wi-Fi or Ethernet). It captures raw packets as they fly by.
- **Demo Mode (`services/simulator`):** A sophisticated traffic generation engine. It creates "Personas" (like a Marketing Intern vs. a Data Scientist) and generates realistic fake network traffic to simulate both normal behavior and stealthy Shadow AI usage without needing a live corporate network.
- **Event Generation:** The raw packets are condensed into `NetworkFlowEvent` objects. Instead of storing the whole packet (which takes too much space), it just stores the Metadata: `source_ip`, `dest_ip`, `dest_port`, `bytes_sent`, `bytes_received`, and `duration`.
- **Message Broker (`services/broker`):** These events are instantly pushed into a central, asynchronous queue (via Python's `asyncio.Queue`) so the core engine can process thousands of events per second without dropping packets.

> 💡 **Example:**
> An employee runs a Python script that sends a prompt to Anthropic's Claude API.
> The Capture layer sees a TCP connection to `34.102.136.x`. It records that `192.168.1.5` sent `850 bytes` and received `4,200 bytes` over exactly `1.2 seconds`. It packages this info and sends it to the broker.

### 2. The Brain (Enrichment & Intelligence Engine)

**Purpose:** Pull events from the broker, figure out what they are, and assign a mathematical Risk Score.

- **CIDR Threat Intel (`pkg/data/cidr_threat_intel.py`):** Before using complex math, the system does a fast check. It matches the destination IP against a hardcoded database of known AI provider IP blocks (OpenAI, Google, Anthropic). If it matches, the event gets instantly tagged (e.g., `Provider: Anthropic`, `Risk: CRITICAL`).
- **Feature Extraction:** The system looks at the raw numbers (bytes, duration) and mathematically transforms them. For example, it calculates the "byte ratio" (bytes received ÷ bytes sent).
- **The ML Pipeline (`services/intelligence`):** The event is passed through three parallel machine learning models:
  1.  **Isolation Forest (Scikit-Learn):** A statistical model trained on millions of "normal" corporate traffic events. If the current event sits far outside the normal cluster in multi-dimensional space, it is flagged as an anomaly.
  2.  **Deep Autoencoder:** A neural network that tries to compress the event into a tiny 8-neuron bottleneck and unpack it again. Because it has only ever seen "normal" browser traffic, it utterly fails to reconstruct the weird shape of a zero-day API call. This causes a massive "Reconstruction Error," flagging the event.
  3.  **Random Forest Classifier:** A supervised model trained to look at the byte ratio and packet timing to confidently say, _"This is 99% an API call, not a web browser interacting with a page."_

> 💡 **Example:**
> The employee's Claude API call hits the Brain. The CIDR Intel confirms the IP belongs to Anthropic. The Random Forest sees a massive imbalance in byte ratio (sent a small prompt, got a massive essay back) and perfectly static timing. It flags the event with a `98%` confidence score that it is a programmatic API call, not casual web browsing.

### 3. Active Defense & Validation

**Purpose:** Confirm the ML models' suspicions to prevent false positives, and identify exactly how widely the tool is being used.

- **Active Interrogator (`services/active_defense/interrogator.py`):** If the ML models flag an IP, Shadow Hunter sends a totally harmless "knock" (an `HTTP OPTIONS` request) to that external IP. If the IP responds with headers like `Allow: POST, application/json` or restrictive automated CORS headers, Shadow Hunter catches it red-handed—proving it is an automated API server, not a normal website rendering HTML.
- **Graph Centrality Analytics (`services/graph/analytics.py`):** Builds a live mathematical map of the entire network using `networkx`. It calculates the **Betweenness Centrality** of every node. If an external IP suddenly becomes a massive "bridge" because 50 different employees are connecting to it simultaneously, the math proves it is a heavily-used shadow tool causing a corporate data leak bottleneck.

> 💡 **Example:**
> The ML engine is 98% sure the employee is using the Claude API. The Active Interrogator pings the Anthropic IP, and the IP replies `Content-Type: application/json`. Boom, confirmed. Meanwhile, the Graph Engine notices that not just one, but _five_ different internal IPs are talking to that exact same Anthropic IP. The external IP glows bright red on the network map as a major Shadow AI hub.

### 4. The Control Plane (React Dashboard & API)

**Purpose:** Provide a beautiful, real-time command center for security analysts to monitor the network and enforce company policies.

- **Backend API (`services/api`):** A blazing-fast Python `FastAPI` server. It provides REST endpoints for getting historical data, and a live WebSocket connection that pushes new threat alerts instantly.
- **Policy Engine:** Admins can write natural language rules like _"Block ChatGPT for the Finance Department."_
- **Frontend Dashboard (`services/dashboard`):** A React application styled with Tailwind CSS. It features:
  - **Live Network Topology:** A massive 2D node map (using Cytoscape.js) showing employees connecting to external servers in real time.
  - **Intel Feed:** A scrolling feed of verified threats, showing exactly who did what, when.
  - **Top Offenders:** A leaderboard of the internal IP addresses with the highest cumulative risk scores, showing the security team who to speak to first.

---

### 🛠️ Tech Stack Summary

- **Backend & Data Processing:** Python 3.12+, `FastAPI` (REST + WebSockets), `scapy` (Packet sniffing), `asyncio` (Event loops)
- **Machine Learning:** `scikit-learn` (Isolation Forest, Random Forest), `MLPRegressor` (Deep Autoencoder approximation)
- **Graph Analytics:** `networkx` (Betweenness Centrality calculations)
- **Frontend UI:** React 18, Vite, Tailwind CSS (for premium aesthetics), `lucide-react` (Icons)
- **Data Visualization:** `cytoscape.js` (Live network mapping), `recharts` (Statistical charts)
