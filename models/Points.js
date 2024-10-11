import mongoose from "mongoose";


const pointSchema = new mongoose.Schema({

    pointsPerTopup:{
        type: Number,
        required: true
    },
    pointEqualTo :{
        type: Number,
        required : true
    }

},{timestamps:true})

const Points  = mongoose.model("Points" , pointSchema);

export default Points;
