import express from 'express';
import cors from 'cors';
import { query } from './db';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors()); // Permite que tu Vue (puerto 5173) hable con este servidor (puerto 3000)
app.use(express.json()); // Permite recibir JSON del frontend


// Ruta para probar la base de datos -> pedimos la fecha actual
app.get('/api/test-db', async (req, res) => {
  try {
    const result = await query('SELECT NOW()'); 
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error conectando a la BD' });
  }
});

// Iniciar servidor
app.listen(PORT, () => {
  console.log(`Servidor Backend corriendo en http://localhost:${PORT}`);
});