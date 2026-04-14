require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const passport = require('passport') 
const session = require('express-session'); 
const todolistRoutes = require('./routes/todolistRoutes');
const oauthRoutes = require('./routes/oAuthroutes'); 
const app = express();
const server = http.createServer(app);

app.set('trust proxy', 1);

const allowedOrigins = [
  'http://localhost:4200',
  'https://todolist-app-kappa-jet.vercel.app', 
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  })
);

app.use(express.json());
app.use(cookieParser());

//middleware
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-me',
    resave: false,
    saveUninitialized: false,
  })
);

app.use(passport.initialize());

const io = new Server(server, {
  cors: {
    origin: allowedOrigins,
    credentials: true,
  },
});

app.set('io', io);
io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('register', (userId) => {
    socket.join(`user_${userId}`);
    console.log(`User ${userId} joined their room`);
  });
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

// Routes
app.use('/api', todolistRoutes);
app.use('/api/auth', oauthRoutes);

// cron job route
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});





