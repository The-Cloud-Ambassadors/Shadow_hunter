# Architecture Overview

Shadow Hunter operates as a hybridized **Control Plane / Data Plane** architecture, adhering to zero-trust principles.

## Core System Layers

- **Data Plane (The "Sensors"):** Distributed, lightweight agents deployed as DaemonSets (Kubernetes) or eBPF probes (VMs). These perform passive traffic analysis and active service interrogation without impacting application latency. They are stateless and push telemetry to the ingestion layer.
- **Control Plane (The "Brain"):** Centralized aggregation, analysis, and decision-making cluster. It ingests telemetry, builds the dependency graph, runs AI models for anomaly detection, and orchestrates mitigation strategies.
- **Ingestion & Processing:** deeply decoupled via Kafka. Raw network flows are processed into "conversations" and "behaviors".
- **The Loop:** Observe -> Orient (Graph) -> Decide (AI) -> Act (Mitigate).

## Architecture Diagram

```mermaid
graph TB
    subgraph "Target Cloud Environment (VPC/K8s)"
        direction TB
        AppService[Application Services]
        ShadowAI[Unknown AI Agent]

        subgraph "Data Plane (DaemonSet)"
            TrafficMirror[eBPF Traffic Mirror]
            Interrogator[Interrogator Node]
        end

        AppService --> ShadowAI
        TrafficMirror -.->|Packet Copy| AppService
        TrafficMirror -.->|Packet Copy| ShadowAI
        Interrogator -->|Active Probes| ShadowAI
    end

    subgraph "Shadow Hunter Control Plane"
        direction TB
        Ingest[Kafka Ingestion Layer]
        StreamProc[Stream Processor (Flink/Rust)]

        subgraph "Intelligence Core"
            GraphDB[(Causal Graph DB)]
            BehaviorEng[Behavioral Engine (LSTM)]
            RiskEng[Risk Engine]
        end

        API[Control Plane API]
        Dashboard[Admin Dashboard]

        TrafficMirror -->|NetFlow/PCAP| Ingest
        Interrogator -->|Probe Results| Ingest
        Ingest --> StreamProc
        StreamProc --> BehaviorEng
        StreamProc --> GraphDB
        BehaviorEng --> RiskEng
        RiskEng --> API
        API --> Dashboard
        API -->|Mitigation Commands| Interrogator
    end
```
