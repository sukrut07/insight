"""Sign-to-Text Translation Benchmark evaluating WER, CER, BLEU, and Sentence Accuracy."""
import asyncio
import re
from typing import List, Dict, Any, Tuple
import numpy as np

from backend.services.model_orchestrator import model_orchestrator, ModelRequest, TaskType


def compute_levenshtein_distance(seq1: List[str], seq2: List[str]) -> int:
    """Computes standard edit distance between two token sequences."""
    n, m = len(seq1), len(seq2)
    dp = [[0] * (m + 1) for _ in range(n + 1)]
    for i in range(n + 1):
        dp[i][0] = i
    for j in range(m + 1):
        dp[0][j] = j

    for i in range(1, n + 1):
        for j in range(1, m + 1):
            if seq1[i - 1] == seq2[j - 1]:
                dp[i][j] = dp[i - 1][j - 1]
            else:
                dp[i][j] = 1 + min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    return dp[n][m]


def compute_wer(reference: str, hypothesis: str) -> float:
    """Computes Word Error Rate between reference and hypothesis strings."""
    ref_words = re.findall(r"\w+", reference.lower())
    hyp_words = re.findall(r"\w+", hypothesis.lower())
    if not ref_words:
        return 0.0 if not hyp_words else 1.0
    dist = compute_levenshtein_distance(ref_words, hyp_words)
    return min(1.0, dist / len(ref_words))


def compute_cer(reference: str, hypothesis: str) -> float:
    """Computes Character Error Rate between reference and hypothesis strings."""
    ref_chars = list(reference.lower().replace(" ", ""))
    hyp_chars = list(hypothesis.lower().replace(" ", ""))
    if not ref_chars:
        return 0.0 if not hyp_chars else 1.0
    dist = compute_levenshtein_distance(ref_chars, hyp_chars)
    return min(1.0, dist / len(ref_chars))


def compute_bleu_1(reference: str, hypothesis: str) -> float:
    """Computes unigram BLEU-1 precision score."""
    ref_words = re.findall(r"\w+", reference.lower())
    hyp_words = re.findall(r"\w+", hypothesis.lower())
    if not hyp_words or not ref_words:
        return 0.0
    matches = sum(1 for w in hyp_words if w in ref_words)
    return matches / len(hyp_words)


BENCHMARK_PAIRS: List[Tuple[List[str], str]] = [
    (["HELLO"], "Hello!"),
    (["PLEASE", "HELP"], "Please help me."),
    (["THANK_YOU"], "Thank you."),
    (["I", "WATER", "NEED"], "I need water."),
    (["FOOD", "PLEASE"], "Please give me food."),
    (["YOU", "NAME", "WHAT"], "What is your name?"),
    (["WHERE", "HOSPITAL"], "Where is the hospital?"),
    (["YES"], "Yes."),
    (["NO"], "No."),
    (["GOODBYE"], "Goodbye!")
]


async def evaluate_translation_pipeline() -> Dict[str, Any]:
    """Runs translation benchmark comparing Gemma E4B, Gemma E2B, and Deterministic Rules."""
    providers_to_test = [
        ("Deterministic Rules", "deterministic"),
        ("Gemma 4 E2B (Fallback)", "ollama_e2b"),
        ("Gemma 4 E4B (Primary)", "ollama_e4b"),
    ]

    results = []

    for label, provider_id in providers_to_test:
        wers = []
        cers = []
        bleus = []
        latencies = []
        exact_matches = 0

        for tokens, ground_truth in BENCHMARK_PAIRS:
            req = ModelRequest(
                prompt=f"Convert recognized ISL sign sequence {tokens} into natural English.",
                system_prompt="You are iNSIGHT Sign Language Translation Engine. Output strictly JSON: {\"sentence\": \"...\"}",
                task_type=TaskType.LINGUISTIC_RECONSTRUCTION,
                structured_json=True
            )
            resp = await model_orchestrator.execute_task(req, preferred_provider=provider_id)
            latencies.append(resp.latency_ms)

            pred_sentence = ""
            if resp.parsed_json and "sentence" in resp.parsed_json:
                pred_sentence = resp.parsed_json["sentence"]
            elif resp.content:
                pred_sentence = resp.content

            wer = compute_wer(ground_truth, pred_sentence)
            cer = compute_cer(ground_truth, pred_sentence)
            bleu = compute_bleu_1(ground_truth, pred_sentence)

            wers.append(wer)
            cers.append(cer)
            bleus.append(bleu)

            clean_pred = re.sub(r"[^\w\s]", "", pred_sentence.lower()).strip()
            clean_gt = re.sub(r"[^\w\s]", "", ground_truth.lower()).strip()
            if clean_pred == clean_gt:
                exact_matches += 1

        results.append({
            "provider_name": label,
            "provider_id": provider_id,
            "mean_wer": round(float(np.mean(wers)), 3),
            "mean_cer": round(float(np.mean(cers)), 3),
            "mean_bleu_1": round(float(np.mean(bleus)), 3),
            "exact_match_accuracy": round((exact_matches / len(BENCHMARK_PAIRS)) * 100.0, 1),
            "avg_latency_ms": round(float(np.mean(latencies)), 1),
            "sample_pairs_count": len(BENCHMARK_PAIRS)
        })

    return {"benchmark_pairs": len(BENCHMARK_PAIRS), "results": results}


if __name__ == "__main__":
    res = asyncio.run(evaluate_translation_pipeline())
    import json
    print(json.dumps(res, indent=2))
