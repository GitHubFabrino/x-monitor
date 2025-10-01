import React from 'react';

interface FormattedDateProps {
  date: Date | string | number | null | undefined;
  defaultText?: string;
  className?: string;
}

export const FormattedDate: React.FC<FormattedDateProps> = ({
  date,
  defaultText = 'N/A',
  className = ''
}) => {
  if (!date) {
    return <span className={className}>{defaultText}</span>;
  }

  const dateObj = new Date(date);
  
  if (isNaN(dateObj.getTime())) {
    return <span className={className}>{defaultText}</span>;
  }

  return (
    <div className={`flex flex-col ${className}`}>
      <span>{dateObj.toLocaleTimeString()}</span>
      <span className="text-xs opacity-80">
        {dateObj.toLocaleDateString(undefined, {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        })}
      </span>
    </div>
  );
};

export default FormattedDate;
