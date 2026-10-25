import { useState, useEffect, useMemo } from 'react';
import { Plus, History, Pill, Activity, AlertTriangle, Clock } from 'lucide-react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePatientsApi, useAccessLogsApi } from '../../hooks';
import { useAuth } from '../../contexts';
import { PageLoader, useToast, PatientSidebar, RecordCard, AddRecordModal } from '../../components';
import { dashboardMenuItems } from './menuItems';

const sectionConfig = {
  diagnoses: {
    title: 'Recent Diagnoses',
    icon: History,
    api: 'getPatientRecords',
    dataKey: 'diagnoses',
    emptyMessage: 'No diagnoses recorded',
    roles: ['Doctor', 'Admin'],
    recordType: 'diagnosis',
  },
  prescriptions: {
    title: 'Active Prescriptions & Dosage',
    icon: Pill,
    api: 'getPatientRecords',
    dataKey: 'prescriptions',
    emptyMessage: 'No active prescriptions',
    roles: ['Doctor', 'Admin'],
    recordType: 'prescription',
  },
  'lab-results': {
    title: 'Latest Laboratory Results',
    icon: Activity,
    api: 'getPatientRecords',
    dataKey: 'lab_results',
    emptyMessage: 'No lab results available',
    roles: ['Lab', 'Admin'],
    recordType: 'lab_result',
  },
  allergies: {
    title: 'Allergies',
    icon: AlertTriangle,
    api: 'getPatientRecords',
    dataKey: 'allergies',
    emptyMessage: 'No allergies recorded',
    roles: [],
    recordType: null,
  },
  'access-logs': {
    title: 'Access Logs',
    icon: Clock,
    api: 'getAccessLogs',
    dataKey: 'logs',
    emptyMessage: 'No access logs',
    roles: ['Admin'],
    recordType: null,
  },
};

export default function DashboardPatientPage() {
  const { patientCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { getPatient, getPatientRecords } = usePatientsApi();
  const { getAccessLogs } = useAccessLogsApi();
  const { error: showError, success: showSuccess } = useToast();

  const [patient, setPatient] = useState(null);
  const [records, setRecords] = useState({ diagnoses: [], prescriptions: [], lab_results: [] });
  const [accessLogs, setAccessLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('diagnoses');
  const [addRecordModal, setAddRecordModal] = useState({ isOpen: false, recordType: null });

  useEffect(() => {
    loadPatientData();
  }, [patientCode]);

  const loadPatientData = async () => {
    setIsLoading(true);
    try {
      const [patientData, recordsData, logsData] = await Promise.all([
        getPatient(patientCode),
        getPatientRecords(patientCode),
        getAccessLogs(patientCode).catch(() => []),
      ]);
      setPatient(patientData);
      setRecords(recordsData);
      setAccessLogs(logsData || []);
    } catch (err) {
      showError(err.message || 'Failed to load patient data', 'error');
      navigate('/patients');
    } finally {
      setIsLoading(false);
    }
  };

  const canAddRecord = useMemo(() => {
    const config = sectionConfig[activeSection];
    if (!config?.roles?.length) return false;
    return user && config.roles.includes(user.role);
  }, [activeSection, user]);

  const handleAddRecord = () => {
    const config = sectionConfig[activeSection];
    if (config?.recordType) {
      setAddRecordModal({ isOpen: true, recordType: config.recordType });
    }
  };

  const handleRecordAdded = () => {
    loadPatientData();
    setAddRecordModal({ isOpen: false, recordType: null });
  };

  if (isLoading) {
    return <PageLoader />;
  }

  if (!patient) {
    return null;
  }

  const config = sectionConfig[activeSection];
  const sectionRecords = config?.api === 'getAccessLogs' ? accessLogs : records[config?.dataKey] || [];

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
              <h1 className="text-xl font-bold text-slate-900">{patient.full_name}</h1>
              <span className="text-sm text-slate-500 font-mono">{patient.patient_code}</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-slate-600">Logged in as</span>
              <span className="px-2 py-1 text-xs font-medium bg-primary/10 text-primary rounded-full">{user?.role}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-6">
          <PatientSidebar
            patient={patient}
            activeSection={activeSection}
            onSectionChange={setActiveSection}
          />

          <div className="flex-1 min-w-0">
            <div className="grid gap-6 lg:grid-cols-2">
              <RecordCard
                title={config?.title || 'Records'}
                icon={config?.icon}
                records={sectionRecords}
                onVerify={handleVerify}
                emptyMessage={config?.emptyMessage}
                action={canAddRecord && (
                  <Button variant="ghost" size="sm" onClick={handleAddRecord} leftIcon={<Plus className="w-4 h-4" />}>
                    Add Record
                  </Button>
                )}
              />
              {activeSection === 'diagnoses' && (
                <RecordCard
                  title="Active Prescriptions & Dosage"
                  icon={Pill}
                  records={records.prescriptions}
                  onVerify={handleVerify}
                  emptyMessage="No active prescriptions"
                />
              )}
              {activeSection === 'prescriptions' && (
                <RecordCard
                  title="Recent Diagnoses"
                  icon={History}
                  records={records.diagnoses}
                  onVerify={handleVerify}
                  emptyMessage="No diagnoses recorded"
                />
              )}
              {activeSection === 'lab-results' && (
                <RecordCard
                  title="Recent Diagnoses"
                  icon={History}
                  records={records.diagnoses}
                  onVerify={handleVerify}
                  emptyMessage="No diagnoses recorded"
                />
              )}
            </div>

            <RecordCard
              title="Latest Laboratory Results"
              icon={Activity}
              records={records.lab_results}
              onVerify={handleVerify}
              emptyMessage="No lab results available"
            />
          </div>
        </div>
      </main>

      <AddRecordModal
        isOpen={addRecordModal.isOpen}
        onClose={() => setAddRecordModal({ isOpen: false, recordType: null })}
        recordType={addRecordModal.recordType}
        patientId={patient.id}
        userRole={user?.role}
        onRecordAdded={handleRecordAdded}
      />
    </div>
  );
}

function handleVerify(type, recordId) {
  console.log('Verify record:', type, recordId);
}