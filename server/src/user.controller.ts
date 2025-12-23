import { Request, Response } from 'express';
import { query } from './db';

// Nota: en Express con Multer, el archivo viene en req.file
export const updateProfile = async (req: Request, res: Response): Promise<void> => {
  const userId = req.user?.id;
  
  // Si viene un archivo, creamos la URL completa. Si no, cogemos el body normal.
  let avatarUrl = req.body.avatar_url;
  
  if (req.file) {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    avatarUrl = `${baseUrl}/uploads/${req.file.filename}`;
  }

  const { full_name, email } = req.body;

  if (!userId) {
    res.status(401).json({ message: 'No autorizado' });
    return;
  }

  try {
    const result = await query(
      `UPDATE users 
       SET full_name = $1, email = $2, avatar_url = $3 
       WHERE id = $4 
       RETURNING id, username, email, full_name, avatar_url`,
      [full_name, email, avatarUrl, userId]
    );

    res.json({ user: result.rows[0], message: 'Perfil actualizado' });
  } catch (error: any) {
    console.error(error);
    res.status(500).json({ message: 'Error al actualizar' });
  }
};