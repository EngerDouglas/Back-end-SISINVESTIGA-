import Publication from '../models/Publication.js'
import Project from '../models/Project.js'
import validator from 'validator'

// **************************** Crear Publicacion ************************************************* //

export const createPublication = async (req, res) => {
  try {
    const {
      titulo,
      fecha,
      proyecto, 
      revista,
      resumen,
      palabrasClave,
      tipoPublicacion,
      estado,
      anexos,
      idioma
    } = req.body;

    // Validaciones básicas
    if (!titulo || !fecha || !proyecto || !revista || !tipoPublicacion || !idioma) {
      return res.status(400).json({ error: 'Todos los campos obligatorios deben ser proporcionados' });
    }

    if (!validator.isDate(fecha)) {
      return res.status(400).json({ error: 'Fecha inválida' });
    }

    // Verificar si el proyecto existe
    const project = await Project.findById(proyecto).populate('investigadores', '_id nombre apellido role');

    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Validar que el usuario que crea la publicación sea investigador del proyecto
    const currentUser = req.user._id.toString();
    const isCurrentUserPartOfProject = project.investigadores.some(investigador => investigador._id.toString() === currentUser);

    if (!isCurrentUserPartOfProject) {
      return res.status(403).json({ error: 'No tienes permiso para crear publicaciones en este proyecto, ya que no eres parte del equipo de investigadores' });
    }

    // Asignar automáticamente los investigadores del proyecto como autores de la publicación
    const autores = project.investigadores.map(investigador => investigador._id);

    // Crear la nueva publicación
    const newPublication = new Publication({
      titulo,
      fecha,
      proyecto,
      revista,
      resumen,
      palabrasClave,
      tipoPublicacion,
      estado,
      anexos,
      idioma,
      autores // Asignamos automáticamente los autores
    });

    await newPublication.save();

    res.status(201).json({ message: 'Publicación creada exitosamente', publication: newPublication });
  } catch (error) {
    res.status(500).json({ message: 'Error al crear la publicación', error: error.message });
  }
};

// **************************** END ************************************************ //


// **************************** Actualizar Publicacion ************************************************* //

export const updatePublication = async (req, res) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    const publication = await Publication.findById(id);
    if (!publication) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }

    // Solo el autor o un administrador pueden actualizar una publicación
    if (req.userRole !== 'Administrador' && !publication.autores.includes(req.user._id)) {
      return res.status(403).json({ error: 'No tienes permiso para actualizar esta publicación.' });
    }

    // No se permite cambiar autores o proyectos si la publicación ya está "Revisada" o "Publicada"
    if ((updates.autores || updates.proyecto) && ['Revisado', 'Publicado'].includes(publication.estado)) {
      return res.status(400).json({ error: 'No puedes cambiar autores o el proyecto de una publicación ya revisada o publicada.' });
    }

    // Validaciones de fecha
    if (updates.fecha && !validator.isDate(updates.fecha)) {
      return res.status(400).json({ error: 'Fecha inválida.' });
    }

    if (updates.proyecto) {
      const project = await Project.findById(updates.proyecto).populate('investigadores', '_id nombre');
      if (!project) {
        return res.status(404).json({ error: 'El proyecto especificado no existe.' });
      }

      if (updates.autores) {
        const projectInvestigadores = project.investigadores.map(investigador => investigador._id.toString());
        const invalidAuthors = updates.autores.filter(autorId => !projectInvestigadores.includes(autorId));

        if (invalidAuthors.length > 0) {
          return res.status(400).json({
            error: 'Algunos autores no están asignados a este proyecto. Asigna solo investigadores del proyecto.',
            invalidAuthors
          });
        }
      }
    }

    // Actualizar los campos permitidos
    const allowedUpdates = ['titulo', 'fecha', 'proyecto', 'revista', 'resumen', 'palabrasClave', 'tipoPublicacion', 'estado', 'anexos', 'idioma', 'autores'];
    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        publication[field] = updates[field];
      }
    });

    await publication.save();
    res.status(201).json({ message: 'Publicación actualizada correctamente', publication });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar la publicación', error: error.message });
  }
};

// **************************** END ************************************************ //


// ******************************** Eliminar publicaciones ************************************************* //

export const deletePublication = async (req, res) => {
  const { id } = req.params;

  try {
    const publication = await Publication.findById(id);
    if (!publication) {
      return res.status(404).json({ error: 'Publicación no encontrada' });
    }

    if (req.userRole !== 'Administrador') {
      return res.status(403).json({ error: 'No tienes permisos para eliminar esta publicación.' });
    }

    if (publication.estado === 'Publicado') {
      return res.status(400).json({ error: 'No puedes eliminar una publicación que ya ha sido publicada.' });
    }

    publication.isDeleted = true;
    await publication.save();

    res.status(200).json({ message: 'Publicación eliminada (soft delete).' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la publicación.', error: error.message });
  }
};

// **************************** END ************************************************ //


// ******************************** Obtener todas las publicaciones ************************************************* //

export const getAllPublications = async (req, res) => {
  try {
    const publications = await Publication.find()
    .populate({
      path: 'autores',
      select: 'nombre apellido especializacion responsabilidades',
      populate: {
        path: 'role',
        select: 'roleName',
      }
    })
    .populate({
      path: 'proyecto',
      select: 'nombre descripcion investigadores',
      populate: {
        path: 'investigadores',
        select: 'nombre apellido'
      }
    })
    res.status(200).json(publications)
  } catch (error) {
    res.status(500).json({ message: 'Error en la consulta de las Publiaciones', error: error.message })
  }
}

// **************************** END ************************************************ //


// ******************************** Obtener todas las publicaciones ************************************************* //

export const getUserPublications = async (req, res) => {

  const currentUser = req.user

  try {
    const userPublications = await Publication.find({ autores: currentUser._id })
      .populate({
        path: 'autores',
        select: '-_id nombre apellido especializacion responsabilidades',
        populate: {
          path: 'role',
          select: '-_id -__v',
        },
      })
      .select('-_id -__v')
      .populate({
        path: 'proyecto',
        select: '-_id',
      })

    // Verificamos si nuestro usuario tiene publicaciones, en caso de tener no puede eliminarse
    if (!userPublications || userPublications.length === 0) {
      return res.status(404).json({ error: 'No se encontraron publicaciones para este usuario.' })
    }

    // Respondemos con las publicaciones de nuestro usuarios
    res.status(200).json(userPublications)
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener las publicaciones del usuario', error: error.message })
  }
}

// **************************** END ************************************************ //



// ******************************** Obtener publicaciones por ID ************************************************* //

export const getPubById = async (req, res) => {
  try {
    const { id } = req.params
    const publication = await Publication.findById(id)
    .populate({
      path: 'autores',
      select: '-_id nombre apellido especializacion responsabilidades',
      populate: {
        path: 'role',
        select: '-_id -__v',
      }
    })
    .select('-_id -__v')
    .populate({
      path: 'proyecto',
      select: '-_id',
    })

    if (!publication) {
      return res.status(404).json({ error: 'Publicacion no encontrada' })
    }

    res.status(200).json(publication)
  } catch (error) {
    res.status(500).json({ message: 'Error en la consulta de la Publicacion', error: error.message })
  }
}

// **************************** END ************************************************ //


// ******************************** Obtener publicaciones por el titulo ************************************************* //

export const getPubByTitle = async (req, res) => {
  try {
    const { titulo } = req.params

    const publication = await Publication.find({ titulo })
    .populate({
      path: 'autores',
      select: '-_id nombre apellido especializacion responsabilidades',
      populate: {
        path: 'role',
        select: '-_id -__v',
      }
    })
    .select('-_id -__v')
    .populate({
      path: 'proyecto',
      select: '-_id',
    })

    if (publication.length === 0) {
      return res.status(404).json({ error: 'Publicacion no encontrada con el titulo suministrado' })
    }

    res.status(200).json(publication)
  } catch (error) {
    res.status(500).json({ message: 'Error en la consulta de la Publicacion', error: error.message })
  }
}

// **************************** END ************************************************ //