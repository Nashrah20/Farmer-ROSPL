import React from 'react';

const StatCard = ({ title, value, unit, icon, color = 'primary' }) => {
  const colorClasses = {
    primary: 'bg-primary-50 text-primary-700 border-primary-200',
    blue: 'bg-blue-50 text-blue-700 border-blue-200',
    green: 'bg-green-50 text-green-700 border-green-200',
    yellow: 'bg-yellow-50 text-yellow-700 border-yellow-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  };

  return (
    <div className={`p-4 rounded-lg border-2 card-hover ${colorClasses[color]}`}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium opacity-75 uppercase tracking-wide">{title}</p>
          <p className="text-2xl font-bold mt-1">
            {value !== null && value !== undefined ? value : '--'}
            {unit && <span className="text-sm font-normal ml-1">{unit}</span>}
          </p>
        </div>
        {icon && <div className="text-3xl ml-2">{icon}</div>}
      </div>
    </div>
  );
};

export default StatCard;
