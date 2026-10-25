# AEVORIX AI Service

## Overview

The AI Service is a Python FastAPI microservice that provides:
1. **RAG Medical Query Engine** - Natural language queries against patient EHR data
2. **XAI Risk Analysis** - Explainable cardiometabolic risk with SHAP feature attributions

## Architecture

```
┌─────────────────┐     ┌──────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   AI Service     │────▶│   Supabase      │
│   (React)       │     │   (FastAPI)      │     │   (PostgreSQL)  │
└─────────────────┘     └──────────────────┘     └─────────────────┘
                              │
                              ▼
                        ┌──────────────────┐
                        │   LLM Provider   │
                        │  (Gemini/Ollama) │
                        └──────────────────┘
```

## API Endpoints

### RAG Medical Query

#### POST `/api/ai/query`
Answer medical questions using RAG pipeline.

**Request:**
```json
{
  "patient_code": "AEV-2026-8941",
  "query": "What medications is the patient taking?",
  "use_llm": true,
  "temperature": 0.3
}
```

**Response:**
```json
{
  "answer": "Based on the patient's records...",
  "sources": [
    {
      "type": "prescription",
      "content_preview": "Prescription: Metformin 500mg...",
      "metadata": { "medication_name": "Metformin", ... },
      "similarity_score": 0.89
    }
  ],
  "confidence": 0.89,
  "retrieved_chunks": 3,
  "patient_code": "AEV-2026-8941",
  "query": "What medications is the patient taking?"
}
```

#### POST `/api/ai/quick-prompts`
Get contextual quick prompt suggestions.

### XAI Risk Analysis

#### POST `/api/ai/xai-risk`
Calculate cardiometabolic risk with SHAP attributions.

**Request:**
```json
{
  "patient_code": "AEV-2026-8941"
}
```

**Response:**
```json
{
  "patient_code": "AEV-2026-8941",
  "overall_risk_score": 42.5,
  "risk_category": "moderate",
  "feature_attributions": [
    {
      "feature": "HbA1c (%)",
      "value": "6.8%",
      "contribution": 28.3,
      "impact": "high"
    },
    {
      "feature": "Hypertension",
      "value": "Present",
      "contribution": 22.1,
      "impact": "high"
    },
    {
      "feature": "eGFR (mL/min)",
      "value": "84 mL/min",
      "contribution": -10.2,
      "impact": "medium"
    }
  ],
  "clinical_summary": "Patient has MODERATE cardiometabolic risk (42.5%). Key risk drivers: HbA1c (6.8%), Hypertension (Present). Protective factors: eGFR (84 mL/min). HbA1c above target (<7.0%) - consider treatment intensification.",
  "model_version": "v1.0",
  "generated_at": "2026-10-26T12:00:00Z"
}
```

#### GET `/api/ai/xai-risk/{patient_code}/contributions`
Get feature contributions for horizontal bar chart visualization.

## RAG Pipeline Details

### Document Creation
Patient records are converted to structured documents:
- **Diagnoses**: Condition name, date, recorder, blockchain hash
- **Prescriptions**: Medication, dosage, prescriber, blockchain hash
- **Lab Results**: Test name, result, target range, recorder, blockchain hash
- **Allergies**: Allergen list

### Retrieval
- Uses `sentence-transformers/all-MiniLM-L6-v2` (384-dim embeddings)
- FAISS IndexFlatIP for cosine similarity search
- Top-K retrieval with similarity threshold filtering

### Generation
- Supports Google Gemini API (primary) and Ollama (local fallback)
- Prompt includes blockchain verification status
- Cites sources with `[1], [2]` notation

## XAI Risk Model

### Features
1. **HbA1c (%)** - Glycated hemoglobin
2. **Hypertension** - Binary (0/1)
3. **Type 2 Diabetes** - Binary (0/1)
4. **eGFR (mL/min)** - Kidney function
5. **Age** - Years
6. **BMI** - Body mass index
7. **Medication Adherence** - 0-1 score

### SHAP Attributions
- Uses `shap.TreeExplainer` with XGBoost model
- Positive contribution = increases risk
- Negative contribution = decreases risk (protective)
- Impact categories: high (≥10%), medium (5-10%), low (<5%)

### Risk Categories
- **Low**: 0-19%
- **Moderate**: 20-39%
- **High**: 40-69%
- **Critical**: 70-100%

## Configuration

### Environment Variables
```bash
# Server
HOST=0.0.0.0
PORT=8000
DEBUG=true

# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-key

# LLM Providers
GEMINI_API_KEY=your-gemini-key
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3:8b

# Model Settings
EMBEDDING_MODEL=all-MiniLM-L6-v2
TOP_K_RETRIEVAL=5
SIMILARITY_THRESHOLD=0.3
```

## Running Locally

### Using Docker Compose (Recommended)
```bash
docker-compose up ai-service
```

### Manual Setup
```bash
cd ai-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

## Frontend Integration

The AI Widget is integrated into the Patient Dashboard (`/dashboard/patient/:patientCode`) as a 4th card in the bottom-right slot with two tabs:

1. **RAG Medical Query Tab**: Chat interface with quick-prompt chips
2. **XAI Risk Insights Tab**: Risk gauge + horizontal bar chart of feature attributions

## Testing

```bash
# Backend tests
cd ai-service
python -m pytest tests/

# Frontend tests
cd frontend
npm run test
```

## Security

- All endpoints require JWT authentication via `Authorization: Bearer <token>`
- Token validated against Supabase
- Role-based access control (Doctor, Nurse, Lab, Pharmacist, Admin)
- Patient data isolated by `patient_code`

## Monitoring

Health check endpoint: `GET /health`