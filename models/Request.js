import mongoose from "mongoose";

const commentSchema = new mongoose.Schema({
  usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  comentario: { type: String, required: true },
  fecha: { type: Date, default: Date.now },
});

const requestSchema = new mongoose.Schema(
  {
    solicitante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tipoSolicitud: {
      type: String,
      enum: ['Unirse a Proyecto', 'Recursos', 'Aprobación', 'Permiso', 'Otro'],
      required: true,
    },
    descripcion: {
      type: String,
      required: true,
    },
    proyecto: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Project',
      required: function () {
        // Proyecto es requerido si el tipo de solicitud está relacionado con un proyecto
        return ['Unirse a Proyecto', 'Recursos', 'Aprobación'].includes(this.tipoSolicitud);
      },
    },
    estado: {
      type: String,
      enum: ['Pendiente', 'Aprobada', 'Rechazada', 'En Proceso'],
      default: 'Pendiente',
    },
    comentarios: [commentSchema],
    fechaResolucion: {
      type: Date,
    },
    revisadoPor: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isDeleted: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Request = mongoose.model('Request', requestSchema);

export default Request;