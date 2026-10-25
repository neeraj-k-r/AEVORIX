import { useState, useEffect } from 'react';
import { Search, Plus, Users, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { usePatientsApi } from '../hooks/useApi';
import { PatientList } from '../components/PatientCard';
import { PageLoader } from '../components/LoadingSpinner';
import { useToast } from '../components/Toast';

export default function PatientsPage() {
  const navigate = useNavigate();
  const { getPatient } = usePatientsApi();
  const { error: showError } = useToast();

  const [patients, setPatients] = useState([]);
  const [filteredPatients, setFilteredPatients] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // Mock patient data - in production, this would come from an API endpoint
  useEffect(() => {
    loadPatients();
  }, []);

  const loadPatients = async () => {
    setIsLoading(true);
    try {
      // For demo, we'll use the test patient
      const patient = await getPatient('AEV-2026-8941');
      setPatients([patient]);
      setFilteredPatients([patient]);
    } catch (err) {
      showError('Failed to load patients', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const filtered = patients.filter((p) =>
      p.full_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.patient_code.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredPatients(filtered);
  }, [searchQuery, patients]);

  if (isLoading) {
    return <PageLoader />;
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Patients
          </h1>
          <p className="text-slate-600 mt-1">Manage and view patient records</p>
        </div>
        <button className="px-4 py-2 bg-primary text-white font-medium rounded-lg hover:bg-primary-hover transition-colors flex items-center gap-2">
          <Plus className="w-4 h-4" />
          Add Patient
        </button>
      </div>

      <div className="bg-white border border-card-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-card-border">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search patients by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
          </div>
        </div>

        <div className="p-4">
          <PatientList patients={filteredPatients} onSelect={(patient) => navigate(`/patients/${patient.patient_code}`)} />
        </div>
      </div>
    </div>
  );
}