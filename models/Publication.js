import mongoose from "mongoose";

const publicationSchema = mongoose.Schema(
  {
    titulo: {
      type: String,
      required: true,
      trim: true,
    },
    fecha: {
      type: Date,
      required: true,
    },
    autores: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User", // Referencia al modelo que tenemos de User
        required: true,
      },
    ],
    proyecto: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        required: true,
      },
    revista: {
      type: String,
      required: true,
      trim: true,
    },
    resumen: {
      type: String,
      trim: true,
    },
    palabrasClave: [
      {
        type: String,
        trim: true,
      },
    ],
    tipoPublicacion: {
      type: String,
      enum: ["Articulo", "Informe", "Tesis", "Presentacion", "Otro"], // Tipos de publicaciones
      required: true,
    },
    estado: {
      type: String,
      enum: ["Borrador", "Revisado", "Publicado"],
      default: "Borrador",
    },
    anexos: [
      {
        type: String,
        trim: true,
      },
    ],
    idioma: {
      type: String,
      required: true,
      trim: true,
    },
    isDeleted: {
      // Soft delete
      type: Boolean,
      default: false,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Índice de texto para búsqueda
publicationSchema.index({ titulo: 'text', resumen: 'text' });

// Propiedad virtual para obtener datos adicionales del proyecto
publicationSchema.virtual('proyectoDetalles', {
  ref: 'Project',
  localField: 'proyecto',
  foreignField: '_id',
  justOne: true,
});

const Publication = mongoose.model("Publication", publicationSchema);

export default Publication;
