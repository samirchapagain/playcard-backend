const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS for mobile
app.use(cors({
  origin: ['http://localhost:3000', 'http://192.168.1.1:3000'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// In-memory storage
let games = [];
let currentGame = null;

// Routes
app.post('/api/games', (req, res) => {
  try {
    const { players } = req.body;
    if (!players || !Array.isArray(players) || players.length < 2) {
      return res.status(400).json({ error: 'At least 2 players required' });
    }
    
    const game = {
      id: uuidv4(),
      players: players.map(name => ({ 
        id: uuidv4(), 
        name: name.trim(), 
        totalPoints: 0 
      })),
      rounds: [],
      createdAt: new Date().toISOString()
    };
    games.push(game);
    currentGame = game;
    res.json(game);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create game' });
  }
});

app.get('/api/games/current', (req, res) => {
  res.json(currentGame);
});

app.post('/api/games/current/round', (req, res) => {
  try {
    const { points } = req.body;
    if (!currentGame) return res.status(404).json({ error: 'No active game' });
    if (!points || typeof points !== 'object') {
      return res.status(400).json({ error: 'Invalid points data' });
    }
    
    const round = { id: uuidv4(), points, timestamp: new Date().toISOString() };
    currentGame.rounds.push(round);
    
    // Update total points with validation
    Object.entries(points).forEach(([playerId, point]) => {
      const player = currentGame.players.find(p => p.id === playerId);
      if (player) {
        const numPoint = parseInt(point) || 0;
        player.totalPoints += numPoint;
      }
    });
    
    res.json(currentGame);
  } catch (error) {
    res.status(500).json({ error: 'Failed to add round' });
  }
});

app.get('/api/games', (req, res) => {
  res.json(games);
});

app.delete('/api/games/current', (req, res) => {
  currentGame = null;
  res.json({ success: true });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});