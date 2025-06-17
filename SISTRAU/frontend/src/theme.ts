import { createTheme, alpha } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00D4FF',
      light: '#33DDFF',
      dark: '#00A8CC',
      contrastText: '#000000',
    },
    secondary: {
      main: '#FF0080',
      light: '#FF3399',
      dark: '#CC0066',
      contrastText: '#FFFFFF',
    },
    error: {
      main: '#FF3366',
      light: '#FF6B8A',
      dark: '#CC1F47',
    },
    warning: {
      main: '#FFB800',
      light: '#FFC933',
      dark: '#CC9300',
    },
    success: {
      main: '#00FF88',
      light: '#33FF9F',
      dark: '#00CC6B',
    },
    info: {
      main: '#00D4FF',
      light: '#33DDFF',
      dark: '#00A8CC',
    },
    background: {
      default: '#0A0A0F',
      paper: '#0F0F17',
    },
    text: {
      primary: '#FFFFFF',
      secondary: alpha('#FFFFFF', 0.7),
      disabled: alpha('#FFFFFF', 0.4),
    },
    divider: alpha('#FFFFFF', 0.08),
    action: {
      active: '#FFFFFF',
      hover: alpha('#00D4FF', 0.08),
      selected: alpha('#00D4FF', 0.12),
      disabled: alpha('#FFFFFF', 0.26),
      disabledBackground: alpha('#FFFFFF', 0.12),
    },
  },
  typography: {
    fontFamily: [
      'Inter',
      '-apple-system',
      'BlinkMacSystemFont',
      '"Segoe UI"',
      'Roboto',
      '"Helvetica Neue"',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '3.5rem',
      fontWeight: 800,
      letterSpacing: '-0.02em',
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2.5rem',
      fontWeight: 700,
      letterSpacing: '-0.01em',
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '2rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.5rem',
      fontWeight: 600,
      letterSpacing: '-0.01em',
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.25rem',
      fontWeight: 600,
      letterSpacing: '0',
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1.125rem',
      fontWeight: 600,
      letterSpacing: '0',
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      letterSpacing: '0',
      lineHeight: 1.7,
    },
    body2: {
      fontSize: '0.875rem',
      letterSpacing: '0',
      lineHeight: 1.6,
    },
    button: {
      fontSize: '0.875rem',
      fontWeight: 600,
      letterSpacing: '0.02em',
      textTransform: 'none',
    },
    caption: {
      fontSize: '0.75rem',
      letterSpacing: '0.01em',
      lineHeight: 1.5,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
      lineHeight: 2,
    },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    'none',
    '0px 2px 4px -1px rgba(0,212,255,0.06),0px 4px 6px -1px rgba(0,212,255,0.10),0px 1px 10px 0px rgba(0,212,255,0.08)',
    '0px 3px 5px -1px rgba(0,212,255,0.06),0px 6px 10px 0px rgba(0,212,255,0.10),0px 1px 18px 0px rgba(0,212,255,0.08)',
    '0px 3px 5px -2px rgba(0,212,255,0.06),0px 8px 10px 1px rgba(0,212,255,0.10),0px 3px 14px 2px rgba(0,212,255,0.08)',
    '0px 2px 4px -1px rgba(0,212,255,0.06),0px 10px 15px 0px rgba(0,212,255,0.10),0px 4px 6px -2px rgba(0,212,255,0.08)',
    '0px 3px 5px -1px rgba(0,212,255,0.06),0px 12px 17px 2px rgba(0,212,255,0.10),0px 5px 8px -3px rgba(0,212,255,0.08)',
    '0px 3px 6px 0px rgba(0,212,255,0.06),0px 14px 19px 2px rgba(0,212,255,0.10),0px 6px 10px -3px rgba(0,212,255,0.08)',
    '0px 4px 6px -1px rgba(0,212,255,0.06),0px 16px 21px 2px rgba(0,212,255,0.10),0px 7px 12px -4px rgba(0,212,255,0.08)',
    '0px 5px 6px -2px rgba(0,212,255,0.06),0px 18px 23px 2px rgba(0,212,255,0.10),0px 8px 14px -4px rgba(0,212,255,0.08)',
    '0px 5px 7px -2px rgba(0,212,255,0.06),0px 20px 25px 3px rgba(0,212,255,0.10),0px 9px 16px -5px rgba(0,212,255,0.08)',
    '0px 6px 7px -3px rgba(0,212,255,0.06),0px 22px 27px 3px rgba(0,212,255,0.10),0px 10px 18px -5px rgba(0,212,255,0.08)',
    '0px 6px 8px -3px rgba(0,212,255,0.06),0px 24px 29px 3px rgba(0,212,255,0.10),0px 11px 20px -6px rgba(0,212,255,0.08)',
    '0px 7px 8px -3px rgba(0,212,255,0.06),0px 26px 31px 3px rgba(0,212,255,0.10),0px 12px 22px -6px rgba(0,212,255,0.08)',
    '0px 7px 9px -4px rgba(0,212,255,0.06),0px 28px 33px 4px rgba(0,212,255,0.10),0px 13px 24px -7px rgba(0,212,255,0.08)',
    '0px 8px 9px -4px rgba(0,212,255,0.06),0px 30px 35px 4px rgba(0,212,255,0.10),0px 14px 26px -7px rgba(0,212,255,0.08)',
    '0px 8px 10px -4px rgba(0,212,255,0.06),0px 32px 37px 4px rgba(0,212,255,0.10),0px 15px 28px -8px rgba(0,212,255,0.08)',
    '0px 9px 11px -5px rgba(0,212,255,0.06),0px 34px 39px 4px rgba(0,212,255,0.10),0px 16px 30px -8px rgba(0,212,255,0.08)',
    '0px 9px 11px -5px rgba(0,212,255,0.06),0px 36px 41px 5px rgba(0,212,255,0.10),0px 17px 32px -9px rgba(0,212,255,0.08)',
    '0px 10px 12px -5px rgba(0,212,255,0.06),0px 38px 43px 5px rgba(0,212,255,0.10),0px 18px 34px -9px rgba(0,212,255,0.08)',
    '0px 10px 13px -6px rgba(0,212,255,0.06),0px 40px 45px 5px rgba(0,212,255,0.10),0px 19px 36px -10px rgba(0,212,255,0.08)',
    '0px 11px 13px -6px rgba(0,212,255,0.06),0px 42px 47px 5px rgba(0,212,255,0.10),0px 20px 38px -10px rgba(0,212,255,0.08)',
    '0px 11px 14px -6px rgba(0,212,255,0.06),0px 44px 49px 6px rgba(0,212,255,0.10),0px 21px 40px -11px rgba(0,212,255,0.08)',
    '0px 12px 14px -7px rgba(0,212,255,0.06),0px 46px 51px 6px rgba(0,212,255,0.10),0px 22px 42px -11px rgba(0,212,255,0.08)',
    '0px 12px 15px -7px rgba(0,212,255,0.06),0px 48px 53px 6px rgba(0,212,255,0.10),0px 23px 44px -12px rgba(0,212,255,0.08)',
    '0px 13px 16px -7px rgba(0,212,255,0.06),0px 50px 55px 6px rgba(0,212,255,0.10),0px 24px 46px -12px rgba(0,212,255,0.08)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: '#1A1A25 #0A0A0F',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: 8,
            height: 8,
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: '#1A1A25',
            border: '2px solid #0A0A0F',
          },
          '&::-webkit-scrollbar-thumb:hover, & *::-webkit-scrollbar-thumb:hover': {
            backgroundColor: '#252530',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          padding: '10px 24px',
          fontSize: '0.875rem',
          fontWeight: 600,
          boxShadow: 'none',
          transition: 'all 0.2s ease-in-out',
          '&:hover': {
            boxShadow: 'none',
            transform: 'translateY(-1px)',
          },
        },
        contained: {
          background: 'linear-gradient(135deg, #00D4FF 0%, #00A8CC 100%)',
          '&:hover': {
            background: 'linear-gradient(135deg, #33DDFF 0%, #00D4FF 100%)',
          },
        },
        outlined: {
          borderWidth: 2,
          '&:hover': {
            borderWidth: 2,
            backgroundColor: alpha('#00D4FF', 0.08),
          },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          backgroundColor: '#0F0F17',
          border: '1px solid',
          borderColor: alpha('#00D4FF', 0.1),
          transition: 'all 0.3s ease-in-out',
        },
        elevation1: {
          boxShadow: '0 4px 20px 0 rgba(0,212,255,0.05)',
        },
        elevation2: {
          boxShadow: '0 8px 32px 0 rgba(0,212,255,0.08)',
        },
        elevation3: {
          boxShadow: '0 12px 40px 0 rgba(0,212,255,0.1)',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundColor: '#0F0F17',
          border: '1px solid',
          borderColor: alpha('#00D4FF', 0.1),
          transition: 'all 0.3s ease-in-out',
          '&:hover': {
            borderColor: alpha('#00D4FF', 0.3),
            boxShadow: '0 8px 32px 0 rgba(0,212,255,0.15)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#0A0A0F', 0.8),
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid',
          borderColor: alpha('#00D4FF', 0.1),
          boxShadow: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: '#0F0F17',
          borderRight: '1px solid',
          borderColor: alpha('#00D4FF', 0.1),
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&:hover': {
            backgroundColor: alpha('#00D4FF', 0.08),
          },
          '&.Mui-selected': {
            backgroundColor: alpha('#00D4FF', 0.15),
            borderLeft: '3px solid #00D4FF',
            '&:hover': {
              backgroundColor: alpha('#00D4FF', 0.2),
            },
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            backgroundColor: alpha('#FFFFFF', 0.02),
            transition: 'all 0.3s ease-in-out',
            '&:hover': {
              backgroundColor: alpha('#FFFFFF', 0.04),
            },
            '&.Mui-focused': {
              backgroundColor: alpha('#FFFFFF', 0.05),
            },
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid',
          borderColor: alpha('#00D4FF', 0.08),
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 6,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          border: '1px solid',
        },
        standardError: {
          backgroundColor: alpha('#FF3366', 0.1),
          borderColor: alpha('#FF3366', 0.3),
        },
        standardWarning: {
          backgroundColor: alpha('#FFB800', 0.1),
          borderColor: alpha('#FFB800', 0.3),
        },
        standardInfo: {
          backgroundColor: alpha('#00D4FF', 0.1),
          borderColor: alpha('#00D4FF', 0.3),
        },
        standardSuccess: {
          backgroundColor: alpha('#00FF88', 0.1),
          borderColor: alpha('#00FF88', 0.3),
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          backgroundColor: '#1A1A25',
          border: '1px solid',
          borderColor: alpha('#00D4FF', 0.2),
          borderRadius: 8,
          fontSize: '0.75rem',
          padding: '8px 12px',
        },
      },
    },
    MuiTabs: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid',
          borderColor: alpha('#00D4FF', 0.1),
        },
        indicator: {
          height: 3,
          borderRadius: '3px 3px 0 0',
          background: 'linear-gradient(90deg, #00D4FF 0%, #00A8CC 100%)',
        },
      },
    },
    MuiTab: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          fontSize: '0.875rem',
          textTransform: 'none',
          minHeight: 48,
          '&.Mui-selected': {
            color: '#00D4FF',
          },
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          height: 6,
          borderRadius: 3,
          backgroundColor: alpha('#00D4FF', 0.1),
        },
        bar: {
          borderRadius: 3,
          background: 'linear-gradient(90deg, #00D4FF 0%, #00A8CC 100%)',
        },
      },
    },
    MuiCircularProgress: {
      styleOverrides: {
        root: {
          color: '#00D4FF',
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: alpha('#00D4FF', 0.08),
        },
      },
    },
    MuiSwitch: {
      styleOverrides: {
        root: {
          width: 42,
          height: 26,
          padding: 0,
          '& .MuiSwitch-switchBase': {
            padding: 0,
            margin: 2,
            transitionDuration: '300ms',
            '&.Mui-checked': {
              transform: 'translateX(16px)',
              color: '#fff',
              '& + .MuiSwitch-track': {
                backgroundColor: '#00D4FF',
                opacity: 1,
                border: 0,
              },
            },
          },
          '& .MuiSwitch-thumb': {
            boxSizing: 'border-box',
            width: 22,
            height: 22,
          },
          '& .MuiSwitch-track': {
            borderRadius: 26 / 2,
            backgroundColor: alpha('#FFFFFF', 0.2),
            opacity: 1,
          },
        },
      },
    },
  },
});