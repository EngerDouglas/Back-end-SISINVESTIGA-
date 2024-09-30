import mongoose from 'mongoose'

const roleSchema = mongoose.Schema({
  roleName: {
    type: String,
    required: true,
    unique: true,
  },
  descripcion: {
    type: String,
    trim: true,
  },
  permisos: [{
    type: String,
    enum: ['leer', 'escribir', 'actualizar', 'eliminar', 'administrar'],
    required: true,
  }],
}, {
  timestamps: true, 
});

export default mongoose.model('Role', roleSchema)