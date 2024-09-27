import mongoose from 'mongoose'
import validator from 'validator'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const userSchema = mongoose.Schema({
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  apellido: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate(value) {
      if (!validator.isEmail(value)) {
        throw new Error('¡Correo Electrónico inválido!');
      }
    },
  },
  password: {
    type: String,
    required: true,
    trim: true,
    minlength: [8, 'La contraseña debe tener un mínimo de 8 caracteres'],
    validate(value) {
      if (!validator.isStrongPassword(value, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })) {
        throw new Error('¡La Contraseña debe tener un mínimo de 8 caracteres, incluyendo una letra mayúscula, una letra minúscula, un número y un símbolo!');
      }
      if (value.includes('12345678')) {
        throw new Error('¡Contraseña insegura!');
      }
    },
  },
  especializacion: {
    type: String,
    required: true,
    trim: true,
  },
  responsabilidades: [{
    type: String,
    required: true,
  }],
  role: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Role', // Referencia a nuestro modelo Role
    required: true,
  },
  isDisabled: {
    type: Boolean,
    default: false, // Los usuarios no están deshabilitados por defecto
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  tokens: [{
    token: {
      type: String,
      required: true
    }
  }],
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// propiedad virtual para traer los 'proyectos'
userSchema.virtual('proyectos', {
  ref: 'Project',
  localField: '_id',
  foreignField: 'investigadores',
});

// propiedad virtual para traer lss 'publicaciones'
userSchema.virtual('publicaciones', {
  ref: 'Publication',
  localField: '_id',
  foreignField: 'autores',
});

// Vamos a eliminar las propiedades sensibles al convertir nuestro json
userSchema.methods.toJSON = function () {  
  const user = this.toObject()
  delete user.password
  delete user.tokens
  return user
};

// Generaremos nuestro token JWT y lo guardaremos en el usuario
userSchema.methods.generateAuthToken = async function () {
  const user = this
  const token = jwt.sign({ _id: user._id.toString() }, process.env.JWT_SEC_KEY, { expiresIn: '1d' })
  user.tokens = user.tokens.concat({ token })
  await user.save()
  return token
}

// Hashearemos la clave antes de que la guardemos
userSchema.pre('save', async function (next) {
  const user = this
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next()
})

export default mongoose.model('User', userSchema)