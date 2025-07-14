const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const app = express();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const verifyToken = require('./middleware/auth');

const SECRET_KEY = 'your_secret_key';



app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());







app.get('/', (req, res) => {
    res.sendFile(__dirname + '/public/index.html');
});


app.get('/root', verifyToken, (req, res) => {
  res.json({ message: "You are logged in", user: req.user });
});



app.post('/', async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already created" });
    }

    const user = await prisma.user.create({
      data: { username, password }
    });


    res.status(201).json({
      message: "User created successfully",
      user,
      
    });

  } catch (error) {
    console.error(" Error creating user:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});




app.post('/login', async (req, res) => {
  const { username, password } = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (!existingUser) {
      return res.status(400).json({ message: "User not found" });
    }

    if (existingUser.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }

    const access_token = jwt.sign(
      { id: existingUser.id, username: existingUser.username },
      SECRET_KEY,
      { expiresIn: "1m" }
    );

    const refresh_token = jwt.sign(
      { id: existingUser.id, username: existingUser.username },
      SECRET_KEY,
      { expiresIn: "10m" }
    );

    return res.status(200).json({
      message: "Login successful",
      access_token,
      refresh_token,
      user: {
        id: existingUser.id,
        username: existingUser.username
      }
    });

  } catch (error) {
    console.error("❌ Login error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
});



app.post('/refresh_token', async (req,res)=>{

    const { refresh_token } = req.body;
    if (!refresh_token) {
        return res.status(401).json({ message: "❌ Refresh token not provided" });
    }
    try {
      
      const decoded = jwt.verify(refresh_token, SECRET_KEY);

      if (decoded) {
        const newAccessToken = jwt.sign(
        { id: decoded.id, username: decoded.username },
        SECRET_KEY,
        { expiresIn: "1m" }
      );

      return res.status(200).json({
        message: "New access token generated successfully",
        access_token: newAccessToken,
      })
      
      }

      else{
        return res.status(403).json({ message: "  refresh token api failed to get new access token" });
      }
      
    } catch (error) {
      
    }
    

})


app.get('/api/users', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});


app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
