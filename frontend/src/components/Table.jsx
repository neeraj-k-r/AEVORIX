import { forwardRef } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';

export function Table({ columns, data, keyField = 'id', onRowClick, sortBy, sortOrder, onSort, loading = false, emptyMessage = 'No data available' }) {
  if (loading) {
    return (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-card-border">
              {columns.map((col) => (
                <th key={col.key} className="px-4 py-3 text-left text-sm font-medium text-slate-500">
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td colSpan={columns.length} className="px-4 py-12 text-center text-slate-500">
                <div className="flex items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                  Loading...
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div className="text-center py-12 text-slate-500">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full" role="grid">
        <thead>
          <tr className="border-b border-card-border bg-slate-50">
            {columns.map((col) => (
              <th
                key={col.key}
                className={`px-4 py-3 text-left text-sm font-medium text-slate-500 ${col.sortable ? 'cursor-pointer hover:bg-slate-100 select-none' : ''}`}
                onClick={col.sortable ? () => onSort?.(col.key) : undefined}
                style={{ width: col.width }}
              >
                <div className="flex items-center gap-1">
                  {col.header}
                  {col.sortable && sortBy === col.key && (
                    sortOrder === 'asc' ? <ChevronUp className="w-4 h-4 text-primary" /> : <ChevronDown className="w-4 h-4 text-primary" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-card-border">
          {data.map((row) => (
            <tr
              key={row[keyField]}
              className={onRowClick ? 'hover:bg-slate-50 cursor-pointer transition-colors' : ''}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((col) => (
                <td key={col.key} className="px-4 py-3 text-sm text-slate-900">
                  {col.render ? col.render(row[col.key], row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </div>
    </div>
  );
}

export function Column({ key, header, width, sortable = false, render }) {
  return { key, header, width, sortable, render };
}