import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const AnimatedButton: React.FC<ButtonProps> = ({ children, className = '', ...props }) => {
  return (
    <button className={`animated-button ${className}`} {...props}>
      <svg viewBox="0 0 24 24" className="arr-2" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z" />
      </svg>
      <span className="text">{children}</span>
      <span className="circle" />
      <svg viewBox="0 0 24 24" className="arr-1" xmlns="http://www.w3.org/2000/svg">
        <path d="M16.1716 10.9999L10.8076 5.63589L12.2218 4.22168L20 11.9999L12.2218 19.778L10.8076 18.3638L16.1716 12.9999H4V10.9999H16.1716Z" />
      </svg>
    </button>
  );
};

interface CheckboxProps extends Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string;
}

export const AnimatedCheckbox: React.FC<CheckboxProps> = ({ checked, onChange, label, className = '', id, ...props }) => {
  return (
    <div className={`flex items-center gap-3 ${className}`}>
      <label className="animated-checkbox-container animated-checkbox-label">
        <input type="checkbox" checked={checked} onChange={onChange} id={id} {...props} />
        <svg viewBox="0 0 64 64" height="1.5em" width="1.5em" className="inline-block align-middle">
          <path d="M 0 16 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 16 L 32 48 L 64 16 V 8 A 8 8 90 0 0 56 0 H 8 A 8 8 90 0 0 0 8 V 56 A 8 8 90 0 0 8 64 H 56 A 8 8 90 0 0 64 56 V 16" pathLength="575.0541381835938" className="animated-checkbox-path" />
        </svg>
      </label>
      {label && <label htmlFor={id} className="text-xs text-slate-300 font-medium cursor-pointer select-none">{label}</label>}
    </div>
  );
};

interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}

export const CosmicToggle: React.FC<ToggleProps> = ({ checked, onChange, id }) => {
  return (
    <label className="cosmic-toggle">
      <input className="toggle" type="checkbox" id={id} checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <div className="slider">
        <div className="cosmos" />
        <div className="energy-line" />
        <div className="energy-line" />
        <div className="energy-line" />
        <div className="toggle-orb">
          <div className="inner-orb" />
          <div className="ring" />
        </div>
        <div className="particles">
          <div style={{'--angle': '30deg'} as React.CSSProperties} className="particle" />
          <div style={{'--angle': '60deg'} as React.CSSProperties} className="particle" />
          <div style={{'--angle': '90deg'} as React.CSSProperties} className="particle" />
          <div style={{'--angle': '120deg'} as React.CSSProperties} className="particle" />
          <div style={{'--angle': '150deg'} as React.CSSProperties} className="particle" />
          <div style={{'--angle': '180deg'} as React.CSSProperties} className="particle" />
        </div>
      </div>
    </label>
  );
};

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  labelText: string;
}

export const AnimatedInput: React.FC<InputProps> = ({ labelText, value, onChange, ...props }) => {
  return (
    <div className="animated-input-group">
      <input 
        value={value} 
        onChange={onChange} 
        placeholder=" " /* Crucial for :placeholder-shown to work */
        {...props} 
      />
      <label>
        {labelText.split('').map((char, index) => (
          <span 
            key={index} 
            style={{ 
              transitionDelay: `${index * 35}ms`,
              marginRight: char === ' ' ? '4px' : '0px'
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </label>
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  labelText: string;
}

export const AnimatedTextArea: React.FC<TextAreaProps> = ({ labelText, value, onChange, ...props }) => {
  return (
    <div className="animated-input-group">
      <textarea 
        value={value} 
        onChange={onChange} 
        placeholder=" " 
        {...props} 
      />
      <label>
        {labelText.split('').map((char, index) => (
          <span 
            key={index} 
            style={{ 
              transitionDelay: `${index * 35}ms`,
              marginRight: char === ' ' ? '4px' : '0px'
            }}
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        ))}
      </label>
    </div>
  );
};

interface TooltipProps {
  text: string;
  tooltipText: string;
  hoverText?: string;
}

export const AnimatedTooltip: React.FC<TooltipProps> = ({ text, tooltipText, hoverText = "Info ℹ️" }) => {
  return (
    <div className="animated-tooltip-container">
      <span className="tooltip">{tooltipText}</span>
      <span className="text">{text}</span>
      <span className="bg-hover">{hoverText}</span>
    </div>
  );
};

interface SocialProps {
  href: string;
  icon: React.ReactNode;
  platform: string;
  username: string;
  followers: string;
  colorHex: string;
  iconLetter: string;
}

export const AnimatedSocialLink: React.FC<SocialProps> = ({ href, icon, platform, username, followers, colorHex, iconLetter }) => {
  return (
    <div className="animated-social-container" style={{ '--social-color': colorHex } as React.CSSProperties}>
      <div className="tooltip">
        <div className="profile">
          <div className="user">
            <div className="img-stub" style={{ border: `1px solid ${colorHex}` }}>{iconLetter}</div>
            <div className="details">
              <div className="name" style={{ color: colorHex }}>{platform}</div>
              <div className="username">{username}</div>
            </div>
          </div>
          <div className="about">{followers}</div>
        </div>
      </div>
      <div className="text">
        <a className="icon" href={href} target="_blank" rel="noopener noreferrer">
          <div className="layer">
            <span />
            <span />
            <span />
            <span />
            <span className="social-svg-container" style={{ background: colorHex }}>
              {icon}
            </span>
          </div>
          <div className="text" style={{ color: colorHex }}>{platform}</div>
        </a>
      </div>
    </div>
  );
};
