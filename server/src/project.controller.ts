import { Request, Response } from 'express';
import { query } from './db';

export const getProjects = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  try {
    const result = await query(
      `SELECT * FROM projects 
       WHERE owner_id = $1 AND deleted_at IS NULL 
       ORDER BY updated_at DESC`,
      [userId]
    );
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener proyectos' });
  }
};

export const createProject = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const { name, description, is_public } = req.body;

  if (!name) {
    res.status(400).json({ message: 'El nombre es obligatorio' });
    return;
  }

  try {
    const result = await query(
      `INSERT INTO projects (name, description, is_public, owner_id) 
       VALUES ($1, $2, $3, $4) 
       RETURNING *`,
      [name, description || '', is_public || false, userId]
    );
    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al crear proyecto' });
  }
};

// Borrado lógico
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
      res.status(404).json({ message: 'Proyecto no encontrado o no eres el dueño' });
      return;
    }

    res.json({ message: 'Proyecto eliminado' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al eliminar' });
  }
};

export const updateProject = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  const projectId = req.params.id;
  const { name, description, is_public } = req.body;

  if (!name) {
    res.status(400).json({ message: 'El nombre es obligatorio' });
    return;
  }

  try {
    const result = await query(
      `UPDATE projects 
       SET name = $1, description = $2, is_public = $3, updated_at = NOW()
       WHERE id = $4 AND owner_id = $5
       RETURNING *`,
      [name, description || '', is_public || false, projectId, userId]
    );

    if (result.rowCount === 0) {
      res.status(404).json({ message: 'Proyecto no encontrado o no tienes permiso' });
      return;
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar proyecto' });
  }
};