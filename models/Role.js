import mongoose from 'mongoose'

const roleSchema = mongoose.Schema({
  roleName: {
    type: String,
    required: true,
    unique: true,
  },
}, {
  timestamps: true, 
});

export default mongoose.model('Role', roleSchema)