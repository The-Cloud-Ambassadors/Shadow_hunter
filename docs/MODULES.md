# Modular System Breakdown

The codebase is organized into modules with clear responsibilities, following a clean architecture pattern.

```text
shadow_hunter/
├── cmd/                    # Entrypoints
├── pkg/                    # Core libraries
│   ├── ingestion/          # Kafka consumers, Protocol decoding
│   ├── graph/              # GraphDB adapters, Topology logic
│   ├── analysis/           # AI models, Heuristics engine
│   ├── interrogation/      # Active probing logic
│   └── k8s/                # Kubernetes controllers/operators
├── services/               # Microservices
│   ├── listener/           # Traffic capture agent (eBPF wrapper)
│   ├── analyzer/           # Stream processor & AI inference
│   ├── api/                # Control Plane API
│   └── dashboard/          # Frontend assets
├── deploy/                 # Helm charts, Terraform
└── api/                    # Proto/OpenAPI definitions
```

## Module Responsibilities

- **cmd/**: Main applications for each service. Minimal logic, mostly wiring and startup.
- **pkg/**: Shared libraries and core domain logic.
  - **ingestion**: Handling data from Kafka, protocol parsing (HTTP, gRPC, DNS).
  - **graph**: Interactions with Neo4j/Memgraph.
  - **analysis**: The logic for anomaly detection and behavioral fingerprinting.
  - **interrogation**: Logic for active probing safety checks and payload generation.
- **services/**: The deployable units.
  - **listener**: The data plane agent.
  - **analyzer**: The intelligence worker.
  - **api**: The REST/gRPC interface for the control plane.
- **deploy/**: All infrastructure definitions.
