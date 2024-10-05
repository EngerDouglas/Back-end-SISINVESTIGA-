import Publication from '../models/Publication.js';
import Project from '../models/Project.js';
import { BadRequestError, NotFoundError, ForbiddenError } from '../utils/errors.js';
import { PUBLICATION_TYPES, PUBLICATION_STATES } from '../utils/constants.js';

class PublicationService {
  // **************************** Crear Publicacion ************************************************* //
  static async createPublication(publicationData, userId, userRole) {
    const { titulo, fecha, proyecto, revista, resumen, palabrasClave, tipoPublicacion, estado, anexos, idioma } = publicationData;

    if (!titulo || !fecha || !proyecto || !revista || !tipoPublicacion || !idioma) {
      throw new BadRequestError('Todos los campos obligatorios deben ser proporcionados.');
    }

    if (!PUBLICATION_TYPES.includes(tipoPublicacion)) {
      throw new BadRequestError('Tipo de publicación inválido.');
    }

    const project = await Project.findOne({ _id: proyecto, isDeleted: false }).populate('investigadores', '_id');
    if (!project) {
      throw new NotFoundError('Proyecto no encontrado.');
    }

    const isCurrentUserPartOfProject = project.investigadores.some(
      (investigador) => investigador._id.toString() === userId
    );

    if (!isCurrentUserPartOfProject && userRole !== 'Administrador') {
      throw new ForbiddenError('No tienes permiso para crear publicaciones en este proyecto.');
    }

    if (estado === 'Publicado' && userRole !== 'Administrador') {
      throw new ForbiddenError('Solo un administrador puede establecer el estado como "Publicado".');
    }

    const autores = project.investigadores.map((investigador) => investigador._id);

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
    return newPublication;
  }
  // **************************** END************************************************* //

  // **************************** Actualizar Publicacion ************************************************* //

  static async updatePublication(id, updates, userId, userRole) {
    const publication = await Publication.findOne({ _id: id, isDeleted: false });
    if (!publication) {
      throw new NotFoundError('Publicación no encontrada.');
    }

    const isAuthor = publication.autores.some((autorId) => autorId.equals(userId));
    const isAdmin = userRole === 'Administrador';

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenError('No tienes permiso para actualizar esta publicación.');
    }

    if ((updates.autores || updates.proyecto) && ['Revisado', 'Publicado'].includes(publication.estado) && !isAdmin) {
      throw new BadRequestError('No puedes cambiar autores o el proyecto de una publicación revisada o publicada.');
    }

    if (updates.proyecto) {
      const newProject = await Project.findOne({ _id: updates.proyecto, isDeleted: false }).populate('investigadores', '_id');
      if (!newProject) {
        throw new NotFoundError('El proyecto especificado no existe.');
      }

      if (!isAdmin) {
        const isUserInNewProject = newProject.investigadores.some((investigador) => investigador._id.equals(userId));
        if (!isUserInNewProject) {
          throw new ForbiddenError('No tienes permiso para asignar esta publicación a un proyecto en el que no participas.');
        }
      }

      if (updates.autores) {
        const validAuthors = newProject.investigadores.map((investigador) => investigador._id.toString());
        const invalidAuthors = updates.autores.filter((autorId) => !validAuthors.includes(autorId));

        if (invalidAuthors.length > 0) {
          throw new BadRequestError('Algunos autores no pertenecen al proyecto especificado.');
        }
      }
    }

    if (updates.estado === 'Publicado' && !isAdmin) {
      throw new ForbiddenError('Solo un administrador puede publicar esta publicación.');
    }

    const allowedUpdates = [
      'titulo', 'fecha', 'proyecto', 'revista', 'resumen', 'palabrasClave',
      'tipoPublicacion', 'estado', 'anexos', 'idioma', 'autores'
    ];

    const updateKeys = Object.keys(updates);
    const isValidOperation = updateKeys.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
      throw new BadRequestError('Intento de actualización no válido.');
    }

    updateKeys.forEach((key) => {
      publication[key] = updates[key];
    });

    await publication.save();
    return publication;
  }

  // **************************** END ************************************************* //


  // **************************** Eliminar Publicacion ************************************************* //

  static async deletePublication(id, userId, userRole) {
    const publication = await Publication.findOne({ _id: id, isDeleted: false });
    if (!publication) {
      throw new NotFoundError('Publicación no encontrada.');
    }

    const isAuthor = publication.autores.some((autorId) => autorId.equals(userId));
    const isAdmin = userRole === 'Administrador';

    if (!isAuthor && !isAdmin) {
      throw new ForbiddenError('No tienes permiso para eliminar esta publicación.');
    }

    if (publication.estado === 'Publicado' && !isAdmin) {
      throw new BadRequestError('No puedes eliminar una publicación que ya ha sido publicada.');
    }

    publication.isDeleted = true;
    await publication.save();
    return { message: 'Publicación eliminada (soft delete).' };
  }

  // **************************** END ************************************************* //

  
  // **************************** Restaurar Publicacion ************************************************* //

  static async restorePublication(id, userRole) {
    const publication = await Publication.findOne({ _id: id, isDeleted: true });
    if (!publication) {
      throw new NotFoundError('Publicación no encontrada o no está eliminada.');
    }
  
    if (userRole !== 'Administrador') {
      throw new ForbiddenError('No tienes permisos para restaurar esta publicación.');
    }
  
    publication.isDeleted = false;
    await publication.save();
  
    return {
      message: 'Publicación restaurada exitosamente.',
      publication: await publication.populate([
        {
          path: 'autores',
          select: 'nombre apellido especializacion responsabilidades',
          populate: {
            path: 'role',
            select: 'roleName',
          }
        },
        {
          path: 'proyecto',
          select: 'nombre descripcion'
        }
      ])
    };
  }

    // **************************** END ************************************************* //

    
  // ********************************  Seccion de busqueda ************************************************* //

  // ******************************** Obtener todas las publicaciones ************************************************* //

  static async getAllPublications(filters, page = 1, limit = 10) {
    const query = { isDeleted: false, ...filters };
    
    if (filters.tipoPublicacion) {
      query.tipoPublicacion = new RegExp(`^${filters.tipoPublicacion}$`, 'i');
    }
    if (filters.titulo) {
      query.titulo = new RegExp(filters.titulo, 'i');
    }

    const total = await Publication.countDocuments(query);
    const publications = await Publication.find(query)
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
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    return {
      publications,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    };
  }
  // **************************** END ************************************************* //

  // ******************************** Obtener tus propias publicaciones ************************************************* //

  static async getUserPublications(userId, page = 1, limit = 10) {
    const query = { autores: userId, isDeleted: false };
    const total = await Publication.countDocuments(query);

    const publications = await Publication.find(query)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate({
        path: 'autores',
        select: 'nombre apellido especializacion responsabilidades',
        populate: {
          path: 'role',
          select: 'roleName',
        },
      })
      .populate({
        path: 'proyecto',
        select: '_id nombre',
      })
      .lean();

    return {
      publications,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      tiposPublicacion: PUBLICATION_TYPES,
      estadosPublicacion: PUBLICATION_STATES
    };
  }
  // **************************** END ************************************************ //

  // ******************************** Obtener publicaciones por ID ************************************************* //

  static async getPubById(id) {
    const publication = await Publication.findOne({ _id: id, isDeleted: false })
      .populate({
        path: 'autores',
        select: 'nombre apellido especializacion responsabilidades fotoPerfil',
        populate: {
          path: 'role',
          select: 'roleName',
        }
      })
      .populate({
        path: 'proyecto',
        select: '_id nombre',
      })
      .lean();

    if (!publication) {
      throw new NotFoundError('Publicación no encontrada');
    }

    return publication;
  }
  // **************************** END ************************************************ //


// ******************************** Obtener publicaciones por el titulo ************************************************* //
  static async searchPublications(query, page = 1, limit = 10) {
    const searchQuery = {
      $or: [
        { titulo: new RegExp(query, 'i') },
        { resumen: new RegExp(query, 'i') },
        { 'palabrasClave': new RegExp(query, 'i') }
      ],
      isDeleted: false
    };

    const total = await Publication.countDocuments(searchQuery);
    const publications = await Publication.find(searchQuery)
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
        select: 'nombre descripcion',
      })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .lean();

    return {
      publications,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit)
    };
  }
  // **************************** END ************************************************ //
}

export default PublicationService;