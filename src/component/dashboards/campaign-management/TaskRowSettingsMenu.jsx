import React, { useEffect, useRef, useState } from 'react';
import { FiSettings, FiEdit2, FiUserPlus, FiClipboard, FiPause, FiPlay, FiTrash2 } from 'react-icons/fi';

export default function TaskRowSettingsMenu({
  onEdit,
  onAssign,
  onViewSubmissions,
  onToggleStatus,
  onDelete,
  isActive = true,
  isPublic = false,
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const close = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    if (open) document.addEventListener('mousedown', close);
    return () => document.removeEventListener('mousedown', close);
  }, [open]);

  const item = (label, icon, onClick, danger = false) => (
    <button
      type="button"
      onClick={() => { setOpen(false); onClick?.(); }}
      className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors ${
        danger ? 'text-red-600 hover:bg-red-50' : 'text-gray-700 hover:bg-gray-50'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="p-2 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors"
        title="Settings"
        aria-label="Task settings"
      >
        <FiSettings size={15} />
      </button>
      {open && (
        <div className="absolute right-0 mt-1 w-48 bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-30">
          {item('Edit task', <FiEdit2 size={14} className="text-blue-500" />, onEdit)}
          {!isPublic && onAssign && item('Assign users', <FiUserPlus size={14} className="text-green-600" />, onAssign)}
          {onViewSubmissions && item('View submissions', <FiClipboard size={14} className="text-indigo-500" />, onViewSubmissions)}
          {item(
            isActive ? 'Pause task' : 'Activate task',
            isActive ? <FiPause size={14} className="text-yellow-600" /> : <FiPlay size={14} className="text-green-600" />,
            onToggleStatus
          )}
          <div className="my-1 border-t border-gray-100" />
          {item('Delete task', <FiTrash2 size={14} className="text-red-500" />, onDelete, true)}
        </div>
      )}
    </div>
  );
}
