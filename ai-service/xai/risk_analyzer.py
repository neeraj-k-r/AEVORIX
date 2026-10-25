"""
XAI Risk Analyzer - Cardiometabolic Complication Risk with SHAP-style Feature Attributions
Calculates risk scores and provides explainable feature contributions.
"""
import asyncio
from typing import Dict, List, Any, Optional
from datetime import datetime
import numpy as np
import shap
import xgboost as xgb
import joblib
import os

from config import settings


class RiskAnalyzer:
    """
    Explainable AI risk analyzer for cardiometabolic complications.
    Uses SHAP values for feature attribution.
    """
    
    def __init__(self, model_version: str = "v1.0"):
        self.model_version = model_version
        self.model = None
        self.explainer = None
        self.feature_names = [
            "HbA1c (%)",
            "Hypertension",
            "Type 2 Diabetes",
            "eGFR (mL/min)",
            "Age",
            "BMI",
            "Medication Adherence",
        ]
        self._load_or_create_model()
    
    def _load_or_create_model(self):
        """Load pre-trained model or create a new one"""
        model_path = f"models/risk_model_{self.model_version}.joblib"
        
        if os.path.exists(model_path):
            self.model = joblib.load(model_path)
        else:
            # Create a simple gradient boosting model for demo
            self.model = xgb.XGBRegressor(
                n_estimators=100,
                max_depth=4,
                learning_rate=0.1,
                random_state=42,
            )
            # Train on synthetic data for demo
            self._train_demo_model()
        
        # Create SHAP explainer
        self.explainer = shap.TreeExplainer(self.model)
    
    def _train_demo_model(self):
        """Train model on synthetic clinical data for demonstration"""
        np.random.seed(42)
        n_samples = 1000
        
        # Generate synthetic features
        # HbA1c: 4.5 - 12.0
        hba1c = np.random.normal(6.5, 1.2, n_samples)
        hba1c = np.clip(hba1c, 4.5, 12.0)
        
        # Hypertension: binary
        hypertension = np.random.binomial(1, 0.4, n_samples)
        
        # Diabetes: binary
        diabetes = np.random.binomial(1, 0.35, n_samples)
        
        # eGFR: 15 - 120
        egfr = np.random.normal(75, 20, n_samples)
        egfr = np.clip(egfr, 15, 120)
        
        # Age: 30 - 90
        age = np.random.normal(60, 12, n_samples)
        age = np.clip(age, 30, 90)
        
        # BMI: 18 - 45
        bmi = np.random.normal(28, 5, n_samples)
        bmi = np.clip(bmi, 18, 45)
        
        # Medication adherence: 0 - 1
        adherence = np.random.beta(8, 2, n_samples)
        
        # Target: risk score based on clinical rules
        risk = (
            (hba1c - 5.0) * 8.0 +  # HbA1c contribution
            hypertension * 15.0 +    # Hypertension contribution
            diabetes * 20.0 +        # Diabetes contribution
            np.maximum(0, (90 - egfr)) * 0.3 +  # Low eGFR risk
            (age - 50) * 0.4 +       # Age contribution
            np.maximum(0, (bmi - 25)) * 0.5 +  # BMI contribution
            (1 - adherence) * 10.0 + # Non-adherence contribution
            np.random.normal(0, 5, n_samples)  # Noise
        )
        
        risk = np.clip(risk, 0, 100)
        
        X = np.column_stack([hba1c, hypertension, diabetes, egfr, age, bmi, adherence])
        y = risk
        
        self.model.fit(X, y)
        
        # Save model
        os.makedirs("models", exist_ok=True)
        joblib.dump(self.model, f"models/risk_model_{self.model_version}.joblib")
    
    async def analyze(self, features: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze cardiometabolic risk with feature attributions.
        """
        # Prepare feature vector
        X = self._prepare_features(features)
        
        # Predict risk score
        risk_score = float(self.model.predict(X.reshape(1, -1))[0])
        risk_score = np.clip(risk_score, 0, 100)
        
        # Get SHAP values
        shap_values = self.explainer.shap_values(X.reshape(1, -1))
        
        # Process attributions
        attributions = []
        for i, feature_name in enumerate(self.feature_names):
            contribution = float(shap_values[0][i])
            feature_value = self._format_feature_value(feature_name, features)
            
            attributions.append({
                "feature": feature_name,
                "value": feature_value,
                "contribution": contribution,
                "impact": self._categorize_impact(abs(contribution)),
            })
        
        # Sort by absolute contribution
        attributions.sort(key=lambda x: abs(x["contribution"]), reverse=True)
        
        # Determine risk category
        risk_category = self._categorize_risk(risk_score)
        
        # Generate clinical summary
        clinical_summary = self._generate_clinical_summary(
            risk_score, risk_category, attributions, features
        )
        
        return {
            "risk_score": round(risk_score, 1),
            "risk_category": risk_category,
            "attributions": attributions,
            "clinical_summary": clinical_summary,
            "model_version": self.model_version,
            "generated_at": datetime.utcnow().isoformat() + "Z",
        }
    
    def _prepare_features(self, features: Dict[str, Any]) -> np.ndarray:
        """Convert feature dict to model input array"""
        X = np.zeros(len(self.feature_names))
        
        # HbA1c
        X[0] = features.get("hba1c", 6.0)
        
        # Hypertension
        X[1] = 1.0 if features.get("hypertension", False) else 0.0
        
        # Diabetes
        X[2] = 1.0 if features.get("diabetes", False) else 0.0
        
        # eGFR
        X[3] = features.get("egfr", 90.0)
        
        # Age
        X[4] = features.get("age", 50)
        
        # BMI
        X[5] = features.get("bmi", 25.0)
        
        # Medication adherence
        X[6] = features.get("medication_adherence", 0.8)
        
        return X
    
    def _format_feature_value(self, feature_name: str, features: Dict[str, Any]) -> str:
        """Format feature value for display"""
        if feature_name == "HbA1c (%)":
            return f"{features.get('hba1c', 'N/A')}%"
        elif feature_name == "Hypertension":
            return "Present" if features.get("hypertension") else "Absent"
        elif feature_name == "Type 2 Diabetes":
            return "Present" if features.get("diabetes") else "Absent"
        elif feature_name == "eGFR (mL/min)":
            return f"{features.get('egfr', 'N/A')} mL/min"
        elif feature_name == "Age":
            return f"{features.get('age', 'N/A')} years"
        elif feature_name == "BMI":
            return f"{features.get('bmi', 'N/A')} kg/m²"
        elif feature_name == "Medication Adherence":
            return f"{int(features.get('medication_adherence', 0.8) * 100)}%"
        return str(features.get(feature_name.lower().replace(" ", "_").replace("(", "").replace(")", "").replace("%", ""), "N/A"))
    
    def _categorize_impact(self, abs_contribution: float) -> str:
        """Categorize feature impact"""
        if abs_contribution >= 10:
            return "high"
        elif abs_contribution >= 5:
            return "medium"
        return "low"
    
    def _categorize_risk(self, score: float) -> str:
        """Categorize overall risk"""
        if score < 20:
            return "low"
        elif score < 40:
            return "moderate"
        elif score < 70:
            return "high"
        return "critical"
    
    def _generate_clinical_summary(
        self, 
        risk_score: float, 
        risk_category: str, 
        attributions: List[Dict],
        features: Dict
    ) -> str:
        """Generate clinical narrative summary"""
        top_factors = [a for a in attributions[:3] if a["contribution"] > 0]
        protective_factors = [a for a in attributions if a["contribution"] < -2]
        
        summary = f"Patient has a {risk_category.upper()} cardiometabolic risk ({risk_score:.1f}%). "
        
        if top_factors:
            factor_strs = [f"{f['feature']} ({f['value']})" for f in top_factors]
            summary += f"Key risk drivers: {', '.join(factor_strs)}. "
        
        if protective_factors:
            prot_strs = [f"{f['feature']} ({f['value']})" for f in protective_factors]
            summary += f"Protective factors: {', '.join(prot_strs)}. "
        
        # Specific recommendations
        if features.get("hba1c", 0) >= 7.0:
            summary += "HbA1c above target (<7.0%) - consider treatment intensification. "
        
        if features.get("hypertension"):
            summary += "Hypertension present - ensure BP control per guidelines. "
        
        if features.get("egfr", 90) < 60:
            summary += "Reduced kidney function - adjust medication dosing. "
        
        return summary.strip()


# Singleton instance
_risk_analyzer_instance: Optional[RiskAnalyzer] = None


def get_risk_analyzer(model_version: str = settings.RISK_MODEL_VERSION) -> RiskAnalyzer:
    global _risk_analyzer_instance
    if _risk_analyzer_instance is None:
        _risk_analyzer_instance = RiskAnalyzer(model_version=model_version)
    return _risk_analyzer_instance