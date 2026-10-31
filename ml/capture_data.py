"""Dataset recording CLI: Captures webcam landmarks for a designated ISL sign."""
import argparse
import json
import time
from pathlib import Path
import cv2
import numpy as np

from ml.extract_landmarks import LandmarkExtractor
from ml.normalize import process_dual_hand_landmarks

ROOT_DIR = Path(__file__).resolve().parent.parent
RAW_DIR = ROOT_DIR / "data" / "raw"
VOCAB_PATH = ROOT_DIR / "data" / "vocabulary" / "isl_vocabulary.json"


def record_samples(label: str, samples_count: int = 10, fps: int = 30):
    RAW_DIR.mkdir(parents=True, exist_ok=True)
    with open(VOCAB_PATH, "r") as f:
        vocab = json.load(f)["signs"]

    valid_labels = [s["label"] for s in vocab]
    if label not in valid_labels:
        print(f"Error: '{label}' is not in ISL vocabulary: {valid_labels}")
        return

    print(f"Initializing camera and LandmarkExtractor for sign: {label}...")
    extractor = LandmarkExtractor()
    cap = cv2.VideoCapture(0)
    if not cap.isOpened():
        print("Error: Could not open camera.")
        extractor.close()
        return

    print("--- INSTRUCTIONS ---")
    print(f"Recording {samples_count} sequences for sign '{label}'.")
    print("Press SPACE to start recording a 30-frame sequence.")
    print("Press 'q' to quit.")

    recorded = 0
    while recorded < samples_count:
        ret, frame = cap.read()
        if not ret:
            break

        hands, annotated = extractor.extract_from_bgr_frame(frame)
        cv2.putText(
            annotated,
            f"Sign: {label} | Recorded: {recorded}/{samples_count} | Press SPACE",
            (20, 40),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (0, 255, 0),
            2
        )
        cv2.imshow("SignBridge Data Collection", annotated)

        key = cv2.waitKey(1) & 0xFF
        if key == ord('q'):
            break
        elif key == 32:  # Spacebar pressed
            print(f"Recording sequence {recorded + 1}/{samples_count}...")
            seq_landmarks = []
            for _ in range(30):
                ret_f, f_frame = cap.read()
                if not ret_f:
                    break
                h_detected, _ = extractor.extract_from_bgr_frame(f_frame)
                raw_126, eng_148, meta = process_dual_hand_landmarks(h_detected)
                seq_landmarks.append(eng_148)
                time.sleep(1.0 / fps)

            if len(seq_landmarks) == 30:
                filename = RAW_DIR / f"{label}_{int(time.time())}_{recorded}.npy"
                np.save(filename, np.array(seq_landmarks, dtype=np.float32))
                print(f"Saved: {filename.name}")
                recorded += 1

    cap.release()
    cv2.destroyAllWindows()
    extractor.close()
    print(f"Recording complete. Captured {recorded} samples.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--label", type=str, required=True, help="Vocabulary label (e.g. HELLO)")
    parser.add_argument("--samples", type=int, default=10, help="Number of 30-frame samples to record")
    args = parser.parse_args()
    record_samples(args.label, args.samples)
