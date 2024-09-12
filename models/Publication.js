import mongoose from 'mongoose'

const publicationSchema = mongoose.Schema({
  titulo: {
    type: String,
    required: true,
    trim: true
  },
  fecha: {
    type: Date,
    required: true
  },
  autores: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Referencia al modelo que tenemos de User
    required: true
  },
  // proyecto: [{ Esta parte esta comentada ya que otro companero trabaja este modelo.
  //   type: mongoose.Schema.Types.ObjectId, 
  //   ref: 'Proyecto',
  //   required: true
  // }],
  revista: {
    type: String,
    required: true,
    trim: true
  },
  resumen: {
    type: String,
    trim: true
  },
  palabrasClave: {
    type: String,
    trim: true
  },
  tipoPublicacion: {
    type: String,
    enum: ['Articulo', 'Informe', 'Tesis', 'Presentacion', 'Otro'], // Tipos de publicaciones
    required: true
  },
  estado: {
    type: String,
    enum: ['Borrador', 'Revisado', 'Publicado'],
    default: 'Borrador'
  },
  anexos: {  // URL o ruta de archivos de nuestras publicaciones
    type: String,
    trim: true
  },
  idioma: {
    type: String,
    required: true,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
})

export default mongoose.model('Publication', publicationSchema)