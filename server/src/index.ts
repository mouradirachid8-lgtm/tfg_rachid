import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http'; // <--- NUEVO
import { Server } from 'socket.io';  // <--- NUEVO
import { query } from './db';
import { register, login, forgotPassword, resetPassword } from './auth';
import { authenticateToken } from './middleware/auth.middleware';
import { updateProfile } from './user.controller';
import path from 'path';
import { upload } from './middleware/upload';
import { getProjects, createProject, updateProject, deleteProject } from './project.controller';
import { getProjectDiagram, saveProjectDiagram } from './diagram.controller';

const app = express();
const PORT = process.env.PORT || 3000;

// -- CONFIGURACIÓN SOCKET.IO --
const httpServer = createServer(app); // Envolvemos la app express
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173", // URL de tu Frontend Vue
    methods: ["GET", "POST"]
  }
});

app.use(cors()); 
app.use(express.json()); 

// -- RUTAS DE AUTENTICACIÓN --
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

// -- RUTAS PROTEGIDAS --
app.get('/api/protected/profile', authenticateToken, (req: any, res) => {
  res.json({
    message: 'entraste a zona restringida',
    user: req.user 
  });
});

// -- PERFIL DE USUARIO --
app.put('/api/users/profile', 
  authenticateToken, 
  upload.single('avatar'),
  updateProfile
);

// -- SERVIR ARCHIVOS --
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// -- RECUPERAR CONTRASEÑA --
app.post('/api/auth/forgot-password', forgotPassword);
app.post('/api/auth/reset-password/:token', resetPassword);

// -- RUTAS DE PROYECTOS --
app.get('/api/projects', authenticateToken, getProjects);
app.post('/api/projects', authenticateToken, createProject);
app.put('/api/projects/:id', authenticateToken, updateProject);
app.delete('/api/projects/:id', authenticateToken, deleteProject);

app.get('/api/diagrams/:projectId', authenticateToken, getProjectDiagram);
app.post('/api/diagrams/:projectId', authenticateToken, saveProjectDiagram);

// ==========================================
//            LÓGICA DE SOCKET.IO 
// ==========================================

// Almacén en memoria de usuarios por sala (Proyecto)
// Estructura: { "id_proyecto": [ { id, name, color } ] }
const rooms: Record<string, any[]> = {};

function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

io.on('connection', (socket) => {
  console.log('🔌 Usuario conectado al socket:', socket.id);

  // 1. Unirse a un proyecto (Sala)
  socket.on('join-project', ({ projectId, userName }) => {
    socket.join(projectId);

    if (!rooms[projectId]) rooms[projectId] = [];
    
    // Evitar duplicados si el usuario reconecta rápido
    const existingUser = rooms[projectId].find((u) => u.id === socket.id);
    if (!existingUser) {
      rooms[projectId].push({ 
        id: socket.id, 
        name: userName || 'Anónimo', 
        color: getRandomColor() 
      });
    }

    // Notificar a todos en la sala la lista actualizada
    io.to(projectId).emit('users-update', rooms[projectId]);
    socket.to(projectId).emit('user-joined', userName);
  });

  // 2. Movimiento del cursor
  socket.on('cursor-move', ({ projectId, x, y, userName }) => {
    // Buscar color del usuario
    const user = rooms[projectId]?.find((u) => u.id === socket.id);
    const color = user ? user.color : '#000';

    socket.to(projectId).emit('remote-cursor', { 
      id: socket.id, 
      x, 
      y, 
      userName, 
      color 
    });
  });

  // 3. Actualización del Diagrama
  socket.on('diagram-update', ({ projectId, content }) => {
    // Reenviar a todos los demás en la sala
    socket.to(projectId).emit('diagram-sync', content);
  });

  // 4. Chat
  socket.on('send-message', ({ projectId, message, userName }) => {
    io.to(projectId).emit('receive-message', { 
      userName, 
      message, 
      timestamp: new Date() 
    });
  });

  // 5. Desconexión
  socket.on('disconnect', () => {
    console.log('🔌 Usuario desconectado:', socket.id);
    for (const pid in rooms) {
      const prevLength = rooms[pid].length;
      rooms[pid] = rooms[pid].filter((u) => u.id !== socket.id);
      
      if (rooms[pid].length < prevLength) {
        io.to(pid).emit('users-update', rooms[pid]);
      }
    }
  });
});

// ==========================================

// CAMBIO IMPORTANTE: Usamos httpServer.listen en lugar de app.listen
httpServer.listen(PORT, () => {
  console.log(`🚀 Servidor Backend + Sockets corriendo en http://localhost:${PORT}`);
});