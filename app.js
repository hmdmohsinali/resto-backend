import express from "express";
import dotenv from'dotenv';
import adminRoute from './routes/adminRoutes.js'
import superAdminRoute from './routes/superAdminRoutes.js'
import connectToDB from "./config/connectToDB.js";
import customerRoutes from './routes/customerRoutes.js'
import cors from 'cors'
dotenv.config()
const app= express();
const PORT = process.env.PORT || 4000

const corsOptions = {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  };
  
app.use(cors(corsOptions));


app.use(express.json())


app.get('/', (req, res)=>{
    res.send("heeelllo")
})

app.use('/superAdmin',superAdminRoute);
app.use('/admin',adminRoute);
app.use('/customer' , customerRoutes );

connectToDB()

app.listen(PORT,()=>{
    console.log(`server is running on PORT ${PORT}`)
})