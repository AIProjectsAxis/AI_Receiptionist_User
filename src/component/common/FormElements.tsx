import React, { ReactNode, ChangeEvent } from 'react';

// Common types
type CommonProps = {
  className?: string;
  [key: string]: any;
}

type InputProps = CommonProps & {
  type?: string;
  id?: string;
  name?: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
}

type SelectOption = {
  value: string | number;
  label: string;
  disabled?: boolean;
}

type SelectProps = CommonProps & {
  id?: string;
  name?: string;
  value: string | number;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: SelectOption[];
  placeholder?: string | null;
  required?: boolean;
  disabled?: boolean;
}

type CheckboxProps = CommonProps & {
  id: string;
  name: string;
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  disabled?: boolean;
  dataField?: string;
}

type RadioProps = CommonProps & {
  id: string;
  name: string;
  value: string;
  checked: boolean;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  label?: string;
  disabled?: boolean;
}

type TextareaProps = CommonProps & {
  id?: string;
  name?: string;
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  rows?: number;
  required?: boolean;
  disabled?: boolean;
}

// Base component props
const baseProps = (className = '') => ({
  className: `${className}`.trim()
});

// Form components
export const FormGroup: React.FC<{ children: ReactNode } & CommonProps> = ({ 
  children, 
  className = '', 
  ...props 
}) => (
  <div {...baseProps(`form-group ${className}`)} {...props}>
    {children}
  </div>
);

export const FormLabel: React.FC<{ children: ReactNode; htmlFor?: string } & CommonProps> = ({
  children,
  htmlFor,
  className = '',
  ...props
}) => (
  <label {...baseProps(`form-label ${className}`)} htmlFor={htmlFor} {...props}>
    {children}
  </label>
);

export const FormInput: React.FC<InputProps> = ({
  type = 'text',
  id,
  name,
  value,
  onChange,
  placeholder = '',
  className = '',
  required = false,
  disabled = false,
  ...props
}) => (
  <input
    type={type}
    id={id}
    name={name}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    {...baseProps(`form-input ${className}`)}
    required={required}
    disabled={disabled}
    {...props}
  />
);

export const FormSelect: React.FC<SelectProps> = ({
  id,
  name,
  value,
  onChange,
  options = [],
  placeholder = null,
  className = '',
  required = false,
  disabled = false,
  ...props
}) => (
  <select
    id={id}
    name={name}
    value={value}
    onChange={onChange}
    {...baseProps(`form-select ${className}`)}
    required={required}
    disabled={disabled}
    {...props}
  >
    {placeholder && (
      <option value="" disabled>{placeholder}</option>
    )}
    {options.map((option, index) => (
      <option key={index} value={option.value} disabled={option.disabled}>
        {option.label}
      </option>
    ))}
  </select>
);

export const FormCheckbox: React.FC<CheckboxProps> = ({
  id,
  name,
  checked,
  onChange,
  label,
  className = '',
  disabled = false,
  dataField,
  ...props
}) => (
  <div {...baseProps(`custom-checkbox ${className} ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}`)}>
    <input
      type="checkbox"
      id={id}
      name={name}
      checked={checked}
      onChange={onChange}
      className="checkbox-input"
      disabled={disabled}
      data-field={dataField || ""}
      {...props}
    />
    <label htmlFor={id} className="checkbox-label px-2">
      {label && <span className="checkbox-text">{label}</span>}
    </label>
  </div>
);

export const FormRadio: React.FC<RadioProps> = ({
  id,
  name,
  value,
  checked,
  onChange,
  label,
  className = '',
  disabled = false,
  ...props
}) => (
  <div {...baseProps(`custom-radio ${className} ${checked ? 'checked' : ''} ${disabled ? 'disabled' : ''}`)}>
    <input
      type="radio"
      id={id}
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      className="radio-input"
      disabled={disabled}
      {...props}
    />
    <label htmlFor={id} className="radio-label">
      {/* <span className="radio-control">
        <span className="radio-dot" />
      </span> */}
      {label && <span className="radio-text">{label}</span>}
    </label>
  </div>
);

export const FormTextarea: React.FC<TextareaProps> = ({
  id,
  name,
  value,
  onChange,
  placeholder = '',
  rows = 4,
  className = '',
  required = false,
  disabled = false,
  ...props
}) => (
  <textarea
    id={id}
    name={name}
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    rows={rows}
    {...baseProps(`form-textarea ${className}`)}
    required={required}
    disabled={disabled}
    {...props}
  />
);

export const FormHelper: React.FC<{ children: ReactNode } & CommonProps> = ({
  children,
  className = '',
  ...props
}) => (
  <div {...baseProps(`form-helper ${className}`)} {...props}>
    {children}
  </div>
);
