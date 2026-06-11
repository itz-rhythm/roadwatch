const express = require('express');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const dotenv = require('dotenv');

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Socket.io Injection Middleware
app.set('io', io);

// Import Routes & Cron Jobs
require('./jobs/cron');
const authRoutes = require('./routes/auth.routes');
const complaintRoutes = require('./routes/complaint.routes');
const roadRoutes = require('./routes/road.routes');
const contractorRoutes = require('./routes/contractor.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const escalationRoutes = require('./routes/escalation.routes');
const leaderboardRoutes = require('./routes/leaderboard.routes');
const rtiRoutes = require('./routes/rti.routes');
const notificationRoutes = require('./routes/notification.routes');

// Mount Routes
app.use('/auth', authRoutes);
app.use('/complaints', complaintRoutes);
app.use('/roads', roadRoutes);
app.use('/contractors', contractorRoutes);
app.use('/dashboard', dashboardRoutes);
app.use('/escalations', escalationRoutes);
app.use('/leaderboard', leaderboardRoutes);
app.use('/rti', rtiRoutes);
app.use('/notifications', notificationRoutes);
app.use('/export', rtiRoutes); // Reusing RTI controller for exports

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'RoadWatch Backend is running smoothly with full routing.' });
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  
  socket.on('join_room', (room) => {
    socket.join(room);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
