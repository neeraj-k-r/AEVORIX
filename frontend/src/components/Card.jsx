export function Card({ children, className = '', hover = false, padding = 'p-6' }) {
  return (
    <div className={`
      bg-white border border-card-border rounded-xl
      ${padding}
      ${hover ? 'hover:shadow-lg transition-shadow cursor-pointer' : ''}
      ${className}
    `}>
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, action, className = '' }) {
  return (
    <div className={`flex items-start justify-between mb-4 ${className}`}>
      <div>
        {title && <h3 className="font-semibold text-slate-900">{title}</h3>}
        {subtitle && <p className="text-sm text-slate-600 mt-0.5">{subtitle}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}

export function CardBody({ children, className = '' }) {
  return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = '' }) {
  return (
    <div className={`mt-4 pt-4 border-t border-card-border flex items-center gap-3 ${className}`}>
      {children}
    </div>
  );
}

export function CardGrid({ children, columns = 1, gap = 6, className = '' }) {
  return (
    <div className={`grid gap-${gap} ${className}`} style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {children}
    </div>
  );
}