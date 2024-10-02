import mongoose from "mongoose";

const tableSchema = new mongoose.Schema({
    tableNo: {
        type: String,       
    },
    totalPax: {
        type: Number,
        required: [true, "Total pax is required"],
    },
    availablePax: {
        type: Number,
        required: true,
        default: function() {
            return this.totalPax;
        }
    },
    restaurantId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Restaurant', 
        required: [true, "Restaurant ID is required"]
    }
});

const Table = mongoose.model("Table", tableSchema);

export default Table;