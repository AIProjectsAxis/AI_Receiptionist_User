import React, { ReactNode, CSSProperties } from 'react';

// Define the props interface for the Card component
interface CardProps {
  children: ReactNode;
  title?: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  footer?: ReactNode;
  className?: string;
  style?: CSSProperties;
  isLoading?: boolean;
  // Allow any additional HTML div props
  [key: string]: any;
}

const Card = ({
  children,
  title,
  subtitle,
  actions,
  footer,
  className = '',
  style = {},
  isLoading,
  ...props
}: CardProps): JSX.Element => {
  return (
    <div
      className={`
        bg-white/90 backdrop-blur-lg 
        rounded-lg p-4 md:rounded-xl md:p-6 
        border border-gray-200/50 
        shadow-md hover:shadow-lg 
        mb-6 
        transition-all duration-300 
        relative overflow-hidden
        ${className}
      `}
      style={style}
      {...props}
    >
      {(title || subtitle || actions) && (
        <div 
          className="
            flex flex-col gap-3 mb-4 
            md:flex-row md:justify-between md:items-start md:gap-0 md:mb-6 
            relative
          "
        >
          <div className="flex-1">
            {title && (
              <h3 
                className="
                  font-semibold text-lg md:text-xl 
                  text-gray-900 
                  flex items-center gap-2 mb-1
                "
              >
                {title}
              </h3>
            )}
            {subtitle && (
              <div className="text-gray-600 text-sm">
                {subtitle}
              </div>
            )}
          </div>
          {actions && <div className="card-actions">{actions}</div>}
        </div>
      )}

      <div className="">
        {isLoading ? (
          <div className="flex justify-center items-center h-full">
            <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-gray-900"></div>
          </div>
        ) : (
          children
        )}
      </div>

      {footer && (
        <div 
          className="
            mt-5 pt-5 
            border-t border-gray-200/50 
            flex justify-end gap-3
          "
        >
          {footer}
        </div>
      )}
    </div>
  );
};

export default Card;