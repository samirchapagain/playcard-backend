const express = require('express');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
const PORT = process.env.PORT || 5000;

// Enhanced CORS for PWA and mobile
app.use(cors({
  origin: '*',
  credentials: false,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// In-memory storage
let games = [];
let currentGame = null;

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Playcard Backend API', status: 'running' });
});
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

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// API info endpoint
app.get('/api', (req, res) => {
  res.json({
    name: 'Playcard API',
    version: '1.0.0',
    endpoints: {
      'GET /': 'API status',
      'GET /health': 'Health check',
      'POST /api/games': 'Create new game',
      'GET /api/games/current': 'Get current game',
      'POST /api/games/current/round': 'Add round to current game',
      'GET /api/games': 'Get all games',
      'DELETE /api/games/current': 'Reset current game'
    }
  });
});

// Catch-all route for undefined endpoints
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint not found',
    message: 'Visit /api for available endpoints',
    requestedPath: req.originalUrl
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});