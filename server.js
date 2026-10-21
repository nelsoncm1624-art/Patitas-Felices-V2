require('dotenv').config();
const path = require('path');
const express = require('express');
const rutas = require('./src/citasRoutes');
const CitaError = require('./src/errors');

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));
app.use('/api', rutas);

// Manejo central de errores
app.use((err, req, res, next) => {
  if (err instanceof CitaError) {
    return res.status(err.status).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Error interno del servidor. Revisa la consola.' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor listo en http://localhost:${PORT}`));
