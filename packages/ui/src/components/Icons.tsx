"use client"

import React from "react";

interface IconProps {
  size?: number | string;
  color?: string;
  strokeWidth?: number;
  fill?: string;
  className?: string;
}

const BaseIc = ({ children, size = 18, color = "currentColor", strokeWidth = 2, fill = "none", className }: IconProps & { children: React.ReactNode }) => (
  <svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    fill={fill} 
    stroke={color} 
    strokeWidth={strokeWidth} 
    strokeLinecap="round" 
    strokeLinejoin="round"
    className={className}
  >
    {children}
  </svg>
);

export const Ic = {
  Clock: (p: IconProps) => <BaseIc {...p}><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></BaseIc>,
  Search: (p: IconProps) => <BaseIc size={16} {...p}><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></BaseIc>,
  Map: (p: IconProps) => <BaseIc {...p}><polygon points="3 6 9 3 15 6 21 3 21 18 15 21 9 18 3 21"/><line x1="9" y1="3" x2="9" y2="18"/><line x1="15" y1="6" x2="15" y2="21"/></BaseIc>,
  Star: (p: IconProps) => <BaseIc size={14} strokeWidth={1} fill={p.color || "#f5c418"} color={p.color || "#f5c418"} {...p}><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></BaseIc>,
  User: (p: IconProps) => <BaseIc {...p}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></BaseIc>,
  Grid: (p: IconProps) => <BaseIc {...p}><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></BaseIc>,
  Home: (p: IconProps) => <BaseIc {...p}><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></BaseIc>,
  Bell: (p: IconProps) => <BaseIc {...p}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></BaseIc>,
  Check: (p: IconProps) => <BaseIc size={16} strokeWidth={2.5} {...p}><polyline points="20 6 9 17 4 12"/></BaseIc>,
  Arrow: (p: IconProps) => <BaseIc size={16} {...p}><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></BaseIc>,
  Plus: (p: IconProps) => <BaseIc size={16} {...p}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></BaseIc>,
  X: (p: IconProps) => <BaseIc size={16} {...p}><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></BaseIc>,
  Heart: (p: IconProps) => <BaseIc fill={p.fill || "none"} {...p}><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></BaseIc>,
  ChevR: (p: IconProps) => <BaseIc size={16} {...p}><polyline points="9 18 15 12 9 6"/></BaseIc>,
  ChevD: (p: IconProps) => <BaseIc size={14} {...p}><polyline points="6 9 12 15 18 9"/></BaseIc>,
  ChevL: (p: IconProps) => <BaseIc size={16} {...p}><polyline points="15 18 9 12 15 6"/></BaseIc>,
  Shield: (p: IconProps) => <BaseIc {...p}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></BaseIc>,
  Settings: (p: IconProps) => <BaseIc {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></BaseIc>,
  LogOut: (p: IconProps) => <BaseIc {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></BaseIc>,
  Users: (p: IconProps) => <BaseIc {...p}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></BaseIc>,
  Bar: (p: IconProps) => <BaseIc {...p}><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></BaseIc>,
  MapPin: (p: IconProps) => <BaseIc size={14} {...p}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></BaseIc>,
  Zap: (p: IconProps) => <BaseIc size={16} {...p}><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></BaseIc>,
  Eye: (p: IconProps) => <BaseIc size={16} {...p}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></BaseIc>,
  Store: (p: IconProps) => <BaseIc {...p}><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M2 7h20"/></BaseIc>,
  Building: (p: IconProps) => <BaseIc {...p}><rect x="4" y="2" width="16" height="20" rx="2"/><line x1="9" y1="22" x2="9" y2="12"/><line x1="15" y1="22" x2="15" y2="12"/></BaseIc>,
  Tag: (p: IconProps) => <BaseIc size={14} {...p}><path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z"/><line x1="7" y1="7" x2="7.01" y2="7"/></BaseIc>,
  Filter: (p: IconProps) => <BaseIc size={16} {...p}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></BaseIc>,
  Sparkle: (p: IconProps) => <BaseIc size={16} {...p}><path d="m12 3-1.912 5.813a2 2 0 0 1-1.275 1.275L3 12l5.813 1.912a2 2 0 0 1 1.275 1.275L12 21l1.912-5.813a2 2 0 0 1 1.275-1.275L21 12l-5.813-1.912a2 2 0 0 1-1.275-1.275L12 3Z"/></BaseIc>,
  Google: ({ size = 18 }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
    </svg>
  ),
  Upload: (p: IconProps) => <BaseIc size={16} {...p}><polyline points="16 16 12 12 8 16"/><line x1="12" y1="12" x2="12" y2="21"/><path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/></BaseIc>,
  TrendUp: (p: IconProps) => <BaseIc size={16} {...p}><polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/></BaseIc>,
  Walk: (p: IconProps) => <BaseIc size={13} {...p}><circle cx="12" cy="5" r="1"/><path d="m9 20 3-6 3 6"/><path d="m6 8 6 2 4-2"/></BaseIc>,
  Menu: (p: IconProps) => <BaseIc size={20} {...p}><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></BaseIc>,
  ChevronLeft: (p: IconProps) => <BaseIc size={16} {...p}><polyline points="15 18 9 12 15 6"/></BaseIc>,
  ChevronRight: (p: IconProps) => <BaseIc size={16} {...p}><polyline points="9 18 15 12 9 6"/></BaseIc>,
  List: (p: IconProps) => <BaseIc {...p}><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></BaseIc>,
  Activity: (p: IconProps) => <BaseIc {...p}><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></BaseIc>,
  Pie: (p: IconProps) => <BaseIc {...p}><path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/></BaseIc>,
  Copy: (p: IconProps) => <BaseIc {...p}><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></BaseIc>,
};
