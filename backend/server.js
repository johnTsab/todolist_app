const express = require('express');
const http = require('http');
const {Server} = require('socket.io');
const cors = require('cors');
const {globalLimiter} = require('./middleware/rateLimiter.js');
const app = express();
const server = http.createServer(app);

const io = new Server(server,{
    cors: {
         origin: ['https://todolist-app-kappa-jet.vercel.app','http://localhost:4200'],
  credentials: true   
    }
});

app.set('io',io);

io.on('connection',(socket)=>{console.log('Client connected:',socket.id)
    socket.on('register',(userId)=>{
        socket.join(`user_${userId}`); //personal room for each user
        console.log(`User ${userId} joined their room`);
    })

    socket.on('disconnect',()=>{
        console.log('Client disconnected:',socket.id);
    });
});

app.use(cors({
    origin: ['https://todolist-app-kappa-jet.vercel.app','http://localhost:4200'],
    credentials: true
}));

const conditionalJSON = (req,res,next) => {
    if(req.method === 'GET' || req.method==='HEAD') return next();
    express.json()(req,res,next);
};

app.use(conditionalJSON);
app.use(express.urlencoded({
    "extended" : true
}));

const cookieParser = require("cookie-parser");
app.use(cookieParser());

//app.use(globalLimiter);

const Routes = require("./routes/todolistRoutes");
app.use("/api",Routes);

require("dotenv").config();

const PORT = process.env.PORT || 3000 ;
const mysql2 = require("mysql2");


app.get('/',(req,res)=>{
    res.send('Server running');
})

server.listen(process.env.PORT || 3000, () => {
  console.log('Server running');
});