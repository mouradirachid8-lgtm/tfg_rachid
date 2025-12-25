import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { query } from './db';
import { register, login } from './auth';
import { authenticateToken } from './middleware/auth.middleware';
import { updateProfile } from './user.controller'
import path from 'path';
import { upload } from './middleware/upload';
import { forgotPassword, resetPassword } from './auth';
import { getProjects, createProject, updateProject, deleteProject } from './project.controller';

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

// -- RECUPERAR CONTRASEÑA --
app.post('/api/auth/forgot-password', forgotPassword);
app.post('/api/auth/reset-password/:token', resetPassword);

// RUTAS DE PROYECTOS
app.get('/api/projects', authenticateToken, getProjects);
app.post('/api/projects', authenticateToken, createProject);
app.put('/api/projects/:id', authenticateToken, updateProject);
app.delete('/api/projects/:id', authenticateToken, deleteProject);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});