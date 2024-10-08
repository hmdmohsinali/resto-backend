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
        }
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
        type: Number, // Total amount after discounts
        required: true
    },
    promotionCard: {
        type: String, // Code of the promotion card used (if any)
    },
    discountApplied: {
        type: Number, // Total discount applied (in percentage or amount)
        default: 0
    },
    completed:{
        type: Boolean,
        default: false
    }
}, { timestamps: true });

const Reservation = mongoose.model('Reservation', reservationSchema);

export default Reservation;
