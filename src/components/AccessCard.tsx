import React from 'react';

interface AccessCardProps {
  title: string;
  description: string;
  features: string[];
  checked: boolean;
  type: 'client' | 'store';
}

const AccessCard: React.FC<AccessCardProps> = ({
  title,
  description,
  features,
  checked,
  type
}) => {
  return (
    <div className={`access-card ${type} ${checked ? 'checked' : ''}`}>
      <div className="card-header">
        <input
          type="radio"
          name="access-type"
          checked={checked}
          readOnly
          className="radio-input"
        />
        <span className="card-title">{title}</span>
      </div>

      <p className="card-description">{description}</p>

      <ul className="features-list">
        {features.map((feature, index) => (
          <li key={index} className="feature-item">
            <span className="checkmark">✔</span>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AccessCard;
