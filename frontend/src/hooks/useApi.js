import { useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiClient } from '../services/apiClient';

export function useApi() {
  const { isAuthenticated } = useAuth();

  const get = useCallback(async (endpoint) => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    return apiClient.get(endpoint);
  }, [isAuthenticated]);

  const post = useCallback(async (endpoint, body) => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    return apiClient.post(endpoint, body);
  }, [isAuthenticated]);

  const put = useCallback(async (endpoint, body) => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    return apiClient.put(endpoint, body);
  }, [isAuthenticated]);

  const del = useCallback(async (endpoint) => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    return apiClient.delete(endpoint);
  }, [isAuthenticated]);

  return { get, post, put, delete: del };
}

// Specific API hooks
export function usePatientsApi() {
  const { get } = useApi();

  const getPatient = useCallback(async (patientCode) => {
    return get(`/patients/${patientCode}`);
  }, [get]);

  const getPatientRecords = useCallback(async (patientCode) => {
    return get(`/patients/${patientCode}/records`);
  }, [get]);

  const getPrescriptions = useCallback(async (patientCode) => {
    return get(`/patients/${patientCode}/prescriptions`);
  }, [get]);

  const getLabResults = useCallback(async (patientCode) => {
    return get(`/patients/${patientCode}/lab-results`);
  }, [get]);

  return { getPatient, getPatientRecords, getPrescriptions, getLabResults };
}

export function useDiagnosesApi() {
  const { post } = useApi();

  const createDiagnosis = useCallback(async (data) => {
    return post('/diagnoses', data);
  }, [post]);

  return { createDiagnosis };
}

export function usePrescriptionsApi() {
  const { post } = useApi();

  const createPrescription = useCallback(async (data) => {
    return post('/prescriptions', data);
  }, [post]);

  return { createPrescription };
}

export function useLabResultsApi() {
  const { post } = useApi();

  const createLabResult = useCallback(async (data) => {
    return post('/lab-results', data);
  }, [post]);

  return { createLabResult };
}

export function useBlockchainApi() {
  const { get, post } = useApi();

  const verifyRecord = useCallback(async (recordType, recordId) => {
    return get(`/blockchain/verify/${recordType}/${recordId}`);
  }, [get]);

  const verifyPatientRecords = useCallback(async (patientCode) => {
    return get(`/patients/${patientCode}/verify-records`);
  }, [get]);

  const verifyChain = useCallback(async (patientCode) => {
    return get(`/patients/${patientCode}/verify-chain`);
  }, [get]);

  const verifySingleRecord = useCallback(async (patientCode, recordType, recordId) => {
    return get(`/patients/${patientCode}/verify/${recordType}/${recordId}`);
  }, [get]);

  const simulateTamper = useCallback(async (data) => {
    return post('/demo/simulate-tamper', data);
  }, [post]);

  return { verifyRecord, verifyPatientRecords, verifyChain, verifySingleRecord, simulateTamper };
}

export function useAccessLogsApi() {
  const { get } = useApi();

  const getAccessLogs = useCallback(async (patientCode) => {
    return get(`/access-logs/${patientCode}`);
  }, [get]);

  return { getAccessLogs };
}

export function useAiApi() {
  const { post } = useApi();
  const { isAuthenticated } = useAuth();

  // Backend API calls
  const explainRecord = useCallback(async (data) => {
    return post('/ai/explain', data);
  }, [post]);

  const queryMedical = useCallback(async (data) => {
    return post('/ai/query', data);
  }, [post]);

  // AI Service (Python FastAPI) calls
  const aiBaseUrl = import.meta.env.VITE_AI_URL || 'http://localhost:8000';
  
  const aiQuery = useCallback(async (patientCode: string, query: string) => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    const token = localStorage.getItem('aevorix_token');
    const response = await fetch(`${aiBaseUrl}/api/ai/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ patient_code: patientCode, query, use_llm: true }),
    });
    if (!response.ok) throw new Error('AI query failed');
    return response.json();
  }, [isAuthenticated]);

  const aiQuickPrompts = useCallback(async (patientCode: string) => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    const token = localStorage.getItem('aevorix_token');
    const response = await fetch(`${aiBaseUrl}/api/ai/quick-prompts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ patient_code: patientCode }),
    });
    if (!response.ok) throw new Error('Failed to get quick prompts');
    return response.json();
  }, [isAuthenticated]);

  const aiRiskAnalysis = useCallback(async (patientCode: string) => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    const token = localStorage.getItem('aevorix_token');
    const response = await fetch(`${aiBaseUrl}/api/ai/xai-risk`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ patient_code: patientCode }),
    });
    if (!response.ok) throw new Error('Risk analysis failed');
    return response.json();
  }, [isAuthenticated]);

  const aiRiskContributions = useCallback(async (patientCode: string) => {
    if (!isAuthenticated) throw new Error('Not authenticated');
    const token = localStorage.getItem('aevorix_token');
    const response = await fetch(`${aiBaseUrl}/api/ai/xai-risk/${patientCode}/contributions`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    if (!response.ok) throw new Error('Failed to get risk contributions');
    return response.json();
  }, [isAuthenticated]);

  return { explainRecord, queryMedical, aiQuery, aiQuickPrompts, aiRiskAnalysis, aiRiskContributions };
}