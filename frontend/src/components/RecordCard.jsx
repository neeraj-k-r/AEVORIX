import { Calendar, Pill, FlaskConical, Hash, ExternalLink } from 'lucide-react';

const recordIcons = {
  diagnosis: Calendar,
  prescription: Pill,
  lab_result: FlaskConical,
};

const recordColors = {
  diagnosis: 'bg-blue-100 text-blue-700',
  prescription: 'bg-green-100 text-green-700',
  lab_result: 'bg-purple-100 text-purple-700',
};

export function RecordCard({ record, type, onVerify }) {
  const Icon = recordIcons[type] || Calendar;
  const colorClass = recordColors[type] || 'bg-slate-100 text-slate-700';

  const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className="bg-white border border-card-border rounded-xl p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-lg ${colorClass}`}>
            <Icon className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-semibold text-slate-900 capitalize">{type.replace('_', ' ')}</h4>
            <p className="text-sm text-slate-500">
              {type === 'diagnosis' && record.condition_name}
              {type === 'prescription' && record.medication_name}
              {type === 'lab_result' && record.test_name}
            </p>
          </div>
        </div>
        {record.sha256_hash && (
          <button
            onClick={() => onVerify?.(type, record.id)}
            className="p-2 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Verify on blockchain"
          >
            <Hash className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="mt-4 space-y-3 text-sm">
        {type === 'diagnosis' && (
          <>
            <div className="flex items-center gap-2 text-slate-600">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Diagnosed: {formatDate(record.diagnosed_date)}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span>Condition: </span>
              <span className="font-medium">{record.condition_name}</span>
            </div>
          </>
        )}

        {type === 'prescription' && (
          <>
            <div className="flex items-center gap-2 text-slate-600">
              <Pill className="w-4 h-4 text-slate-400" />
              <span>Medication: <span className="font-medium">{record.medication_name}</span></span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span>Dosage: </span>
              <span className="font-medium">{record.dosage_instructions}</span>
            </div>
          </>
        )}

        {type === 'lab_result' && (
          <>
            <div className="flex items-center gap-2 text-slate-600">
              <FlaskConical className="w-4 h-4 text-slate-400" />
              <span>Test: <span className="font-medium">{record.test_name}</span></span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <span>Result: </span>
              <span className="font-medium font-mono">{record.result_value}</span>
            </div>
            {record.target_range && (
              <div className="flex items-center gap-2 text-slate-600">
                <span>Range: </span>
                <span className="font-medium font-mono">{record.target_range}</span>
              </div>
            )}
          </>
        )}

        <div className="flex items-center gap-2 text-slate-600 pt-2 border-t border-card-border">
          <span>Recorded by: </span>
          <span className="font-medium">{record.recorded_by?.full_name || 'Unknown'}</span>
          <span className="text-slate-400">({record.recorded_by?.role || 'N/A'})</span>
        </div>

        {record.blockchain_tx_id && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Hash className="w-3 h-3" />
            <span className="font-mono">{record.blockchain_tx_id}</span>
            <span className="text-slate-400">|</span>
            <span className="font-mono">{record.sha256_hash?.slice(0, 16)}...</span>
          </div>
        )}
      </div>
    </div>
  );
}

export function RecordList({ records, type, onVerify, title }) {
  if (!records?.length) {
    return (
      <div className="text-center py-8 text-slate-500">
        <div className="w-12 h-12 mx-auto mb-3 text-slate-300">
          <recordIcons[type] className="w-full h-full" />
        </div>
        <p>No {title?.toLowerCase() || 'records'} found</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-slate-900 flex items-center gap-2">
        <recordIcons[type] className={`w-5 h-5 ${recordColors[type].replace('bg-', 'text-').replace('100', '600')}`} />
        {title || type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())} ({records.length})
      </h3>
      {records.map((record) => (
        <RecordCard key={record.id} record={record} type={type} onVerify={onVerify} />
      ))}
    </div>
  );
}