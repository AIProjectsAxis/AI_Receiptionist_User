import React, { ReactNode, ButtonHTMLAttributes } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  type?: 'button' | 'submit' | 'reset';
  variant?: string;
  size?: string;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children,
  type = 'button',
  variant = 'primary',
  size = '',
  className = '',
  onClick,
  disabled = false,
  ...props
}) => {
  // Create class names based on props
  const getButtonClasses = (): string => {
    let classes = 'button';
    
    // Add variant class
    if (variant) {
      classes += ` button-${variant}`;
    }
    
    // Add size class
    if (size) {
      classes += ` button-${size}`;
    }
    
    // Add custom classes
    if (className) {
      classes += ` ${className}`;
    }
    
    return classes;
  };
  
  return React.createElement(
    'button',
    {
      type,
      className: getButtonClasses(),
      onClick,
      disabled,
      ...props
    },
    children
  );
};

export default Button;