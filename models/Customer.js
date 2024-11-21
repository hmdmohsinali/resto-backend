import mongoose from "mongoose";
import validator from "validator";
import bcrypt from 'bcrypt'
const customerSchema = new mongoose.Schema({
  email: {
    type: String,
    required: [true, "Email is required"],
    unique: true,
    lowercase: true,
    validate: [validator.isEmail, "Please enter a valid email"]
  },
  password: {
    type: String,
    required: [true, "Password is required"],
    minlength: [6, "Password must be at least 6 characters long"]
  },
  fullName: {
    type: String,
    
  },
  phoneNumber: {
    type: String,
    validate: {
      validator: function (v) {
        return /\d{10}/.test(v);
      },
      message: props => `${props.value} is not a valid phone number!`
    }
  },
  isVerified:{
    type: Boolean,
    default: false,
  },
  address: {
    type: String,
    trim: true
  },
  fcmToken: {
    type: String,
  },
  otp: {
    type: String,
},
otpVerified: {
  type: Boolean,
  default: false, 
},
balance: {
  type: Number,
  default: 0
},
points: {
  type: Number,
  default: 0
},
});

customerSchema.pre("save", async function (next) {
    if (!this.isModified("password")) return next();
    this.password = await bcrypt.hash(this.password, 10);
    next();
  })

const Customer = mongoose.model("Customer", customerSchema);

export default Customer;
