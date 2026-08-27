export function Loading({ label = 'Loading…' }) {
  return (
    <div className="state state-loading" role="status" aria-live="polite">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function ErrorState({ message = 'Something went wrong.', onRetry }) {
  return (
    <div className="state state-error" role="alert">
      <span className="state-icon" aria-hidden="true">
        ⚠
      </span>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ icon = '🔍', title, description }) {
  return (
    <div className="state state-empty">
      <span className="state-icon" aria-hidden="true">
        {icon}
      </span>
      {title && <p className="state-title">{title}</p>}
      {description && <p className="state-description">{description}</p>}
    </div>
  );
}
