import { useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Clock, Hash, ArrowRight, ExternalLink } from 'lucide-react';
import { useBlockchainApi } from '../hooks/useApi';
import { useToast } from '../components/Toast';

export default function BlockchainVerificationModal({ isOpen, onClose, recordType, recordId }) {
  const { verifyRecord } = useBlockchainApi();
  const { error: showError, success: showSuccess } = useToast();
  const [verification, setVerification] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen && recordType && recordId) {
      verifyRecordOnChain();
    }
  }, [isOpen, recordType, recordId]);

  const verifyRecordOnChain = async () => {
    setIsLoading(true);
    setVerification(null);
    try {
      const data = await verifyRecord(recordType, recordId);
      setVerification(data);
      if (data.chain_valid) {
        showSuccess('Blockchain verification successful');
      } else {
        showError('Blockchain chain integrity check failed', 'error');
      }
    } catch (err) {
      showError(err.message || 'Verification failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="fixed inset-0 bg-black/50" onClick={onClose} aria-hidden="true" />
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
          <div className="flex items-center justify-between p-4 border-b border-card-border">
            <h2 className="text-lg font-semibold text-slate-900">Blockchain Verification</h2>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors">
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-4 space-y-4">
            {isLoading ? (
              <div className="flex flex-col items-center gap-3 py-8">
                <div className="w-10 h-10 border-3 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="text-slate-600">Verifying record on blockchain...</p>
              </div>
            ) : verification ? (
              <div className="space-y-4">
                <div className={`p-4 rounded-lg border ${verification.chain_valid ? 'bg-verification-bg border-verification-text/20' : 'bg-alert-bg border-alert-text/20'}`}>
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${verification.chain_valid ? 'bg-verification-text/20 text-verification-text' : 'bg-alert-text/20 text-alert-text'}`}>
                      {verification.chain_valid ? <CheckCircle className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="font-medium">{verification.chain_valid ? 'Chain Valid' : 'Chain Invalid'}</p>
                      <p className="text-sm text-slate-600">
                        {verification.chain_valid
                          ? 'Record hash matches the blockchain ledger'
                          : 'Record hash does not match the previous block'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-3 text-sm">
                  <VerificationRow label="Block Index" value={verification.block_index} />
                  <VerificationRow label="Record Type" value={verification.record_type} />
                  <VerificationRow label="Patient Code" value={verification.patient_code} />
                  <VerificationRow label="Data Hash" value={`${verification.data_hash?.slice(0, 16)}...`} monospace />
                  <VerificationRow label="Previous Hash" value={`${verification.previous_hash?.slice(0, 16)}...`} monospace />
                  <VerificationRow label="Timestamp" value={new Date(verification.timestamp).toLocaleString()} />
                  <VerificationRow label="Verified At" value={new Date(verification.verified_at).toLocaleString()} />
                </div>

                <div className="pt-4 border-t border-card-border flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-900 border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

function VerificationRow({ label, value, monospace }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-slate-100">
      <span className="text-slate-500">{label}</span>
      <span className={`font-medium text-slate-900 ${monospace ? 'font-mono text-xs' : ''}`}>{value}</span>
    </div>
  );
}