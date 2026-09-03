const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const cors = require('cors');
const http = require('http');
const socketio = require('socket.io');

const swaggerJsdoc = require('swagger-jsdoc');
const swaggerUi = require('swagger-ui-express');

// Import Database Pool
const db = require('./db'); 

// Import Routes
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

const app = express();
const server = http.createServer(app);

// Dynamic Environment Base Resolution
const PORT = process.env.PORT || 1000;
const CLIENT_URL = process.env.CLIENT_URL || '*';
const API_BASE_URL = process.env.API_BASE_URL || `http://localhost:${PORT}/api`;

// Dynamic CORS Configuration
const corsOptions = {
    origin: CLIENT_URL === '*' ? '*' : CLIENT_URL.split(',').map(url => url.trim()),
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};

app.use(cors(corsOptions));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Dynamic Swagger Configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'CRM API',
            version: '1.0.0',
            description: 'CRM Backend API Documentation'
        },
        servers: [
            { url: API_BASE_URL }
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

// Socket.io Dynamic Setup
const io = socketio(server, {
    cors: {
        origin: corsOptions.origin,
        methods: ['GET', 'POST']
    }
});

app.set('io', io);

io.on('connection', (socket) => {
    console.log(`[SOCKET CONNECTED] Socket ID: ${socket.id}`);

    socket.on('joinAdminRoom', (user_data) => {
        if (user_data && user_data.user_id) {
            const roomName = `admin_${user_data.user_id}`;
            socket.join(roomName);
            console.log(`[SOCKET ROOM JOIN] Admin ${user_data.user_id} joined ${roomName}`);
        }
    });

    socket.on('disconnect', () => {
        console.log(`[SOCKET DISCONNECTED] Socket ID: ${socket.id}`);
    });
});

// Health Check Route for Railway Status Monitoring
app.get('/health', async (req, res) => {
    try {
        await db.query('SELECT 1');
        return res.status(200).json({ status: 'OK', message: 'Backend & Database up and running' });
    } catch (err) {
        return res.status(500).json({ status: 'ERROR', message: 'Database query failed', error: err.message });
    }
});

// Mount Routes
app.use('/api', dealRoutes, stageRoutes, pipelineRoutes, userRoutes, authRoutes, commentRoutes);
app.use('/api/deals/upload', uploadRoutes);
app.use('/api/schedules', schedulesRoutes);
app.use('/api/deals', conversationRoutes);
app.use('/api/img/conv', imageRoutes);
app.use('/api', activityRoutes);

// Start HTTP Server
server.listen(PORT, () => {
    console.log(`[SERVER ACTIVE] Running in ${process.env.NODE_ENV || 'development'} mode on Port ${PORT}`);
});