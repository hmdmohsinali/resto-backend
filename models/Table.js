import mongoose from "mongoose";

const tableSchema = new mongoose.Schema({
    tableNo: {
        type: Number,
        required: [true, "Table number is required"],
        min: [1, "Table number must be at least 1"]
    },
    totalPax: {
        type: Number,
        required: [true, "Total pax is required"],
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId, // Reference to the restaurant
        ref: 'Restaurant', // Assuming there's a Restaurant model
        required: [true, "Restaurant ID is required"]
    }
});

const Table = mongoose.model("Table", tableSchema);

export default Table;