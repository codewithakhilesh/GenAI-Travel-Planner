const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const twilio = require("twilio");

const Otp = require("../models/otp");
const User = require("../models/User");

const OTP_EXPIRY_MS = 5 * 60 * 1000;
const MAX_OTP_ATTEMPTS = 5;

let cachedTwilioClient = null;




function normalizeIndianPhone(value) {
  let digits = String(value || "").replace(/\D/g, "");
  if (!digits) return null;

  if (digits.length === 12 && digits.startsWith("91")) {
    digits = digits.slice(2);
  }

  if (!/^[6-9]\d{9}$/.test(digits)) {
    return null;
  }

  return `+91${digits}`;
}

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function issueJwt(user) {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not configured.");
  }

  return jwt.sign({ id: String(user._id) }, secret, { expiresIn: "7d" });
}

function toClientUser(user) {
  return {
    id: String(user._id),
    name: user.name || "",
    email: user.email || null,
    phone: user.phone || null,
    photo: user.photo || null,
    provider: user.provider || "phone"
  };
}

function hasTwilioConfig() {
  return Boolean(
    process.env.TWILIO_ACCOUNT_SID &&
    process.env.TWILIO_AUTH_TOKEN &&
    process.env.TWILIO_PHONE
  );
}

function getTwilioClient() {
  if (!hasTwilioConfig()) return null;
  if (!cachedTwilioClient) {
    cachedTwilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
  }
  return cachedTwilioClient;
}

async function sendSmsOtp(phone, otp) {
  const client = getTwilioClient();
  if (!client) return false;

  await client.messages.create({
    body: `Your GoYatra OTP is ${otp}. It is valid for 5 minutes.`,
    from: process.env.TWILIO_PHONE,
    to: phone
  });

  return true;
}

exports.sendOtp = async (req, res) => {
  try {
    const phone = normalizeIndianPhone(req.body.phone);
    if (!phone) {
      return res.status(400).json({ message: "Enter a valid India mobile number." });
    }

    const otp = generateOtpCode();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS);

    await Otp.findOneAndUpdate(
      { phone },
      { phone, otpHash, expiresAt, attempts: 0 },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    let smsSent = false;

    if (hasTwilioConfig()) {
      try {
        await sendSmsOtp(phone, otp);
        smsSent = true;
      } catch (smsError) {
        console.error("Twilio send OTP failed:", smsError.message);
        return res.status(500).json({ message: "Failed to send OTP. Please try again." });
      }
    } else {
      console.log(`OTP for ${phone} is ${otp}`);
    }

    const payload = {
      message: smsSent ? "OTP sent successfully." : "OTP generated successfully."
    };

    if (!smsSent && process.env.NODE_ENV !== "production") {
      payload.devOtp = otp;
    }

    return res.status(200).json(payload);
  } catch (error) {
    console.error("Send OTP error:", error);
    return res.status(500).json({ message: "Unable to send OTP right now." });
  }
};

exports.verifyOtp = async (req, res) => {
  try {
    const phone = normalizeIndianPhone(req.body.phone);
    const otp = String(req.body.otp || "").trim();

    if (!phone) {
      return res.status(400).json({ message: "Enter a valid India mobile number." });
    }

    if (!/^\d{6}$/.test(otp)) {
      return res.status(400).json({ message: "Enter a valid 6-digit OTP." });
    }

    const otpDoc = await Otp.findOne({ phone });
    if (!otpDoc) {
      return res.status(400).json({ message: "OTP not found. Please request a new OTP." });
    }

    if (otpDoc.expiresAt.getTime() < Date.now()) {
      await Otp.deleteOne({ _id: otpDoc._id });
      return res.status(400).json({ message: "OTP expired. Please request a new OTP." });
    }

    const isMatch = await bcrypt.compare(otp, otpDoc.otpHash);
    if (!isMatch) {
      otpDoc.attempts = Number(otpDoc.attempts || 0) + 1;

      if (otpDoc.attempts >= MAX_OTP_ATTEMPTS) {
        await Otp.deleteOne({ _id: otpDoc._id });
        return res.status(400).json({ message: "Too many wrong attempts. Request OTP again." });
      }

      await otpDoc.save();
      return res.status(400).json({ message: "Invalid OTP." });
    }

    await Otp.deleteOne({ _id: otpDoc._id });

    let user = await User.findOne({ phone });

    if (!user) {
      user = await User.create({
        name: `Traveler ${phone.slice(-4)}`,
        phone,
        provider: "phone"
      });
    } else {
      let shouldSave = false;

      if (!user.name) {
        user.name = `Traveler ${phone.slice(-4)}`;
        shouldSave = true;
      }

      if (!user.provider || user.provider === "local") {
        user.provider = "phone";
        shouldSave = true;
      }

      if (shouldSave) {
        await user.save();
      }
    }

    const token = issueJwt(user);

    return res.status(200).json({
      message: "Mobile login successful.",
      token,
      user: toClientUser(user)
    });
  } catch (error) {
    console.error("Verify OTP error:", error);
    return res.status(500).json({ message: "Unable to verify OTP right now." });
  }
};
