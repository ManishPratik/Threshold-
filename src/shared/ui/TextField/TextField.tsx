import { forwardRef, useId, type InputHTMLAttributes } from 'react';
import styles from './TextField.module.css';

export interface TextFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string;
  helperText?: string | undefined;
  errorText?: string | undefined;
  id?: string | undefined;
}

export const TextField = forwardRef<HTMLInputElement, TextFieldProps>(function TextField(
  { label, helperText, errorText, className, id, ...rest },
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
      <input
        ref={ref}
        id={inputId}
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
