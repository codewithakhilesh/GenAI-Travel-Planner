const mongoose = require("mongoose");

const OtpSchema = new mongoose.Schema(
  {
    phone: {
      type: String,
      required: true,
      unique: true,
      trim: true
    },
    otpHash: {
      type: String,
      required: true
    },
    expiresAt: {
      type: Date,
      required: true
    },
    attempts: {
      type: Number,
      default: 0
    }
  },
  { timestamps: true }
);

OtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("Otp", OtpSchema);
