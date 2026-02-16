import { Response, NextFunction } from 'express';
import { query } from '../db';

// SOLUCIÓN: Añadimos ': Record<string, number>' para que acepte cualquier string como clave
const ROLE_LEVELS: Record<string, number> = {
  'viewer': 1,
  'editor': 2,
  'owner': 3
};

export const authorize = (requiredRole: 'viewer' | 'editor' | 'owner') => {
  return async (req: any, res: Response, next: NextFunction) => {
    const userId = req.user?.id;
    // Ajuste para soportar ambos nombres de parámetro
    const projectId = req.params.id || req.params.projectId;

    if (!projectId) {
      return res.status(400).json({ message: 'ID de proyecto no especificado' });
    }

    try {
      // 1. Verificar si es el DUEÑO (Owner)
      const projectRes = await query('SELECT owner_id FROM projects WHERE id = $1', [projectId]);
      
      if (projectRes.rows.length === 0) {
        return res.status(404).json({ message: 'Proyecto no encontrado' });
      }

      if (projectRes.rows[0].owner_id === userId) {
        return next(); // Es dueño, pase usted
      }

      // 2. Si no es dueño, verificamos si es MIEMBRO
      const memberRes = await query(
        'SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2',
        [projectId, userId]
      );

      if (memberRes.rows.length === 0) {
        return res.status(403).json({ message: 'No tienes acceso a este proyecto' });
      }

      const userRole = memberRes.rows[0].role; // TypeScript ahora confiará en que esto es un string válido

      // 3. Comprobar Nivel de Permiso
      if (ROLE_LEVELS[userRole] >= ROLE_LEVELS[requiredRole]) {
        return next();
      } else {
        return res.status(403).json({ message: `Se requiere rol de ${requiredRole} para esta acción` });
      }

    } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Error de autorización' });
    }
  };
};