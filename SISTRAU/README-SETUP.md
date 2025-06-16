# Guía de Instalación - SISTRAU

## Requisitos Previos

- Docker y Docker Compose instalados
- Node.js 18+ (opcional, si quieres ejecutar sin Docker)
- PostgreSQL 15+ con PostGIS (opcional, si quieres ejecutar sin Docker)
- Git

## Instalación Rápida con Docker

### 1. Clonar el repositorio
```bash
cd /Users/cheva/Coding/SISTRAU/SISTRAU
```

### 2. Ejecutar con Docker Compose
```bash
docker-compose up -d
```

Esto iniciará:
- PostgreSQL con PostGIS en puerto 5432
- Redis en puerto 6379
- Mosquitto MQTT en puerto 1883
- Backend API en http://localhost:3001
- Frontend en http://localhost:3000

### 3. Verificar que todo esté funcionando
```bash
docker-compose ps
```

### 4. Ver logs
```bash
docker-compose logs -f
```

## Instalación Manual (sin Docker)

### 1. Instalar PostgreSQL con PostGIS
```bash
# macOS
brew install postgresql@15 postgis

# Ubuntu/Debian
sudo apt-get install postgresql-15 postgresql-15-postgis-3
```

### 2. Crear base de datos
```bash
psql -U postgres
CREATE DATABASE sistrau;
CREATE USER sistrau_user WITH PASSWORD 'sistrau_password';
GRANT ALL PRIVILEGES ON DATABASE sistrau TO sistrau_user;
\q

# Cargar esquema
psql -U sistrau_user -d sistrau -f database/schema.sql
psql -U sistrau_user -d sistrau -f database/seed.sql
```

### 3. Instalar Redis
```bash
# macOS
brew install redis
brew services start redis

# Ubuntu/Debian
sudo apt-get install redis-server
sudo systemctl start redis
```

### 4. Instalar Mosquitto MQTT
```bash
# macOS
brew install mosquitto
brew services start mosquitto

# Ubuntu/Debian
sudo apt-get install mosquitto mosquitto-clients
sudo systemctl start mosquitto
```

### 5. Configurar Backend
```bash
cd backend
npm install
cp .env.example .env
# Editar .env con tus configuraciones
npm run dev
```

### 6. Configurar Frontend
```bash
cd frontend
npm install
npm run dev
```

## Credenciales de Prueba

El sistema viene con usuarios de prueba precargados:

| Rol | Usuario | Contraseña | Descripción |
|-----|---------|------------|-------------|
| Admin | admin | admin123 | Acceso total al sistema |
| Transportista | transportista | demo123 | Gestión de flota y viajes |
| Conductor | conductor1 | demo123 | Acceso a sus viajes |
| Autoridad | autoridad | demo123 | Supervisión y control |
| Sindicato | sindicato | demo123 | Vista de datos laborales |

## Acceder al Sistema

1. Abrir navegador en http://localhost:3000
2. Usar cualquiera de las credenciales de prueba
3. Explorar las diferentes funcionalidades según el rol

## Características Principales

- **Dashboard**: Vista general con estadísticas y gráficos
- **Vehículos**: Gestión completa de la flota
- **Viajes**: Programación y seguimiento de viajes
- **Tracking**: Monitoreo GPS en tiempo real (próximamente)
- **Guías de Carga**: Sistema electrónico con blockchain
- **Alertas**: Notificaciones automáticas inteligentes

## Solución de Problemas

### Puerto en uso
Si algún puerto está ocupado, puedes cambiarlos en `docker-compose.yml`

### Error de base de datos
```bash
docker-compose down -v  # Elimina volúmenes
docker-compose up -d    # Recrea todo
```

### Logs del backend
```bash
docker-compose logs -f backend
```

### Resetear base de datos
```bash
docker-compose exec postgres psql -U sistrau_user -d sistrau -f /docker-entrypoint-initdb.d/01-schema.sql
docker-compose exec postgres psql -U sistrau_user -d sistrau -f /docker-entrypoint-initdb.d/02-seed.sql
```

## Desarrollo

### Estructura del Proyecto
```
SISTRAU/
├── backend/          # API Node.js/Express
├── frontend/         # React/TypeScript
├── database/         # Scripts SQL
├── config/          # Configuraciones
└── docker-compose.yml
```

### Variables de Entorno

Backend (`.env`):
- `DB_*`: Configuración de PostgreSQL
- `REDIS_*`: Configuración de Redis
- `JWT_SECRET`: Clave para tokens JWT
- `MQTT_*`: Configuración de MQTT

Frontend (`.env`):
- `VITE_API_URL`: URL de la API
- `VITE_MAPBOX_TOKEN`: Token para mapas (opcional)

## Próximos Pasos

1. Explorar el dashboard con diferentes roles
2. Crear vehículos y programar viajes
3. Generar guías de carga electrónicas
4. Monitorear alertas del sistema

## Soporte

Para reportar problemas o sugerencias, contactar al equipo de desarrollo SISTRAU.