const express = require('express');
const cors = require('cors');
app = express();

app.use(cors({
    origin: 'http://localhost:4200', // ← εμπιστεύσου μόνο το Angular app
    credentials: true                // ← για να περνάνε τα cookies (refresh token)
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