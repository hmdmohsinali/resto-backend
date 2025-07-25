import express from "express";
import dotenv from'dotenv';
import adminRoute from './routes/adminRoutes.js'
import superAdminRoute from './routes/superAdminRoutes.js'
import connectToDB from "./config/connectToDB.js";
import customerRoutes from './routes/customerRoutes.js';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import cookieParser from 'cookie-parser';
import { transporter } from './utils/transpoter.js';
dotenv.config();
const app= express();
const PORT = process.env.PORT || 4000
const corsOptions = {
    origin: ["*", "http://localhost:5173","http://localhost:5174","https://resto-sub-admins-v464.vercel.app", "https://resto-super-admin.vercel.app", "https://resto-sub-admins.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
    credentials: true,
  }
  
app.use(cors(corsOptions))
app.use(cookieParser());

app.use(express.json());

app.use(fileUpload({
    useTempFiles: true,
    tempFileDir: '/tmp/',      
  }));

app.get('/', (req, res)=>{
    res.send("heeelllo")
})

app.get('/test-email', async (req, res) => {
    try {
        const info = await transporter.sendMail({
            from: process.env.Email_User,
            to: req.query.to || process.env.Email_User, // allow override via query param
            subject: 'Test Email',
            text: 'This is a test email from the transporter test endpoint.',
        });
        res.json({ success: true, message: 'Email sent', info });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to send email', error: error.message });
    }
});

app.use('/superAdmin',superAdminRoute);
app.use('/admin',adminRoute);
app.use('/customer' , customerRoutes );

connectToDB()

app.listen(PORT,()=>{
    console.log(`server is running on PORT ${PORT}`)
})