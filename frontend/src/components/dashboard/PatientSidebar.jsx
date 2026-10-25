import { BloodDroplet, AlertTriangle, Shield, History, Pill, Activity, Clock } from 'lucide-react';
import { dashboardMenuItems } from '../pages/dashboard/menuItems';
import { Badge } from '../components';

const menuIcons = {
  History,
  Pill,
  Activity,
  AlertTriangle,
  Clock,
  Shield,
};

export default function PatientSidebar({ patient, activeSection, onSectionChange }) {
  const { patient_code, full_name, blood_group, allergies, nfc_status } = patient;

  return (
    <aside className="w-full lg:w-72 flex-shrink-0">
      <div className="bg-white border border-card-border rounded-xl p-5 sticky top-20 h-fit">
        <div className="mb-5">
          <p className="font-bold text-slate-900">Patient: {full_name}</p>
          <p className="text-sm text-slate-500 font-mono">ID: {patient_code}</p>
        </div>

        <div className="space-y-4 mb-5 p-4 bg-slate-50 rounded-lg border border-card-border">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-100 rounded-lg">
              <BloodDroplet className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide">Blood Group</p>
              <p className="font-semibold text-slate-900">{blood_group || 'Not specified'}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="p-2 bg-alert-bg rounded-lg">
              <AlertTriangle className="w-5 h-5 text-alert-text" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-slate-500 uppercase tracking-wide">Allergies</p>
              <Badge variant="alert" className="truncate block">
                {allergies?.length ? allergies.join(', ') : 'None'}
              </Badge>
            </div>
          </div>
        </div>

        <div className="pt-4 border-t border-card-border">
          <p className="text-xs text-slate-500 uppercase tracking-wide mb-3 px-2">Navigation</p>
          <nav className="space-y-1" aria-label="Patient dashboard sections">
            {dashboardMenuItems.map((item) => {
              const Icon = menuIcons[item.icon];
              const isActive = activeSection === item.section;
              return (
                <button
                  key={item.id}
                  onClick={() => onSectionChange(item.section)}
                  className={`
                    w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                    ${isActive
                      ? 'bg-primary/10 text-primary border-l-2 border-primary'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}
                  `}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" aria-hidden="true" />
                  {item.label}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="mt-5 pt-4 border-t border-card-border">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-verification-bg">
            <Shield className="w-4 h-4 text-verification-text" />
            <span className="text-xs font-medium text-verification-text">Ledger Connected</span>
          </div>
        </div>
      </div>
    </aside>
  );
}