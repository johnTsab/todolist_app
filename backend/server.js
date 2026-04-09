const express = require('express');
const cors = require('cors');
const {globalLimiter} = require('./middleware/rateLimiter.js');
app = express();

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

app.use(globalLimiter);

const Routes = require("./routes/todolistRoutes");
app.use("/api",Routes);

require("dotenv").config();

const PORT = process.env.PORT || 3000 ;
const mysql2 = require("mysql2");


app.get('/',(req,res)=>{
    res.send('Server running');
})

app.listen(PORT,()=>{
    console.log(`Server is running on port : ${PORT}`);
})