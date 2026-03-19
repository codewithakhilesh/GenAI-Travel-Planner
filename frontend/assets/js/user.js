const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: null
    },
    phone: {
      type: String,
      trim: true,
      default: null
    },
    password: {
      type: String,
      default: null
    },
    photo: {
      type: String,
      default: null
    },
    provider: {
      type: String,
      enum: ["local", "google", "phone"],
      default: "local"
    }
  },
  { timestamps: true }
);

UserSchema.index({ email: 1 }, { unique: true, sparse: true });
UserSchema.index({ phone: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model("User", UserSchema);
