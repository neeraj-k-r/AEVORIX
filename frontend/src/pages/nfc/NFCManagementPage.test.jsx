import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import NFCManagementPage from '../../pages/nfc/NFCManagementPage';
import { ToastProvider } from '../../components/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { usePatientsApi, useBlockchainApi } from '../../hooks/useApi';
import { BrowserRouter } from 'react-router-dom';

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: '1', role: 'Doctor', full_name: 'Dr. Test' },
  }),
}));

vi.mock('../../hooks/useApi', () => ({
  usePatientsApi: () => ({
    getPatient: vi.fn(),
  }),
  useBlockchainApi: () => ({
    verifyPatientRecords: vi.fn(),
  }),
}));

const renderPage = () => {
  return render(
    <BrowserRouter>
      <ToastProvider>
        <NFCManagementPage />
      </ToastProvider>
    </BrowserRouter>
  );
};

describe('NFCManagementPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders the page header', () => {
    renderPage();
    expect(screen.getByText('NFC Card Management')).toBeInTheDocument();
    expect(screen.getByText('Configure, verify, and link secure NFC patient cards to the blockchain')).toBeInTheDocument();
  });

  it('shows the left column with card reader section', () => {
    renderPage();
    expect(screen.getByText('TAP NTAG215 CARD ON READER')).toBeInTheDocument();
    expect(screen.getByText('PN532 Reader: Ready (Simulated Mode)')).toBeInTheDocument();
  });

  it('shows the Scan NFC Card button', () => {
    renderPage();
    expect(screen.getByRole('button', { name: /Scan NFC Card/i })).toBeInTheDocument();
  });

  it('shows the NFC status toggle', () => {
    renderPage();
    expect(screen.getByRole('checkbox')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('shows empty state when no card scanned', () => {
    renderPage();
    expect(screen.getByText('No Card Scanned')).toBeInTheDocument();
    expect(screen.getByText('Rahul Sharma')).toBeInTheDocument();
    expect(screen.getByText('AEV-2026-8941')).toBeInTheDocument();
    expect(screen.getByText('04:A3:B2:C1:D0:9E')).toBeInTheDocument();
  });

  it('simulates card scan when button clicked', async () => {
    renderPage();
    const scanButton = screen.getByRole('button', { name: /Scan NFC Card/i });
    
    fireEvent.click(scanButton);
    
    // During scanning
    expect(screen.getByText('Scanning...')).toBeInTheDocument();
    expect(screen.getByText('PN532 Reader: Scanning...')).toBeInTheDocument();
    
    // Advance timers past the 1.5s delay
    await vi.advanceTimersByTimeAsync(1500);
    
    // After scan
    expect(screen.getByText('Re-scan Card')).toBeInTheDocument();
    expect(screen.getByText('PN532 Reader: Card Detected')).toBeInTheDocument();
    expect(screen.getByText('Rahul Sharma')).toBeInTheDocument();
    expect(screen.getByText('AEV-2026-8941')).toBeInTheDocument();
    expect(screen.getByText('04:A3:B2:C1:D0:9E')).toBeInTheDocument();
  });

  it('shows patient profile after scan', async () => {
    renderPage();
    const scanButton = screen.getByRole('button', { name: /Scan NFC Card/i });
    fireEvent.click(scanButton);
    await vi.advanceTimersByTimeAsync(1500);
    
    expect(screen.getByText('LINKED PATIENT PROFILE')).toBeInTheDocument();
    expect(screen.getByText('Patient Name')).toBeInTheDocument();
    expect(screen.getByText('Patient ID')).toBeInTheDocument();
    expect(screen.getByText('Card UID')).toBeInTheDocument();
    expect(screen.getByText('NFC Status')).toBeInTheDocument();
  });

  it('shows action buttons after scan', async () => {
    renderPage();
    const scanButton = screen.getByRole('button', { name: /Scan NFC Card/i });
    fireEvent.click(scanButton);
    await vi.advanceTimersByTimeAsync(1500);
    
    expect(screen.getByRole('button', { name: /Save & Sync to Blockchain/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Unlink \/ Block Lost Card/i })).toBeInTheDocument();
  });

  it('toggles NFC status when switch clicked', async () => {
    renderPage();
    const scanButton = screen.getByRole('button', { name: /Scan NFC Card/i });
    fireEvent.click(scanButton);
    await vi.advanceTimersByTimeAsync(1500);
    
    const toggle = screen.getByRole('checkbox');
    expect(toggle).toBeChecked();
    
    fireEvent.click(toggle);
    expect(toggle).not.toBeChecked();
  });
});