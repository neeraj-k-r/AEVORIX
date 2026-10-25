import { useState, useEffect } from 'react';
import { 
  Shield, 
  Circle, 
  Loader2, 
  CheckCircle, 
  AlertCircle, 
  Radio, 
  Waves, 
  CreditCard, 
  UserCheck, 
  Hash, 
  ArrowRight, 
  AlertTriangle,
  Save,
  Link2,
  Unlink,
  RefreshCw
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { usePatientsApi, useBlockchainApi } from '../../hooks';
import { useToast } from '../../components/Toast';
import { Button, Badge, Card, Input } from '../../components';

const mockPatient = {
  id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  patient_code: 'AEV-2026-8941',
  full_name: 'Rahul Sharma',
  blood_group: 'O+',
  allergies: ['Penicillin', 'Peanuts'],
  nfc_uid: '04:A3:B2:C1:D0:9E',
  nfc_status: 'Active',
};

export default function NFCManagementPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getPatient } = usePatientsApi();
  const { verifyPatientRecords } = useBlockchainApi();
  const { error: showError, success: showSuccess } = useToast();

  const [isScanning, setIsScanning] = useState(false);
  const [scannedPatient, setScannedPatient] = useState(null);
  const [nfcStatus, setNfcStatus] = useState('Active');
  const [isSaving, setIsSaving] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);
  const [readerStatus, setReaderStatus] = useState('ready'); // ready, scanning, success, error

  // Simulate NFC scan
  const handleScan = async () => {
    setIsScanning(true);
    setReaderStatus('scanning');
    setScannedPatient(null);

    // Simulate 1.5 second scan delay
    await new Promise(resolve => setTimeout(resolve, 1500));

    // Mock scan result - in production this would come from hardware
    setScannedPatient(mockPatient);
    setReaderStatus('success');
    setIsScanning(false);
    showSuccess('NFC card scanned successfully', 'success');
  };

  // Save & Sync to Blockchain
  const handleSaveAndSync = async () => {
    if (!scannedPatient) return;
    
    setIsSaving(true);
    try {
      // Simulate blockchain write
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, this would call the backend to create a blockchain entry
      // linking the NFC UID to the patient
      showSuccess('NFC card linked and synced to blockchain', 'success');
      
      // Redirect to patient dashboard
      navigate(`/dashboard/patient/${scannedPatient.patient_code}`);
    } catch (err) {
      showError('Failed to sync to blockchain', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  // Unlink / Block Lost Card
  const handleUnlink = async () => {
    if (!scannedPatient) return;
    
    setIsUnlinking(true);
    try {
      // Simulate blockchain revocation
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In production, this would call the backend to update nfc_status to 'Blocked'
      // and create a revocation transaction in the blockchain
      showSuccess('Card blocked and revocation logged to blockchain', 'success');
      
      setScannedPatient(prev => prev ? { ...prev, nfc_status: 'Blocked' } : null);
      setNfcStatus('Blocked');
    } catch (err) {
      showError('Failed to block card', 'error');
    } finally {
      setIsUnlinking(false);
    }
  };

  // Toggle NFC status
  const handleStatusToggle = () => {
    const newStatus = nfcStatus === 'Active' ? 'Inactive' : 'Active';
    setNfcStatus(newStatus);
    showSuccess(`NFC card status changed to ${newStatus}`, 'success');
  };

  // Animate wave rings when scanning
  const waveAnimation = readerStatus === 'scanning';

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-card-border sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors lg:hidden"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
              </button>
              <div>
                <h1 className="text-xl font-bold text-slate-900">NFC Card Management</h1>
                <p className="text-sm text-slate-500">Configure, verify, and link secure NFC patient cards to the blockchain</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">Logged in as</span>
              <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">{user?.role}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Left Column - NFC Card Reader */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-primary" />
                  TAP NTAG215 CARD ON READER
                </h2>
                <Badge variant={readerStatus === 'success' ? 'verification' : readerStatus === 'scanning' ? 'warning' : 'default'}>
                  {readerStatus === 'success' ? 'Card Detected' : readerStatus === 'scanning' ? 'Scanning...' : 'Ready'}
                </Badge>
              </div>

              {/* Smart Card Illustration with Wave Rings */}
              <div className="relative flex flex-col items-center justify-center py-12">
                {/* Wave Rings Animation */}
                <div className="relative w-64 h-64">
                  {[1, 2, 3, 4].map((ring, index) => (
                    <div
                      key={ring}
                      className={`absolute inset-0 rounded-full border-2 border-primary/30 ${
                        waveAnimation 
                          ? 'animate-pulse-ring' 
                          : 'scale-75 opacity-0'
                      }`}
                      style={{
                        animationDelay: `${index * 200}ms`,
                        transformOrigin: 'center',
                      }}
                    />
                  ))}
                </div>

                {/* NFC Card */}
                <div className="relative z-10 w-56 h-36 bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl border border-slate-700 flex flex-col items-center justify-center p-6 shadow-2xl">
                  <div className="flex items-center gap-3 mb-2">
                    <Radio className="w-8 h-8 text-primary bg-slate-800" />
                    <span className="text-white font-mono text-sm">NTAG215</span>
                  </div>
                  <Waves className={`w-12 h-12 text-primary/50 ${waveAnimation ? 'animate-spin' : ''}`} />
                  <p className="text-xs text-slate-400 mt-2">Tap card to reader</p>
                </div>

                {/* Status Indicator */}
                <div className="mt-6 p-4 bg-slate-50 rounded-lg border border-card-border">
                  <div className="flex items-center gap-3">
                    <Circle className={`w-3 h-3 ${
                      readerStatus === 'success' ? 'text-verification-text' : 
                      readerStatus === 'scanning' ? 'text-primary animate-pulse' : 
                      readerStatus === 'error' ? 'text-alert-text' : 'text-slate-400'
                    } fill-current`} />
                    <span className="text-sm font-medium text-slate-700">
                      {readerStatus === 'success' ? 'PN532 Reader: Card Detected' : 
                       readerStatus === 'scanning' ? 'PN532 Reader: Scanning...' : 
                       readerStatus === 'error' ? 'PN532 Reader: Error' : 'PN532 Reader: Ready (Simulated Mode)'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Scan Button */}
              <Button
                onClick={handleScan}
                disabled={isScanning || readerStatus === 'scanning'}
                loading={isScanning}
                fullWidth
                size="lg"
                leftIcon={<Loader2 className="w-5 h-5" />}
                className="mt-6"
              >
                {isScanning ? 'Scanning...' : scannedPatient ? 'Re-scan Card' : 'Scan NFC Card'}
              </Button>
            </Card>

            {/* NFC Status Toggle */}
            <Card className="p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
                <Shield className="w-5 h-5 text-primary" />
                NFC Card Status
              </h3>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Card Status</p>
                  <p className="text-sm text-slate-500">Toggle to activate/deactivate the NFC card</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={nfcStatus === 'Active'}
                    onChange={handleStatusToggle}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>
              <div className="mt-4 p-3 bg-slate-50 rounded-lg border border-card-border">
                <Badge variant={nfcStatus === 'Active' ? 'verification' : 'default'}>
                  {nfcStatus}
                </Badge>
              </div>
            </Card>
          </div>

          {/* Right Column - Linked Patient Profile */}
          <div className="space-y-6">
            {scannedPatient ? (
              <>
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                      <UserCheck className="w-5 h-5 text-primary" />
                      LINKED PATIENT PROFILE
                    </h2>
                    <Badge variant="verification">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Verified
                    </Badge>
                  </div>

                  <div className="space-y-4">
                    <div className="p-4 bg-slate-50 rounded-lg border border-card-border">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Patient Name</p>
                      <p className="text-xl font-bold text-slate-900">{scannedPatient.full_name}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-slate-50 rounded-lg border border-card-border">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Patient ID</p>
                        <p className="font-mono font-medium text-slate-900">{scannedPatient.patient_code}</p>
                      </div>
                      <div className="p-4 bg-slate-50 rounded-lg border border-card-border">
                        <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">Card UID</p>
                        <p className="font-mono font-medium text-slate-900 text-sm">{scannedPatient.nfc_uid}</p>
                      </div>
                    </div>
                    <div className="p-4 bg-slate-50 rounded-lg border border-card-border">
                      <p className="text-xs text-slate-500 uppercase tracking-wide mb-1">NFC Status</p>
                      <Badge variant={scannedPatient.nfc_status === 'Active' ? 'verification' : 'alert'}>
                        {scannedPatient.nfc_status}
                      </Badge>
                    </div>
                  </div>
                </Card>

                {/* Action Buttons */}
                <Card className="p-6">
                  <div className="flex flex-col gap-3">
                    <Button
                      onClick={handleSaveAndSync}
                      loading={isSaving}
                      leftIcon={<Save className="w-4 h-4" />}
                      rightIcon={<Hash className="w-4 h-4" />}
                      size="lg"
                    >
                      Save & Sync to Blockchain
                    </Button>
                    <Button
                      onClick={handleUnlink}
                      loading={isUnlinking}
                      variant="outline"
                      variant="danger"
                      leftIcon={<Unlink className="w-4 h-4" />}
                      size="lg"
                    >
                      Unlink / Block Lost Card
                    </Button>
                  </div>
                  <p className="text-xs text-slate-500 text-center mt-4">
                    Saving creates an immutable blockchain record linking UID <code className="font-mono">{scannedPatient.nfc_uid}</code> to patient <code className="font-mono">{scannedPatient.patient_code}</code>
                  </p>
                </Card>
              </>
            ) : (
              // Empty state
              <Card className="p-12 text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-slate-100 rounded-full flex items-center justify-center">
                  <CreditCard className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">No Card Scanned</h3>
                <p className="text-slate-500 mb-6">Tap an NTAG215 card on the reader to begin linking a patient profile</p>
                <div className="p-4 bg-slate-50 rounded-lg border border-card-border max-w-xs mx-auto text-left">
                  <p className="text-sm font-medium text-slate-700 mb-2">Expected Patient (Demo):</p>
                  <ul className="space-y-1 text-sm text-slate-600">
                    <li><strong>Name:</strong> Rahul Sharma</li>
                    <li><strong>ID:</strong> AEV-2026-8941</li>
                    <li><strong>UID:</strong> 04:A3:B2:C1:D0:9E</li>
                    <li><strong>Status:</strong> Active</li>
                  </ul>
                </div>
              </Card>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}