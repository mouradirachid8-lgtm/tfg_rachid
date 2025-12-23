import express from 'express';
import cors from 'cors';
import { query } from './db';
import { register, login } from './auth';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Permite que tu Vue (puerto 5173) hable con este servidor (puerto 3000)
app.use(express.json()); // Permite recibir JSON del frontend

// -- RUTAS DE AUTENTICACIÓN --
app.post('/api/auth/register', register);
app.post('/api/auth/login', login);

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});