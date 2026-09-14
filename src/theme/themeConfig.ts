import { ThemeConfig } from 'antd';

export const customTheme: ThemeConfig = {
  token: {
    colorPrimary: '#0284c7', // Cyber Blue / Ocean
    colorInfo: '#0284c7',
    colorSuccess: '#10b981', // Modern Emerald
    colorWarning: '#f59e0b', // Amber
    colorError: '#ef4444', // Rose Red
    colorTextBase: '#0f172a', // Slate 900
    colorBgBase: '#ffffff',
    fontFamily: "'Plus Jakarta Sans', 'Inter', -apple-system, BlinkMacSystemFont, sans-serif",
    borderRadius: 10,
    borderRadiusLG: 14,
    borderRadiusSM: 6,
    boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.06), 0 2px 6px -1px rgba(15, 23, 42, 0.04)',
    boxShadowSecondary: '0 10px 25px -5px rgba(2, 132, 199, 0.12), 0 8px 10px -6px rgba(2, 132, 199, 0.08)',
  },
  components: {
    Button: {
      controlHeight: 40,
      controlHeightLG: 48,
      borderRadius: 8,
      fontWeight: 600,
      primaryShadow: '0 4px 14px 0 rgba(2, 132, 199, 0.35)',
    },
    Card: {
      borderRadiusLG: 16,
      headerHeight: 52,
    },
    Table: {
      borderRadius: 12,
      headerBg: '#f8fafc',
      headerColor: '#1e293b',
      rowHoverBg: '#f0f9ff',
    },
    Tag: {
      borderRadiusSM: 6,
    },
    Input: {
      controlHeight: 42,
      borderRadius: 8,
    },
    Select: {
      controlHeight: 42,
      borderRadius: 8,
    },
  },
};
