import React from 'react';
import './Loader.css';

interface LoaderProps {
  size?: number;
  label?: string;
}

const Loader: React.FC<LoaderProps> = ({ size = 64, label }) => {
  const scale = size / 64;
  return (
    <div className="custom-loader-wrapper">
      <div className="custom-loader" style={{ transform: `scale(${scale})` }}>
        <svg height={0} width={0} viewBox="0 0 64 64" className="custom-loader-absolute">
          <defs xmlns="http://www.w3.org/2000/svg">
            <linearGradient gradientUnits="userSpaceOnUse" y2={2} x2={0} y1={62} x1={0} id="loader-grad-b">
              <stop stopColor="#1e3a8a" />
              <stop stopColor="#2563eb" offset={1} />
            </linearGradient>
            <linearGradient gradientUnits="userSpaceOnUse" y2={0} x2={0} y1={64} x1={0} id="loader-grad-c">
              <stop stopColor="#eab308" />
              <stop stopColor="#1e3a8a" offset={1} />
              <animateTransform repeatCount="indefinite" keySplines=".42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1;.42,0,.58,1" keyTimes="0; 0.125; 0.25; 0.375; 0.5; 0.625; 0.75; 0.875; 1" dur="8s" values="0 32 32;-270 32 32;-270 32 32;-540 32 32;-540 32 32;-810 32 32;-810 32 32;-1080 32 32;-1080 32 32" type="rotate" attributeName="gradientTransform" />
            </linearGradient>
            <linearGradient gradientUnits="userSpaceOnUse" y2={2} x2={0} y1={62} x1={0} id="loader-grad-d">
              <stop stopColor="#facc15" />
              <stop stopColor="#eab308" offset={1} />
            </linearGradient>
          </defs>
        </svg>

        {/* "UoN" text with gradient stroke animation */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 180 64" height={64} width={180} className="custom-loader-inline custom-loader-text-left">
          <text
            x="90"
            y="46"
            textAnchor="middle"
            fontFamily="'Inter', 'Outfit', system-ui, sans-serif"
            fontWeight="800"
            fontSize="42"
            stroke="url(#loader-grad-b)"
            strokeWidth="2"
            fill="none"
            className="custom-loader-text"
            pathLength={360}
          >
            UoN
          </text>
        </svg>

        {/* Spinning "O" ring as separator */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 64 64" height={64} width={64} className="custom-loader-inline custom-loader-spinner">
          <path strokeLinejoin="round" strokeLinecap="round" strokeWidth={10} stroke="url(#loader-grad-c)" d="M 32 32 m 0 -27 a 27 27 0 1 1 0 54 a 27 27 0 1 1 0 -54" className="custom-loader-spin" pathLength={360} />
        </svg>

        {/* "Clear" text with gradient stroke animation */}
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 180 64" height={64} width={180} className="custom-loader-inline custom-loader-text-right">
          <text
            x="90"
            y="46"
            textAnchor="middle"
            fontFamily="'Inter', 'Outfit', system-ui, sans-serif"
            fontWeight="800"
            fontSize="42"
            stroke="url(#loader-grad-d)"
            strokeWidth="2"
            fill="none"
            className="custom-loader-text"
            pathLength={360}
          >
            Clear
          </text>
        </svg>
      </div>
      {label && <span className="custom-loader-label">{label}</span>}
    </div>
  );
};

export default Loader;
