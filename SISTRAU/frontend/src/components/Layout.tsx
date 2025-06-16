import React, { useState } from 'react';
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
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../hooks/redux';
import { logout } from '../store/slices/authSlice';
import { toggleSidebar } from '../store/slices/uiSlice';

const drawerWidth = 280;

const menuItems = [
  { title: 'Dashboard', path: '/dashboard', icon: <DashboardIcon />, color: '#1976D2' },
  { title: 'Vehículos', path: '/vehicles', icon: <VehicleIcon />, color: '#388E3C' },
  { title: 'Viajes', path: '/trips', icon: <TripIcon />, color: '#F57C00' },
  { title: 'Tracking', path: '/tracking', icon: <TrackingIcon />, color: '#7B1FA2' },
  { title: 'Alertas', path: '/alerts', icon: <AlertIcon />, color: '#D32F2F' },
  { title: 'Tacógrafo', path: '/tachograph', icon: <TimerIcon />, color: '#00BCD4' },
  { title: 'e-CMR', path: '/ecmr', icon: <DocumentIcon />, color: '#9C27B0' },
  { title: 'Jornadas', path: '/working-hours', icon: <WorkingHoursIcon />, color: '#FF5722' },
  { title: 'Reportes', path: '/reports', icon: <ReportIcon />, color: '#0288D1' },
];

const Layout: React.FC = () => {
  const theme = useTheme();
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

  const roleColors = {
    admin: '#1976D2',
    operator: '#388E3C',
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
          backgroundColor: alpha(theme.palette.background.paper, 0.8),
          borderBottom: '1px solid',
          borderColor: theme.palette.divider,
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
          
          <Stack direction="row" alignItems="center" spacing={1} sx={{ flexGrow: 1 }}>
            <LocalShipping sx={{ color: 'primary.main', fontSize: 28 }} />
            <Typography 
              variant="h6" 
              noWrap 
              sx={{ 
                fontWeight: 600,
                color: 'text.primary',
                display: { xs: 'none', sm: 'block' },
              }}
            >
              SISTRAU
            </Typography>
            <Chip 
              label="v2.0" 
              size="small" 
              sx={{ 
                fontSize: '0.7rem',
                height: 20,
                backgroundColor: alpha(theme.palette.primary.main, 0.1),
                color: 'primary.main',
              }} 
            />
          </Stack>

          <Stack direction="row" alignItems="center" spacing={1}>
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
            borderRight: 'none',
            boxShadow: '2px 0 8px rgba(0,0,0,0.05)',
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
            justifyContent: 'center',
            padding: 3,
            background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.light} 100%)`,
          }}
        >
          <Stack direction="row" alignItems="center" spacing={2}>
            <Box
              sx={{
                width: 48,
                height: 48,
                borderRadius: 2,
                backgroundColor: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              }}
            >
              <LocalShipping sx={{ fontSize: 28, color: 'primary.main' }} />
            </Box>
            <Box>
              <Typography variant="h5" fontWeight={700} color="white">
                SISTRAU
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)' }}>
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