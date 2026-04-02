const express = require("express");
const bcrypt = require("bcrypt");
const db = require("../src/config/database");
require("dotenv").config();

const registerUser = async (req, res) => {
  const { username, password, confirmPassword,email } = req.body;
  console.log('REGISTER BODY:', { username, email });

  //secondary check for empty username/password
  if (!username || !password || !email) {
    return res
      .status(400)
      .json({ message: "All fields are required" });
  }

  if(!confirmPassword){
    return res.status(400).json({message:"You need to confirm your password."})
  }

  //check if the username already exists
  try {
    const [rows] = await db.query("SELECT * FROM users WHERE username=?", [username]);
console.log('USERNAME CHECK:', rows.length); // ← πόσα βρήκε
if (rows.length > 0) {
  console.log('USERNAME CONFLICT');
  return res.status(409).json({ message: "Username already exists" });
}

const [rows2] = await db.query("SELECT * FROM users WHERE email=?", [email]);
console.log('EMAIL CHECK:', rows2.length); // ← πόσα βρήκε
if (rows2.length > 0) {
  console.log('EMAIL CONFLICT');
  return res.status(409).json({ message: "Email already exists" });
}
   


    //register data after hasing password
    const hashedPwd = await bcrypt.hash(password, 10);
    const [result] = await db.query(
      "INSERT INTO users (username,password,email) VALUES (?,?,?)",
      [username, hashedPwd,email],
    );

    //update logging database
    const userId = result.insertId;
    await db.query(
      "INSERT INTO logs (user_id,action,activity_type) VALUES (?,?,?)",
      [userId, "USER REGISTERED", "AUTH"],
    );
    return res.status(201).json({message:"User registered succesfully",userId});
  } catch (err) {
     console.error('REGISTER ERROR:', err); // ← ΝΕΟ
  res.status(500).json({ message: err.message });
  }
};

module.exports = registerUser;
