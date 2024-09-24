import express from 'express';

const router  = express.Router();

router.get('/', (req,res)=>{
    res.send("HEllo from super admin")
})


export default router;