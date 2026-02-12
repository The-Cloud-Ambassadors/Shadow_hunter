# Technology Stack & MCP Servers

## Technology Stack

### A) Data Ingestion Layer

- **Technology:** **Vector (Data Dog) / Fluent-bit** + **Kafka (Redpanda)**
- **Why:** Ultra-low latency, high throughput. Redpanda (C++) removes Zookeeper dependency, ideal for self-hosted enterprise stability.
- **Scaling:** Partition-based horizontal scaling.

### B) Stream Processing Layer

- **Technology:** **Apache Flink** (Stateful) or **Rust-based consumer groups**
- **Why:** Complex Event Processing (CEP) required for stitching packets into "requests". Rust provides memory safety and predictable latency for high-volume packet analysis.
- **Scaling:** Stateless worker nodes.

### C) AI / ML Layer

- **Technology:** **PyTorch** (Inference), **ONNX Runtime**
- **Why:** Standard industry support. ONNX for optimized CPU execution in the control plane to reduce GPU dependency for simple classifiers.
- **Alternatives:** TensorFlow (too heavy).

### D) Graph Engine

- **Technology:** **Neo4j** or **Memgraph**
- **Why:** Cypher query language support. Memgraph is in-memory and C++ optimized, suitable for real-time graph updates.
- **Scaling:** Read replicas for the dashboard/API.

### E) API Layer

- **Technology:** **FastAPI (Python)**
- **Why:** Native async support, automatic OpenAPI schema generation, excellent ecosystem for AI integration.
- **Scaling:** Horizontal stateless pods behind Load Balancer.

### F) Control Plane

- **Technology:** **Kubernetes (actions via Operator pattern)**
- **Why:** Native reconciliation loops.

### G) Storage Layer

- **Technology:** **ClickHouse** (Logs/Telemetry), **PostgreSQL** (Metadata/User Config)
- **Why:** ClickHouse is unmatched for OLAP on log data. Postgres for relational reliability.

### H) Dashboard

- **Technology:** **React**, **Tailwind CSS**, **Recharts** / **Cytoscape.js** (Graph Viz)
- **Why:** Standard modern web stack. Cytoscape is essential for visualizing the dependency graph.

### I) Infrastructure-as-Code

- **Technology:** **Terraform**, **Helm Charts**
- **Why:** Cloud-agnostic infrastructure provisioning.

---

## MCP Servers Required

These components expose valid Model Context Protocol (MCP) interfaces for the "Shadow Hunter" agent to utilize autonomously.

1.  **Listener Node (MCP Tool: `fetch_traffic_stats`)**
    - **Responsibility:** Aggregates passive traffic stats from eBPF probes.
    - **Auth:** mTLS.
2.  **Interrogator Node (MCP Tool: `probe_service`)**
    - **Responsibility:** Safely sends crafting payloads to unknown endpoints to determine protocol (HTTP/gRPC) and potential LLM signatures (e.g., prompt injection probing).
    - **Auth:** mTLS, specific role permissions.
3.  **Graph Engine Node (MCP Tool: `query_dependency_graph`)**
    - **Responsibility:** Interfaces with the graph DB to answer "Who talks to whom?".
4.  **Risk Engine (MCP Tool: `assess_risk_score`)**
    - **Responsibility:** Calculates risk based on behavior anomalies and policy.
