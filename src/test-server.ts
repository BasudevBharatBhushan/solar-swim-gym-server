import express from 'express';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('Test server running');
});

const server = app.listen(port, () => {
  console.log(`✅ Test server running on port ${port}`);
});

// Keep alive
setInterval(() => {
  console.log('Server is alive...');
}, 5000);
