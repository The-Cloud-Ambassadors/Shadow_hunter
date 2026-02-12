# AI & Intelligence Engine

## Architecture

### Why LSTM vs Transformer?

- **Choice:** LSTM (Long Short-Term Memory).
- **Reasoning:** Network traffic is a time-series sequence. We need to detect "sequences" of calls (e.g., A -> B -> C -> A loop). Transformers are heavier (O(N^2)) and better for NLP; LSTMs are sufficient and computationally cheaper for sequential anomaly detection in numerical/categorical flow data.

## Behavioral Fingerprinting

- We vectorize a service's behavior: `[AvgPacketSize, BurstRate, Ratio_In_Out, Protocol_Entropy]`.
- **Unsupervised Learning:** Isolation Forest to detect outliers (services deviating from their own historical baseline).

## False Positive Reduction

- **Human-in-the-Loop:** "Anomalies" are flagged as "Draft Incidents". Admin confirms/rejects. Model retrains on this feedback loop (Active Learning).
