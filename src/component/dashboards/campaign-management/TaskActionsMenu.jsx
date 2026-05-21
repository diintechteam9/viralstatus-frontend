import React, { useEffect, useRef, useState } from 'react';

const MenuItem = ({ onClick, disabled, children, className = '', icon }) => (
  <button
    type="button"
    role="menuitem"
    onClick={onClick}
    disabled={disabled}
    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
  >
    {icon}
    <span>{children}</span>
  </button>
);

const TaskActionsMenu = ({
  canApprove,
  canCancel,
  isLoading,
  timerExpired,
  cancellationPenalty,
  onAccept,
  onReject,
  onCancel,
  onViewUser,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onEsc = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', close);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', close);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open]);

  const hasActions = canApprove || canCancel || onViewUser;
  if (!hasActions) {
    return <span className="text-xs text-gray-400">—</span>;
  }

  return (
    <div className="relative flex justify-center" ref={ref}>
      <button
        type="button"
        aria-label="Task actions"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        disabled={isLoading}
        className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 shadow-sm transition-colors disabled:opacity-50"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
          <path d="M10 6a2 2 0 110-4 2 2 0 010 4zm0 4a2 2 0 110-4 2 2 0 010 4zm0 4a2 2 0 110-4 2 2 0 010 4z" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full mt-1 z-30 w-52 bg-white border border-gray-200 rounded-lg shadow-lg py-1"
        >
          {onViewUser && (
            <>
              <MenuItem
                className="text-gray-700 hover:bg-gray-50"
                onClick={() => {
                  setOpen(false);
                  onViewUser();
                }}
                icon={
                  <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                }
              >
                View participant
              </MenuItem>
              {(canApprove || canCancel) && <div className="my-1 border-t border-gray-100" />}
            </>
          )}

          {canApprove && (
            <>
              <MenuItem
                className="text-green-700 hover:bg-green-50"
                disabled={isLoading}
                onClick={() => {
                  setOpen(false);
                  onAccept?.();
                }}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                }
              >
                Accept task
              </MenuItem>
              <MenuItem
                className="text-red-700 hover:bg-red-50"
                disabled={isLoading}
                onClick={() => {
                  setOpen(false);
                  onReject?.();
                }}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                }
              >
                Reject task
              </MenuItem>
            </>
          )}

          {canCancel && (
            <>
              {canApprove && <div className="my-1 border-t border-gray-100" />}
              <MenuItem
                className="text-gray-800 hover:bg-orange-50"
                disabled={isLoading}
                onClick={() => {
                  setOpen(false);
                  onCancel?.();
                }}
                icon={
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                  </svg>
                }
              >
                Cancel task
              </MenuItem>
              <p className="px-3 py-1.5 text-[10px] text-gray-500 leading-snug border-t border-gray-50 mt-1">
                {timerExpired
                  ? `Penalty: −${cancellationPenalty} credits`
                  : 'Free cancel during grace period'}
              </p>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default React.memo(TaskActionsMenu);
