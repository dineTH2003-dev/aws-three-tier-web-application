import React from 'react';

export function Alert({ type = 'error', message, details, onClose }) {
  if (!message) return null;

  const bgStyles = {
    error: 'bg-red-50 border-red-200 text-red-800',
    success: 'bg-green-50 border-green-200 text-green-800',
    info: 'bg-blue-50 border-blue-200 text-blue-800',
  }[type] || 'bg-red-50 border-red-200 text-red-800';

  return (
    <div className={`p-4 mb-4 text-sm rounded-lg border ${bgStyles} flex justify-between items-start animate-fade-in`}>
      <div className="flex-1">
        <p className="font-medium">{message}</p>
        {details && Array.isArray(details) && details.length > 0 && (
          <ul className="mt-1 list-disc list-inside text-xs space-y-0.5">
            {details.map((d, i) => (
              <li key={i}>{d.message || JSON.stringify(d)}</li>
            ))}
          </ul>
        )}
      </div>
      {onClose && (
        <button
          type="button"
          onClick={onClose}
          className="ml-3 text-current opacity-70 hover:opacity-100 font-bold"
        >
          &times;
        </button>
      )}
    </div>
  );
}
