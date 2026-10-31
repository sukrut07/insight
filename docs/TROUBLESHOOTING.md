# SignBridge Troubleshooting Guide

This guide covers common issues, diagnostics, and recovery steps when running SignBridge locally on macOS.

---

## 1. Camera & Video Stream Issues

### Issue: "Browser cannot access webcam"
- **Cause**: macOS privacy permissions or browser denied access to the camera.
- **Solution**:
  1. Open **System Settings** > **Privacy & Security** > **Camera**.
  2. Ensure your browser (Chrome/Safari/Brave) is toggled **ON**.
  3. In the browser URL bar, click the camera icon to allow webcam access for `localhost:5173`.

### Issue: "MediaPipe detects 0 hands"
- **Causes**:
  - Distance too far (> 2 meters from camera).
  - Low lighting or hand blurred by rapid motion.
  - Hand partially cropped outside camera viewport.
- **Diagnostics**:
  - Check the Live Indicator in the SignBridge UI: it displays whether 0, 1, or 2 hands are detected.
  - Keep hand within 0.5m – 1.2m of camera with fingers clearly spread and palms visible.

---

## 2. Ollama & Gemma Issues

### Issue: "Ollama connection refused at localhost:11434"
- **Cause**: The Ollama background process is terminated or paused.
- **Fix**:
  ```bash
  # Check if Ollama is running
  pgrep ollama
  # Start Ollama service
  ollama serve
  ```

### Issue: "Ollama out of memory on macOS"
- **Cause**: Simultaneous execution of multiple heavy local models under memory pressure.
- **Fix**:
  - SignBridge automatically prioritizes `gemma4:e4b` and falls back to `gemma4:e2b`.
  - If unified RAM is constrained, unload inactive models:
    ```bash
    ollama stop gemma4:e4b
    ```
  - SignBridge seamlessly continues in offline literal token mode even if LLMs are unavailable.

---

## 3. PyTorch & Metal (MPS) Acceleration

### Issue: "UserWarning: MPS not available"
- **Cause**: Incompatible torch wheel or Intel Mac architecture.
- **Fix**:
  SignBridge automatically tests `torch.backends.mps.is_available()`. If false, it falls back to CPU vectorization without user intervention.

---

## 4. Audio & Text-to-Speech

### Issue: "pyttsx3 fails or sound hangs on macOS"
- **Cause**: macOS sandbox or missing NSSpeechSynthesizer binding.
- **Fix**:
  SignBridge backend includes a native fallback to the macOS `/usr/bin/say` command via an asynchronous sub-process, ensuring zero-configuration audio playback on any Mac.
