import { useState } from 'react';
import { AlertTriangle, CheckCircle, Loader2, Terminal, Zap } from 'lucide-react';
import { Modal, Button, Badge } from '../components';
import { useToast } from '../components/Toast';
import { useBlockchainApi } from '../../hooks/useApi';

export default function TamperDemoModal({ isOpen, onClose, patientCode, userRole }) {
  const { verifyPatientRecords, simulateTamper } = useBlockchainApi();
  const { error: showError, success: showSuccess } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [tamperResult, setTamperResult] = useState(null);
  const [verificationResult, setVerificationResult] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const recordTypes = [
    { type: 'diagnosis', label: 'Diagnosis', icon: '🏥' },
    { type: 'prescription', label: 'Prescription', icon: '💊' },
    { type: 'lab_result', label: 'Lab Result', icon: '🧪' },
  ];

  const runVerification = async () => {
    setIsLoading(true);
    try {
      const result = await verifyPatientRecords(patientCode);
      setVerificationResult(result);
      if (result.summary.tampered > 0) {
        showError(`⚠ ${result.summary.tampered} record(s) tampered!`, 'error');
      } else {
        showSuccess(`✓ All ${result.summary.verified} records verified`, 'success');
      }
    } catch (err) {
      showError(err.message || 'Verification failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTamper = async () => {
    if (!selectedRecord) return;

    setIsLoading(true);
    try {
      const result = await simulateTamper({
        patient_code: patientCode,
        record_type: selectedRecord.type,
        record_id: selectedRecord.id,
        field: selectedRecord.field,
        new_value: selectedRecord.newValue,
      });
      setTamperResult(result);
      if (result.verification?.tamper_detected) {
        showError('⚠ Tamper detected! Hash mismatch proves unauthorized modification.', 'error');
      }
      await runVerification();
    } catch (err) {
      showError(err.message || 'Tamper simulation failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRecordSelect = (record) => {
    setSelectedRecord(record);
    setTamperResult(null);
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="🔬 Blockchain Tamper Demo" size="xl">
      <div className="space-y-6">
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg">
          <h4 className="font-semibold text-primary mb-2 flex items-center gap-2">
            <Zap className="w-4 h-4" />
            How It Works
          </h4>
          <p className="text-sm text-slate-600 mb-2">
            This demo simulates a database tampering attack. When a record is modified directly in PostgreSQL 
            without updating the blockchain ledger, the SHA-256 hash will no longer match.
          </p>
          <p className="text-sm text-slate-600">
            Click "Verify All Records" to see real-time integrity checking in action.
          </p>
        </div>

        <div className="flex gap-3">
          <Button 
            onClick={runVerification} 
            loading={isLoading}
            leftIcon={<Terminal className="w-4 h-4" />}
            variant="primary"
          >
            Verify All Records
          </Button>
          <Button 
            onClick={() => setVerificationResult(null)} 
            variant="ghost"
            size="sm"
          >
            Clear Results
          </Button>
        </div>

        {verificationResult && (
          <div className="space-y-4">
            <div className="grid grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                <p className="text-2xl font-bold text-green-700">{verificationResult.summary.verified}</p>
                <p className="text-xs text-green-600">Verified</p>
              </div>
              <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                <p className="text-2xl font-bold text-red-700">{verificationResult.summary.failed}</p>
                <p className="text-xs text-red-600">Failed</p>
              </div>
              <div className="p-4 bg-alert-bg rounded-lg border border-alert-text/20">
                <p className="text-2xl font-bold text-alert-text">{verificationResult.summary.tampered}</p>
                <p className="text-xs text-alert-text">Tampered</p>
              </div>
              <div className="p-4 bg-slate-50 rounded-lg border border-slate-200">
                <p className="text-2xl font-bold text-slate-700">{verificationResult.summary.total}</p>
                <p className="text-xs text-slate-500">Total</p>
              </div>
            </div>

            <div className="max-h-64 overflow-y-auto space-y-2">
              {verificationResult.results.map((result, idx) => (
                <div 
                  key={idx}
                  className={`p-3 rounded-lg border flex items-center justify-between gap-4 ${
                    result.verified 
                      ? 'bg-green-50 border-green-200' 
                      : 'bg-red-50 border-red-200'
                  }`}
                  onClick={() => handleRecordSelect({ ...result.record, type: result.record_type })}
                >
                  <div className="flex items-center gap-3">
                    {result.verified ? (
                      <CheckCircle className="w-5 h-5 text-green-600" />
                    ) : (
                      <AlertTriangle className="w-5 h-5 text-red-600" />
                    )}
                    <div>
                      <p className="font-medium text-slate-900 capitalize">{result.record_type.replace('_', ' ')}</p>
                      <p className="text-xs text-slate-500 font-mono">{result.record?.id?.slice(0, 8)}...</p>
                    </div>
                  </div>
                  <Badge variant={result.verified ? 'verification' : 'alert'}>
                    {result.verified ? '✓ Verified' : '⚠ Tampered'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="p-4 bg-alert-bg/50 border border-alert-text/20 rounded-lg">
          <h4 className="font-semibold text-alert-text mb-3 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5" />
            Simulate Tamper Attack
          </h4>
          <p className="text-sm text-slate-600 mb-4">
            Select a record and field to modify. This will update the database directly WITHOUT updating the blockchain ledger.
          </p>

          <div className="grid gap-3 md:grid-cols-3">
            <select
              value={selectedRecord?.type || ''}
              onChange={(e) => setSelectedRecord(prev => ({ ...prev, type: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select Record Type</option>
              {recordTypes.map(rt => (
                <option key={rt.type} value={rt.type}>{rt.icon} {rt.label}</option>
              ))}
            </select>
            
            <input
              type="text"
              placeholder="Record ID (auto-filled on click)"
              value={selectedRecord?.id || ''}
              readOnly
              className="px-3 py-2 border border-slate-300 rounded-lg bg-slate-50"
            />
            
            <select
              value={selectedRecord?.field || ''}
              onChange={(e) => setSelectedRecord(prev => ({ ...prev, field: e.target.value }))}
              className="px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              <option value="">Select Field</option>
              {selectedRecord?.type === 'diagnosis' && (
                <>
                  <option value="condition_name">Condition Name</option>
                  <option value="diagnosed_date">Diagnosed Date</option>
                </>
              )}
              {selectedRecord?.type === 'prescription' && (
                <>
                  <option value="medication_name">Medication Name</option>
                  <option value="dosage_instructions">Dosage Instructions</option>
                </>
              )}
              {selectedRecord?.type === 'lab_result' && (
                <>
                  <option value="test_name">Test Name</option>
                  <option value="result_value">Result Value</option>
                  <option value="target_range">Target Range</option>
                </>
              )}
            </select>
          </div>

          <div className="mt-3">
            <input
              type="text"
              placeholder="New Value"
              value={selectedRecord?.newValue || ''}
              onChange={(e) => setSelectedRecord(prev => ({ ...prev, newValue: e.target.value }))}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>

          <div className="mt-4 flex gap-3">
            <Button 
              onClick={handleTamper} 
              loading={isLoading}
              disabled={!selectedRecord?.type || !selectedRecord?.field || !selectedRecord?.newValue}
              variant="danger"
              leftIcon={<Zap className="w-4 h-4" />}
            >
              Simulate Tamper
            </Button>
          </div>
        </div>

        {tamperResult && (
          <div className={`p-4 rounded-lg border ${
            tamperResult.verification?.tamper_detected 
              ? 'bg-red-50 border-red-200' 
              : 'bg-green-50 border-green-200'
          }`}>
            <h5 className="font-semibold mb-2 flex items-center gap-2">
              {tamperResult.verification?.tamper_detected ? (
                <AlertTriangle className="w-5 h-5 text-red-600" />
              ) : (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              {tamperResult.verification?.tamper_detected ? '⚠ TAMPER DETECTED!' : 'No Tamper Detected'}
            </h5>
            <div className="space-y-1 text-sm">
              <p><strong>Record:</strong> {tamperResult.record_type} ({tamperResult.record_id})</p>
              <p><strong>Field:</strong> {tamperResult.field_changed}</p>
              <p><strong>Original:</strong> {tamperResult.original_value}</p>
              <p><strong>New:</strong> {tamperResult.new_value}</p>
              {tamperResult.verification && (
                <>
                  <p><strong>Computed Hash:</strong> <code className="text-xs">{tamperResult.verification.computed_hash?.slice(0, 16)}...</code></p>
                  <p><strong>Stored Hash:</strong> <code className="text-xs">{tamperResult.verification.stored_hash?.slice(0, 16)}...</code></p>
                </>
              )}
            </div>
            <p className="mt-2 text-xs text-slate-500">
              {tamperResult.warning || 'Record integrity verified.'}
            </p>
          </div>
        )}
      </div>
    </Modal>
  );
}