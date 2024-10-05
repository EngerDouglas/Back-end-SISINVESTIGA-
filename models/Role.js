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

const Role = mongoose.model('Role', roleSchema)

export default Role