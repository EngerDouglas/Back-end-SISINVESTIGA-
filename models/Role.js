import mongoose from 'mongoose'

const roleSchema = mongoose.Schema({
  roleName: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
})

export default mongoose.model('Role', roleSchema)