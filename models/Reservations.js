import mongoose from "mongoose";

const reservationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Customer',
        required: true
    },
    restaurant: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant',
        required: true
    },
    guestNumber: {
        type: Number,
        required: true,
        min: 1
    },
    date: {
        type: Date,
        required: true
    },
    time: {
        type: String,
        required: true
    },
    menuItems: [{
        menuItem: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Menu',
            required: true
        },
        quantity: {
            type: Number,
            required: true,
            min: 1
        },
        selectedOptions: [{
            name: { type: String, required: true },  
            value: { type: String, required: true }   
        }]
    }],
    note: {
        type: String,
        trim: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    contactNo: {
        type: String,
        required: true,
        trim: true
    },
    totalAmount: {
        type: Number, 
        required: true
    },
    promotionCard: {
        type: String, 
    },
    discountApplied: {
        type: Number, 
        default: 0
    },
    completed: {
        type: Boolean,
        default: false
    },
    isRated: {
        type: Boolean,
        default: false 
    }
}, { timestamps: true });

const Reservation = mongoose.model('Reservation', reservationSchema);


export default Reservation;