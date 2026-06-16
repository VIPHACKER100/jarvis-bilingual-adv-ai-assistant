import { FC, TextareaHTMLAttributes } from 'react';

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea: FC<TextareaProps> = ({
  label,
  error,
  className = '',
  ...props
}) => (
  <div className="form-group">
    {label && <label className="form-label">{label}</label>}
    <textarea
      className={`form-textarea ${error ? 'form-input--error' : ''} ${className}`}
      {...props}
    />
    {error && <span className="form-error">{error}</span>}
  </div>
);
