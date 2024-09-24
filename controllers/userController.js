import User from '../models/User.js'
import Role from '../models/Role.js'
import bcrypt from 'bcryptjs'
import validator from 'validator'

// *********************** Creando el Usuario ******************* //
export const createUser = async (req, res) => {
  const { nombre, apellido, email, password, especializacion, responsabilidades } = req.body

  try {
    // Verifiquemos si hay un usuario registrado
    const existUser = await User.findOne({ email })
    if (existUser) {
      return res.status(409).json({ error: 'El email colocado ya existe.' })
    }

    // //Validemos si el rol proporcionado existe en la base de datos
    // const existRole = await Role.findById(role)
    // if (!existRole) {
    //   return res.status(400).json({ error: 'Rol no valido' })
    // }

    // Buscaremos el rol por el nombre
    const roleDocument = await Role.findOne({roleName: 'Investigador' })

    if (!roleDocument) {
      return res.status(400).json({ error: 'Rol no encontrado en la Base de Datos' })
    }

    const roleId = roleDocument._id

    // Crear a nuestro usuario
    const newUser = new User({
      nombre,
      apellido,
      email,
      password,
      role: roleId,
      especializacion,
      responsabilidades
    })

    await newUser.save()
    res.status(201).json({ message: 'Usuario registrado exitosamente' })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Ha ocurrido un error al crear el usuario', error: error.message })
  }
}

// *********************** END ******************* //


// *********************** Actualizar Usuarios por el Administrador ******************* //

export const updateUser = async (req, res) => {
  const { id } = req.params
  const updates = req.body

  try {
    // veamos si nuestro usuario existe en DB
    const user = await User.findById(id)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }
      
    // Verificaremos si la clave actual es correcta antes de hacer la actualizacion
    if (updates.currentPassword && updates.newPassword) {
      const isMatch = await bcrypt.compare(updates.currentPassword, user.password)
      if (!isMatch) {
        return res.status(400).json({ error: 'Contraseña incorrecta' })
      }

      // Validar la nueva contraseña usando los mismos criterios definidos en el modelo
      if (!validator.isStrongPassword(updates.newPassword, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })) {
        return res.status(400).json({
          error: '¡La Contraseña debe tener un mínimo de 8 caracteres, incluyendo una letra mayúscula, una letra minúscula, un número y un símbolo!'
        })
      }

      // Actualizar la contraseña del usuario
      user.password = updates.newPassword

      // Eliminar los campos `currentPassword` y `newPassword` del objeto `updates`
      delete updates.currentPassword
      delete updates.newPassword
    }

    // Si proporciono `roleName`, buscamos el rol correspondiente
    if (updates.roleName) {
      const roleDocument = await Role.findOne({ roleName: updates.roleName })
      if (!roleDocument) {
        return res.status(400).json({ error: 'Rol no válido' })
      }
      user.role = roleDocument._id
      delete updates.roleName // Eliminamos `roleName` de `updates` para que no sea procesado más adelante
    }



    // aqui definiremos solo los campos que permitiremos para actualizar
    const allowedUpdates = [ 'nombre', 'apellido', 'email', 'especializacion', 'responsabilidades']
    const updateKeys = Object.keys(updates)

    // vamos a filtrar esos campos permitido para actualizarlos
    updateKeys.forEach((key) => {
      if (allowedUpdates.includes(key)) {
        user[key] = updates[key]
      }
    })

    // guardamos el usuario en la base de datos
    await user.save()

    await user.populate('role', 'roleName -_id')

    return res.status(201).json({ message: 'Usuario actualizado correctamente', user })
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar el usuario', error: error.message })
  }
}

// *********************** END ******************* //

// ************************** Actualizar tu propio Usuario ******************************* //

export const updateSelfUser = async (req, res) => {
  const updates = req.body
  const user = req.user

  try {
    if (updates.currentPassword && updates.newPassword) {
      const isMatch = await bcrypt.compare(updates.currentPassword, user.password)
      if (!isMatch) {
        return res.status(400).json({ error: 'Contraseña incorrecta' })
      }

      if (!validator.isStrongPassword(updates.newPassword, {
        minLength: 8,
        minLowercase: 1,
        minUppercase: 1,
        minNumbers: 1,
        minSymbols: 1,
      })) {
        return res.status(400).json({
          error: '¡La contraseña debe tener un mínimo de 8 caracteres, incluyendo una letra mayúscula, una letra minúscula, un número y un símbolo!'
        })
      }

      user.password = updates.newPassword

      delete updates.currentPassword
      delete updates.newPassword
    }

    const allowedUpdates = ['nombre', 'apellido', 'email', 'especializacion', 'responsabilidades']
    const updateKeys = Object.keys(updates)

    // Actualizar los campos permitidos
    updateKeys.forEach((key) => {
      if (allowedUpdates.includes(key)) {
        user[key] = updates[key]
      }
    })

    // Validar si el email ha sido modificado y si ya está en uso
    if (updates.email && updates.email !== user.email) {
      const emailExists = await User.findOne({ email: updates.email })
      if (emailExists) {
        return res.status(400).json({ error: 'El email proporcionado ya está en uso' })
      }
    }

    await user.save()

    await user.populate('role', 'roleName -_id')

    return res.status(200).json({ message: 'Información actualizada correctamente', user })
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar la información', error: error.message })
  }
}
// ************************** END ******************************* //


// ************************** Filtros y Busquedas para los Usuarios ******************************* //


// *********************** Buscar tu propio usuario ******************* //

export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password -tokens') // Excluimos campos de seguridad que no deberian verse
      .populate('role', 'roleName') 
      .populate('proyectos')
      .populate('publicaciones');

    res.status(200).json(user)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener el usuario', error: error.message })
  }
}

// ****************************** END *************************** //


// *********************** Buscar Todos los usuarios ******************* //

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate('role', 'roleName -_id')
    .select('-__v')
    .populate('proyectos')
    .populate('publicaciones');
    res.status(200).json(users)
  } catch (error) {
    res.status(500).send({ message: 'Error en la consulta de usuarios', error: error.message })
  }
}

// *********************** END ******************* //

// *********************** Buscar por ID ******************* //

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params
    const user = await User.findById(id)
      .select('-__v')
      .populate('role', 'roleName -_id')
      .populate('proyectos')
      .populate('publicaciones');

    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }

    res.status(200).json(user)
  } catch (error) {
    res.status(500).send({ message:  'Error al buscar el usuario suministrado', error: error.message})
  }
}

// *********************** END ******************* //

// ************************** END de los Filtros ******************************* //



// *********************** Log In ******************* //

// Iniciar la sesion de los usuarios
export const logInUser = async (req, res) => {
  const { email, password } = req.body

  try {
    // Verifiquemos si nuestro usuario existe.
    const user = await User.findOne({ email }).populate('role')
    if (!user) {
      return res.status(400).json({ error: 'Credenciales incorrectas' })
    }

    // Verifiquemos la clave del usuario
    const isPassCorrect = await bcrypt.compare(password, user.password)
    if (!isPassCorrect) {
      return res.status(400).json({ error: 'Credenciales incorrectas' })
    }

    // Generemos nuestos json web token
    const token = await user.generateAuthToken()

    res.status(200).json({
      message: 'Inicio de sesion exitoso',
      token,
      role: user.role.roleName,
      user: {
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido
      }
    })
  } catch (error) {
    console.log(error)
    res.status(500).json({ message: 'Ha ocurrido un error, Comunicarse con Tecnologia', error: error.message })
  }
}

// *********************** END ******************* //


// *********************** Log Out ******************* //

export const logOutUser = async (req, res) => {
  try {
    req.user.tokens = req.user.tokens.filter((userToken) => userToken.token !== req.token)
    await req.user.save()
    res.status(200).send({ message: 'Cierre de sesion exitoso' })
  } catch (error) {
    res.status(500).json({ message: 'Error al cerrar la sesion. Contacte a Tecnologia', error: error.message })
  }
}

// *********************** END ******************* //


// *********************** Log Out All Devices ******************* //

export const logOutAllUser = async (req,res ) => {
  try {
    req.user.tokens = [] // limpiamos aqui todos los tokens del usuario
    await req.user.save()
    res.status(200).send({ message: 'Todas las sesiones han sido cerrada exitosamente.' })
  } catch (error) {
    res.status(500).json({ message: 'Error al cerrar todas las sesiones. Contacte a Tecnologia', error: error.message })
  }
}

// *********************** END ******************* //