import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import DashboardPatientPage from './DashboardPatientPage';
import { AuthProvider } from '../../contexts/AuthContext';
import { ToastProvider } from '../../components/Toast';
import { BrowserRouter } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Mock hooks
vi.mock('../../hooks/useApi', () => ({
  usePatientsApi: () => ({
    getPatient: vi.fn(),
    getPatientRecords: vi.fn(),
  }),
  useAccessLogsApi: () => ({
    getAccessLogs: vi.fn(),
  }),
}));

const mockPatient = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  patient_code: 'AEV-2026-8941',
  full_name: 'Rahul Sharma',
  blood_group: 'O+',
  allergies: ['Penicillin', 'Peanuts'],
  nfc_status: 'Active',
};

const mockRecords = {
  diagnoses: [
    { id: '1', condition_name: 'Type 2 Diabetes Mellitus', diagnosed_date: '2026-10-12', sha256_hash: 'abc123' },
    { id: '2', condition_name: 'Hypertension', diagnosed_date: '2026-09-15', sha256_hash: 'def456' },
  ],
  prescriptions: [
    { id: '1', medication_name: 'Metformin', dosage_instructions: '500mg twice daily with meals', sha256_hash: 'ghi789' },
    { id: '2', medication_name: 'Lisinopril', dosage_instructions: '10mg once daily in the morning', sha256_hash: 'jkl012' },
  ],
  lab_results: [
    { id: '1', test_name: 'HbA1c', result_value: '6.8%', target_range: '< 7.0%', sha256_hash: 'mno345' },
    { id: '2', test_name: 'eGFR', result_value: '84 mL/min', target_range: '> 60', sha256_hash: 'pqr678' },
  ],
};

const mockUser = {
  id: '11111111-1111-1111-1111-111111111111',
  email: 'dr.rao@aevorix.com',
  role: 'Doctor',
  full_name: 'Dr. Priya Rao',
};

const renderWithProviders = (component, { user = mockUser } = {}) => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <AuthProvider>
          {component}
        </AuthProvider>
      </ToastProvider>
    </BrowserRouter>
  );
};

describe('DashboardPatientPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders patient info in sidebar', () => {
    const { getByText } = renderWithProviders(<DashboardPatientPage />);
    expect(getByText('Patient: Rahul Sharma')).toBeInTheDocument();
    expect(getByText('ID: AEV-2026-8941')).toBeInTheDocument();
  });

  it('renders blood group and allergies', () => {
    renderWithProviders(<DashboardPatientPage />);
    expect(screen.getByText('O+')).toBeInTheDocument();
    expect(screen.getByText('Penicillin, Peanuts')).toBeInTheDocument();
  });

  it('renders navigation menu items', () => {
    renderWithProviders(<DashboardPatientPage />);
    expect(screen.getByText('Medical History')).toBeInTheDocument();
    expect(screen.getByText('Treatments')).toBeInTheDocument();
    expect(screen.getByText('Diagnostics')).toBeInTheDocument();
    expect(screen.getByText('Allergies')).toBeInTheDocument();
    expect(screen.getByText('Access Logs')).toBeInTheDocument();
  });

  it('renders diagnoses card with blockchain verified badge', () => {
    renderWithProviders(<DashboardPatientPage />);
    expect(screen.getByText('Recent Diagnoses')).toBeInTheDocument();
    expect(screen.getByText('Type 2 Diabetes Mellitus')).toBeInTheDocument();
    expect(screen.getByText('Hypertension')).toBeInTheDocument();
  });

  it('renders prescriptions card', () => {
    renderWithProviders(<DashboardPatientPage />);
    expect(screen.getByText('Active Prescriptions & Dosage')).toBeInTheDocument();
    expect(screen.getByText('Metformin')).toBeInTheDocument();
    expect(screen.getByText('Lisinopril')).toBeInTheDocument();
  });

  it('renders lab results card', () => {
    renderWithProviders(<DashboardPatientPage />);
    expect(screen.getByText('Latest Laboratory Results')).toBeInTheDocument();
    expect(screen.getByText('HbA1c')).toBeInTheDocument();
    expect(screen.getByText('eGFR')).toBeInTheDocument();
  });

  it('shows Add Record button for Doctor role', () => {
    renderWithProviders(<DashboardPatientPage />);
    expect(screen.getByRole('button', { name: /Add Record/i })).toBeInTheDocument();
  });
});