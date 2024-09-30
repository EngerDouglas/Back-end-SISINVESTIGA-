import mongoose from "mongoose";

const requestSchema = new mongoose.Schema(
  {
    solicitante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tipoSolicitud: {
      type: String,
      enum: ["Aprobación", "Recurso", "Permiso", "Otros"],
      required: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    proyecto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
    },
    estado: {
      type: String,
      enum: ["Pendiente", "Aprobada", "Rechazada", "En Proceso"],
      default: "Pendiente",
    },
    fechaCreacion: {
      type: Date,
      default: Date.now,
    },
    comentarios: [
      {
        usuario: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        comentario: String,
        fecha: { type: Date, default: Date.now },
      },
    ],
    fechaResolucion: {
      type: Date,
    },
    revisadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Request", requestSchema);
