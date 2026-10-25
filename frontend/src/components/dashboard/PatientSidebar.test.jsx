import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PatientSidebar from '../../components/dashboard/PatientSidebar';

const mockPatient = {
  patient_code: 'AEV-2026-8941',
  full_name: 'Rahul Sharma',
  blood_group: 'O+',
  allergies: ['Penicillin', 'Peanuts'],
  nfc_status: 'Active',
};

describe('PatientSidebar', () => {
  it('renders patient name and ID', () => {
    render(<PatientSidebar patient={mockPatient} activeSection="diagnoses" onSectionChange={vi.fn()} />);
    expect(screen.getByText('Patient: Rahul Sharma')).toBeInTheDocument();
    expect(screen.getByText('ID: AEV-2026-8941')).toBeInTheDocument();
  });

  it('renders blood group', () => {
    render(<PatientSidebar patient={mockPatient} activeSection="diagnoses" onSectionChange={vi.fn()} />);
    expect(screen.getByText('O+')).toBeInTheDocument();
  });

  it('renders allergies with alert badge', () => {
    render(<PatientSidebar patient={mockPatient} activeSection="diagnoses" onSectionChange={vi.fn()} />);
    expect(screen.getByText('Penicillin, Peanuts')).toBeInTheDocument();
  });

  it('renders all navigation items', () => {
    render(<PatientSidebar patient={mockPatient} activeSection="diagnoses" onSectionChange={vi.fn()} />);
    expect(screen.getByText('Medical History')).toBeInTheDocument();
    expect(screen.getByText('Treatments')).toBeInTheDocument();
    expect(screen.getByText('Diagnostics')).toBeInTheDocument();
    expect(screen.getByText('Allergies')).toBeInTheDocument();
    expect(screen.getByText('Access Logs')).toBeInTheDocument();
  });

  it('highlights active section', () => {
    render(<PatientSidebar patient={mockPatient} activeSection="prescriptions" onSectionChange={vi.fn()} />);
    const activeButton = screen.getByText('Treatments').closest('button');
    expect(activeButton).toHaveClass('bg-primary/10');
    expect(activeButton).toHaveClass('text-primary');
    expect(activeButton).toHaveClass('border-l-2');
    expect(activeButton).toHaveClass('border-primary');
  });

  it('calls onSectionChange when menu item clicked', () => {
    const onSectionChange = vi.fn();
    render(<PatientSidebar patient={mockPatient} activeSection="diagnoses" onSectionChange={onSectionChange} />);
    fireEvent.click(screen.getByText('Treatments'));
    expect(onSectionChange).toHaveBeenCalledWith('prescriptions');
  });

  it('shows ledger connected badge', () => {
    render(<PatientSidebar patient={mockPatient} activeSection="diagnoses" onSectionChange={vi.fn()} />);
    expect(screen.getByText('Ledger Connected')).toBeInTheDocument();
  });
});