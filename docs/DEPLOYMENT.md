# Deployment & Operations

## Kubernetes Deployment Model

### Namespace Strategy

- `sh-system`: Control plane (API, GraphDB, Kafka).
- `sh-agents`: Data plane (DaemonSets).

### Code: `deploy/k8s/listener-ds.yaml`

```yaml
apiVersion: apps/v1
kind: DaemonSet
metadata:
  name: listener-node
  namespace: sh-agents
  labels:
    app: listener-node
spec:
  selector:
    matchLabels:
      app: listener-node
  template:
    metadata:
      labels:
        app: listener-node
    spec:
      hostNetwork: true # Required for traffic visibility
      dnsPolicy: ClusterFirstWithHostNet
      containers:
        - name: listener
          image: shadow-hunter/listener:latest
          securityContext:
            capabilities:
              add: ["NET_ADMIN", "SYS_ADMIN"] # eBPF requirements
          envFrom:
            - configMapRef:
                name: agent-config
          resources:
            limits:
              memory: "200Mi"
              cpu: "100m"
```
