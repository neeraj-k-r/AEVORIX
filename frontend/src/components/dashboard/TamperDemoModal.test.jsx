import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import TamperDemoModal from '../../components/dashboard/TamperDemoModal';
import { ToastProvider } from '../../components/Toast';
import { useBlockchainApi } from '../../hooks/useApi';

vi.mock('../../hooks/useApi', () => ({
  useBlockchainApi: () => ({
    verifyPatientRecords: vi.fn(),
    simulateTamper: vi.fn(),
  }),
}));

const renderModal = (props = {}) => {
  return render(
    <ToastProvider>
      <TamperDemoModal
        isOpen={true}
        onClose={vi.fn()}
        patientCode="AEV-2026-8941"
        userRole="Doctor"
        {...props}
      />
    </ToastProvider>
  );
};

describe('TamperDemoModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders when isOpen is true', () => {
    renderModal();
    expect(screen.getByText('Blockchain Tamper Demo')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<ToastProvider><TamperDemoModal isOpen={false} onClose={vi.fn()} patientCode="AEV-2026-8941" userRole="Doctor" /></ToastProvider>);
    expect(screen.queryByText('Blockchain Tamper Demo')).not.toBeInTheDocument();
  });

  it('shows verify all records button', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /Verify All Records/i })).toBeInTheDocument();
  });

  it('shows tamper attack button in footer', () => {
    renderModal();
    expect(screen.getByRole('button', { name: /Simulate DB Tamper Attack/i })).toBeInTheDocument();
  });

  it('calls verifyPatientRecords when verify button clicked', async () => {
    const { verifyPatientRecords } = await import('../../hooks/useApi');
    verifyPatientRecords.mockResolvedValue({
      summary: { total: 3, verified: 3, failed: 0, tampered: 0 },
      results: [],
    });

    renderModal();
    fireEvent.click(screen.getByRole('button', { name: /Verify All Records/i }));

    await waitFor(() => {
      expect(verifyPatientRecords).toHaveBeenCalledWith('AEV-2026-8941');
    });
  });

  it('shows record type selector', () => {
    renderModal();
    expect(screen.getByText('Select Record Type')).toBeInTheDocument();
  });

  it('shows record types: diagnosis, prescription, lab_result', () => {
    renderModal();
    expect(screen.getByText('🏥 Diagnosis')).toBeInTheDocument();
    expect(screen.getByText('💊 Prescription')).toBeInTheDocument();
    expect(screen.getByText('🧪 Lab Result')).toBeInTheDocument();
  });
});