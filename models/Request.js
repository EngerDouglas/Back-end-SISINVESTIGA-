import mongoose from 'mongoose';

const requestSchema = new mongoose.Schema({
  solicitante: {
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Usuario', // Asumiendo que hay un modelo Usuario
    required: true
  },
  tipo: {
    type: String,
    enum: ['Aprobación', 'Recurso', 'Permiso', 'Otros'], // Opciones de tipos de solicitud
    required: true
  },
  descripcion: {
    type: String,
    required: true
  },
  proyecto: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Proyecto', // Referencia al proyecto relacionado
    required: false // Puede no estar relacionado a un proyecto específico
  },
  estado: {
    type: String,
    enum: ['Pendiente', 'Aprobada', 'Rechazada', 'En Proceso'], // Diferentes estados de una solicitud
    default: 'Pendiente'
  },
  fechaCreacion: {
    type: Date,
    default: Date.now
  },
  comentarios: [
    {
      usuario: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario' }, // Referencia a quien hizo el comentario
      comentario: String,
      fecha: { type: Date, default: Date.now }
    }
  ],
  fechaResolucion: {
    type: Date
  },
  revisadoPor: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Usuario', // Usuario que revisa y resuelve la solicitud
    required: false
  }
});

// Crear el modelo de Solicitud
const Request = mongoose.model('Request', requestSchema);

export default Request;
