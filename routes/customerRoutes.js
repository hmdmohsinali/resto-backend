import express from 'express';

const router  = express.Router();

router.get('/', (req,res)=>{
    res.send("Hello from customers side")
})


export default router;