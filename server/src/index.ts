import express from 'express';
import cors from 'cors';
import { query } from './db';
import { register, login } from './auth';
import { authenticateToken } from './middleware/auth.middleware';
import { updateProfile } from './user.controller'
import path from 'path';
import { upload } from './middleware/upload';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Permite que tu Vue (puerto 5173) hable con este servidor (puerto 3000)
app.use(express.json()); // Permite recibir JSON del frontend

// -- RUTAS DE AUTENTICACIÓN --
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

// -- RUTAS PROTEGISDAS CON MIDDLEWARE DE TOKEN --
app.get('/api/protected/profile', authenticateToken, (req, res) => {
  res.json({
    message: 'entraste a zona restringida',
    user: req.user 
  });
});

// -- PERFIL DE USUARIO -- (PROTEGIDO POR MIDDLEWARE Y USANDO CONTROLLER)
app.put('/api/users/profile', 
  authenticateToken, 
  upload.single('avatar'),// PARA EL AVATAR
  updateProfile
);

// -- SERVIR ARCHIVOS --
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});