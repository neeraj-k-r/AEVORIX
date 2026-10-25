import { CheckCircle, Hash, ExternalLink } from 'lucide-react';
import { Badge } from '../../components';

export function RecordRow({ label, subtext, value, verified = true, onVerify, icon }) {
  return (
    <div className="flex items-start justify-between gap-4 py-3 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        {icon && <icon className="w-5 h-5 text-slate-400 mb-1" />}
        <p className="font-medium text-slate-900 truncate">{label}</p>
        {subtext && <p className="text-sm text-slate-500 mt-0.5">{subtext}</p>}
        {value && <p className="text-sm text-slate-600 mt-0.5 font-mono">{value}</p>}
      </div>
      <div className="flex items-center gap-2 flex-shrink-0">
        {verified && (
          <Badge variant="verification" className="flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Verified
          </Badge>
        )}
        {onVerify && (
          <button
            onClick={onVerify}
            className="p-1.5 text-slate-400 hover:text-primary hover:bg-primary/10 rounded-lg transition-colors"
            title="Verify on blockchain"
            aria-label="Verify on blockchain"
          >
            <Hash className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
}

export function RecordCard({ title, records, verified = true, onVerify, icon, emptyMessage = 'No records found', action, className = '' }) {
  const hasRecords = records?.length > 0;

  return (
    <div className={`bg-white border border-card-border rounded-xl overflow-hidden ${className}`}>
      <div className="flex items-center justify-between p-4 border-b border-card-border">
        <div className="flex items-center gap-2">
          {icon && <icon className="w-5 h-5 text-primary" />}
          <h3 className="font-semibold text-slate-900">{title}</h3>
        </div>
        <div className="flex items-center gap-2">
          {verified && <Badge variant="verification"><CheckCircle className="w-3 h-3" /> Blockchain Verified</Badge>}
          {action}
        </div>
      </div>

      <div className="divide-y divide-slate-100">
        {hasRecords ? (
          records.map((record, index) => (
            <RecordRow
              key={record.id || index}
              label={record.condition_name || record.medication_name || record.test_name}
              subtext={
                record.diagnosed_date
                  ? new Date(record.diagnosed_date).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
                  : record.created_at
                  ? new Date(record.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: 'numeric' }).replace(/\//g, '-')
                  : record.dosage_instructions || record.target_range
              }
              value={
                record.result_value
                  ? `${record.result_value} ${record.target_range ? `(${record.target_range})` : ''}`
                  : record.dosage_instructions
              }
              verified={record.sha256_hash || verified}
              onVerify={() => onVerify?.(record.type || 'unknown', record.id)}
            />
          ))
        ) : (
          <div className="p-6 text-center text-slate-500">
            {emptyMessage}
          </div>
        )}
      </div>
    </div>
  );
}