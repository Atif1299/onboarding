import React from 'react';

export function Spinner({ className = '', size = 'md', ...props }) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  return (
    <div className={`inline-block animate-spin rounded-full border-2 border-solid border-current border-r-transparent ${sizeClasses[size]} ${className}`} {...props}>
      <span className="sr-only">Loading...</span>
    </div>
  );
}

export default Spinner;
