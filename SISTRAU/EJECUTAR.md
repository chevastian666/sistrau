# Instrucciones para ejecutar SISTRAU localmente

## Opción 1: Ejecutar en dos terminales separadas

### Terminal 1 - Backend (Puerto 3001)
```bash
cd backend
npm run dev
```

### Terminal 2 - Frontend (Puerto 3000)
```bash
cd frontend
npm run dev
```

## Opción 2: Ejecutar todo junto
```bash
npm run dev
```

## Acceder al sistema

1. Abre tu navegador en: **http://localhost:3000**

2. Usa estas credenciales de prueba:

   - **Admin**: usuario: `admin`, contraseña: `admin123`
   - **Transportista**: usuario: `transportista`, contraseña: `demo123`

## Notas importantes

- El sistema está funcionando con una base de datos simulada (mock)
- No requiere PostgreSQL ni Redis instalados
- Los datos son temporales y se pierden al reiniciar

## Si hay problemas con los puertos

Ejecuta esto para limpiar los puertos:
```bash
lsof -ti:3000 -ti:3001 | xargs kill -9
```

## Estructura del proyecto

- **Backend**: http://localhost:3001 (API REST)
- **Frontend**: http://localhost:3000 (Interfaz web)

## Funcionalidades disponibles

✅ Login con diferentes roles
✅ Dashboard con estadísticas
✅ Gestión de vehículos
✅ Vista de guías de carga
⏳ Tracking GPS (en desarrollo)
⏳ Sistema de alertas (en desarrollo)
⏳ Reportes (en desarrollo)