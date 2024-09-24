import express from "express";
import dotenv from'dotenv';
import superAdminRoute from './routes/superAdminRoutes.js'
import connectToDB from "./config/connectToDB.js";

dotenv.config()
const app= express();
const PORT = process.env.PORT || 4000



app.get('/', (req, res)=>{
    res.send("heeelllo")
})

app.use('/superAdmin',superAdminRoute)

connectToDB();

app.listen(PORT,()=>{
    console.log(`server is running on PORT ${PORT}`)
})