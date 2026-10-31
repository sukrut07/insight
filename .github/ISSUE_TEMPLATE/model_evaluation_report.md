---
name: Model Evaluation Report
about: Submit an independent benchmark or evaluation report for SignBridge models
title: '[EVAL] '
labels: evaluation, benchmark
assignees: ''
---

### Evaluated Model / Configuration
- Model Type: [Static Random Forest / Temporal Bi-LSTM / Gemma 4 E4B / Gemma 4 E2B]
- Test Split Size: [e.g. 150 sequences across 5 signers]
- Hardware Evaluated On: [e.g. Apple Silicon M4 / M3 / M2 / M1 / Linux CUDA / CPU]

### Measured Quantitative Metrics
- Top-1 Classification Accuracy: [e.g. 96.2%]
- Macro Precision: [e.g. 0.95]
- Macro Recall: [e.g. 0.94]
- Weighted F1-Score: [e.g. 0.95]
- Inference Latency (ms): [e.g. 14.2 ms]

### Gemma 4 Multimodal Visual Reasoning Results
- Disagreement Rate (%): [e.g. 4.1%]
- Structured JSON Conformance Rate (%): [e.g. 99.2%]
- Average Multimodal Verification Latency (ms): [e.g. 42 ms]

### Reproducibility Verification
- [ ] Command run: `source .venv/bin/activate && python -m ml.evaluate`
- [ ] Output metrics saved to `data/model_metrics.json`
- [ ] Automated tests passed: `pytest`
