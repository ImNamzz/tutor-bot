import React, { useState, useEffect } from "react";

interface RenameModalProps {
  open: boolean;
  title?: string;
  label?: string;
  initialValue?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  maxLength?: number;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}

const RenameModal: React.FC<RenameModalProps> = ({
  open,
  title = "Rename",
  label = "New name",
  initialValue = "",
  confirmLabel = "Save",
  cancelLabel = "Cancel",
  loading = false,
  maxLength = 100,
  onSubmit,
  onCancel,
}) => {
  const [value, setValue] = useState(initialValue);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue(initialValue);
      setError(null);
    }
  }, [open, initialValue]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) {
      setError("Name cannot be empty");
      return;
    }
    if (trimmed.length > maxLength) {
      setError(`Name must be under ${maxLength} characters`);
      return;
    }
    onSubmit(trimmed);
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onCancel();
        }
      }}
    >
      <div
        className="w-full max-w-md rounded-lg bg-white dark:bg-[#1a1a1a] shadow-lg p-6"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">{title}</h2>
        <form onSubmit={handleSubmit}>
          <label
            className="block text-sm font-medium mb-1 text-gray-700 dark:text-gray-300"
            htmlFor="rename-input"
          >
            {label}
          </label>
          <input
            id="rename-input"
            type="text"
            value={value}
            maxLength={maxLength}
            autoFocus
            onChange={(e) => {
              setValue(e.target.value);
              if (error) setError(null);
            }}
            className="w-full rounded border border-gray-300 dark:border-gray-600 px-3 py-2 bg-white dark:bg-[#212121] text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter new name"
          />
          {error && <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>}
          <div className="flex justify-end gap-3 mt-6">
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
            >
              {cancelLabel}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-4 py-2 rounded-md bg-blue-600 dark:bg-blue-600 text-white text-sm hover:bg-blue-500 dark:hover:bg-blue-700 transition-colors disabled:opacity-50"
            >
              {loading ? "Saving..." : confirmLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RenameModal;
