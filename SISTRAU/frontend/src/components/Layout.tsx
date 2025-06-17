import React, { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  Stack,
  Chip,
  alpha,
  useTheme,
  Fade,
  Paper,
  LinearProgress,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  LocalShipping,
  LocalShipping as VehicleIcon,
  Route as TripIcon,
  GpsFixed as TrackingIcon,
  Warning as AlertIcon,
  Assessment as ReportIcon,
  AccountCircle as ProfileIcon,
  Logout as LogoutIcon,
  Notifications as NotificationsIcon,
  ChevronLeft as ChevronLeftIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  Timer as TimerIcon,
  Description as DocumentIcon,
  AccessTime as WorkingHoursIcon,
  Security as SecurityIcon,
  Shield as ShieldIcon,
  Fingerprint as BiometricIcon,
  NetworkCheck as NetworkIcon,
  Brightness4 as DarkModeIcon,
  Brightness7 as LightModeIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { logout } from '../store/slices/authSlice';
import { toggleSidebar } from '../store/slices/uiSlice';
import { useThemeMode } from '../contexts/ThemeContext';

const drawerWidth = 280;

const menuItems = [
  { title: 'Dashboard', path: '/dashboard', icon: <DashboardIcon />, color: '#00D4FF', glow: true },
  { title: 'Vehículos', path: '/vehicles', icon: <VehicleIcon />, color: '#00FF88' },
  { title: 'Viajes', path: '/trips', icon: <TripIcon />, color: '#FFB800' },
  { title: 'Tracking GPS', path: '/tracking', icon: <TrackingIcon />, color: '#FF0080', glow: true },
  { title: 'Alertas', path: '/alerts', icon: <AlertIcon />, color: '#FF3366' },
  { title: 'Tacógrafo Digital', path: '/tachograph', icon: <TimerIcon />, color: '#00D4FF' },
  { title: 'e-CMR', path: '/ecmr', icon: <DocumentIcon />, color: '#FF0080' },
  { title: 'Control Jornadas', path: '/working-hours', icon: <WorkingHoursIcon />, color: '#00FF88' },
  { title: 'Reportes', path: '/reports', icon: <ReportIcon />, color: '#00D4FF' },
];

const Layout: React.FC = () => {
  const theme = useTheme();
  const { mode, toggleColorMode } = useThemeMode();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useAppDispatch();
  const { user } = useAppSelector((state) => state.auth);
  const { sidebarOpen } = useAppSelector((state) => state.ui);
  const { unresolvedAlerts } = useAppSelector((state) => state.alerts);
  
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await dispatch(logout());
    navigate('/login');
  };

  const handleDrawerToggle = () => {
    dispatch(toggleSidebar());
  };

  const isMenuOpen = Boolean(anchorEl);

  const [systemStatus, setSystemStatus] = useState({
    connected: true,
    latency: 12,
    cpu: 45,
  });

  useEffect(() => {
    const interval = setInterval(() => {
      setSystemStatus({
        connected: Math.random() > 0.05,
        latency: 8 + Math.random() * 20,
        cpu: 30 + Math.random() * 40,
      });
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const roleColors = {
    admin: '#00D4FF',
    operator: '#00FF88',
    transporter: '#F57C00',
    authority: '#7B1FA2',
  };

  const roleLabels = {
    admin: 'Administrador',
    operator: 'Operador',
    transporter: 'Transportista',
    authority: 'Autoridad',
  };

  return (
    <Box sx={{ display: 'flex', bgcolor: 'background.default' }}>
      {/* System Status Bar */}
      <Box
        sx={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          height: 3,
          background: `linear-gradient(90deg, 
            ${theme.palette.primary.main} 0%, 
            ${theme.palette.secondary.main} 50%, 
            ${theme.palette.primary.main} 100%)`,
          backgroundSize: '200% 100%',
          animation: 'gradient 3s ease infinite',
          '@keyframes gradient': {
            '0%': { backgroundPosition: '0% 50%' },
            '50%': { backgroundPosition: '100% 50%' },
            '100%': { backgroundPosition: '0% 50%' },
          },
          zIndex: theme.zIndex.drawer + 2,
        }}
      />
      
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: `calc(100% - ${sidebarOpen ? drawerWidth : 0}px)`,
          ml: `${sidebarOpen ? drawerWidth : 0}px`,
          transition: theme.transitions.create(['margin', 'width'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          backdropFilter: 'blur(20px)',
          backgroundColor: alpha(theme.palette.background.default, 0.85),
          borderBottom: '1px solid',
          borderColor: alpha(theme.palette.primary.main, 0.1),
          top: 3,
        }}
      >
        <Toolbar sx={{ py: 1 }}>
          <IconButton
            aria-label="toggle drawer"
            onClick={handleDrawerToggle}
            edge="start"
            sx={{ 
              mr: 2,
              color: 'text.primary',
              '&:hover': {
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
              },
            }}
          >
            {sidebarOpen ? <ChevronLeftIcon /> : <MenuIcon />}
          </IconButton>
          
          <Stack direction="row" alignItems="center" spacing={2} sx={{ flexGrow: 1 }}>
            <Box
              sx={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: `radial-gradient(circle, ${alpha(theme.palette.primary.main, 0.3)} 0%, transparent 70%)`,
                  animation: 'pulse 2s infinite',
                  '@keyframes pulse': {
                    '0%': { transform: 'scale(0.8)', opacity: 1 },
                    '50%': { transform: 'scale(1.2)', opacity: 0.5 },
                    '100%': { transform: 'scale(0.8)', opacity: 1 },
                  },
                }}
              />
              <SecurityIcon sx={{ color: 'primary.main', fontSize: 28, zIndex: 1 }} />
            </Box>
            <Stack spacing={0}>
              <Typography 
                variant="h6" 
                noWrap 
                sx={{ 
                  fontWeight: 800,
                  color: 'text.primary',
                  letterSpacing: '0.05em',
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                SISTRAU
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.65rem',
                  letterSpacing: '0.1em',
                  textTransform: 'uppercase',
                  display: { xs: 'none', sm: 'block' },
                }}
              >
                Sistema de Tránsitos Uruguay
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip 
                label="v2.0" 
                size="small" 
                sx={{ 
                  fontSize: '0.65rem',
                  height: 18,
                  backgroundColor: alpha(theme.palette.success.main, 0.1),
                  color: 'success.main',
                  borderColor: alpha(theme.palette.success.main, 0.3),
                  border: '1px solid',
                }} 
              />
              <Chip
                icon={<NetworkIcon sx={{ fontSize: 14 }} />}
                label={systemStatus.connected ? 'Online' : 'Offline'}
                size="small"
                sx={{
                  fontSize: '0.65rem',
                  height: 18,
                  backgroundColor: alpha(
                    systemStatus.connected ? theme.palette.success.main : theme.palette.error.main,
                    0.1
                  ),
                  color: systemStatus.connected ? 'success.main' : 'error.main',
                  borderColor: alpha(
                    systemStatus.connected ? theme.palette.success.main : theme.palette.error.main,
                    0.3
                  ),
                  border: '1px solid',
                }}
              />
              <Typography
                variant="caption"
                sx={{
                  color: 'text.secondary',
                  fontSize: '0.7rem',
                  display: { xs: 'none', md: 'block' },
                }}
              >
                {systemStatus.latency.toFixed(0)}ms
              </Typography>
            </Stack>
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
            <Tooltip title="Sistema bloqueado en modo oscuro">
              <IconButton
                sx={{ 
                  color: 'text.secondary',
                  cursor: 'default',
                  opacity: 0.5,
                }}
              >
                <DarkModeIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Centro de ayuda">
              <IconButton
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <HelpIcon />
              </IconButton>
            </Tooltip>

            <Tooltip title="Notificaciones">
              <IconButton
                onClick={() => navigate('/alerts')}
                sx={{ 
                  color: 'text.secondary',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.08),
                  },
                }}
              >
                <Badge 
                  badgeContent={unresolvedAlerts.length} 
                  color="error"
                  sx={{
                    '& .MuiBadge-badge': {
                      fontSize: '0.7rem',
                      height: 18,
                      minWidth: 18,
                    },
                  }}
                >
                  <NotificationsIcon />
                </Badge>
              </IconButton>
            </Tooltip>

            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />

            <Tooltip title="Mi cuenta">
              <IconButton
                edge="end"
                onClick={handleProfileMenuOpen}
                sx={{ p: 0.5 }}
              >
                <Avatar 
                  sx={{ 
                    width: 36, 
                    height: 36,
                    bgcolor: roleColors[user?.role as keyof typeof roleColors] || 'primary.main',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                  }}
                >
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Stack>
        </Toolbar>
      </AppBar>

      <Menu
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={handleMenuClose}
        onClick={handleMenuClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.08))',
            mt: 1.5,
            minWidth: 240,
            borderRadius: 2,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <Box sx={{ px: 2, py: 1.5 }}>
          <Typography variant="subtitle2" fontWeight={600}>
            {user?.firstName} {user?.lastName}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {user?.email}
          </Typography>
          <Chip 
            label={roleLabels[user?.role as keyof typeof roleLabels] || user?.role}
            size="small"
            sx={{ 
              mt: 1,
              fontSize: '0.75rem',
              height: 24,
              backgroundColor: alpha(roleColors[user?.role as keyof typeof roleColors] || '#000', 0.1),
              color: roleColors[user?.role as keyof typeof roleColors],
            }}
          />
        </Box>
        <Divider sx={{ my: 1 }} />
        <MenuItem onClick={() => navigate('/profile')}>
          <ListItemIcon>
            <ProfileIcon fontSize="small" />
          </ListItemIcon>
          Mi Perfil
        </MenuItem>
        <MenuItem onClick={() => navigate('/settings')}>
          <ListItemIcon>
            <SettingsIcon fontSize="small" />
          </ListItemIcon>
          Configuración
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          Cerrar Sesión
        </MenuItem>
      </Menu>

      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: theme.palette.background.paper,
            borderRight: '1px solid',
            borderColor: alpha(theme.palette.primary.main, 0.1),
            boxShadow: '0 0 20px rgba(0,212,255,0.05)',
            overflow: 'hidden',
          },
        }}
        variant="persistent"
        anchor="left"
        open={sidebarOpen}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: 2,
            borderBottom: '1px solid',
            borderColor: alpha(theme.palette.primary.main, 0.1),
            background: `linear-gradient(135deg, 
              ${alpha(theme.palette.primary.main, 0.1)} 0%, 
              ${alpha(theme.palette.primary.dark, 0.05)} 100%)`,
            backdropFilter: 'blur(10px)',
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box
              sx={{
                position: 'relative',
                width: 40,
                height: 40,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Box
                sx={{
                  position: 'absolute',
                  inset: -4,
                  borderRadius: '50%',
                  background: `conic-gradient(from 180deg at 50% 50%, 
                    ${theme.palette.primary.main} 0deg, 
                    ${theme.palette.secondary.main} 120deg, 
                    ${theme.palette.primary.main} 240deg, 
                    ${theme.palette.primary.main} 360deg)`,
                  animation: 'spin 4s linear infinite',
                  opacity: 0.3,
                  '@keyframes spin': {
                    '0%': { transform: 'rotate(0deg)' },
                    '100%': { transform: 'rotate(360deg)' },
                  },
                }}
              />
              <Box
                sx={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  backgroundColor: theme.palette.background.paper,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ShieldIcon sx={{ fontSize: 24, color: 'primary.main' }} />
              </Box>
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} color="text.primary">
                SISTRAU
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.65rem' }}>
                Control de Tránsitos
              </Typography>
            </Box>
          </Stack>
        </Box>
        
        <Box sx={{ p: 2 }}>
          <Typography 
            variant="overline" 
            sx={{ 
              color: 'text.secondary',
              fontSize: '0.7rem',
              fontWeight: 600,
              letterSpacing: 1.5,
              px: 1,
            }}
          >
            Navegación
          </Typography>
        </Box>

        <List sx={{ px: 2 }}>
          <AnimatePresence>
            {menuItems.map((item) => {
              if (item.path === '/reports' && user?.role === 'driver') {
                return null;
              }
              
              const isSelected = location.pathname === item.path;
              
              return (
                <motion.div
                  key={item.path}
                  initial={{ x: -20, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  exit={{ x: -20, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <ListItem disablePadding sx={{ mb: 0.5 }}>
                    <ListItemButton
                      selected={isSelected}
                      onClick={() => navigate(item.path)}
                      sx={{
                        borderRadius: 2,
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          backgroundColor: alpha(item.color, 0.08),
                          '& .MuiListItemIcon-root': {
                            color: item.color,
                          },
                        },
                        '&.Mui-selected': {
                          backgroundColor: alpha(item.color, 0.12),
                          '&:hover': {
                            backgroundColor: alpha(item.color, 0.16),
                          },
                          '& .MuiListItemIcon-root': {
                            color: item.color,
                          },
                          '& .MuiListItemText-primary': {
                            fontWeight: 600,
                            color: item.color,
                          },
                        },
                      }}
                    >
                      <ListItemIcon
                        sx={{
                          minWidth: 40,
                          color: isSelected ? item.color : 'text.secondary',
                          transition: 'color 0.2s ease',
                        }}
                      >
                        {item.icon}
                      </ListItemIcon>
                      <ListItemText 
                        primary={item.title}
                        primaryTypographyProps={{
                          fontSize: '0.875rem',
                          fontWeight: isSelected ? 600 : 500,
                        }}
                      />
                      {item.path === '/alerts' && unresolvedAlerts.length > 0 && (
                        <Chip
                          label={unresolvedAlerts.length}
                          size="small"
                          color="error"
                          sx={{
                            height: 20,
                            fontSize: '0.7rem',
                            fontWeight: 600,
                          }}
                        />
                      )}
                    </ListItemButton>
                  </ListItem>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </List>
        
        <Box sx={{ flexGrow: 1 }} />
        
        <Box sx={{ p: 2, mx: 2, mb: 2 }}>
          <Box
            sx={{
              p: 2,
              borderRadius: 2,
              background: alpha(theme.palette.primary.main, 0.05),
              border: '1px solid',
              borderColor: alpha(theme.palette.primary.main, 0.1),
            }}
          >
            <Stack spacing={0.5}>
              <Typography variant="caption" color="text.secondary">
                Sesión activa
              </Typography>
              <Typography variant="body2" fontWeight={600}>
                {user?.firstName} {user?.lastName}
              </Typography>
              <Chip
                label={roleLabels[user?.role as keyof typeof roleLabels] || user?.role}
                size="small"
                sx={{
                  fontSize: '0.7rem',
                  height: 20,
                  backgroundColor: alpha(roleColors[user?.role as keyof typeof roleColors] || '#000', 0.1),
                  color: roleColors[user?.role as keyof typeof roleColors],
                }}
              />
            </Stack>
          </Box>
        </Box>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          marginLeft: sidebarOpen ? `${drawerWidth}px` : 0,
          transition: theme.transitions.create('margin', {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          minHeight: '100vh',
        }}
      >
        <Toolbar />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Outlet />
        </motion.div>
      </Box>
    </Box>
  );
};

export default Layout;