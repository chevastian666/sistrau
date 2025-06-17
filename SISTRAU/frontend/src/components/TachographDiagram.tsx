import React from 'react';
import { Box, useTheme, alpha } from '@mui/material';
import { motion } from 'framer-motion';

interface Activity {
  type: 'driving' | 'rest' | 'work' | 'available';
  start: Date;
  end: Date;
}

interface TachographDiagramProps {
  activities: Activity[];
  date: Date;
}

const ACTIVITY_COLORS = {
  driving: '#2196F3',
  rest: '#4CAF50',
  work: '#FF9800',
  available: '#9C27B0',
};

const TachographDiagram: React.FC<TachographDiagramProps> = ({ activities, date }) => {
  const theme = useTheme();
  const hoursInDay = 24;
  const pixelsPerHour = 40; // Width of each hour
  const diagramWidth = hoursInDay * pixelsPerHour;
  
  // Convert activity to pixel position
  const getPositionForTime = (time: Date) => {
    const hours = time.getHours() + time.getMinutes() / 60;
    return (hours / hoursInDay) * diagramWidth;
  };

  // Generate hour markers
  const hourMarkers = [];
  for (let i = 0; i < hoursInDay; i++) {
    hourMarkers.push(
      <Box
        key={i}
        sx={{
          position: 'absolute',
          left: i * pixelsPerHour,
          top: 0,
          width: pixelsPerHour,
          height: '100%',
          borderLeft: '1px solid',
          borderColor: alpha(theme.palette.divider, 0.3),
          '&:hover': {
            bgcolor: alpha(theme.palette.primary.main, 0.05),
          },
        }}
      >
        <Box
          sx={{
            position: 'absolute',
            top: -20,
            left: -10,
            fontSize: '12px',
            color: theme.palette.text.secondary,
            fontWeight: 500,
          }}
        >
          {i}:00
        </Box>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        position: 'relative',
        bgcolor: alpha(theme.palette.background.paper, 0.5),
        borderRadius: 2,
        p: 3,
        overflow: 'auto',
      }}
    >
      {/* Diagram container */}
      <Box
        sx={{
          position: 'relative',
          height: 120,
          width: diagramWidth,
          bgcolor: theme.palette.background.paper,
          borderRadius: 1,
          border: '1px solid',
          borderColor: theme.palette.divider,
          overflow: 'hidden',
        }}
      >
        {/* Hour markers */}
        {hourMarkers}

        {/* Activity blocks */}
        {activities.map((activity, index) => {
          const startPos = getPositionForTime(activity.start);
          const endPos = getPositionForTime(activity.end);
          const width = endPos - startPos;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, scaleX: 0 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              style={{
                position: 'absolute',
                left: startPos,
                top: 30,
                width: width,
                height: 60,
                transformOrigin: 'left center',
              }}
            >
              <Box
                sx={{
                  width: '100%',
                  height: '100%',
                  bgcolor: ACTIVITY_COLORS[activity.type],
                  borderRadius: 1,
                  boxShadow: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontSize: '12px',
                  fontWeight: 600,
                  textTransform: 'capitalize',
                  overflow: 'hidden',
                  cursor: 'pointer',
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: 4,
                  },
                }}
              >
                {width > 30 && activity.type}
              </Box>
            </motion.div>
          );
        })}

        {/* Current time indicator */}
        {date.toDateString() === new Date().toDateString() && (
          <Box
            sx={{
              position: 'absolute',
              left: getPositionForTime(new Date()),
              top: 0,
              width: 2,
              height: '100%',
              bgcolor: theme.palette.error.main,
              zIndex: 2,
              '&::before': {
                content: '""',
                position: 'absolute',
                top: -5,
                left: -4,
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: theme.palette.error.main,
              },
            }}
          />
        )}
      </Box>

      {/* Legend */}
      <Box sx={{ mt: 3, display: 'flex', gap: 3, flexWrap: 'wrap' }}>
        {Object.entries(ACTIVITY_COLORS).map(([type, color]) => (
          <Box key={type} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box
              sx={{
                width: 16,
                height: 16,
                borderRadius: 1,
                bgcolor: color,
              }}
            />
            <Box sx={{ fontSize: '14px', textTransform: 'capitalize', color: 'text.secondary' }}>
              {type === 'driving' ? 'Conduciendo' :
               type === 'rest' ? 'Descansando' :
               type === 'work' ? 'Trabajando' : 'Disponible'}
            </Box>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default TachographDiagram;