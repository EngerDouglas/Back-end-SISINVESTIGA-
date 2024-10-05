import mongoose from "mongoose";

const projectSchema = mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      text: true,
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
      text: true,
    },
    objetivos: {
      type: String,
      trim: true,
    },
    presupuesto: {
      type: Number,
      required: true,
    },
    cronograma: {
      fechaInicio: {
        type: Date,
        required: true,
      },
      fechaFin: {
        type: Date,
        required: true,
      },
    },
    investigadores: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    ],
    recursos: [
      {
        type: String,
        trim: true,
      },
    ],
    hitos: [
      {
        nombre: {
          type: String,
          required: true,
        },
        fecha: {
          type: Date,
          required: true,
        },
        entregable: {
          type: String,
          trim: true,
        },
      },
    ],
    estado: {
      type: String,
      enum: ["Planeado", "En Proceso", "Finalizado", "Cancelado"],
      default: "Planeado",
    },
    isEvaluated: {
      type: Boolean,
      default: false,
    },
    isDeleted: {
      // Soft delete
      type: Boolean,
      default: false,
    },
  },
  {
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    timestamps: true,
  }
);

// Propiedad virtual para relacionar las evaluaciones
projectSchema.virtual("evaluaciones", {
  ref: "Evaluation",
  localField: "_id",
  foreignField: "project",
});

const Project = mongoose.model("Project", projectSchema);

export default Project;
