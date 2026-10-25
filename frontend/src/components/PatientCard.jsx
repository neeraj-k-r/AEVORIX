import { Shield, Droplet, AlertTriangle, Circle } from 'lucide-react';

export default function PatientCard({ patient, onClick }) {
  const { patient_code, full_name, blood_group, allergies, nfc_status, nfc_uid } = patient;

  return (
    <div
      className="bg-white border border-card-border rounded-xl p-5 hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 rounded-lg text-primary">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900">{full_name}</h3>
            <p className="text-sm text-slate-500 font-mono">{patient_code}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Circle className={`w-2 h-2 ${nfc_status === 'Active' ? 'text-verification-text' : 'text-slate-400'} fill-current`} />
          <span className="text-xs font-medium capitalize text-slate-600">{nfc_status?.toLowerCase()}</span>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-2 gap-4 text-sm">
        <div className="flex items-center gap-2">
          <Droplet className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-slate-500">Blood Group</p>
            <p className="font-medium">{blood_group || 'N/A'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-slate-400" />
          <div>
            <p className="text-slate-500">Allergies</p>
            <p className="font-medium truncate">
              {allergies?.length > 0 ? allergies.join(', ') : 'None'}
            </p>
          </div>
        </div>
      </div>

      {nfc_uid && (
        <div className="mt-3 pt-3 border-t border-card-border">
          <p className="text-xs text-slate-500 font-mono flex items-center gap-1">
            <Circle className="w-1.5 h-1.5 text-slate-400 fill-current" />
            NFC: {nfc_uid}
          </p>
        </div>
      )}
    </div>
  );
}

export function PatientList({ patients, onSelect }) {
  if (!patients?.length) {
    return (
      <div className="text-center py-12 text-slate-500">
        <Shield className="w-12 h-12 mx-auto mb-3 text-slate-300" />
        <p>No patients found</p>
      </div>
    );
  }

  return (
    <div className="grid gap-4">
      {patients.map((patient) => (
        <PatientCard key={patient.id} patient={patient} onClick={() => onSelect?.(patient)} />
      ))}
    </div>
  );
}