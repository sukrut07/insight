# Graph Report - sign_language_identifier  (2026-10-31)

## Corpus Check
- 188 files · ~98,630 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 11 file(s) not represented in the graph (top: (none) 4, .pt 2, .example 1)

## Summary
- 1128 nodes · 2396 edges · 65 communities (28 shown, 37 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 121 edges (avg confidence: 0.89)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- Community 0
- Community 1
- Community 2
- Community 3
- Community 4
- Community 5
- Community 6
- Community 7
- Community 8
- Community 9
- Community 10
- Community 11
- Community 12
- Community 13
- Community 14
- Community 15
- Community 16
- Community 17
- Community 18
- Community 19
- Community 20
- Community 21
- Community 22
- Community 23
- Community 24
- Community 25
- Community 26
- Community 27
- Community 28
- Community 29
- Community 30
- Community 32
- Community 33
- Community 35
- Community 36
- Community 38
- Community 39
- Community 40
- Community 41
- Community 42
- Community 43
- Community 44
- Community 45
- Community 46
- Community 47
- Community 48
- Community 49
- Community 50
- Community 51
- Community 52
- Community 53
- Community 62
- Community 63

## God Nodes (most connected - your core abstractions)
1. `useStore` - 43 edges
2. `react` - 36 edges
3. `lucide-react` - 26 edges
4. `TemporalGestureClassifier` - 24 edges
5. `SignLanguageRecognizer` - 23 edges
6. `StaticGestureClassifier` - 20 edges
7. `GesturePredictor` - 20 edges
8. `ModelRequest` - 19 edges
9. `GemmaService` - 18 edges
10. `App()` - 18 edges

## Surprising Connections (you probably didn't know these)
- `test_gemma_fallback_mechanism()` --uses--> `GemmaService`  [INFERRED]
  tests/test_pipeline.py → backend/services/gemma_service.py
- `GestureService` --uses--> `GesturePredictor`  [INFERRED]
  backend/services/gesture_service.py → ml/predict.py
- `run_latency_profile()` --uses--> `TaskType`  [INFERRED]
  ml/benchmark/latency_benchmark.py → backend/services/model_orchestrator.py
- `RecognitionSession` --uses--> `GesturePredictor`  [INFERRED]
  backend/services/session_manager.py → ml/predict.py
- `test_asl_recognizer_contract()` --uses--> `ASLRecognizer`  [INFERRED]
  tests/test_model_registry.py → ml/asl/recognizer.py

## Import Cycles
- None detected.

## Communities (65 total, 37 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.06
Nodes (97): App(), CameraPermissionDialog(), CameraPermissionDialogProps, DisagreementBanner(), FeedbackModal(), InsightNavbar(), MultimodalInspector(), Navbar() (+89 more)

### Community 1 - "Community 1"
Cohesion: 0.06
Nodes (23): BaseAIProvider, DeterministicRuleProvider, extract_json_from_text(), GeminiProvider, ModelOrchestrator, ModelRequest, ModelResponse, OllamaGemmaE2BProvider (+15 more)

### Community 2 - "Community 2"
Cohesion: 0.05
Nodes (9): GestureService, GlossSegment, RecognitionStateMachine, RecognitionStatus, StructuredSentenceRepresentation, RecognitionSession, SessionManager, test_recognition_state_machine_transitions() (+1 more)

### Community 3 - "Community 3"
Cohesion: 0.07
Nodes (42): dependencies, lucide-react@^0.359.0, motion@^14.9.0, react@^18.2.0, react-dom@^18.2.0, zustand@^4.5.2, devDependencies, autoprefixer@^10.4.18 (+34 more)

### Community 4 - "Community 4"
Cohesion: 0.07
Nodes (16): faceEngine, NonManualSigningCues, handEngine, ProcessedHand, HolisticConfig, holisticEngine, HolisticFrameResult, HandOrientationInfo (+8 more)

### Community 5 - "Community 5"
Cohesion: 0.08
Nodes (16): predict_gesture(), reset_gesture_buffer(), get_active_language(), get_full_language_config(), get_language_alphabet(), get_language_vocabulary(), LanguageSelectRequest, list_languages() (+8 more)

### Community 6 - "Community 6"
Cohesion: 0.09
Nodes (8): extract_features(), TemporalFeatureBuffer, validate_feature_vector(), test_canonical_schema_dimensions(), test_extract_features_interface(), test_temporal_feature_buffer_shape(), test_validate_feature_vector_accepts_valid(), test_validate_feature_vector_rejects_mismatch()

### Community 7 - "Community 7"
Cohesion: 0.11
Nodes (17): build_and_save_dataset(), create_base_hand_pose(), generate_sign_trajectory(), load_vocabulary(), compute_finger_joint_angles(), normalize_hand_landmarks(), process_dual_hand_landmarks(), test_api_health_endpoint() (+9 more)

### Community 8 - "Community 8"
Cohesion: 0.11
Nodes (4): test_explicit_language_selection(), test_language_router_initialization(), test_no_silent_substitution(), test_sign_identification_matching()

### Community 9 - "Community 9"
Cohesion: 0.14
Nodes (15): compare_models(), get_gemma_evaluation(), get_provider_status(), handle_disagreement_action(), inspect_gesture_multimodal(), update_gemma_settings(), DisagreementActionRequest, DisagreementEvent (+7 more)

### Community 11 - "Community 11"
Cohesion: 0.11
Nodes (3): LandmarkService, record_samples(), LandmarkExtractor

### Community 12 - "Community 12"
Cohesion: 0.07
Nodes (26): context, dockerfile, interval, retries, start_period, test, timeout, build (+18 more)

### Community 13 - "Community 13"
Cohesion: 0.13
Nodes (7): evaluate_models(), TemporalGestureClassifier, train_temporal(), run.sh script, download_models.sh script, setup_mac.sh script, test_temporal_classifier_inference()

### Community 14 - "Community 14"
Cohesion: 0.15
Nodes (7): benchmark_static_model(), benchmark_temporal_model(), generate_all_reports(), write_feature_benchmark_doc(), write_model_benchmark_doc(), write_provider_benchmark_doc(), run_latency_profile()

### Community 15 - "Community 15"
Cohesion: 0.14
Nodes (4): SignLanguageRecognizer, test_asl_recognizer_contract(), test_registry_contains_supported_languages(), test_registry_unsupported_language_raises()

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (5): ISLRecognitionPipeline, PyTorchStaticMLP, StaticGestureClassifier, train_static(), test_static_classifier_inference()

### Community 17 - "Community 17"
Cohesion: 0.11
Nodes (18): compilerOptions, allowImportingTsExtensions, isolatedModules, jsx, lib, module, moduleResolution, noEmit (+10 more)

### Community 18 - "Community 18"
Cohesion: 0.22
Nodes (10): identify_sign(), orchestrate_translation(), refine_translation(), submit_feedback(), add_translation_history(), FeedbackSubmitRequest, FeedbackSubmitResponse, RecognizedSignItem (+2 more)

### Community 20 - "Community 20"
Cohesion: 0.12
Nodes (16): key, value, branch, deploy_on_push, name, region, path, services (+8 more)

### Community 22 - "Community 22"
Cohesion: 0.19
Nodes (6): extend_vocabulary(), ExtendVocabularyRequest, get_analytics(), get_health(), get_model_status(), get_vocabulary()

### Community 23 - "Community 23"
Cohesion: 0.15
Nodes (3): lifespan(), root(), serve_frontend()

### Community 25 - "Community 25"
Cohesion: 0.22
Nodes (3): recognition_websocket(), execute_model_inference(), main()

### Community 26 - "Community 26"
Cohesion: 0.22
Nodes (6): DatasetClassInfo, DatasetSummaryResponse, export_dataset_manifest(), get_dataset_summary(), record_dataset_sample(), RecordSampleRequest

### Community 32 - "Community 32"
Cohesion: 0.23
Nodes (5): delete_history(), get_history(), delete_translation_history_item(), get_all_translation_history(), test_database_and_feedback()

### Community 38 - "Community 38"
Cohesion: 0.31
Nodes (5): list_voices(), speak_text(), stop_speech(), SpeakRequest, SpeakResponse

### Community 39 - "Community 39"
Cohesion: 0.28
Nodes (3): get_db_connection(), init_db(), setup_database()

### Community 41 - "Community 41"
Cohesion: 0.29
Nodes (3): add_user_feedback(), get_feedback_count(), FeedbackService

### Community 42 - "Community 42"
Cohesion: 0.25
Nodes (7): compilerOptions, allowSyntheticDefaultImports, composite, module, moduleResolution, skipLibCheck, include

## Knowledge Gaps
- **2 isolated node(s):** `PYTHONPATH`, `PYTHONPATH`
  These have ≤1 connection - possible missing edges. (Counts symbols only; 460 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **37 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `BSLRecognizer` connect `Community 27` to `Community 30`, `Community 15`?**
  _High betweenness centrality (0.035) - this node is a cross-community bridge._
- **What connects `PYTHONPATH`, `PYTHONPATH` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.05749032614704257 - nodes in this community are weakly interconnected._
- **Why does `HolisticFeatureExtractor` connect `Community 21` to `Community 2`, `Community 6`?**
  _High betweenness centrality (0.029) - this node is a cross-community bridge._
- **Should `Community 1` be split into smaller, more focused modules?**
  _Cohesion score 0.05639097744360902 - nodes in this community are weakly interconnected._
- **Why does `GemmaService` connect `Community 10` to `Community 22`, `Community 7`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Should `Community 2` be split into smaller, more focused modules?**
  _Cohesion score 0.05263157894736842 - nodes in this community are weakly interconnected._