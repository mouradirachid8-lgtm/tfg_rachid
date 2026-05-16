import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from './db';

import crypto from 'crypto';
import { transporter } from './mailer';

const SECRET_KEY = process.env.JWT_SECRET || 'secreto_por_defecto';

// --- REGISTER ---
export const register = async (req: Request, res: Response): Promise<void> => {
  const { name, email, password } = req.body;

  try {
    // 1. Validar que no exista el usuario
    const userCheck = await query('SELECT * FROM users WHERE email = $1', [email]);
    if (userCheck.rows.length > 0) {
      res.status(400).json({ message: 'El usuario ya existe' });
      return; 
    }

    // 2. Encriptar contraseña
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Insertar en BBDD
    const newUser = await query(
      'INSERT INTO users (username, email, password_hash) VALUES ($1, $2, $3) RETURNING id, username, email',
      [name, email, passwordHash]
    );

    // 4. Generar Token
    const user = newUser.rows[0];
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '2h' });

    res.status(201).json({ user, token });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al registrarse' });
  }
};

// --- LOGIN ---
export const login = async (req: Request, res: Response): Promise<void> => {
  const { email, password } = req.body;

  try {
    // 1. Buscar usuario
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    
    if (result.rows.length === 0) {
      res.status(400).json({ message: 'Credenciales inválidas' });
      return;
    }

    const user = result.rows[0];

    // 2. Comparar contraseña (la que envían vs la encriptada)
    const validPassword = await bcrypt.compare(password, user.password_hash);
    if (!validPassword) {
      res.status(400).json({ message: 'Credenciales inválidas' });
      return;
    }

    // 3. Generar Token
    const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: '2h' });

    // 4. Responder
    res.json({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        avatar_url: user.avatar_url
      },
      token
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al iniciar sesión' });
  }
};

// --- SOLICITAR RECUPERACIÓN ---
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  const { email } = req.body;

  try {
    // Verificar si el usuario existe
    const result = await query('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];

    if (!user) {
      res.json({ message: 'Si el email existe, recibirás un correo.' });
      return;
    }

    // Generar token aleatorio y fecha de expiración (1 hora)
    const token = crypto.randomBytes(20).toString('hex');
    const expires = new Date(Date.now() + 3600000);

    await query(
      'UPDATE users SET reset_password_token = $1, reset_password_expires = $2 WHERE id = $3',
      [token, expires, user.id]
    );

    // Enviar Email
    const resetUrl = `http://localhost:5173/reset-password/${token}`;

    const mailOptions = {
      from: 'Soporte UML <noreply@tudominio.com>',
      to: user.email,
      subject: 'Recuperación de contraseña',
      text: `Haz clic en este enlace para cambiar tu contraseña: ${resetUrl}`
    };

    await transporter.sendMail(mailOptions);

    res.json({ message: 'Correo enviado' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor' });
  }
};

// --- ESTABLECER NUEVA CONTRASEÑA ---
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  const { token } = req.params;
  const { password } = req.body;

  try {
    
    const result = await query(
      `SELECT * FROM users 
       WHERE reset_password_token = $1 
       AND reset_password_expires > NOW()`,
      [token]
    );

    const user = result.rows[0];

    if (!user) {
      res.status(400).json({ message: 'Token inválido o expirado' });
      return;
    }

    // Hashear nueva contraseña
    const hashedPassword = await bcrypt.hash(password, 10);

    // Actualizar password y BORRAR el token para que no se use de nuevo
    await query(
      `UPDATE users 
       SET password_hash = $1, reset_password_token = NULL, reset_password_expires = NULL 
       WHERE id = $2`,
      [hashedPassword, user.id]
    );

    res.json({ message: 'Contraseña actualizada correctamente' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al cambiar contraseña' });
  }
};

// --- GUEST JOIN (Acceso como invitado con código de aula) ---
export const guestJoin = async (req: Request, res: Response): Promise<void> => {
  const { code, alias } = req.body;

  if (!code || !alias) {
    res.status(400).json({ message: 'Se requiere el código de aula y un alias' });
    return;
  }

  try {
    // 1. Buscar el proyecto por invite_code
    const projResult = await query(
      'SELECT id FROM projects WHERE UPPER(invite_code) = UPPER($1) AND deleted_at IS NULL',
      [code]
    );

    if (projResult.rows.length === 0) {
      res.status(400).json({ message: 'Código de aula inválido o proyecto no encontrado' });
      return;
    }

    const projectId = projResult.rows[0].id;

    // 2. Crear usuario invitado temporal
    const randomHex = crypto.randomBytes(4).toString('hex');
    const randomUUID = crypto.randomUUID();
    const guestUsername = `${alias.replace(/\s+/g, '_').toLowerCase()}_${randomHex}`;
    const guestEmail = `guest_${randomUUID}@guest.local`;
    const guestPassword = crypto.randomBytes(16).toString('hex');
    const passwordHash = await bcrypt.hash(guestPassword, 10);

    const newUserResult = await query(
      `INSERT INTO users (username, full_name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id, username, full_name, email`,
      [guestUsername, alias, guestEmail, passwordHash]
    );

    const guestUser = newUserResult.rows[0];

    // 3. Añadir al proyecto como viewer
    await query(
      `INSERT INTO project_members (project_id, user_id, role)
       VALUES ($1, $2, 'viewer')
       ON CONFLICT (project_id, user_id) DO NOTHING`,
      [projectId, guestUser.id]
    );

    // 4. Generar JWT
    const token = jwt.sign(
      { id: guestUser.id, email: guestUser.email },
      SECRET_KEY,
      { expiresIn: '8h' }
    );

    res.status(201).json({ user: guestUser, token, projectId });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error al unirse como invitado' });
  }
};