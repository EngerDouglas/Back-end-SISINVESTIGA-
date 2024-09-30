import mongoose from "mongoose";

const projectSchema = mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
      text: true, // Añadir índice de texto
    },
    descripcion: {
      type: String,
      required: true,
      trim: true,
      text: true, // Añadir índice de texto
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
    evaluacion: [
      {
        evaluador: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        puntuacion: {
          type: Number,
          min: 0,
          max: 100,
        },
        comentarios: String,
        fechaEvaluacion: {
          type: Date,
          default: Date.now,
        },
      },
    ],
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
    timestamps: true,
  }
);

export default mongoose.model("Project", projectSchema);
