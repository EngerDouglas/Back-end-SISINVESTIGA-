import Role from '../models/Role.js'
import User from '../models/User.js'

// ***********************  Creamos un nuevo roles ******************* //

export const createRole = async (req, res) => {
  try {
    const role = new Role(req.body);
    await role.save();
    res.status(201).json(role);
  } catch (error) {
    res.status(500).json({ message: 'Ha ocurrido un error al crear el rol',  error: error.message });
  }
};
// *********************** END ******************* //


// *********************** Actualizar los Roles ******************* //

export const updateRole = async (req, res) => {
  const role = req.body
  const { id } = req.params

  try {
    const existRole = await Role.findOne({
      roleName: role.roleName,
      _id: { $ne: id } // Query para consultar en la DB
    })

    if (existRole) {
      // Si hay un conflicto con el nombre del Rol
      return res.status(409).json({
        message: 'El rol suministrado ya existe.',
        existRoleName: existRole.roleName,
        existRoleId: existRole._id,
      })
    }

    // si no fallos actualizemos el rol
    const updateRole = await Role.findByIdAndUpdate(id, role, {
      new: true,
      runValidators: true,
    })

    // verificamos el rol actualizado y si fue encontrado
    if (updateRole) {
      return res.status(201).json({ message: 'Rol actualizado correctamente', role: updateRole })
    } else {
      return res.status(404).json({ message: 'Rol no encontrado' })
    }
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar el rol', error: error.message });
  }
}

// *********************** END ******************* //


// *********************** Obtener todos los roles ******************* //

export const getRoles = async (req, res) => {
  try {
    const roles = await Role.find().select('-_id -__v')
    res.status(200).json(roles)
  } catch (error) {
    res.status(500).json({ message: 'Ha ocurrido un error en la consulta de los roles', error: error.message })
  }
}

// *********************** END ******************* //


// ********************************* Eliminar un Rol ****************************************///

export const deleteRole = async (req, res) => {
  const { id } = req.params

  try {
    // Validaremos si el rol existe en la base de datos
    const role = await Role.findById(id)
    if (!role) {
      return res.status(404).json({ error: 'Rol no encontrado' })
    }

    // Verificaremos si este rol lo tiene asignado algun usuario
    const userWithRole = await User.find({ role: id })
    if (userWithRole.length > 0) {
      return res.status(400).json({ 
        message: 'No se puede eliminar el rol porque esta asignado a uno o mas usuarios.'
      })
    }

    // Eliminamos el rol de la base de datos
    await Role.findByIdAndDelete(id)
    res.status(200).json({ message: 'Rol eliminado correctamente' })
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar el rol', error: error.message })
  }
}

// ********************************* END ****************************************///