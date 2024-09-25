import bcrypt from 'bcrypt'
import dotenv from 'dotenv';
import { transporter } from '../utils/transpoter.js';
import SuperAdmin from '../models/superAdmin.js';

dotenv.config();

export const signUp = async (req, res) => {
    const { email, password } = req.body;
    console.log('Request body:', req.body); 

    try {
        let user = await SuperAdmin.findOne({ email });
        if (user) {
            console.log('SuperAdmin already exists');
            return res.status(400).json({ msg: 'SuperAdmin already exists' });
        }

        console.log('SuperAdmin not found, proceeding with signup');
        
        const customer = new SuperAdmin({ email, password })
        await customer.save();
        console.log('SuperAdmin saved to database');

        return res.status(201).json({ msg: 'SuperAdmin created successfully' });
    } catch (error) {
        console.log('Error:', error.message);
        return res.status(500).json({ error: 'Server error' });
    }
};

export const login = async (req, res) => {
    const { email, password } = req.body;
    console.log('Request body:', req.body); // Check if req.body is coming through

    try {
        const customer = await SuperAdmin.findOne({ email });
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

