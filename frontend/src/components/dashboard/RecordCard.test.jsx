import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RecordCard, RecordRow } from '../../components/dashboard/RecordCard';
import { Badge } from '../../components';

describe('RecordCard', () => {
  const mockRecords = [
    {
      id: '1',
      condition_name: 'Type 2 Diabetes Mellitus',
      diagnosed_date: '2026-10-12',
      sha256_hash: 'abc123',
    },
    {
      id: '2',
      condition_name: 'Hypertension',
      diagnosed_date: '2026-09-15',
      sha256_hash: 'def456',
    },
  ];

  it('renders title and verified badge', () => {
    render(<RecordCard title="Recent Diagnoses" records={mockRecords} />);
    expect(screen.getByText('Recent Diagnoses')).toBeInTheDocument();
    expect(screen.getByText('Blockchain Verified')).toBeInTheDocument();
  });

  it('renders record rows with data', () => {
    render(<RecordCard title="Recent Diagnoses" records={mockRecords} />);
    expect(screen.getByText('Type 2 Diabetes Mellitus')).toBeInTheDocument();
    expect(screen.getByText('Hypertension')).toBeInTheDocument();
  });

  it('formats date correctly', () => {
    render(<RecordCard title="Recent Diagnoses" records={mockRecords} />);
    expect(screen.getByText('12-10-2026')).toBeInTheDocument();
    expect(screen.getByText('15-09-2026')).toBeInTheDocument();
  });

  it('shows verified badge on each row', () => {
    render(<RecordCard title="Recent Diagnoses" records={mockRecords} />);
    const verifiedBadges = screen.getAllByText('Verified');
    expect(verifiedBadges.length).toBe(2);
  });

  it('shows verify button when onVerify provided', () => {
    const onVerify = vi.fn();
    render(<RecordCard title="Recent Diagnoses" records={mockRecords} onVerify={onVerify} />);
    const verifyButtons = screen.getAllByLabelText('Verify on blockchain');
    expect(verifyButtons.length).toBe(2);
  });

  it('calls onVerify when verify button clicked', () => {
    const onVerify = vi.fn();
    render(<RecordCard title="Recent Diagnoses" records={mockRecords} onVerify={onVerify} />);
    fireEvent.click(screen.getAllByLabelText('Verify on blockchain')[0]);
    expect(onVerify).toHaveBeenCalledWith('unknown', '1');
  });

  it('shows empty message when no records', () => {
    render(<RecordCard title="Recent Diagnoses" records={[]} emptyMessage="No diagnoses found" />);
    expect(screen.getByText('No diagnoses found')).toBeInTheDocument();
  });

  it('renders action button when provided', () => {
    const action = <button data-testid="add-btn">Add Record</button>;
    render(<RecordCard title="Recent Diagnoses" records={mockRecords} action={action} />);
    expect(screen.getByTestId('add-btn')).toBeInTheDocument();
  });

  it('renders prescription records with dosage', () => {
    const prescriptionRecords = [
      {
        id: '1',
        medication_name: 'Metformin',
        dosage_instructions: '500mg twice daily with meals',
        sha256_hash: 'abc123',
      },
    ];
    render(<RecordCard title="Prescriptions" records={prescriptionRecords} />);
    expect(screen.getByText('Metformin')).toBeInTheDocument();
    expect(screen.getByText('500mg twice daily with meals')).toBeInTheDocument();
  });

  it('renders lab result records with result value and target range', () => {
    const labRecords = [
      {
        id: '1',
        test_name: 'HbA1c',
        result_value: '6.8%',
        target_range: '< 7.0%',
        sha256_hash: 'abc123',
      },
    ];
    render(<RecordCard title="Lab Results" records={labRecords} />);
    expect(screen.getByText('HbA1c')).toBeInTheDocument();
    expect(screen.getByText('6.8% (< 7.0%)')).toBeInTheDocument();
  });
});

describe('RecordRow', () => {
  it('renders label, subtext, and value', () => {
    render(
      <RecordRow
        label="Type 2 Diabetes Mellitus"
        subtext="12-10-2026"
        value="Confirmed"
        verified={true}
      />
    );
    expect(screen.getByText('Type 2 Diabetes Mellitus')).toBeInTheDocument();
    expect(screen.getByText('12-10-2026')).toBeInTheDocument();
    expect(screen.getByText('Confirmed')).toBeInTheDocument();
  });

  it('shows verified badge when verified=true', () => {
    render(<RecordRow label="Test" verified={true} />);
    expect(screen.getByText('Verified')).toBeInTheDocument();
  });

  it('hides verified badge when verified=false', () => {
    render(<RecordRow label="Test" verified={false} />);
    expect(screen.queryByText('Verified')).not.toBeInTheDocument();
  });

  it('calls onVerify when verify button clicked', () => {
    const onVerify = vi.fn();
    render(<RecordRow label="Test" onVerify={onVerify} />);
    fireEvent.click(screen.getByLabelText('Verify on blockchain'));
    expect(onVerify).toHaveBeenCalled();
  });
});