import mongoose from "mongoose";
import validator from "validator";
import bcrypt from 'bcrypt'
const superAdminSchema = new mongoose.Schema({
    
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
      }
});


superAdminSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});


const SuperAdmin = mongoose.model("SuperAdmin", superAdminSchema);

export default SuperAdmin;
