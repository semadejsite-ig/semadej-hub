import React from 'react';
import styles from './Input.module.css';
import { clsx } from 'clsx';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, label, error, id, ...props }, ref) => {
        return (
            <div className={styles.wrapper}>
                {label && (
                    <label htmlFor={id} className={styles.label}>
                        {label}
                    </label>
                )}
                <input
                    ref={ref}
                    id={id}
                    className={clsx(
                        styles.input,
                        error && styles.hasError,
                        className
                    )}
                    {...props}
                />
                {error && <span className={styles.error}>{error}</span>}
            </div>
        );
    }
);

Input.displayName = "Input";
