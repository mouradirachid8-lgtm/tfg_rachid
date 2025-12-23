import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query } from './db';

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
      user: { id: user.id, name: user.username, email: user.email },
      token
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error en el servidor al iniciar sesión' });
  }
};