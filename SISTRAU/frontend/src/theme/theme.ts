import { createTheme, alpha } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1565C0',
      light: '#1976D2',
      dark: '#0D47A1',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: '#FF6B35',
      light: '#FF8C42',
      dark: '#E85D2C',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#D32F2F',
      light: '#EF5350',
      dark: '#C62828',
    },
    warning: {
      main: '#FFA726',
      light: '#FFB74D',
      dark: '#F57C00',
    },
    info: {
      main: '#0288D1',
      light: '#03A9F4',
      dark: '#01579B',
    },
    success: {
      main: '#2E7D32',
      light: '#4CAF50',
      dark: '#1B5E20',
    },
    background: {
      default: '#F5F7FA',
      paper: '#FFFFFF',
    },
    text: {
      primary: '#1A202C',
      secondary: '#718096',
    },
    divider: alpha('#718096', 0.12),
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.02em',
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
      letterSpacing: '-0.01em',
    },
    h3: {
      fontSize: '1.75rem',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '-0.01em',
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
      letterSpacing: '0.01em',
    },
    body1: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
      letterSpacing: '0.01em',
    },
    button: {
      fontWeight: 600,
      letterSpacing: '0.02em',
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px rgba(0,0,0,0.05)',
    '0px 4px 8px rgba(0,0,0,0.05)',
    '0px 8px 16px rgba(0,0,0,0.05)',
    '0px 12px 24px rgba(0,0,0,0.05)',
    '0px 16px 32px rgba(0,0,0,0.05)',
    '0px 20px 40px rgba(0,0,0,0.05)',
    '0px 24px 48px rgba(0,0,0,0.05)',
    '0px 28px 56px rgba(0,0,0,0.05)',
    '0px 32px 64px rgba(0,0,0,0.05)',
    '0px 36px 72px rgba(0,0,0,0.05)',
    '0px 40px 80px rgba(0,0,0,0.05)',
    '0px 44px 88px rgba(0,0,0,0.05)',
    '0px 48px 96px rgba(0,0,0,0.05)',
    '0px 52px 104px rgba(0,0,0,0.05)',
    '0px 56px 112px rgba(0,0,0,0.05)',
    '0px 60px 120px rgba(0,0,0,0.05)',
    '0px 64px 128px rgba(0,0,0,0.05)',
    '0px 68px 136px rgba(0,0,0,0.05)',
    '0px 72px 144px rgba(0,0,0,0.05)',
    '0px 76px 152px rgba(0,0,0,0.05)',
    '0px 80px 160px rgba(0,0,0,0.05)',
    '0px 84px 168px rgba(0,0,0,0.05)',
    '0px 88px 176px rgba(0,0,0,0.05)',
    '0px 92px 184px rgba(0,0,0,0.05)',
  ],
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '0.875rem',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0,0,0,0.08)',
          },
        },
        contained: {
          '&:hover': {
            boxShadow: '0px 4px 12px rgba(0,0,0,0.12)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 12px rgba(0,0,0,0.05)',
          '&.MuiPaper-elevation1': {
            boxShadow: '0px 2px 8px rgba(0,0,0,0.04)',
          },
          '&.MuiPaper-elevation2': {
            boxShadow: '0px 4px 12px rgba(0,0,0,0.05)',
          },
          '&.MuiPaper-elevation3': {
            boxShadow: '0px 8px 24px rgba(0,0,0,0.06)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: '0px 4px 12px rgba(0,0,0,0.05)',
          '&:hover': {
            boxShadow: '0px 8px 24px rgba(0,0,0,0.08)',
            transform: 'translateY(-2px)',
            transition: 'all 0.3s ease-in-out',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          boxShadow: '0px 2px 8px rgba(0,0,0,0.05)',
          backdropFilter: 'blur(10px)',
          backgroundColor: alpha('#FFFFFF', 0.8),
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: 'none',
          boxShadow: '4px 0px 24px rgba(0,0,0,0.05)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: '#1976D2',
            },
            '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
              borderWidth: 2,
            },
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 6,
          fontWeight: 500,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: alpha('#1A202C', 0.9),
          backdropFilter: 'blur(10px)',
          borderRadius: 6,
          padding: '8px 12px',
          fontSize: '0.75rem',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: alpha('#718096', 0.08),
        },
        head: {
          fontWeight: 600,
          backgroundColor: alpha('#F5F7FA', 0.5),
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          backgroundColor: alpha('#E2E8F0', 0.5),
        },
      },
    },
  },
});

export default theme;