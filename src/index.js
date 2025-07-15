const express = require('express');
const jwt = require('jsonwebtoken');
const path = require('path');
const app = express();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const nodemailer = require('nodemailer');

const verifyToken = require('./middleware/auth');
const e = require('express');

const swaggerUi = require('swagger-ui-express');
const swaggerDocument = require('./swagger/swagger_output.json');

const { OAuth2Client } = require("google-auth-library");


app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());


const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);


const SECRET_KEY = process.env.SECRET_KEY

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.MY_EMAIL,
    pass: process.env.MY_EMAIL_PASS
  }
});




app.post("/api/google-login", async (req, res) => {
  const { credential } = req.body;
  console.log("google login api called with credential:", credential);

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload(); // Google user info
    console.log("object payload:", payload);

    const { sub, email,given_name,family_name, name, picture ,email_verified} = payload;

    const randomDigits = Math.floor(1000 + Math.random() * 9000); // 1000–9999
    user_name = given_name + randomDigits

    if (payload) {
      console.log("Google user authenticated successfully:", email);

     const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (!existingUser) {

        const user = await prisma.user.create({
        data: { username:user_name, f_name:given_name, l_name:family_name, email:email, verified: email_verified,profile_pic_url:picture,provider:"google_Auth" },
      });

    }



      // 🎫 Create your own JWT
      const token = jwt.sign(
        { id: sub, email, name, picture },
        process.env.SECRET_KEY,
        { expiresIn: "1h" }
      );

      res.json({ token }); // Send JWT to frontend
    } else {
      console.log("google auth failed in middle ........");
    }

  } catch (err) {
    console.error(err);
    res.status(401).json({ message: "Invalid Google token" });
  }
});


app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// #swagger.tags = ['Protected']
// #swagger.security = [{ "bearerAuth": [] }]

app.get('/root', verifyToken, (req, res) => {
  res.json({ message: "You are logged in", user: req.user });
});




app.post('/resend_verification_link', async (req, res) => {
  const { username, email } = req.body;

  const existingUser = await prisma.user.findUnique({
    where: { username },
  });

  if (existingUser) {

    if(existingUser.verified) {
            return res.status(400).json({ message: "User already verified" });
    }

    const token = jwt.sign({ id: existingUser.id, email: existingUser.email }, SECRET_KEY, {
      expiresIn: "15m",
    });
    const verificationLink = `http://localhost:3000/verify-email?token=${token}`;

    await transporter.sendMail({
      from: process.env.MY_EMAIL,
      to: email,
      subject: "Verify your Email",
      html: `<h2>Hi ${username}</h2>
           <p>Click below to verify your email:</p>
           <a href="${verificationLink}">Verify Now</a>`,
    });

    res.json({ msg: "Verification email sent!" });
  } else {
    return res.status(400).json({ message: "Username not found in Database" });
  }
});





app.get('/verify-email', async (req, res) => {
  const { token } = req.query;

  try {
    const decoded = jwt.verify(token, SECRET_KEY);
    const user = await prisma.user.update({
      where: { id: decoded.id },
      data: { verified: true }
    });

    const accessToken = jwt.sign({ id: user.id, username: user.username }, SECRET_KEY, { expiresIn: "1m" });

    return res.status(200).json({
      message: "Email verified successfully",
      accessToken,
  
    })

  } catch (err) {
    return res.status(400).send("Invalid or expired token");
  }
});



app.post('/register', async (req, res) => {
  const { username,f_name,l_name, password ,email,profile_pic_url} = req.body;

  try {
    const existingUser = await prisma.user.findUnique({
      where: { username }
    });

    if (existingUser) {
      return res.status(400).json({ message: "User already created" });
    }

    const user = await prisma.user.create({
      data: { username, password,f_name,l_name,email, verified: false,profile_pic_url, provider: "local" },
    });

     const token = jwt.sign({ id: user.id, email: user.email }, SECRET_KEY, { expiresIn: "15m" });
     const verificationLink = `http://localhost:3000/verify-email?token=${token}`;

     await transporter.sendMail({
    from: process.env.MY_EMAIL,
    to: email,
    subject: "Verify your Email",
    html: `<h2>Hi ${username}</h2>
           <p>Click below to verify your email:</p>
           <a href="${verificationLink}">Verify Now</a>`
  });


      res.json({ msg: "Verification email sent!" });


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


app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, {
  swaggerOptions: {
    persistAuthorization: true, // ✅ optional - keep token on refresh
  },
}));

app.get('/api/users', async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});


app.listen(3000, () => {
  console.log('Server running at http://localhost:3000');
});
