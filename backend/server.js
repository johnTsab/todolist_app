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

// CORS
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

// Middleware
app.use(express.json());
app.use(cookieParser());

// Session middleware 
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'fallback-secret-change-me',
    resave: false,
    saveUninitialized: false,
  })
);

// Initialize Passport
app.use(passport.initialize());

// Socket.io
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
app.use('/api/auth', oauthRoutes); // NEW

// Health check
app.get('/', (req, res) => {
  res.json({ status: 'Server is running' });
});

// Error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: 'Internal server error' });
});
console.log('ADMIN_EMAIL:', JSON.stringify(process.env.ADMIN_EMAIL));
console.log('EMAIL_PASS length:', process.env.EMAIL_PASS?.length);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});





