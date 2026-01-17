import { useState, useRef, useEffect, useCallback } from 'react';

interface UseEditableFieldOptions<T> {
  /** Initial value to display when editing starts */
  initialValue: T;
  /** Called when edit is submitted with a valid value */
  onSubmit: (value: T) => void;
  /** Validates the value before submission. Returns true if valid. */
  validate?: (value: T) => boolean;
}

interface UseEditableFieldReturn<T> {
  /** Whether the field is currently being edited */
  isEditing: boolean;
  /** Current edit value */
  value: T;
  /** Ref to attach to the input element for auto-focus */
  inputRef: React.RefObject<HTMLInputElement>;
  /** Start editing mode */
  startEditing: () => void;
  /** Update the edit value */
  setValue: (value: T) => void;
  /** Submit the edit (validates first) */
  submit: () => void;
  /** Cancel editing and reset value */
  cancel: () => void;
  /** Key handler for Enter (submit) and Escape (cancel) */
  handleKeyDown: (e: React.KeyboardEvent) => void;
}

/**
 * Hook for managing inline editable fields.
 * Provides state, refs, and handlers for a consistent editing experience.
 *
 * Features:
 * - Auto-focus and select on edit start
 * - Enter to submit, Escape to cancel
 * - Optional validation before submit
 */
export function useEditableField<T>({
  initialValue,
  onSubmit,
  validate = () => true,
}: UseEditableFieldOptions<T>): UseEditableFieldReturn<T> {
  const [isEditing, setIsEditing] = useState(false);
  const [value, setValue] = useState<T>(initialValue);
  const inputRef = useRef<HTMLInputElement>(null!);

  // Auto-focus and select when editing starts
  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const startEditing = useCallback(() => {
    setValue(initialValue);
    setIsEditing(true);
  }, [initialValue]);

  const submit = useCallback(() => {
    if (validate(value)) {
      onSubmit(value);
    }
    setIsEditing(false);
  }, [value, validate, onSubmit]);

  const cancel = useCallback(() => {
    setValue(initialValue);
    setIsEditing(false);
  }, [initialValue]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        submit();
      } else if (e.key === 'Escape') {
        cancel();
      }
    },
    [submit, cancel]
  );

  return {
    isEditing,
    value,
    inputRef,
    startEditing,
    setValue,
    submit,
    cancel,
    handleKeyDown,
  };
}
