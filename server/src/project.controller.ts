import { Request, Response } from 'express';
import { query } from './db';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

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

// GET: Ver miembros del proyecto
export const getMembers = async (req: Request, res: Response): Promise<void> => {
  const projectId = req.params.id;

  try {
    const result = await query(
      `SELECT u.id, u.username, u.email, u.avatar_url, pm.role 
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1`,
      [projectId]
    );
    
    // También añadimos al Owner manualmente si no está en la tabla members
    // (Opcional, pero recomendable para que salga en la lista)
    const ownerResult = await query(
      `SELECT u.id, u.username, u.email, u.avatar_url, 'owner' as role
       FROM projects p
       JOIN users u ON p.owner_id = u.id
       WHERE p.id = $1`,
      [projectId]
    );

    // Unimos owner + miembros
    const members = [...ownerResult.rows, ...result.rows];
    
    // Filtramos duplicados por ID (por si el owner se autoinvitó también)
    const uniqueMembers = members.filter((v,i,a)=>a.findIndex(v2=>(v2.id===v.id))===i);

    res.json(uniqueMembers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al obtener miembros' });
  }
};

// POST: Invitar usuario por Email
export const addMember = async (req: Request, res: Response): Promise<void> => {
  const projectId = req.params.id;
  const { email, role } = req.body; // role puede ser 'editor' o 'viewer'

  if (!email) {
    res.status(400).json({ message: 'Email requerido' });
    return;
  }

  try {
    // 1. Buscar usuario por email
    const userRes = await query('SELECT id FROM users WHERE email = $1', [email]);
    
    if (userRes.rows.length === 0) {
      res.status(404).json({ message: 'Usuario no encontrado con ese email' });
      return;
    }

    const newUserId = userRes.rows[0].id;
    const finalRole = role === 'editor' ? 'editor' : 'viewer'; // Viewer por defecto

    // 2. Insertar en project_members
    // Usamos ON CONFLICT DO NOTHING para evitar error si ya está invitado
    await query(
      `INSERT INTO project_members (project_id, user_id, role) 
       VALUES ($1, $2, $3)
       ON CONFLICT (project_id, user_id) DO UPDATE SET role = $3`,
      [projectId, newUserId, finalRole]
    );

    res.json({ message: 'Usuario invitado correctamente' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al invitar usuario' });
  }
};

// DELETE: Eliminar miembro (expulsar)
export const removeMember = async (req: Request, res: Response): Promise<void> => {
    const projectId = req.params.id;
    const { userId } = req.body; // ID del usuario a echar

    try {
        await query(
            'DELETE FROM project_members WHERE project_id = $1 AND user_id = $2',
            [projectId, userId]
        );
        res.json({ message: 'Miembro eliminado' });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar miembro' });
    }
};

// POST: Generar enlace de invitacion (Solo Owner)
export const generateInviteLink = async (req: Request, res: Response): Promise<void> => {
    const projectId = req.params.id;
    const { role } = req.body; // 'editor' | 'viewer'
    if (!role) { res.status(400).json({ message: 'Role info missing' }); return; }

    try {
        let proj = await query('SELECT invite_token, invite_code FROM projects WHERE id = $1', [projectId]);
        if (proj.rows.length === 0) { res.status(404).json({ message: 'Project not found' }); return; }
        
        let tokenStr = proj.rows[0].invite_token;
        let inviteCodeStr = proj.rows[0].invite_code;
        
        // Generate Token and Code if either is missing
        if (!tokenStr || !inviteCodeStr) {
            tokenStr = tokenStr || crypto.randomUUID();
            inviteCodeStr = inviteCodeStr || Math.random().toString(36).substring(2, 8).toUpperCase();
            await query('UPDATE projects SET invite_token = $1, invite_code = $2 WHERE id = $3', [tokenStr, inviteCodeStr, projectId]);
        }

        const payload = { projectId, role, invite_token: tokenStr };
        const inviteJwt = jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: '7d' });

        res.json({ token: inviteJwt, code: inviteCodeStr });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error generating link' });
    }
};

// POST: Unirse al proyecto usando el token
export const joinWithInviteLink = async (req: Request, res: Response): Promise<void> => {
    const { token } = req.params;
    const userId = req.user?.id;

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as any;
        const { projectId, role, invite_token } = decoded;

        const proj = await query('SELECT invite_token FROM projects WHERE id = $1', [projectId]);
        if (proj.rows.length === 0 || proj.rows[0].invite_token !== invite_token) {
            res.status(400).json({ message: 'Enlace de invitación inválido o revocado' });
            return;
        }

        const finalRole = role === 'editor' ? 'editor' : 'viewer';
        
        await query(
            `INSERT INTO project_members (project_id, user_id, role) 
            VALUES ($1, $2, $3)
            ON CONFLICT (project_id, user_id) DO UPDATE SET role = $3`,
            [projectId, userId, finalRole]
        );

        res.json({ message: 'Unido correctamente', projectId });
    } catch (e) {
        console.error(e);
        res.status(400).json({ message: 'Enlace inválido o expirado' });
    }
};

// POST: Unirse al proyecto usando el código corto
export const joinWithInviteCode = async (req: Request, res: Response): Promise<void> => {
    const { code } = req.body;
    const userId = req.user?.id;

    if (!code) { res.status(400).json({ message: 'Código numérico/texto requerido' }); return; }

    try {
        const proj = await query('SELECT id FROM projects WHERE UPPER(invite_code) = UPPER($1)', [code]);
        if (proj.rows.length === 0) {
            res.status(400).json({ message: 'Código de aula inválido' });
            return;
        }

        const projectId = proj.rows[0].id;
        
        await query(
            `INSERT INTO project_members (project_id, user_id, role) 
            VALUES ($1, $2, 'viewer')
            ON CONFLICT (project_id, user_id) DO NOTHING`,
            [projectId, userId]
        );

        res.json({ message: 'Te has unido correctamente al aula. Actualiza tu lista de proyectos.', projectId });
    } catch (e) {
        console.error(e);
        res.status(500).json({ message: 'Error interno de servidor o código inválido' });
    }
};