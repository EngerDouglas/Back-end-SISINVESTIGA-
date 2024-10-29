import Publication from '../models/Publication.js';
import Project from '../models/Project.js';
import NotificationService from './notificationService.js';
import User from '../models/User.js';
import { BadRequestError, NotFoundError, ForbiddenError, ConflictError } from '../utils/errors.js';
import { PUBLICATION_TYPES, PUBLICATION_STATES } from '../utils/constants.js';

class PublicationService {
  // #region **************************** Crear Publicacion ************************************************* //
  static async createPublication(publicationData, userId, userRole) {
    const { titulo, fecha, proyecto, revista, resumen, palabrasClave, tipoPublicacion, estado, idioma, imagen, anexos } = publicationData;

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
      (investigador) => investigador._id.equals(userId)
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
      idioma,
      autores,
      imagen,
      anexos: anexos || [],
    });

    await newPublication.save();

    // Enviar notificaciones a los otros autores (investigadores del proyecto)
    const otherAuthors = autores.filter((autorId) => !autorId.equals(userId));

    for (const authorId of otherAuthors) {
      await NotificationService.createNotification({
        recipientId: authorId,
        senderId: userId,
        type: 'Publicación',
        message: `Se ha creado una nueva publicación titulada "${newPublication.titulo}" en el proyecto "${project.nombre}".`,
        data: { publicationId: newPublication._id },
      });
    }

    return newPublication;
  }
  // #endregion *************************************************************************************************************** //

  // #region **************************** Actualizar Publicacion ************************************************* //

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
      'tipoPublicacion', 'estado', 'anexos', 'idioma', 'autores', 'imagen'
    ];

    const updateKeys = Object.keys(updates);
    const isValidOperation = updateKeys.every((update) => allowedUpdates.includes(update));

    if (!isValidOperation) {
      throw new BadRequestError('Intento de actualización no válido.');
    }

    updateKeys.forEach((key) => {
      publication[key] = updates[key];
    });

    if (updates.imagen) {
      publication.imagen = updates.imagen;
    }

    if (updates.anexos) {
      publication.anexos = updates.anexos;
    }

    await publication.save();
    
    // Enviar notificaciones a los otros autores
    for (const authorId of publication.autores) {
      await NotificationService.createNotification({
        recipientId: authorId,
        senderId: userId,
        type: 'Publicación',
        message: `La publicación "${publication.titulo}" ha sido actualizada.`,
        data: { publicationId: publication._id },
      });
    }
    return publication;
  }

  // #endregion *************************************************************************************************************** //

  // #region **************************** Actualizar Publicacion Admins ************************************************* //

  static async updateAdmPublication(id, updates) {
    const publication = await Publication.findById(id);
    if (!publication) {
      throw new NotFoundError('Publicación no encontrada.');
    }

    // Validar si se está actualizando el proyecto
    if (updates.proyecto) {
      const project = await Project.findById(updates.proyecto);
      if (!project) {
        throw new BadRequestError('El proyecto especificado no existe.');
      }
    }

    // Solo actualizamos los campos si están presentes en la solicitud
    for (const key of Object.keys(updates)) {
      // Validar tipos de datos específicos
      if (key === 'palabrasClave' && typeof updates[key] === 'string') {
        updates[key] = JSON.parse(updates[key]);
      }
      if (key === 'anexos' && typeof updates[key] === 'string') {
        updates[key] = JSON.parse(updates[key]);
      }
      if (key === 'autores' && typeof updates[key] === 'string') {
        updates[key] = JSON.parse(updates[key]);
      }

      // Asignar la actualización a la publicación
      publication[key] = updates[key];
    }

    await publication.save();
    return publication;
  }

  // #endregion *************************************************************************************************************** //

  // #region **************************** Eliminar Publicacion ************************************************* //

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

    // Enviar notificaciones a los autores
    const otherAuthors = publication.autores.filter((autorId) => !autorId.equals(userId));

    for (const authorId of otherAuthors) {
      await NotificationService.createNotification({
        recipientId: authorId,
        senderId: userId,
        type: 'Publicación',
        message: `La publicación "${publication.titulo}" ha sido eliminada.`,
        data: { publicationId: publication._id },
      });
    }

    return publication;
  }

  // #endregion *************************************************************************************************************** //

  
  // #region **************************** Restaurar Publicacion ************************************************* //

  static async restorePublication(id, userId, userRole) {
    const publication = await Publication.findOne({ _id: id, isDeleted: true });
    if (!publication) {
      throw new NotFoundError('Publicación no encontrada o no está eliminada.');
    }
  
    if (userRole !== 'Administrador') {
      throw new ForbiddenError('No tienes permisos para restaurar esta publicación.');
    }
  
    publication.isDeleted = false;
    await publication.save();

    // Enviar notificaciones a los autores
    for (const authorId of publication.autores) {
      await NotificationService.createNotification({
        recipientId: authorId,
        senderId: userId, // Administrador que restauró la publicación
        type: 'Publicación',
        message: `La publicación "${publication.titulo}" ha sido restaurada.`,
        data: { publicationId: publication._id },
      });
    }
  
    return publication;
  }

  // #endregion *************************************************************************************************************** //

  // #region ********************************  Seccion de busqueda ************************************************* //

  // #region ******************************** Obtener todas las publicaciones ************************************************* //

  static async getAllPublications(filters, page = 1, limit = 10, userRole) {
    const query = { };

    if (userRole === 'Administrador') {
      if (filters.isDeleted !== undefined) {
        query.isDeleted = filters.isDeleted;
      }
    } else {
      query.isDeleted = false; // Los no administradores solo ven publicaciones no eliminadas
    }
  
    if (filters.tipoPublicacion) {
      query.tipoPublicacion = new RegExp(`^${filters.tipoPublicacion}$`, 'i');
    }
    if (filters.titulo) {
      query.titulo = new RegExp(filters.titulo, 'i');
    }
    if (filters.estado) {
      query.estado = filters.estado;
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
      .sort({ createdAt: -1 }) // Ordenar por fecha de creación, más reciente primero
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
  // #endregion *************************************************************************************************************** //

  // #region ******************************** Obtener tus propias publicaciones ************************************************* //

  static async getUserPublications(userId, page = 1, limit = 10, search) {
    let query = { autores: userId, isDeleted: false };
    const total = await Publication.countDocuments(query);

    if (search) {
      query.$or = [
        { titulo: { $regex: search, $options: 'i' } },
        { resumen: { $regex: search, $options: 'i' } }
      ]
    }

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

    const tiposPublicacion = Publication.schema.path('tipoPublicacion').enumValues;

    return {
      publications,
      total,
      page: Number(page),
      limit: Number(limit),
      totalPages: Math.ceil(total / limit),
      tiposPublicacion
    };
  }
  // #endregion *************************************************************************************************************** //

  // #region ******************************** Obtener publicaciones por ID ************************************************* //

  static async getPubById(id, userRole) {
    const query = { _id: id };

    if (userRole !== 'Administrador') {
      query.isDeleted = false; // Los no administradores no ven publicaciones eliminadas
    }

    const publication = await Publication.findOne(query)
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
  // #endregion *************************************************************************************************************** //


// #region ******************************** Obtener publicaciones por el titulo ************************************************* //
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
  // #endregion *************************************************************************************************************** //

  // #endregion Seccion de Busqueda *************************************************************************************************************** //
}

export default PublicationService;