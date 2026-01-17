import { useApp } from '../../store';
import './SaveErrorBanner.css';

export function SaveErrorBanner() {
  const { saveError, dismissSaveError } = useApp();

  if (!saveError) {
    return null;
  }

  return (
    <div className="save-error-banner" role="alert">
      <span className="save-error-message">
        Unable to save changes. Storage may be full or unavailable.
      </span>
      <button
        className="save-error-dismiss"
        onClick={dismissSaveError}
        aria-label="Dismiss error"
      >
        Dismiss
      </button>
    </div>
  );
}
