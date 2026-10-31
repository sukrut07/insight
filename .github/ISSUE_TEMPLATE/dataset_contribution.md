---
name: Dataset Contribution
about: Propose or contribute new Indian Sign Language landmark samples
title: '[DATASET] '
labels: dataset, open-data
assignees: ''
---

### Sign Label & Category
- Sign Label: [e.g. NAMASTE, EMERGENCY, MEDICINE]
- Type: [Static Pose / Dynamic Sequence]
- Hands Involved: [1 Hand / 2 Hands]
- ISLRTC Standard Alignment: [Yes / Regional Variation]

### Dataset Details
- Number of Samples: [e.g. 50 sequences]
- Number of Independent Signers: [e.g. 3 signers]
- Format: [MediaPipe Hand Landmarker 21 3D points (.npy / .json)]
- Frame Rate & Window Size: [25 FPS, 30-frame window]

### Privacy & Consent Statement
- [ ] No raw video footage containing recognizable human faces or private backgrounds is included.
- [ ] All participants provided explicit informed consent for their landmark coordinate data to be released under the Apache-2.0 license.
- [ ] Dataset has been inspected using `scripts/build_dataset.py` and validated against vocabulary schemas.
