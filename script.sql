-- 1. Usuarios
CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    email VARCHAR(100) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL, -- contraseña encriptada
    full_name VARCHAR(100),
    avatar_url TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Proyectos
CREATE TABLE projects (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    owner_id INTEGER REFERENCES users(id) ON DELETE CASCADE, -- propietario
    is_public BOOLEAN DEFAULT FALSE, -- publico o privado
    deleted_at TIMESTAMP, -- Borrado lógico
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Colaboradores
-- relación N:M entre Usuarios y Proyectos
CREATE TABLE project_members (
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) CHECK (role IN ('owner', 'editor', 'viewer')), -- Rol que tiene el usuario en tal proyecto
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (project_id, user_id) -- un usuario no puede estar 2 veces en el mismo proyecto
);

-- 4. Diagramas
CREATE TABLE diagrams (
    id SERIAL PRIMARY KEY,
    project_id INTEGER REFERENCES projects(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    type VARCHAR(50) DEFAULT 'class_diagram', -- Tipos: 'class', 'sequence', etc.
    content JSONB DEFAULT '{}', -- ¡LA CLAVE! Aquí guardas todo el JSON que te da la librería gráfica (nodos, flechas, etc.) -> recomendado por Gemini para guardar la información de los diagramas 
    thumbnail_url TEXT, -- Capricho: una imagen pequeña para mostrar en el dashboard -> previsualización de los proyectos
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 5. Versiones / Historial -> Reomendado por Gemini
CREATE TABLE diagram_versions (
    id SERIAL PRIMARY KEY,
    diagram_id INTEGER REFERENCES diagrams(id) ON DELETE CASCADE,
    content_snapshot JSONB NOT NULL, -- Copia del JSON en ese momento
    saved_by INTEGER REFERENCES users(id), -- Quién guardó esta versión
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    description VARCHAR(255) -- "Versión antes de borrar la clase Usuario"
);


ALTER TABLE users 
ADD COLUMN reset_password_token TEXT,
ADD COLUMN reset_password_expires TIMESTAMP;