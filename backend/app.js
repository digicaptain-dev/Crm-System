const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const cors = require('cors');

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');



const dealRoutes = require('./routes/dealRoutes');
const stageRoutes = require('./routes/stageRoutes');
const pipelineRoutes = require('./routes/pipelineRoutes');
const userRoutes = require('./routes/userRoutes');
const authRoutes = require('./routes/authRoutes');
const commentRoutes = require('./routes/commentRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const schedulesRoutes = require('./routes/scheduleRoutes');
const conversationRoutes = require('./routes/conversationRoutes');
const imageRoutes = require('./routes/imageRoutes');
const activityRoutes = require('./routes/activityRoutes');
const socketio = require('socket.io');
const http = require('http');


const app = express();

const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'CRM API',
      version: '1.0.0',
      description: 'CRM backend API documentation'
    },
    servers: [
      { url: `http://localhost:${process.env.PORT || 3000}/api` }
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT'
        }
      }
    }
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));




const server = http.createServer(app);
const io = socketio(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST"]
    }
});

app.set('io', io);

io.on('connection', (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Join a specific room for admin, which could be based on the admin's ID
    socket.on('joinAdminRoom', (user_data) => {
        console.log(`Admin ${user_data.user_id} joined room admin_${user_data.user_id}`);
        socket.join(`admin_${user_data.user_id}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected');
    });
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Routes
app.use('/api', dealRoutes, stageRoutes, pipelineRoutes, userRoutes, authRoutes, commentRoutes);
app.use('/api/deals/upload', uploadRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/deals', conversationRoutes);
app.use('/api/img/conv', imageRoutes);
app.use('/api', activityRoutes);

// Start the server
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
