import express from 'express';
import { login, signUp } from '../controllers/superAdminController.js';

const router  = express.Router();

router.get('/', (req,res)=>{
    res.send("Hello from super admin")
})

router.post('/signup', signUp)
router.post('/login', login)


export default router;