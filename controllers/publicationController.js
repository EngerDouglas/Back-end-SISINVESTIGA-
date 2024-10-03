import Publication from '../models/Publication.js'
import Project from '../models/Project.js'
import validator from 'validator'

// **************************** Crear Publicacion ************************************************* //

export const createPublication = async (req, res) => {
  try {
    const { titulo, fecha, proyecto, revista, resumen, palabrasClave, tipoPublicacion, estado, anexos, idioma, } = req.body;

    // Validaciones básicas
    if (!titulo || !fecha || !proyecto || !revista || !tipoPublicacion || !idioma) {
      return res.status(400).json({ error: 'Todos los campos obligatorios deben ser proporcionados.' });
    }

    if (!validator.isISO8601(fecha)) {
      return res.status(400).json({ error: 'Fecha inválida. Debe ser en formato ISO8601.' });
    }

    // Verificar si el proyecto existe y no está eliminado
    const project = await Project.findOne({ _id: proyecto, isDeleted: false }).populate('investigadores', '_id');

    if (!project) {
      return res.status(404).json({ error: 'Proyecto no encontrado.' });
    }

    // Validar que el usuario que crea la publicación sea investigador del proyecto
    const currentUserId = req.user._id.toString();
    const isCurrentUserPartOfProject = project.investigadores.some(
      (investigador) => investigador._id.toString() === currentUserId
    );

    if (!isCurrentUserPartOfProject && req.userRole !== 'Administrador') {
      return res.status(403).json({
        error: 'No tienes permiso para crear publicaciones en este proyecto, ya que no eres parte del equipo de investigadores.',
      });
    }

    // Validar que el estado inicial sea 'Borrador' o 'Revisado' (no 'Publicado')
    if (estado && estado === 'Publicado' && req.userRole !== 'Administrador') {
      return res.status(403).json({
        error: 'Solo un administrador puede establecer el estado de la publicación como "Publicado".',
      });
    }

    // Asignar automáticamente los investigadores del proyecto como autores
    const autores = project.investigadores.map((investigador) => investigador._id);

    // Crear la nueva publicación
    const newPublication = new Publication({
      titulo,
      fecha,
      proyecto,
      revista,
      resumen,
      palabrasClave,
      tipoPublicacion,
      estado: estado || 'Borrador',
      anexos,
      idioma,
      autores,
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
    const publication = await Publication.findOne({ _id: id, isDeleted: false });

    if (!publication) {
      return res.status(404).json({ error: 'Publicación no encontrada.' });
    }

    // Solo el autor o un administrador pueden actualizar una publicación
    const isAuthor = publication.autores.some((autorId) => autorId.equals(req.user._id));
    const isAdmin = req.userRole === 'Administrador';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'No tienes permiso para actualizar esta publicación.' });
    }

    // No se permite cambiar autores o proyecto si la publicación ya está "Revisada" o "Publicado"
    if ((updates.autores || updates.proyecto) && ['Revisado', 'Publicado'].includes(publication.estado) && !isAdmin) {
      return res.status(400).json({
        error: 'No puedes cambiar autores o el proyecto de una publicación que ha sido revisada o publicada.',
      });
    }

    // Validaciones de fecha
    if (updates.fecha && !validator.isISO8601(updates.fecha)) {
      return res.status(400).json({ error: 'Fecha inválida. Debe ser en formato ISO8601.' });
    }

    // Si se actualiza el proyecto, verificar que existe y que el usuario es investigador
    if (updates.proyecto) {
      const newProject = await Project.findOne({ _id: updates.proyecto, isDeleted: false }).populate(
        'investigadores',
        '_id'
      );
      if (!newProject) {
        return res.status(404).json({ error: 'El proyecto especificado no existe.' });
      }

      if (!isAdmin) {
        const isUserInNewProject = newProject.investigadores.some((investigador) => investigador._id.equals(req.user._id));
        if (!isUserInNewProject) {
          return res.status(403).json({
            error: 'No tienes permiso para asignar esta publicación a un proyecto en el que no participas.',
          });
        }
      }

      // Validar que los autores pertenezcan al nuevo proyecto
      if (updates.autores) {
        const validAuthors = newProject.investigadores.map((investigador) => investigador._id.toString());
        const invalidAuthors = updates.autores.filter((autorId) => !validAuthors.includes(autorId));

        if (invalidAuthors.length > 0) {
          return res.status(400).json({
            error: 'Algunos autores no pertenecen al proyecto especificado.',
            invalidAuthors,
          });
        }
      }
    }

    // Si se actualiza el estado a 'Publicado', solo un administrador puede hacerlo
    if (updates.estado && updates.estado === 'Publicado' && !isAdmin) {
      return res.status(403).json({ error: 'Solo un administrador puede publicar esta publicación.' });
    }

    // Actualizar los campos permitidos
    const allowedUpdates = [
      'titulo',
      'fecha',
      'proyecto',
      'revista',
      'resumen',
      'palabrasClave',
      'tipoPublicacion',
      'estado',
      'anexos',
      'idioma',
      'autores',
    ];
    const updateKeys = Object.keys(updates);
    const isValidOperation = updateKeys.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
      return res.status(400).json({ error: 'Intento de actualización no válido.' });
    }

    updateKeys.forEach((key) => {
      publication[key] = updates[key];
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
    const publication = await Publication.findOne({ _id: id, isDeleted: false });
    if (!publication) {
      return res.status(404).json({ error: 'Publicación no encontrada.' });
    }

    // Verificar permisos
    const isAuthor = publication.autores.some((autorId) => autorId.equals(req.user._id));
    const isAdmin = req.userRole === 'Administrador';

    if (!isAuthor && !isAdmin) {
      return res.status(403).json({ error: 'No tienes permiso para eliminar esta publicación.' });
    }

    // Si la publicación está en estado "Publicado", solo el administrador puede eliminarla
    if (publication.estado === 'Publicado' && !isAdmin) {
      return res.status(400).json({ error: 'No puedes eliminar una publicación que ya ha sido publicada.' });
    }

    // Soft delete
    publication.isDeleted = true;
    await publication.save();

    res.status(200).json({ message: 'Publicación eliminada (soft delete).' });
  } catch (error) {
    res.status(500).json({ message: 'Error al eliminar la publicación.', error: error.message });
  }
};

// **************************** END ************************************************ //


// **************************** Restaurar Publicación (Soft Restore) ************************************************* //

export const restorePublication = async (req, res) => {
  const { id } = req.params;

  try {
    const publication = await Publication.findOne({ _id: id, isDeleted: true });

    if (!publication) {
      return res.status(404).json({ error: 'Publicación no encontrada o no está eliminada.' });
    }

    // Solo los administradores pueden restaurar publicaciones
    if (req.userRole !== 'Administrador') {
      return res.status(403).json({ error: 'No tienes permisos para restaurar esta publicación.' });
    }

    // sfot delete
    publication.isDeleted = false;
    await publication.save();

    res.status(200).json({ message: 'Publicación restaurada exitosamente.', publication });
  } catch (error) {
    res.status(500).json({ message: 'Error al restaurar la publicación.', error: error.message });
  }
};

// **************************** END ************************************************* //


// ********************************  Seccion de busqueda ************************************************* //

// ******************************** Obtener todas las publicaciones ************************************************* //

export const getAllPublications = async (req, res) => {
  try {
    const { tipoPublicacion, estado, titulo } = req.query;

    const filter = { isDeleted: false };
    if (tipoPublicacion) filter.tipoPublicacion = new RegExp(`^${tipoPublicacion}$`, 'i');
    if (estado) filter.estado = estado;
    if (titulo) filter.titulo = new RegExp(titulo, 'i');

    const publications = await Publication.find(filter)
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
      select: 'nombre descripcion'
    })
    
    res.status(200).json(publications)
  } catch (error) {
    res.status(500).json({ message: 'Error en la consulta de las Publiaciones', error: error.message })
  }
}

// **************************** END ************************************************ //


// ******************************** Obtener tus propias publicaciones ************************************************* //

export const getUserPublications = async (req, res) => {

  try {
    const { page = 1, limit = 10 } = req.query;

    // Buscar publicaciones del usuario
    const publications = await Publication.find({ autores: req.user._id, isDeleted: false })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate({
        path: 'autores',
        select: '-_id nombre apellido especializacion responsabilidades',
        populate: {
          path: 'role',
          select: '-_id -__v',
        },
      })
      .populate({
        path: 'proyecto',
        select: '_id nombre',
      });

    // Contar total de publicaciones
    const totalPublications = await Publication.countDocuments({
      autores: req.user._id,
      isDeleted: false,
    });

    // Obtener los tipos de publicación del esquema
    const tiposPublicacion = Publication.schema.path('tipoPublicacion').enumValues;

    // Respuesta estándar
    res.status(200).json({
      total: totalPublications,
      page: Number(page),
      limit: Number(limit),
      data: publications.length ? publications : [],
      tiposPublicacion: tiposPublicacion,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener las publicaciones del usuario",
      error: error.message,
    });
  }
}

// **************************** END ************************************************ //



// ******************************** Obtener publicaciones por ID ************************************************* //

export const getPubById = async (req, res) => {
  const { id } = req.params

  try {
    const publication = await Publication.findById({ _id: id, isDeleted: false })
    .populate({
      path: 'autores',
      select: '-_id nombre apellido especializacion responsabilidades fotoPerfil',
      populate: {
        path: 'role',
        select: '-_id -__v',
      }
    })
    .select('-_id -__v')
    .populate({
      path: 'proyecto',
      select: '_id nombre',
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
  const { titulo } = req.query

  try {
    const publications = await Publication.find({ 
      titulo: new RegExp(titulo, 'i'),
      isDeleted: false,
    })
    .populate({
      path: 'autores',
      select: 'nombre apellido especializacion responsabilidades',
      populate: {
        path: 'role',
        select: 'roleName',
      }
    })
    .select('-_id -__v')
    .populate({
      path: 'proyecto',
      select: 'nombre descripcion',
    })

    if (!publications.length) {
      return res.status(404).json({ error: 'Publicacion no encontrada con el titulo suministrado' })
    }

    res.status(200).json(publications)
  } catch (error) {
    res.status(500).json({ message: 'Error en la consulta de la Publicacion', error: error.message })
  }
}

// **************************** END ************************************************ //