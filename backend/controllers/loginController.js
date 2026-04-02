const express = require('express');
const router = express.Router();
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const db = require('../src/config/database');
require('dotenv').config();

const loginUser = async(req,res) => {
    const {username,password} = req.body;

    if(!username || !password){
        return res.status(400).json({message: 'Username and password are required'});
    }

    try{
        const[rows] = await db.query('SELECT * FROM users WHERE username = ? ',[username]);
        if(rows.length===0) return res.sendStatus(401); //UNAUTHORIZED

        //EVALUATE PASSWORD
        const foundUser = rows[0];
        const match = await bcrypt.compare(password,foundUser.password);

        if(match){
            //CREATE JWT WEB TOKEN 
            const accessToken = jwt.sign(
                {"username":foundUser.username,"userId":foundUser.id,"role":foundUser.role},
                process.env.ACCESS_TOKEN_SECRET,
                {expiresIn:'1h'}
            );
            const refreshToken = jwt.sign(
                {"username":foundUser.username,"userId":foundUser.id,"role":foundUser.role},
                process.env.REFRESH_TOKEN_SECRET,
                {expiresIn:"1d"}
            );

            await db.query('UPDATE users SET refreshToken = ? WHERE username =? ' , [refreshToken,username]);

            res.cookie('jwt',refreshToken,{
                httpOnly : true,
                secure: process.env.NODE_ENV === 'production',
                maxAge : 24*60*60*1000
            });
            res.json({accessToken});
        }else{
            res.sendStatus(401); //UNAUTHORIZED
        }
    }catch(err){
        console.error(err);
        res.status(500).json({message:'Database error'});
    }
}

module.exports= loginUser;