import mongoose from "mongoose";

const evaluationSchema = mongoose.Schema(
  {
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    evaluator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    puntuacion: {
      type: Number,
      min: 0,
      max: 100,
      required: true,
    },
    comentarios: {
      type: String,
      trim: true,
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
    fechaEvaluacion: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

const Evaluation = mongoose.model("Evaluation", evaluationSchema);

export default Evaluation;
