import express from 'express';
const router = express.Router();

router.get('/', (req, res) => {
  res.render('index');
});

router.get('/matchmaking', (req, res) => {
  res.render('matchmaking');
});

router.get('/room/:roomId', (req, res) => {
  const { roomId } = req.params;
  res.render('room', { roomId });
});

export default router;
