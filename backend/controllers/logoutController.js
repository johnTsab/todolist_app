const express = require('express');
const router = express.Router();
const db = require('../src/config/database');
require('dotenv').config();

const userLogout = async (req,res) => {
    //on client , also delete the access token

    try{
    const cookies = req.cookies
    if(!cookies?.jwt) return res.sendStatus(204); // no content to send back
    
    const refreshToken = cookies.jwt;


    //is refresh token in DB
    const [rows] = await db.query(
        "SELECT * FROM users WHERE refreshToken = ? ",
        [refreshToken]
    );

    const user = rows[0];
    if(!user){

          res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
        return res.sendStatus(204); // no content to send / succesful 
    } 

   // Delete the refresh token 

    const[result] = await db.query('UPDATE users SET refreshToken=NULL WHERE refreshToken=?',[refreshToken])
    
     res.clearCookie('jwt', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    return res.sendStatus(204);

    }catch(error){
        console.error('EROR logging out ', error);
        res.sendStatus(500);
    }
};

module.exports = userLogout;