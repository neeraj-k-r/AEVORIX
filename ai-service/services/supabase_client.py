"""
Supabase Client for AI Service
Fetches patient records for RAG and risk analysis.
"""
from typing import Dict, Any, Optional
from supabase import create_client, Client
from config import settings


class SupabaseClient:
    """Wrapper for Supabase operations"""
    
    def __init__(self, url: str, key: str):
        self.client: Client = create_client(url, key)
    
    async def get_patient(self, patient_code: str) -> Optional[Dict[str, Any]]:
        """Fetch patient by code"""
        try:
            response = self.client.table("patients")\
                .select("*")\
                .eq("patient_code", patient_code)\
                .single()\
                .execute()
            return response.data
        except Exception as e:
            print(f"Error fetching patient: {e}")
            return None
    
    async def get_patient_records(self, patient_code: str) -> Dict[str, Any]:
        """Fetch all records for a patient"""
        # First get patient ID
        patient = await self.get_patient(patient_code)
        if not patient:
            return {}
        
        patient_id = patient["id"]
        
        # Fetch all record types in parallel
        import asyncio
        
        async def fetch_table(table: str, id_field: str = "id"):
            try:
                response = self.client.table(table)\
                    .select(f"*, recorded_by:users(full_name, role), prescribed_by:users(full_name, role)")\
                    .eq("patient_id", patient_id)\
                    .execute()
                return response.data or []
            except Exception as e:
                print(f"Error fetching {table}: {e}")
                return []
        
        diagnoses, prescriptions, lab_results, access_logs = await asyncio.gather(
            fetch_table("diagnoses"),
            fetch_table("prescriptions"),
            fetch_table("lab_results"),
            fetch_table("access_logs"),
        )
        
        return {
            "diagnoses": diagnoses,
            "prescriptions": prescriptions,
            "lab_results": lab_results,
            "access_logs": access_logs,
            "allergies": patient.get("allergies", []),
        }
    
    async def get_patient_by_id(self, patient_id: str) -> Optional[Dict[str, Any]]:
        """Fetch patient by UUID"""
        try:
            response = self.client.table("patients")\
                .select("*")\
                .eq("id", patient_id)\
                .single()\
                .execute()
            return response.data
        except Exception:
            return None