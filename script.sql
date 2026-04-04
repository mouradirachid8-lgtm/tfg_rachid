-- ==========================================
-- LIMPIEZA INICIAL (Cuidado: Borra datos existentes)
-- ==========================================
DROP TABLE IF EXISTS diagram_versions CASCADE; -- La borramos por si existía de antes
DROP TABLE IF EXISTS diagrams CASCADE;
DROP TABLE IF EXISTS project_members CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS users CASCADE;

-- ==========================================
-- 1. USUARIOS
-- ==========================================
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100),
    avatar_url TEXT,
    
    -- Campos para recuperación de contraseña (Integrados aquí directamente)
    reset_password_token TEXT,
    reset_password_expires TIMESTAMP,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. PROYECTOS
-- ==========================================
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- Si se borra el usuario, se borran sus proyectos
    is_public BOOLEAN DEFAULT FALSE,
    
    deleted_at TIMESTAMP, -- Para el borrado lógico (Papelera)
    invite_token VARCHAR(255), -- Para compartir enlaces
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 3. COLABORADORES (Relación N:M)
-- ==========================================
CREATE TABLE project_members (
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('owner', 'editor', 'viewer')),
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (project_id, user_id) -- Evita duplicados: un usuario solo puede tener un rol por proyecto
);

-- ==========================================
-- 4. DIAGRAMAS
-- ==========================================
CREATE TABLE diagrams (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'class_diagram', -- 'class', 'sequence', etc.
    
    -- Aquí se guarda el JSON completo del dibujo (nodos, posiciones, colores)
    content JSONB DEFAULT '{}', 
    
    thumbnail_url TEXT, -- Imagen pequeña para previsualizar en el dashboard
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);