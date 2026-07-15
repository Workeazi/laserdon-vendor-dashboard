import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

// Serve the static files from the Vite build directory
app.use(express.static(path.join(__dirname, 'dist')));

// An API route example (Optional: you can add your backend logic here later)
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Express server is running!' });
});

// Handles any requests that don't match the ones above.
// This is necessary for client-side routing (React Router) to work properly.
app.use((req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});
