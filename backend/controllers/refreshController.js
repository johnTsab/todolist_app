const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");
const db = require('../src/config/database');
require('dotenv').config();

const userrefreshToken = async (req,res) => {
    try{
    const cookies = req.cookies
    if(!cookies?.jwt) return res.sendStatus(401);
    
    const refreshToken = cookies.jwt

    const [rows] = await db.query(
        "SELECT * FROM users WHERE refreshToken = ? ",
        [refreshToken]
    );

    const user = rows[0];
    if(!user) return res.sendStatus(403);

    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    if(decoded.username !== user.username) return res.sendStatus(403);

    const accessToken = jwt.sign(
        {username:decoded.username},
        process.env.ACCESS_TOKEN_SECRET,
        {expiresIn: "5min"}
    );

    res.json({accessToken});

    }catch(error){
        console.error('EROR REFRESHING TOKEN: ', error);

        if(error.name === "JsonWebTokenError" || error.name === "TokenExpiredError"){
            return res.sendStatus(403);
        }
        res.sendStatus(500);
    }
};

module.exports = userrefreshToken;
