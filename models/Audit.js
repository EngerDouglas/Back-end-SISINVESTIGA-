import mongoose, { Schema } from "mongoose";

const auditSchema = mongoose.Schema(
  {
    user: {
      type: Schema.Types.ObjectId, 
      ref: 'User',
      required: false,
    },
    method: {
      type: Schema.Types.String,
      required: true,
    },
    url: {
      type: Schema.Types.String,
      required: true,
    },
    activity: {
      type: Schema.Types.String,
      required: true,
    },
    params: {
      type: Schema.Types.Mixed,
    },
    query: {
      type: Schema.Types.Mixed,
    },
    payload: {
      type: Schema.Types.Mixed,
    },
    response: {
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: Schema.Types.String,
    },
    location: {
      type: Schema.Types.String,
    },
    device: {
      type: Schema.Types.String,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Audit = mongoose.model("Audit", auditSchema);

export default Audit;
