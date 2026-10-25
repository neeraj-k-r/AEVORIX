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
  const { get } = useApi();

  const verifyRecord = useCallback(async (recordType, recordId) => {
    return get(`/blockchain/verify/${recordType}/${recordId}`);
  }, [get]);

  return { verifyRecord };
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

  const explainRecord = useCallback(async (data) => {
    return post('/ai/explain', data);
  }, [post]);

  const queryMedical = useCallback(async (data) => {
    return post('/ai/query', data);
  }, [post]);

  return { explainRecord, queryMedical };
}