"""Direct live validation of Ollama gemma4:e4b (primary) and gemma4:e2b (fallback)."""
import asyncio
import json
import time
import httpx

OLLAMA_URL = "http://localhost:11434"

async def test_model(model_tag: str, prompt: str, structured_json: bool = True):
    print(f"\n=======================================================")
    print(f"Testing Live Inference: {model_tag}")
    print(f"=======================================================")
    
    payload = {
        "model": model_tag,
        "prompt": prompt,
        "stream": False,
        "options": {
            "temperature": 0.1,
            "num_predict": 150
        }
    }
    if structured_json:
        payload["format"] = "json"

    t0 = time.perf_counter()
    async with httpx.AsyncClient(timeout=120.0) as client:
        try:
            resp = await client.post(f"{OLLAMA_URL}/api/generate", json=payload)
            elapsed = time.perf_counter() - t0
            
            if resp.status_code == 200:
                data = resp.json()
                response_text = data.get("response", "").strip()
                prompt_tokens = data.get("prompt_eval_count", 0)
                eval_tokens = data.get("eval_count", 0)
                eval_duration_ms = data.get("eval_duration", 0) / 1e6
                tokens_per_sec = (eval_tokens / (eval_duration_ms / 1000.0)) if eval_duration_ms > 0 else 0
                
                print(f"STATUS: SUCCESS")
                print(f"Elapsed Time: {elapsed:.2f}s ({elapsed*1000:.1f}ms)")
                print(f"Tokens: Prompt={prompt_tokens}, Generated={eval_tokens}")
                print(f"Throughput: {tokens_per_sec:.1f} tokens/sec")
                print(f"Response Preview:\n{response_text[:300]}")
                
                # Check JSON validity if expected
                if structured_json:
                    try:
                        parsed = json.loads(response_text)
                        print("JSON Validation: PASSED (Valid structured dictionary)")
                        return {
                            "model": model_tag,
                            "status": "PASS",
                            "latency_sec": elapsed,
                            "eval_tokens": eval_tokens,
                            "tokens_per_sec": tokens_per_sec,
                            "parsed_json": parsed
                        }
                    except Exception as je:
                        print(f"JSON Validation: FAILED ({je})")
                        return {"model": model_tag, "status": "FAIL_JSON", "raw": response_text}
                return {"model": model_tag, "status": "PASS", "raw": response_text}
            else:
                print(f"STATUS: FAILED (HTTP {resp.status_code}): {resp.text}")
                return {"model": model_tag, "status": "FAIL_HTTP", "code": resp.status_code}
        except Exception as e:
            print(f"STATUS: EXCEPTION: {e}")
            return {"model": model_tag, "status": "FAIL_EXCEPTION", "error": str(e)}

async def main():
    test_prompt = """You are iNSIGHT Sign Language Intelligence Orchestrator.
Convert recognized ISL signs [HELLO, HOW, YOU] into a structured English sentence.
Output strictly JSON schema: {"sentence": "string", "confidence": float, "notes": "string"}"""

    # 1. Test Primary Model gemma4:e4b
    res_e4b = await test_model("gemma4:e4b", test_prompt, structured_json=True)
    
    # 2. Test Fallback Model gemma4:e2b
    res_e2b = await test_model("gemma4:e2b", test_prompt, structured_json=True)
    
    print("\n=======================================================")
    print("SUMMARY OF LIVE OLLAMA TESTS")
    print(f"Primary E4B:  {res_e4b['status']} (Latency: {res_e4b.get('latency_sec', 0):.2f}s, {res_e4b.get('tokens_per_sec', 0):.1f} tok/s)")
    print(f"Fallback E2B: {res_e2b['status']} (Latency: {res_e2b.get('latency_sec', 0):.2f}s, {res_e2b.get('tokens_per_sec', 0):.1f} tok/s)")
    print("=======================================================")

if __name__ == "__main__":
    asyncio.run(main())
