import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Loader2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { usePatientsApi } from '../hooks/useApi';
import { PatientCard } from '../components/PatientCard';
import { RecordList } from '../components/RecordCard';
import { PageLoader } from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

export default function PatientDetailPage() {
  const { patientCode } = useParams();
  const navigate = useNavigate();
  const { getPatient, getPatientRecords, getPrescriptions, getLabResults } = usePatientsApi();
  const { error: showError } = useToast();

  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState({ diagnoses: [], prescriptions: [], lab_results: [] });
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    loadPatientData();
  }, [patientCode]);

  const loadPatientData = async () => {
    setIsLoading(true);
    try {
      const [patientData, recordsData] = await Promise.all([
        getPatient(patientCode),
        getPatientRecords(patientCode),
      ]);
      setPatient(patientData);
      setRecords(recordsData);
    } catch (err) {
      showError(err.message || 'Failed to load patient data', 'error');
      navigate('/');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (!patient) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-white border-b border-card-border sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate(-1)}
                className="p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-3">
                <Shield className="w-8 h-8 text-primary" />
                <div>
                  <h1 className="text-xl font-bold text-slate-900">Patient Detail</h1>
                  <p className="text-sm text-slate-500">{patient.full_name} • {patient.patient_code}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <PatientCard patient={patient} />

        <div className="mt-8 border-b border-card-border">
          <nav className="flex gap-8" aria-label="Patient record tabs">
            <TabButton
              id="overview"
              label="Overview"
              active={activeTab === 'overview'}
              onClick={() => setActiveTab('overview')}
            />
            <TabButton
              id="diagnoses"
              label="Diagnoses"
              active={activeTab === 'diagnoses'}
              onClick={() => setActiveTab('diagnoses')}
              count={records.diagnoses?.length}
            />
            <TabButton
              id="prescriptions"
              label="Prescriptions"
              active={activeTab === 'prescriptions'}
              onClick={() => setActiveTab('prescriptions')}
              count={records.prescriptions?.length}
            />
            <TabButton
              id="lab-results"
              label="Lab Results"
              active={activeTab === 'lab-results'}
              onClick={() => setActiveTab('lab-results')}
              count={records.lab_results?.length}
            />
          </nav>
        </div>

        <div className="mt-6">
          {activeTab === 'overview' && <OverviewTab patient={patient} />}
          {activeTab === 'diagnoses' && (
            <RecordList
              records={records.diagnoses}
              type="diagnosis"
              title="Diagnoses"
              onVerify={handleVerify}
            />
          )}
          {activeTab === 'prescriptions' && (
            <RecordList
              records={records.prescriptions}
              type="prescription"
              title="Prescriptions"
              onVerify={handleVerify}
            />
          )}
          {activeTab === 'lab-results' && (
            <RecordList
              records={records.lab_results}
              type="lab_result"
              title="Lab Results"
              onVerify={handleVerify}
            />
          )}
        </div>
      </main>
    </div>
  );
}

function TabButton({ id, label, active, onClick, count }) {
  return (
    <button
      id={id}
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
        active
          ? 'border-primary text-primary'
          : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
      }`}
    >
      {label}
      {count !== undefined && (
        <span className={`px-2 py-0.5 text-xs rounded-full ${active ? 'bg-primary/20 text-primary' : 'bg-slate-100 text-slate-500'}`}>
          {count}
        </span>
      )}
    </button>
  );
}

function OverviewTab({ patient }) {
  const { blood_group, allergies, nfc_status, nfc_uid } = patient;

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      <InfoCard
        icon="🩸"
        label="Blood Group"
        value={blood_group || 'Not specified'}
      />
      <InfoCard
        icon="⚠️"
        label="Allergies"
        value={allergies?.length ? allergies.join(', ') : 'None'}
      />
      <InfoCard
        icon="📱"
        label="NFC Status"
        value={nfc_status || 'Unknown'}
      />
      {nfc_uid && (
        <InfoCard
          icon="🔑"
          label="NFC UID"
          value={nfc_uid}
          fullWidth
        />
      )}
    </div>
  );
}

function InfoCard({ icon, label, value, fullWidth }) {
  return (
    <div className={`bg-white border border-card-border rounded-xl p-5 ${fullWidth ? 'md:col-span-2 lg:col-span-3' : ''}`}>
      <div className="flex items-center gap-3 mb-2">
        <span className="text-2xl">{icon}</span>
        <p className="text-sm text-slate-500 font-medium">{label}</p>
      </div>
      <p className="text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function handleVerify(type, recordId) {
  // TODO: Implement blockchain verification modal
  console.log('Verify:', type, recordId);
}