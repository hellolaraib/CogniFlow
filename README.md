# CogniFlow — Intelligent Task-Solving Platform

CogniFlow is a precision technical instrument and dynamic task-routing platform designed to minimize unnecessary LLM token consumption. It analyzes incoming requests and routes them to deterministic algorithms, lightweight NLP, or edge language models.

---

## Supported Task Solvers & Engines

1. **Mathematical Reasoning** (`math`): Deterministic Python (SymPy / AST Evaluator) — *0-Token*
2. **Sentiment Classification** (`sentiment`): Lightweight NLP (VADER / Lexical Scorer) — *< 15ms*
3. **Named Entity Recognition** (`ner`): Pattern Matcher + SpaCy — *Hybrid*
4. **Code Debugging** (`code_debug`): AST + Local Code Model (Tree-sitter / Llama)
5. **Code Generation** (`code_gen`): Local Language Model (StarCoder / CodeLlama)
6. **Summarization** (`summarization`): Extractive / Quantized LLM (TextRank / Mistral)
7. **Logical Reasoning** (`logical`): Deterministic SMT Solver (Z3 Theorem Prover) — *0-Token*
8. **Factual Knowledge** (`factual`): Vector Index + Edge LLM (Faiss / Gemma)
- **Smart Mode** (`smart`): Automatic intent routing based on syntax / zero-shot classification.

---

## Tech Stack

- **Frontend**: React 18, Vite 5, TypeScript, Tailwind CSS
- **Design Source**: Google Stitch (`stitch_cogniflow_intelligent_solver_platform`)
- **Design System**: "Technical Precision" (dark-first `#08151c`, terminal green `#4be277`, amber `#fabc45`, Inter & JetBrains Mono)
- **Backend (Planned)**: Python + FastAPI

---

## Getting Started

### 1. Prerequisites
- Node.js >= 18 (Tested on v24.13.0)
- npm >= 9

### 2. Install Dependencies
```bash
npm install
```

### 3. Start Development Server
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 4. Build for Production
```bash
npm run build
```
Build output will be bundled in `dist/`.

---

## API Contract & Configuration

### Endpoint
`POST /solve`

### Request Payload
```json
{
  "task_type": "smart",
  "input": "Calculate 125 multiplied by 64"
}
```

### Expected Response Payload
```json
{
  "success": true,
  "task_type": "math",
  "answer": "8000",
  "solver": "python",
  "processing_time_ms": 2.1,
  "error": null
}
```

### Configuring the Backend URL
1. **Via Environment Variable**:
   Set `VITE_API_BASE_URL` in `.env` (or `.env.local`):
   ```bash
   VITE_API_BASE_URL=http://127.0.0.1:8000
   ```
2. **Via UI at Runtime**:
   Navigate to **Settings & Status** (⌥4) -> **API & Developer Gateway** -> Enter the backend URL and click **Test Ping** / **Apply Changes**.

---

## Implemented Screens

1. **Main Solver Workspace**: Task prompt textarea, 9 routing modes, real-time character & token estimator, dry-run simulation, 4 suggestion chips, and deterministic pipeline architecture diagram.
2. **Solution Results**: Telemetry status HUD (latency, tokens, memory RSS, cloud billed), collapsible query accordion, high-hierarchy typed output display, AST drawer, category tabs showcase (Math, Code, NLP, NER), and 5-step visual audit trail with raw JSON inspector.
3. **Task History**: Filter & search bar (category, engine, status, time window), interactive execution table, JSONL export, and live trace inspector split-panel.
4. **Solver Overview**: 4 hero KPI cards (total tasks, zero-token ratio, latency, savings), 8 registered engine cards, and real-time dispatch flow diagram.
5. **Settings & System Status**: Live infrastructure ping cards, routing mode selectors, confidence threshold slider, cloud fallback toggle, API gateway settings with connection testing, and cache purge actions.
