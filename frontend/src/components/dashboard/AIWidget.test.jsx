import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import AIWidget from '../../components/dashboard/AIWidget';
import { ToastProvider } from '../../components/Toast';
import { useAiApi } from '../../hooks/useApi';

vi.mock('../../hooks/useApi', () => ({
  useAiApi: () => ({
    aiQuery: vi.fn(),
    aiQuickPrompts: vi.fn(),
    aiRiskAnalysis: vi.fn(),
    aiRiskContributions: vi.fn(),
  }),
}));

const renderWidget = (props = {}) => {
  return render(
    <ToastProvider>
      <AIWidget patientCode="AEV-2026-8941" {...props} />
    </ToastProvider>
  );
};

describe('AIWidget', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the AI Clinical Assistant header', () => {
    renderWidget();
    expect(screen.getByText('AI Clinical Assistant')).toBeInTheDocument();
    expect(screen.getByText('RAG Query & XAI Risk Insights')).toBeInTheDocument();
  });

  it('shows two tabs: Query and XAI Risk', () => {
    renderWidget();
    expect(screen.getByText('Query')).toBeInTheDocument();
    expect(screen.getByText('XAI Risk')).toBeInTheDocument();
  });

  it('defaults to Query tab', () => {
    renderWidget();
    expect(screen.getByPlaceholderText('Ask about diagnoses, medications, labs, allergies...')).toBeInTheDocument();
  });

  it('shows quick prompts', () => {
    const { aiQuickPrompts } = require('../../hooks/useApi');
    aiQuickPrompts.mockResolvedValue({ prompts: ['Test prompt 1', 'Test prompt 2'] });
    
    renderWidget();
    expect(screen.getByText('Test prompt 1')).toBeInTheDocument();
  });

  it('switches to XAI Risk tab when clicked', () => {
    renderWidget();
    fireEvent.click(screen.getByText('XAI Risk'));
    expect(screen.getByText('Generate Risk Analysis')).toBeInTheDocument();
  });

  it('sends query when enter pressed', async () => {
    const { aiQuery } = require('../../hooks/useApi');
    aiQuery.mockResolvedValue({
      answer: 'Test answer',
      sources: [],
      confidence: 0.9,
      retrieved_chunks: 1,
    });

    renderWidget();
    const input = screen.getByPlaceholderText('Ask about diagnoses, medications, labs, allergies...');
    fireEvent.change(input, { target: { value: 'What medications?' } });
    fireEvent.keyDown(input, { key: 'Enter' });

    await waitFor(() => {
      expect(aiQuery).toHaveBeenCalledWith('AEV-2026-8941', 'What medications?');
    });
  });

  it('displays risk analysis when loaded', async () => {
    const { aiRiskAnalysis, aiRiskContributions } = require('../../hooks/useApi');
    aiRiskAnalysis.mockResolvedValue({
      overall_risk_score: 42.5,
      risk_category: 'moderate',
      feature_attributions: [
        { feature: 'HbA1c (%)', value: '6.8%', contribution: 28.3, impact: 'high' },
      ],
      clinical_summary: 'Test summary',
      model_version: 'v1.0',
      generated_at: '2026-10-26T12:00:00Z',
    });
    aiRiskContributions.mockResolvedValue([
      { feature: 'HbA1c (%)', value: '6.8%', contribution: 28.3, direction: 'positive' },
    ]);

    renderWidget();
    fireEvent.click(screen.getByText('XAI Risk'));
    fireEvent.click(screen.getByText('Generate Risk Analysis'));

    await waitFor(() => {
      expect(screen.getByText('42.5%')).toBeInTheDocument();
      expect(screen.getByText('MODERATE RISK')).toBeInTheDocument();
    });
  });

  it('shows clinical summary', async () => {
    const { aiRiskAnalysis, aiRiskContributions } = require('../../hooks/useApi');
    aiRiskAnalysis.mockResolvedValue({
      overall_risk_score: 30,
      risk_category: 'moderate',
      feature_attributions: [],
      clinical_summary: 'Patient has moderate risk. HbA1c above target.',
      model_version: 'v1.0',
      generated_at: '2026-10-26T12:00:00Z',
    });
    aiRiskContributions.mockResolvedValue([]);

    renderWidget();
    fireEvent.click(screen.getByText('XAI Risk'));
    fireEvent.click(screen.getByText('Generate Risk Analysis'));

    await waitFor(() => {
      expect(screen.getByText('Clinical Summary')).toBeInTheDocument();
      expect(screen.getByText('Patient has moderate risk. HbA1c above target.')).toBeInTheDocument();
    });
  });
});