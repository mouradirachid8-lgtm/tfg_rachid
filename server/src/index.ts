import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { Server } from 'socket.io';
import { query } from './db';
import { register, login, forgotPassword, resetPassword } from './auth';
import { authenticateToken } from './middleware/auth.middleware';
import { authorize } from './middleware/projectAuth'; 
import { updateProfile } from './user.controller';
import path from 'path';
import { upload } from './middleware/upload';
import { getProjects, createProject, updateProject, deleteProject, getMembers, addMember, removeMember, generateInviteLink, joinWithInviteLink, joinWithInviteCode } from './project.controller';
import { getProjectDiagram, saveProjectDiagram } from './diagram.controller';

const app = express();
const PORT = process.env.PORT || 3000;

// -- CONFIGURACIÓN SOCKET.IO --
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "http://localhost:5173",
    methods: ["GET", "POST"]
  }
});

app.use(cors()); 
app.use(express.json()); 

// -- RUTAS DE AUTENTICACIÓN --
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

// -- PERFIL DE USUARIO --
app.get('/api/protected/profile', authenticateToken, (req: any, res) => {
  res.json({ message: 'entraste a zona restringida', user: req.user });
});

app.put('/api/users/profile', authenticateToken, upload.single('avatar'), updateProfile);

// -- SERVIR ARCHIVOS --
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// -- RECUPERAR CONTRASEÑA --
app.post('/api/auth/forgot-password', forgotPassword);
app.post('/api/auth/reset-password/:token', resetPassword);

// ==========================================
// RUTAS DE PROYECTOS (PROTEGIDAS POR ROL)
// ==========================================

// Obtener lista (filtra internamente, no necesita authorize)
app.get('/api/projects', authenticateToken, getProjects);

// Crear (cualquiera puede crear)
app.post('/api/projects', authenticateToken, createProject);

// Modificar Metadatos (Solo Owner)
app.put('/api/projects/:id', authenticateToken, authorize('owner'), updateProject);

// Borrar Proyecto (Solo Owner)
app.delete('/api/projects/:id', authenticateToken, authorize('owner'), deleteProject);


// ==========================================
// RUTAS DE DIAGRAMAS
// ==========================================

// Ver Diagrama (Viewer o superior)
app.get('/api/diagrams/:projectId', authenticateToken, authorize('viewer'), getProjectDiagram);

// Guardar Diagrama (Editor o superior)
// ¡Aquí es donde impedimos que un alumno 'viewer' guarde cambios!
app.post('/api/diagrams/:projectId', authenticateToken, authorize('editor'), saveProjectDiagram);


// ==========================================
// RUTAS DE MIEMBROS (INVITACIONES)
// ==========================================

// Ver miembros (Viewer o superior)
app.get('/api/projects/:id/members', authenticateToken, authorize('viewer'), getMembers);

// Invitar (Solo Owner - El profesor)
app.post('/api/projects/:id/members', authenticateToken, authorize('owner'), addMember);

// Expulsar (Solo Owner)
app.delete('/api/projects/:id/members', authenticateToken, authorize('owner'), removeMember);

// Generar Enlace de Invitación (Solo Owner)
app.post('/api/projects/:id/invite-link', authenticateToken, authorize('owner'), generateInviteLink);

// Unirse usando Enlace (Cualquier usuario autenticado)
app.post('/api/projects/join/:token', authenticateToken, joinWithInviteLink);

// Unirse usando Código Corto (Cualquier usuario autenticado)
app.post('/api/projects/join-code', authenticateToken, joinWithInviteCode);


// ==========================================
//            LÓGICA DE SOCKET.IO 
// ==========================================
// (El código de sockets sigue igual, lo veremos en el paso de "Concurrencia")
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
  // ... (Tu código de sockets existente) ...
  // NOTA: Más adelante añadiremos validación de token aquí también
  console.log('🔌 Usuario conectado:', socket.id);
  
  socket.on('join-project', ({ projectId, userName, dbUserId, email }) => {
    socket.join(projectId);
    if (!rooms[projectId]) rooms[projectId] = [];
    
    const existingUser = rooms[projectId].find((u) => u.id === socket.id);
    if (!existingUser) {
      rooms[projectId].push({ 
        id: socket.id, 
        name: userName || 'Anónimo', 
        dbUserId,
        email,
        color: getRandomColor(),
        handRaised: false
      });
    }
    io.to(projectId).emit('users-update', rooms[projectId]);
    socket.to(projectId).emit('user-joined', userName);
  });

  socket.on('role-changed', ({ projectId }) => {
    io.to(projectId).emit('permissions-updated');
  });

  socket.on('cursor-move', ({ projectId, x, y, userName }) => {
    const user = rooms[projectId]?.find((u) => u.id === socket.id);
    const color = user ? user.color : '#000';
    socket.to(projectId).emit('remote-cursor', { id: socket.id, x, y, userName, color });
  });

  socket.on('toggle-hand', ({ projectId, isRaised }) => {
    const user = rooms[projectId]?.find((u) => u.id === socket.id);
    if (user) {
      user.handRaised = isRaised;
      io.to(projectId).emit('users-update', rooms[projectId]);
      // Si se levantó la mano, enviamos un evento extra para mostrar una notificación al profesor
      if (isRaised) {
        socket.to(projectId).emit('hand-raised-notification', user.name);
      }
    }
  });

  socket.on('lower-hand', ({ projectId, targetSocketId }) => {
    const targetUser = rooms[projectId]?.find((u) => u.id === targetSocketId);
    if (targetUser) {
      targetUser.handRaised = false;
      io.to(projectId).emit('users-update', rooms[projectId]);
    }
  });

  socket.on('diagram-update', ({ projectId, content }) => {
    socket.to(projectId).emit('diagram-sync', content);
  });

  socket.on('send-message', ({ projectId, message, userName }) => {
    io.to(projectId).emit('receive-message', { userName, message, timestamp: new Date() });
  });

  socket.on('disconnect', () => {
    for (const pid in rooms) {
      const prevLength = rooms[pid].length;
      rooms[pid] = rooms[pid].filter((u) => u.id !== socket.id);
      if (rooms[pid].length < prevLength) {
        io.to(pid).emit('users-update', rooms[pid]);
        io.to(pid).emit('user-disconnected', socket.id);
      }
    }
  });
});

httpServer.listen(PORT, () => {
  console.log(`Servidor Backend + Sockets corriendo en http://localhost:${PORT}`);
});