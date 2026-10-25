import { Shield, Users, Stethoscope, Database, BrainCircuit } from 'lucide-react';

function App() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card-surface border-b border-card-border px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-xl font-bold text-slate-900">AEVORIX</h1>
          </div>
          <nav className="flex items-center gap-6 text-sm text-slate-600">
            <span>Dashboard</span>
            <span>Patients</span>
            <span>Records</span>
            <span>AI Assistant</span>
          </nav>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold text-slate-900">Electronic Health Record Platform</h2>
          <p className="text-slate-600 mt-2">Centralized EHR with RBAC, Blockchain Integrity, XAI & RAG Medical Querying</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<Users className="w-6 h-6" />}
            title="Role-Based Access"
            description="Granular permissions for Doctors, Nurses, Labs, Pharmacists & Admins"
            badge="Active"
            badgeType="verification"
          />
          <FeatureCard
            icon={<Database className="w-6 h-6" />}
            title="Blockchain Integrity"
            description="SHA-256 hashed records with immutable ledger tracking"
            badge="Verified"
            badgeType="verification"
          />
          <FeatureCard
            icon={<BrainCircuit className="w-6 h-6" />}
            title="Explainable AI"
            description="Transparent AI decisions with RAG-based medical querying"
            badge="Beta"
            badgeType="alert"
          />
          <FeatureCard
            icon={<Stethoscope className="w-6 h-6" />}
            title="Patient Records"
            description="Unified diagnoses, prescriptions & lab results"
            badge="Active"
            badgeType="verification"
          />
          <FeatureCard
            icon={<Shield className="w-6 h-6" />}
            title="Audit Logging"
            description="Complete access trails with timestamped actions"
            badge="Active"
            badgeType="verification"
          />
          <FeatureCard
            icon={<BrainCircuit className="w-6 h-6" />}
            title="NFC/Biometric Ready"
            description="Hardware integration scaffolded for future deployment"
            badge="Planned"
            badgeType="alert"
          />
        </div>

        <div className="mt-12 p-6 bg-card-surface border border-card-border rounded-xl">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Test Patient: Rahul Sharma (AEV-2026-8941)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-slate-500">Blood Group</p>
              <p className="font-medium">O+</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-slate-500">Allergies</p>
              <p className="font-medium">Penicillin, Peanuts</p>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg">
              <p className="text-slate-500">NFC Status</p>
              <p className="font-medium text-primary">Active</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function FeatureCard({ icon, title, description, badge, badgeType }) {
  const badgeClasses = badgeType === 'verification'
    ? 'bg-verification-bg text-verification-text'
    : 'bg-alert-bg text-alert-text';

  return (
    <div className="bg-card-surface border border-card-border rounded-xl p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-start gap-4">
        <div className="p-2 bg-primary/10 rounded-lg text-primary">
          {icon}
        </div>
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold text-slate-900">{title}</h3>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${badgeClasses}`}>
              {badge}
            </span>
          </div>
          <p className="text-slate-600 text-sm mt-2">{description}</p>
        </div>
      </div>
    </div>
  );
}

export default App;