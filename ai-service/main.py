"""
AEVORIX AI Service - RAG Medical Query & XAI Risk Analysis
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import logging

from config import settings
from rag.pipeline import RAGPipeline
from xai.risk_analyzer import RiskAnalyzer
from services.supabase_client import SupabaseClient

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global instances
rag_pipeline: Optional[RAGPipeline] = None
risk_analyzer: Optional[RiskAnalyzer] = None
supabase_client: Optional[SupabaseClient] = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global rag_pipeline, risk_analyzer, supabase_client
    
    logger.info("Starting AEVORIX AI Service...")
    
    # Initialize Supabase client
    supabase_client = SupabaseClient(
        url=settings.SUPABASE_URL,
        key=settings.SUPABASE_SERVICE_ROLE_KEY
    )
    
    # Initialize RAG Pipeline
    rag_pipeline = RAGPipeline(
        embedding_model=settings.EMBEDDING_MODEL,
        embedding_dim=settings.EMBEDDING_DIM,
        top_k=settings.TOP_K_RETRIEVAL,
        similarity_threshold=settings.SIMILARITY_THRESHOLD,
        gemini_api_key=settings.GEMINI_API_KEY,
        ollama_base_url=settings.OLLAMA_BASE_URL,
        ollama_model=settings.OLLAMA_MODEL,
    )
    
    # Initialize Risk Analyzer
    risk_analyzer = RiskAnalyzer(
        model_version=settings.RISK_MODEL_VERSION,
    )
    
    logger.info("AI Service initialized successfully")
    yield
    
    logger.info("Shutting down AI Service...")


app = FastAPI(
    title="AEVORIX AI Service",
    description="RAG Medical Query & Explainable AI Risk Analysis for EHR",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS.split(","),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Dependency injection
def get_rag_pipeline() -> RAGPipeline:
    if rag_pipeline is None:
        raise HTTPException(status_code=503, detail="RAG pipeline not initialized")
    return rag_pipeline


def get_risk_analyzer() -> RiskAnalyzer:
    if risk_analyzer is None:
        raise HTTPException(status_code=503, detail="Risk analyzer not initialized")
    return risk_analyzer


def get_supabase_client() -> SupabaseClient:
    if supabase_client is None:
        raise HTTPException(status_code=503, detail="Supabase client not initialized")
    return supabase_client


# Health check
@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "AEVORIX AI Service",
        "version": "1.0.0",
        "rag_ready": rag_pipeline is not None,
        "xai_ready": risk_analyzer is not None,
    }


# ==================== RAG Medical Query Endpoints ====================

class MedicalQueryRequest(BaseModel):
    """Request model for medical queries"""
    patient_code: str = Field(..., description="Patient code (e.g., AEV-2026-8941)")
    query: str = Field(..., description="Natural language medical question")
    use_llm: bool = Field(default=True, description="Whether to use LLM for answer generation")
    temperature: float = Field(default=0.3, ge=0.0, le=1.0, description="LLM temperature")


class MedicalQueryResponse(BaseModel):
    """Response model for medical queries"""
    answer: str
    sources: List[Dict[str, Any]]
    confidence: float
    retrieved_chunks: int
    patient_code: str
    query: str


@app.post("/api/ai/query", response_model=MedicalQueryResponse)
async def medical_query(
    request: MedicalQueryRequest,
    rag: RAGPipeline = Depends(get_rag_pipeline),
    db: SupabaseClient = Depends(get_supabase_client),
):
    """
    Answer medical questions using RAG pipeline.
    Retrieves relevant patient records and generates grounded answers.
    """
    try:
        # Fetch patient records
        records = await db.get_patient_records(request.patient_code)
        
        if not records:
            raise HTTPException(status_code=404, detail="Patient not found or no records available")
        
        # Process query through RAG pipeline
        result = await rag.query(
            patient_code=request.patient_code,
            query=request.query,
            records=records,
            use_llm=request.use_llm,
            temperature=request.temperature,
        )
        
        return MedicalQueryResponse(
            answer=result["answer"],
            sources=result["sources"],
            confidence=result["confidence"],
            retrieved_chunks=result["retrieved_chunks"],
            patient_code=request.patient_code,
            query=request.query,
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Medical query error: {e}")
        raise HTTPException(status_code=500, detail=f"Query processing failed: {str(e)}")


class QuickPromptRequest(BaseModel):
    """Request for quick prompt suggestions"""
    patient_code: str
    category: Optional[str] = Field(default=None, description="Category: medications, conditions, labs, allergies, general")


class QuickPromptResponse(BaseModel):
    """Quick prompt suggestions"""
    prompts: List[str]


@app.post("/api/ai/quick-prompts", response_model=QuickPromptResponse)
async def get_quick_prompts(
    request: QuickPromptRequest,
    db: SupabaseClient = Depends(get_supabase_client),
):
    """Get contextual quick prompts based on patient's records"""
    records = await db.get_patient_records(request.patient_code)
    
    if not records:
        return QuickPromptResponse(prompts=[
            "What are the patient's current diagnoses?",
            "What medications is the patient taking?",
            "What are the latest lab results?",
            "Does the patient have any allergies?",
        ])
    
    # Generate contextual prompts based on available data
    prompts = []
    
    if records.get("diagnoses"):
        prompts.extend([
            "Summarize the patient's active diagnoses",
            "What is the timeline of the patient's diagnoses?",
            "Are there any related conditions?",
        ])
    
    if records.get("prescriptions"):
        prompts.extend([
            "List all current medications with dosages",
            "Are there any drug interactions?",
            "What is the medication schedule?",
        ])
    
    if records.get("lab_results"):
        prompts.extend([
            "Interpret the latest lab results",
            "Are any values outside normal range?",
            "Show lab trends over time",
        ])
    
    if records.get("allergies"):
        prompts.extend([
            "What are the patient's allergies?",
            "Are any medications contraindicated due to allergies?",
        ])
    
    # General prompts
    prompts.extend([
        "Provide a complete clinical summary",
        "What are the key risk factors?",
        "What follow-up actions are recommended?",
    ])
    
    return QuickPromptResponse(prompts=prompts[:10])


# ==================== XAI Risk Analysis Endpoints ====================

class RiskAnalysisRequest(BaseModel):
    """Request model for risk analysis"""
    patient_code: str = Field(..., description="Patient code")


class FeatureAttribution(BaseModel):
    """Single feature attribution"""
    feature: str
    value: str
    contribution: float  # Positive = increases risk, Negative = decreases risk
    impact: str  # "high", "medium", "low"


class RiskAnalysisResponse(BaseModel):
    """Response model for risk analysis"""
    patient_code: str
    overall_risk_score: float  # 0-100
    risk_category: str  # "low", "moderate", "high", "critical"
    feature_attributions: List[FeatureAttribution]
    clinical_summary: str
    model_version: str
    generated_at: str


@app.post("/api/ai/xai-risk", response_model=RiskAnalysisResponse)
async def analyze_cardiometabolic_risk(
    request: RiskAnalysisRequest,
    risk: RiskAnalyzer = Depends(get_risk_analyzer),
    db: SupabaseClient = Depends(get_supabase_client),
):
    """
    Calculate cardiometabolic complication risk with SHAP-style feature attributions.
    """
    try:
        # Fetch patient data
        patient = await db.get_patient(request.request.patient_code)
        records = await db.get_patient_records(request.patient_code)
        
        if not patient:
            raise HTTPException(status_code=404, detail="Patient not found")
        
        # Extract features from records
        features = extract_risk_features(patient, records)
        
        # Calculate risk score and attributions
        result = await risk.analyze(features)
        
        return RiskAnalysisResponse(
            patient_code=request.patient_code,
            overall_risk_score=result["risk_score"],
            risk_category=result["risk_category"],
            feature_attributions=result["attributions"],
            clinical_summary=result["clinical_summary"],
            model_version=result["model_version"],
            generated_at=result["generated_at"],
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Risk analysis error: {e}")
        raise HTTPException(status_code=500, detail=f"Risk analysis failed: {str(e)}")


class FeatureContribution(BaseModel):
    """Feature contribution for visualization"""
    feature: str
    value: str
    contribution: float
    direction: str  # "positive" or "negative"


@app.get("/api/ai/xai-risk/{patient_code}/contributions", response_model=List[FeatureContribution])
async def get_feature_contributions(
    patient_code: str,
    risk: RiskAnalyzer = Depends(get_risk_analyzer),
    db: SupabaseClient = Depends(get_supabase_client),
):
    """Get feature contributions for horizontal bar chart visualization"""
    patient = await db.get_patient(patient_code)
    records = await db.get_patient_records(patient_code)
    
    if not patient:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    features = extract_risk_features(patient, records)
    result = await risk.analyze(features)
    
    contributions = []
    for attr in result["attributions"]:
        contributions.append(FeatureContribution(
            feature=attr["feature"],
            value=attr["value"],
            contribution=abs(attr["contribution"]),
            direction="positive" if attr["contribution"] > 0 else "negative",
        ))
    
    return contributions


# ==================== Helper Functions ====================

def extract_risk_features(patient: Dict, records: Dict) -> Dict[str, Any]:
    """Extract structured features from patient records for risk modeling"""
    features = {
        "age": patient.get("age", 50),
        "bmi": 29.4,  # Would come from vitals in real implementation
    }
    
    # Extract HbA1c from lab results
    for lab in records.get("lab_results", []):
        if "hba1c" in lab.get("test_name", "").lower():
            try:
                features["hba1c"] = float(lab["result_value"].replace("%", ""))
            except:
                pass
        if "egfr" in lab.get("test_name", "").lower():
            try:
                features["egfr"] = float(lab["result_value"].replace("mL/min", "").strip())
            except:
                pass
    
    # Check for diabetes diagnosis
    features["diabetes"] = any(
        "diabetes" in d.get("condition_name", "").lower() 
        for d in records.get("diagnoses", [])
    )
    
    # Check for hypertension
    features["hypertension"] = any(
        "hypertension" in d.get("condition_name", "").lower() 
        for d in records.get("diagnoses", [])
    )
    
    # Medication adherence (simplified)
    features["medication_adherence"] = 0.85
    
    # Allergies
    features["allergies"] = patient.get("allergies", [])
    
    return features


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
    )