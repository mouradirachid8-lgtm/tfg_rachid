// server/src/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// 1. Definimos qué forma tiene la información en el Token
export interface UserPayload {
  id: number;
  email: string;
}

// 2. "Extendemos" la definición de Request de Express -> cosas de typescript
declare global {
  namespace Express {
    interface Request {
      user?: UserPayload;
    }
  }
}

const SECRET_KEY = process.env.JWT_SECRET || 'secreto_por_defecto';

// 3. función del middleware
export const authenticateToken = (req: Request, res: Response, next: NextFunction): void => {
  // Formato: "Authorization: Bearer <TOKEN>"
  const authHeader = req.headers['authorization'];
  
  // Separamos lo que compone el token real -> no hay header = undefined
  const token = authHeader && authHeader.split(' ')[1];

  // no token -> ERROR
  if (!token) {
    res.status(401).json({ message: 'Acceso denegado: Token no proporcionado' });
    return;
  }

  // Verificar el token
  jwt.verify(token, SECRET_KEY, (err, user) => {
    // token caducado -> ERROR
    if (err) {
      res.status(403).json({ message: 'Token inválido o expirado' });
      return;
    }

    // ÉXITO!
    req.user = user as UserPayload;
    
    // siguientes funciones
    next();
  });
};