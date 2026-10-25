import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AddRecordModal from '../../components/dashboard/AddRecordModal';
import { ToastProvider } from '../../components/Toast';
import { useDiagnosesApi, usePrescriptionsApi, useLabResultsApi } from '../../hooks/useApi';

vi.mock('../../hooks/useApi', () => ({
  useDiagnosesApi: () => ({
    createDiagnosis: vi.fn(),
  }),
  usePrescriptionsApi: () => ({
    createPrescription: vi.fn(),
  }),
  useLabResultsApi: () => ({
    createLabResult: vi.fn(),
  }),
}));

const renderModal = (props = {}) => {
  return render(
    <ToastProvider>
      <AddRecordModal
        isOpen={true}
        onClose={vi.fn()}
        recordType="diagnosis"
        patientId="test-patient-id"
        userRole="Doctor"
        {...props}
      />
    </ToastProvider>
  );
};

describe('AddRecordModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders diagnosis form when recordType is diagnosis', () => {
    renderModal({ recordType: 'diagnosis' });
    expect(screen.getByText('Add Diagnosis')).toBeInTheDocument();
    expect(screen.getByLabelText('Condition Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Diagnosed Date')).toBeInTheDocument();
  });

  it('renders prescription form when recordType is prescription', () => {
    renderModal({ recordType: 'prescription' });
    expect(screen.getByText('Add Prescription')).toBeInTheDocument();
    expect(screen.getByLabelText('Medication Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Dosage Instructions')).toBeInTheDocument();
  });

  it('renders lab result form when recordType is lab_result', () => {
    renderModal({ recordType: 'lab_result' });
    expect(screen.getByText('Add Lab Result')).toBeInTheDocument();
    expect(screen.getByLabelText('Test Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Result Value')).toBeInTheDocument();
    expect(screen.getByLabelText('Target Range')).toBeInTheDocument();
  });

  it('shows validation errors for empty required fields', () => {
    renderModal({ recordType: 'diagnosis' });
    fireEvent.click(screen.getByRole('button', { name: 'Add Diagnosis' }));
    expect(screen.getByText('Condition Name is required')).toBeInTheDocument();
    expect(screen.getByText('Diagnosed Date is required')).toBeInTheDocument();
  });

  it('calls createDiagnosis on valid submit', async () => {
    const { createDiagnosis } = await import('../../hooks/useApi');
    createDiagnosis.mockResolvedValue({ id: 'new-diagnosis' });

    renderModal({ recordType: 'diagnosis' });
    fireEvent.change(screen.getByLabelText('Condition Name'), { target: { value: 'Type 2 Diabetes' } });
    fireEvent.change(screen.getByLabelText('Diagnosed Date'), { target: { value: '2026-10-26' } });
    fireEvent.click(screen.getByRole('button', { name: 'Add Diagnosis' }));

    await waitFor(() => {
      expect(createDiagnosis).toHaveBeenCalledWith({
        patient_id: 'test-patient-id',
        condition_name: 'Type 2 Diabetes',
        diagnosed_date: '2026-10-26',
      });
    });
  });

  it('shows blockchain secured badge', () => {
    renderModal({ recordType: 'diagnosis' });
    expect(screen.getByText('Blockchain Secured')).toBeInTheDocument();
  });

  it('closes on cancel button', () => {
    const onClose = vi.fn();
    renderModal({ onClose });
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(onClose).toHaveBeenCalled();
  });
});