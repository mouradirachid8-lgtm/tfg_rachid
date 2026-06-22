# Collaborative Diagramming Tool (TFG)

Este proyecto es una aplicación web full-stack para la creación y gestión colaborativa de diagramas (enfocada principalmente en diagramas de clases, secuencias, etc.). Permite a los usuarios registrarse, crear proyectos, invitar a colaboradores con diferentes roles (propietario, editor, visualizador) y trabajar en tiempo real en los mismos lienzos utilizando WebSockets.

## 🚀 Características Principales

- **Autenticación y Autorización:** Registro, inicio de sesión, recuperación de contraseñas (vía email) mediante JWT y contraseñas encriptadas con bcrypt.
- **Gestión de Proyectos:** Creación de proyectos públicos o privados.
- **Colaboración en Tiempo Real:** Los usuarios pueden editar diagramas de manera simultánea gracias a Socket.IO.
- **Gestión de Roles:** Permisos a nivel de proyecto (owner, editor, viewer).
- **Herramienta de Dibujo:** Interfaz interactiva basada en Vue Flow para diseñar diagramas.
- **Exportación:** Posibilidad de exportar los diagramas a imágenes o PDF (html-to-image, jspdf).
- **Subida de Archivos:** Gestión de avatares de usuario y miniaturas de diagramas (multer).

## 🛠️ Tecnologías Utilizadas

### Frontend (`/client`)
- **Framework:** Vue 3 (Composition API) + Vite
- **Lenguaje:** TypeScript
- **Enrutamiento y Estado:** Vue Router, Pinia
- **UI Framework:** Vuetify
- **Diagramación:** Vue Flow (`@vue-flow/core`, etc.), Dagre
- **WebSockets:** `socket.io-client`
- **Peticiones HTTP:** Axios
- **Testing:** Vitest

### Backend (`/server`)
- **Entorno:** Node.js + Express
- **Lenguaje:** TypeScript
- **Base de Datos:** PostgreSQL (usando `pg`)
- **WebSockets:** Socket.IO
- **Autenticación:** JSON Web Tokens (JWT), bcrypt
- **Manejo de Archivos:** Multer
- **Envío de Correos:** Nodemailer

## 📦 Estructura del Proyecto

```text
tfg_rachid/
├── client/           # Código fuente del Frontend (Vue 3 + Vite)
│   ├── src/          # Componentes, vistas, stores de Pinia, etc.
│   ├── public/       # Archivos estáticos
│   └── package.json  # Dependencias del cliente
├── server/           # Código fuente del Backend (Express + Node.js)
│   ├── src/          # Controladores, rutas, modelos, configuración
│   ├── uploads/      # Directorio para archivos subidos localmente (ej. avatares)
│   └── package.json  # Dependencias del servidor
├── script.sql        # Script de inicialización de la base de datos (PostgreSQL)
└── README.md         # Este archivo
```

## ⚙️ Requisitos Previos

Antes de ejecutar el proyecto, asegúrate de tener instalado:
- [Node.js](https://nodejs.org/) (versión 20 o superior recomendada)
- [PostgreSQL](https://www.postgresql.org/) (versión 13 o superior)
- Git

## 🚀 Instalación y Ejecución Local

### 1. Clonar el repositorio
```bash
git clone <url-del-repositorio>
cd tfg_rachid
```

### 2. Configurar la Base de Datos
1. Asegúrate de que el servidor PostgreSQL esté corriendo.
2. Crea una base de datos para el proyecto.
3. Ejecuta el archivo `script.sql` en tu base de datos para crear las tablas necesarias (`users`, `projects`, `project_members`, `diagrams`).
   ```bash
   psql -U tu_usuario -d tu_base_de_datos -f script.sql
   ```

### 3. Configurar el Servidor (Backend)
1. Navega al directorio del servidor:
   ```bash
   cd server
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura las variables de entorno. Renombra o crea un archivo `.env` en la carpeta `server` e incluye las variables necesarias (ej. `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `JWT_SECRET`, configuración de SMTP para Nodemailer, etc.).
4. Inicia el servidor en modo desarrollo:
   ```bash
   npm run dev
   ```

### 4. Configurar el Cliente (Frontend)
1. Abre una nueva terminal y navega al directorio del cliente:
   ```bash
   cd client
   ```
2. Instala las dependencias:
   ```bash
   npm install
   ```
3. Configura las variables de entorno. Renombra o crea un archivo `.env` si es necesario (ej. `VITE_API_URL` apuntando al backend local).
4. Inicia la aplicación en modo desarrollo:
   ```bash
   npm run dev
   ```

## 🗄️ Esquema de la Base de Datos

El script SQL incluye 4 tablas principales:
- `users`: Almacena información de la cuenta y tokens para recuperación de contraseña.
- `projects`: Información general de los proyectos (públicos/privados, papelera).
- `project_members`: Tabla intermedia para la relación N:M entre usuarios y proyectos, gestionando el rol (`owner`, `editor`, `viewer`).
- `diagrams`: Contiene la metadata del diagrama y el propio dibujo en formato JSONB para facilitar el guardado de nodos de Vue Flow.

## 📄 Licencia

Este proyecto es parte de un Trabajo de Fin de Grado (TFG). Todos los derechos reservados.
