import bcrypt from 'bcrypt'
import Customer from '../models/Customer.js';
import dotenv from 'dotenv';
import { transporter } from '../utils/transpoter.js';

dotenv.config();

export const signUp = async (req, res) => {
    const { email, password } = req.body;
    console.log('Request body:', req.body); // Check if req.body is coming through

    try {
        let user = await Customer.findOne({ email });
        if (user) {
            console.log('Customer already exists');
            return res.status(400).json({ msg: 'Customer already exists' });
        }

        console.log('Customer not found, proceeding with signup');
        
        const customer = new Customer({ email, password })
        await customer.save();
        console.log('Customer saved to database');

        return res.status(201).json({ msg: 'Customer created successfully' });
    } catch (error) {
        console.log('Error:', error.message);
        return res.status(500).json({ error: 'Server error' });
    }
};


export const login = async (req, res) => {
    const { email, password } = req.body;
    console.log('Request body:', req.body); // Check if req.body is coming through

    try {
        const customer = await Customer.findOne({ email });
        if (!customer) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }


        const isMatch = await bcrypt.compare(password, customer.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid credentials' });
        }
        return res.status(200).json({ msg: 'Login successful' , userId : customer._id });
    } catch (error) {
        console.log('Error:', error.message);
        return res.status(500).json({ error: 'Server error' });
    }
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        const user = await Customer.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: 'Customer not found' });
        }

        
        const otp = Math.floor(100000 + Math.random() * 900000);
        user.otp = otp;
        await user.save();

        // Sending OTP via email
        const mailOptions = {
            from: process.env.Email_User, // Sender email
            to: email, // Recipient email
            subject: 'Your OTP Code', // Email subject
            text: `Your OTP code is ${otp}`, // Email content
        };

        // Use transporter to send mail
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.error(`Error sending OTP email: ${error.message}`);
                return res.status(500).json({ msg: 'Failed to send OTP email' });
            } else {
                console.log(`OTP email sent: ${info.response}`);
                return res.status(200).json({ msg: 'OTP sent to your email', userID :user._id });
            }
        });

    } catch (error) {
        console.error(error.message);
        return res.status(500).json({ error: 'Server error' });
    }
};


export const verifyOtp = async (req, res) => {
    const { otp, userId } = req.body;

    try {
        const user = await Customer.findById(userId);
        if (!user || user.otp !== otp) {
            return res.status(400).json({ msg: 'Invalid OTP' });
        }

        user.otp = null; 
        await user.save()

        return res.status(200).json({ msg: 'OTP verified successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Server error' });
    }
};

// Change Password
export const changePassword = async (req, res) => {
    const { newPassword, userId } = req.body;

    try {
        const user = await Customer.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'Customer not found' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        user.password = hashedPassword;
        await user.save();

        return res.status(200).json({ msg: 'Password changed successfully' });
    } catch (error) {
        return res.status(500).json({ error: 'Server error' });
    }
};


export const editProfile = async (req, res) => {
    const { userId, fullName, address, phoneNumber } = req.body;

    try {
        let user = await Customer.findById(userId);
        if (!user) {
            return res.status(404).json({ msg: 'Customer not found' });
        }

        user.fullName = fullName || user.fullName;
        user.address = address || user.address;
        user.phoneNumber = phoneNumber || user.phoneNumber;

        await user.save();

        return res.status(200).json({ msg: 'Profile updated successfully', user });
    } catch (error) {
        return res.status(500).json({ error: 'Server error' });
    }
};