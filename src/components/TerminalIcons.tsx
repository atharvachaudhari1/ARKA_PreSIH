import React from "react";

interface IconProps {
  size?: number;
  className?: string;
  style?: React.CSSProperties;
  color?: string; // override purple accent color
}

/**
 * Custom Brutalist Terminal SVG Icons matching the uploaded aesthetic:
 * - Bold thick black frames (#1a1a1a) with crisp rounded corners
 * - Vibrant brand-purple accents (#5b5fc7) for inner elements and notification badges
 * - No default emojis! Clean pixel-perfect vectors.
 */

export function IconTerminalPrompt({ size = 28, style, color = "#5b5fc7" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#ffffff" stroke="#1a1a1a" strokeWidth="2.5" />
      <path d="M7 8L11 12L7 16" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="13" y1="16" x2="17" y2="16" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconDashboardGrid({ size = 28, style, color = "#5b5fc7" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#ffffff" stroke="#1a1a1a" strokeWidth="2.5" />
      <line x1="2" y1="7" x2="22" y2="7" stroke="#1a1a1a" strokeWidth="2.5" />
      <rect x="5" y="10" width="5.5" height="4.5" rx="1" fill={color} />
      <rect x="13.5" y="10" width="5.5" height="4.5" rx="1" fill={color} />
      <rect x="5" y="16.5" width="5.5" height="3.5" rx="1" fill={color} />
      <rect x="13.5" y="16.5" width="5.5" height="3.5" rx="1" fill={color} />
    </svg>
  );
}

export function IconConsoleAlert({ size = 28, style, color = "#5b5fc7" }: IconProps) {
  return (
    <svg width={size} height={size + 6} viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <rect x="2" y="2" width="20" height="18" rx="4" fill="#ffffff" stroke="#1a1a1a" strokeWidth="2.5" />
      <line x1="6" y1="6" x2="14" y2="6" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M7 10L10 13L7 16" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      <line x1="12" y1="16" x2="17" y2="16" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="12" cy="25" r="3.5" fill={color} />
    </svg>
  );
}

export function IconSearchRadar({ size = 28, style, color = "#5b5fc7" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#ffffff" stroke="#1a1a1a" strokeWidth="2.5" />
      <circle cx="11" cy="11" r="4.5" stroke={color} strokeWidth="2.5" />
      <line x1="14.5" y1="14.5" x2="18" y2="18" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconSquadUsers({ size = 28, style, color = "#5b5fc7" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#ffffff" stroke="#1a1a1a" strokeWidth="2.5" />
      <circle cx="9" cy="10" r="2.5" fill={color} />
      <path d="M5 17C5 14.7909 6.79086 13 9 13C11.2091 13 13 14.7909 13 17" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="16" cy="11" r="2" fill="#1a1a1a" />
      <path d="M15 17C15 15.5 16 14 18 14" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  );
}

export function IconRocketDeploy({ size = 28, style, color = "#5b5fc7" }: IconProps) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={style}>
      <rect x="2" y="2" width="20" height="20" rx="4" fill="#ffffff" stroke="#1a1a1a" strokeWidth="2.5" />
      <path d="M12 6C12 6 16 7 17 11C18 15 16 17 16 17L12 15L8 17C8 17 6 15 7 11C8 7 12 6 12 6Z" fill={color} stroke="#1a1a1a" strokeWidth="1.5" />
      <line x1="12" y1="15" x2="12" y2="19" stroke="#1a1a1a" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
