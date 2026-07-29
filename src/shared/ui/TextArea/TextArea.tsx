import { forwardRef, useId, type TextareaHTMLAttributes } from 'react';
import styles from './TextArea.module.css';

export interface TextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string;
  helperText?: string | undefined;
  errorText?: string | undefined;
  id?: string | undefined;
}

export const TextArea = forwardRef<HTMLTextAreaElement, TextAreaProps>(function TextArea(
  { label, helperText, errorText, className, id, rows = 4, ...rest },
  ref,
) {
  const autoId = useId();
  const inputId = id ?? autoId;
  const helperId = helperText ? `${inputId}-help` : undefined;
  const errorId = errorText ? `${inputId}-err` : undefined;
  const describedBy = [helperId, errorId].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`${styles.field} ${className ?? ''}`}>
      <label htmlFor={inputId} className={styles.label}>
        {label}
      </label>
      <textarea
        ref={ref}
        id={inputId}
        rows={rows}
        className={`${styles.input} ${errorText ? styles.inputError : ''}`}
        aria-invalid={errorText ? true : undefined}
        aria-describedby={describedBy}
        {...rest}
      />
      {helperText && !errorText && (
        <p id={helperId} className={styles.helper}>
          {helperText}
        </p>
      )}
      {errorText && (
        <p id={errorId} className={styles.error} role="alert">
          {errorText}
        </p>
      )}
    </div>
  );
});
