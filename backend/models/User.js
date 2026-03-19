const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    firstName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    lastName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 80
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      unique: true
    },
    passwordHash: {
      type: String,
      required: true
    },
    // legacy support for older records
    name: {
      type: String,
      trim: true,
      default: ""
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
