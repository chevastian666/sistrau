#!/bin/bash

echo "🚀 Iniciando SISTRAU..."

# Matar procesos anteriores
pkill -f "node.*sistrau" || true
pkill -f "vite" || true

# Iniciar backend
echo "📡 Iniciando backend en puerto 3001..."
cd backend && npm run dev &
BACKEND_PID=$!

# Esperar a que el backend esté listo
sleep 3

# Iniciar frontend
echo "🖥️  Iniciando frontend en puerto 3000..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ SISTRAU está ejecutándose:"
echo "   - Frontend: http://localhost:3000"
echo "   - Backend API: http://localhost:3001"
echo ""
echo "🔑 Credenciales:"
echo "   - Usuario: admin"
echo "   - Contraseña: admin123"
echo ""
echo "Para detener, presiona Ctrl+C"

# Esperar
wait $BACKEND_PID $FRONTEND_PID