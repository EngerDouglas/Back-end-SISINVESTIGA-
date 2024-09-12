import User from '../models/User.js'
import Role from '../models/Role.js'
import bcrypt from 'bcryptjs'
import validator from 'validator'

// *********************** Creando el Usuario ******************* //
export const createUser = async (req, res) => {
  const { nombre, apellido, email, password, role, especializacion, responsabilidades } = req.body

  try {
    // Verifiquemos si hay un usuario registrado
    const existUser = await User.findOne({ email })
    if (existUser) {
      return res.status(409).json({ error: 'El usuario ya existe' })
    }

    //Validemos si el rol proporcionado existe en la base de datos
    const existRole = await Role.findById(role)
    if (!existRole) {
      return res.status(400).json({ error: 'Rol no valido' })
    }

    // Crear a nuestro usuario
    const newUser = new User({
      nombre,
      apellido,
      email,
      password,
      role,
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


// *********************** Actualizar Usuarios ******************* //

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


    // aqui definiremos solo los campos que permitiremos para actualizar
    const allowedUpdates = [ 'nombre', 'apellido', 'email', 'especializacion', 'responsabilidades', 'role']
    const updateKeys = Object.keys(updates)

    // vamos a filtrar esos campos permitido para actualizarlos
    updateKeys.forEach((key) => {
      if (allowedUpdates.includes(key)) {
        user[key] = updates[key]
      }
    })

    // guardamos el usuario en la base de datos
    await user.save()
    return res.status(201).json({ message: 'Usuario actualizado correctamente', user })
  } catch (error) {
    return res.status(500).json({ message: 'Error al actualizar el usuario', error: error.message })
  }
}

// *********************** END ******************* //



// ************************** Filtros y Busquedas para los Usuarios ******************************* //


// *********************** Buscar tu propio usuario ******************* //

export const getUser = async (req, res) => {
  res.send(req.user)
}

// ****************************** END *************************** //


// *********************** Buscar Todos los usuarios ******************* //

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().populate('role', 'roleName -_id').select('-__v')
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
      .select('-_id -__v')
      .populate('role', 'roleName -_id')

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

    // Confuguraremos la cookie para que se guarde nuestro token
    res.cookie('ucsd_session', token, { 
      httpOnly: true,
      // secure: process.env.NODE_ENV === 'production', // Asegura las cookies solo en producción
      // sameSite: 'strict', // Mismo sitio
      maxAge: 24 * 60 * 60 *1000 // 1 dia es lo que durara.
    })

    res.status(200).json({
      message: 'Inicio de sesion exitoso',
      user: {
        email: user.email,
        nombre: user.nombre,
        apellido: user.apellido,
        role: user.role.roleName
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

    res.clearCookie('ucsd_session')
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

    res.clearCookie('ucsd_session')
    res.status(200).send({ message: 'Todas las sesiones han sido cerrada exitosamente.' })
  } catch (error) {
    res.status(500).json({ message: 'Error al cerrar todas las sesiones. Contacte a Tecnologia', error: error.message })
  }
}

// *********************** END ******************* //