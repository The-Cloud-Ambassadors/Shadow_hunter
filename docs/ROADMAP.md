# Build Roadmap

## Phase 1: MVP (Hackathon/Proof of Concept)

- **Goal:** Detect one unauthorized HTTP inference loop.
- **Deliverables:**
  1.  Deploy `listener` (simple pcap wrapper) to a Kind cluster.
  2.  Ingest HTTP headers to Postgres.
  3.  Dashboard showing "Service A -> Service B".
  4.  Alert if Service B is not in "Known Allowlist".
- **Risk:** Noise from health checks.

## Phase 2: Production Core (Commercial)

- **Goal:** Enterprise stable, cloud-agnostic.
- **Deliverables:**
  1.  Replace pcap with eBPF (Cilium/Ebpf-go).
  2.  Introduce Kafka/Redpanda.
  3.  Implement GraphDB (Neo4j).
  4.  Secure API with Auth0/OIDC.

## Phase 3: Advanced Intelligence

- **Goal:** Active Interrogation & AI Classification.
- **Deliverables:**
  1.  Deploy `interrogator` agent.
  2.  Train LSTM model on normal traffic patterns.
  3.  Integrate "Prompt Injection" classifier for inputs.

## Phase 4: Autonomous Mitigation

- **Goal:** The "Immune System".
- **Deliverables:**
  1.  K8s NetworkPolicy operator.
  2.  Automated quarantine of "Shadow" pods.
