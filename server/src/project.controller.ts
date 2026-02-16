import { Request, Response } from 'express';
import { query } from './db';

// GET: Obtener proyectos propios y compartidos
export const getProjects = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  try {
    // ESTA ES LA CLAVE:
    // Traemos proyectos donde soy el dueño (owner_id) 
    // O donde estoy en la lista de miembros (project_members)
    const sql = `
      SELECT 
        p.*,
        CASE 
            WHEN p.owner_id = $1 THEN 'owner' 
            ELSE pm.role 
        END as current_user_role
      FROM projects p
      LEFT JOIN project_members pm ON p.id = pm.project_id AND pm.user_id = $1
      WHERE (p.owner_id = $1 OR pm.user_id = $1)
        AND p.deleted_at IS NULL
      ORDER BY p.updated_at DESC
    `;

    const result = await query(sql, [userId]);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener proyectos' });
  }
};

// POST: Crear proyecto + Diagrama inicial
export const createProject = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { name, description, is_public } = req.body;

  if (!name) {
    res.status(400).json({ message: 'El nombre es obligatorio' });
    return;
  }

  try {
    // 1. Crear el Proyecto
    const projectResult = await query(
      `INSERT INTO projects (name, description, is_public, owner_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [name, description || '', is_public || false, userId]
    );

    const newProject = projectResult.rows[0];

    // 2. IMPORTANTE: Crear el primer diagrama automáticamente
    // Esto permite que al hacer click en el proyecto, el editor tenga algo que cargar.
    await query(
      `INSERT INTO diagrams (project_id, name, content) 
       VALUES ($1, 'Diagrama Principal', '{}')`,
      [newProject.id]
    );

    // Devolvemos el proyecto con el rol 'owner' inyectado para que el frontend no falle
    res.json({ ...newProject, current_user_role: 'owner' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear proyecto' });
  }
};

// DELETE: Borrado lógico (Solo si eres Owner)
export const deleteProject = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const projectId = req.params.id;

  try {
    const result = await query(
      `UPDATE projects 
       SET deleted_at = NOW() 
       WHERE id = $1 AND owner_id = $2 
       RETURNING id`,
      [projectId, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ message: 'No encontrado o no tienes permiso de Owner' });
      return;
    }

    res.json({ message: 'Proyecto eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar' });
  }
};

// PUT: Actualizar (Solo si eres Owner)
// Nota: Si quieres que los Editores cambien el nombre, quita "AND owner_id = $5"
export const updateProject = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const projectId = req.params.id;
  const { name, description, is_public } = req.body;

  try {
    const result = await query(
      `UPDATE projects 
       SET name = $1, description = $2, is_public = $3, updated_at = NOW()
       WHERE id = $4 AND owner_id = $5
       RETURNING *`,
      [name, description || '', is_public || false, projectId, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ message: 'No encontrado o no tienes permiso' });
      return;
    }
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar' });
  }
};