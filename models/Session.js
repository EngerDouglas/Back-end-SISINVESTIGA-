import mongoose from "mongoose";

const sessionSchema = mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  ipAddress: {
    type: String,
    required: true,
  },
  location: {
    type: String,
    required: true,
  },
  device: {
    type: String,
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400, // Expira en 24 horas (opcional)
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  token: {
    type: String,
    required: true,
  },
});

const Session = mongoose.model("Session", sessionSchema);

export default Session;
