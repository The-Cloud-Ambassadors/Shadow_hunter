# Security Architecture

## Zero-Trust Principles

- **mTLS Everywhere:** All internal communication (Agent -> Ingest, API -> Graph) is encrypted and mutually authenticated via Istio or Linkerd (optional) or native TLS certs.
- **Least Privilege:** Agents have `NET_ADMIN` only where necessary. Control plane pods have no special privileges.

## Secrets Management

- External Secrets Operator (ESO) integration with AWS Secrets Manager / Azure Key Vault. **Never** map secrets directly in env vars if possible (use volume mounts).

## Tenant Isolation

- Data tagged with `tenant_id` at the ingestion point. Vector/Kafka enforce strict separation if multi-tenant.
