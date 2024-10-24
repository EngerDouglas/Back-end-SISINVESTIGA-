import mongoose from 'mongoose'

const roleSchema = mongoose.Schema({
  roleName: {
    type: String,
    required: true,
    unique: true,
    trim: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true, 
});

roleSchema.index({ roleName: 1 });

const Role = mongoose.model('Role', roleSchema)

export default Role