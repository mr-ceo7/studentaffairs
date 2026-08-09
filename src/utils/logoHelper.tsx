import React, { useState } from 'react';

// Mappings for popular leagues to API-Sports IDs
const LEAGUE_MAPPING: Record<string, number> = {
  'premier league': 39,
  'english premier league': 39,
  'epl': 39,
  'la liga': 140,
  'laliga': 140,
  'primera division': 140,
  'serie a': 135,
  'bundesliga': 78,
  'ligue 1': 61,
  'champions league': 2,
  'uefa champions league': 2,
  'europa league': 3,
  'uefa europa league': 3,
  'eredivisie': 88,
  'primeira liga': 94,
  'mls': 253,
  'major league soccer': 253,
  'ligue mx': 262,
  'super lig': 203,
  'turkish super lig': 203,
};

// Mappings for popular teams to API-Sports IDs
const TEAM_MAPPING: Record<string, number> = {
  // EPL
  'arsenal': 42,
  'aston villa': 66,
  'bournemouth': 35,
  'brentford': 55,
  'brighton': 51,
  'chelsea': 49,
  'crystal palace': 52,
  'everton': 45,
  'fulham': 36,
  'ipswich': 57,
  'leicester': 46,
  'leicester city': 46,
  'liverpool': 40,
  'manchester city': 50,
  'man city': 50,
  'manchester united': 33,
  'man united': 33,
  'man utd': 33,
  'newcastle': 34,
  'newcastle united': 34,
  'nottingham forest': 65,
  'southampton': 41,
  'tottenham': 47,
  'tottenham hotspur': 47,
  'spurs': 47,
  'west ham': 48,
  'west ham united': 48,
  'wolves': 39,
  'wolverhampton': 39,
  'wolverhampton wanderers': 39,

  // La Liga
  'real madrid': 541,
  'barcelona': 529,
  'barca': 529,
  'atletico madrid': 530,
  'real sociedad': 548,
  'real betis': 543,
  'villarreal': 533,
  'athletic bilbao': 531,
  'athletic club': 531,
  'sevilla': 536,
  'valencia': 532,
  'girona': 547,

  // Serie A
  'inter': 505,
  'inter milan': 505,
  'ac milan': 489,
  'milan': 489,
  'juventus': 496,
  'napoli': 492,
  'lazio': 487,
  'roma': 497,
  'as roma': 497,
  'atalanta': 499,
  'fiorentina': 502,
  'bologna': 500,

  // Bundesliga
  'bayern munich': 157,
  'bayern': 157,
  'dortmund': 165,
  'borussia dortmund': 165,
  'leverkusen': 168,
  'bayer leverkusen': 168,
  'leipzig': 173,
  'rb leipzig': 173,
  'frankfurt': 169,
  'eintracht frankfurt': 169,
  'stuttgart': 172,
  'vfb stuttgart': 172,

  // Ligue 1
  'psg': 85,
  'paris saint germain': 85,
  'marseille': 81,
  'olymlique marseille': 81,
  'monaco': 91,
  'as monaco': 91,
  'lyon': 80,
  'olympiqye lyonnais': 80,
  'lille': 79,
  'lens': 116,

  // Others
  'sporting cp': 228,
  'sporting lisbon': 228,
  'benfica': 211,
  'porto': 212,
  'fc porto': 212,
  'ajax': 194,
  'psv': 197,
  'psv eindhoven': 197,
  'feyenoord': 195,
  'celtic': 264,
  'rangers': 268,
  'galatasaray': 610,
  'fenerbahce': 611,
};

// Returns league logo URL or null if not mapped
export function getLeagueLogoUrl(leagueName: string): string | null {
  const normalized = leagueName.toLowerCase().trim();
  const id = LEAGUE_MAPPING[normalized];
  if (id) {
    return `https://media.api-sports.io/football/leagues/${id}.png`;
  }
  // Try partial matching
  for (const [key, val] of Object.entries(LEAGUE_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return `https://media.api-sports.io/football/leagues/${val}.png`;
    }
  }
  return null;
}

// Returns team logo URL or null if not mapped
export function getTeamLogoUrl(teamName: string): string | null {
  const normalized = teamName.toLowerCase().trim();
  const id = TEAM_MAPPING[normalized];
  if (id) {
    return `https://media.api-sports.io/football/teams/${id}.png`;
  }
  // Try partial matching
  for (const [key, val] of Object.entries(TEAM_MAPPING)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return `https://media.api-sports.io/football/teams/${val}.png`;
    }
  }
  return null;
}

// Helper to generate deterministic initials from a name
function getInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

// Helper to generate deterministic gradient background from a name
function getGradient(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  const colors = [
    ['from-indigo-600 to-purple-600', 'from-blue-600 to-indigo-600'],
    ['from-emerald-600 to-teal-600', 'from-cyan-600 to-blue-600'],
    ['from-rose-600 to-pink-600', 'from-pink-600 to-purple-600'],
    ['from-amber-600 to-orange-600', 'from-red-600 to-orange-600'],
    ['from-violet-600 to-fuchsia-600', 'from-purple-600 to-pink-600'],
  ];
  const index = Math.abs(hash) % colors.length;
  return colors[index][Math.abs(hash) % 2];
}

interface LogoProps {
  name: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

// TeamLogo Component: Renders official logo or dynamic initials fallback
export const TeamLogo: React.FC<LogoProps> = ({ name, className = '', size = 'md' }) => {
  const [error, setError] = useState(false);
  const logoUrl = getTeamLogoUrl(name);

  const sizeClasses = {
    sm: 'w-6 h-6 text-[10px]',
    md: 'w-9 h-9 text-[12px]',
    lg: 'w-12 h-12 text-[16px]',
  };

  if (logoUrl && !error) {
    return (
      <div className={`relative flex items-center justify-center bg-white/5 rounded-full border border-white/10 overflow-hidden shrink-0 ${sizeClasses[size]} ${className}`}>
        <img 
          src={logoUrl} 
          alt={`${name} Logo`} 
          className="w-[80%] h-[80%] object-contain" 
          onError={() => setError(true)} 
        />
      </div>
    );
  }

  // Fallback Initials Avatar with Deterministic Gradient
  const initials = getInitials(name);
  const gradient = getGradient(name);

  return (
    <div className={`relative flex items-center justify-center rounded-full border border-white/10 shrink-0 font-bold tracking-wider text-white bg-gradient-to-tr ${gradient} ${sizeClasses[size]} ${className}`}>
      {initials}
    </div>
  );
};

// LeagueLogo Component: Renders official league logo or glassmorphic icon fallback
export const LeagueLogo: React.FC<LogoProps> = ({ name, className = '', size = 'sm' }) => {
  const [error, setError] = useState(false);
  const logoUrl = getLeagueLogoUrl(name);

  const sizeClasses = {
    sm: 'w-5 h-5 text-[8px]',
    md: 'w-7 h-7 text-[10px]',
    lg: 'w-9 h-9 text-[12px]',
  };

  if (logoUrl && !error) {
    return (
      <div className={`relative flex items-center justify-center bg-white/5 rounded-lg border border-white/10 overflow-hidden shrink-0 ${sizeClasses[size]} ${className}`}>
        <img 
          src={logoUrl} 
          alt={`${name} Logo`} 
          className="w-[85%] h-[85%] object-contain" 
          onError={() => setError(true)} 
        />
      </div>
    );
  }

  const initials = getInitials(name);
  return (
    <div className={`relative flex items-center justify-center rounded-md bg-white/5 border border-white/10 shrink-0 text-slate-400 font-bold uppercase ${sizeClasses[size]} ${className}`}>
      {initials.slice(0, 2)}
    </div>
  );
};
