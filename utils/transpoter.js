import dotenv from 'dotenv'
import nodemailer from "nodemailer"

dotenv.config();

export const transporter = nodemailer.createTransport({
   host: 'smtp.gmail.com', 
   auth: {
     user: process.env.Email_User, 
     pass: process.env.Email_Pass 
   }
 })