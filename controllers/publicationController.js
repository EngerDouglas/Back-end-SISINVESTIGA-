import PublicationService from '../services/publicationService.js';
import { BadRequestError } from '../utils/errors.js';

// **************************** Crear Publicacion ************************************************* //

export const createPublication = async (req, res, next) => {
  try {
    const publication = await PublicationService.createPublication(req.body, req.user._id, req.userRole);
    res.status(201).json({ message: 'Publicación creada exitosamente', publication });
  } catch (error) {
    next(error);
  }
};

// **************************** END ************************************************ //


// **************************** Actualizar Publicacion ************************************************* //

export const updatePublication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const publication = await PublicationService.updatePublication(id, req.body, req.user._id, req.userRole);
    res.status(200).json({ message: 'Publicación actualizada correctamente', publication });
  } catch (error) {
    next(error);
  }
};

// **************************** END ************************************************ //


// ******************************** Eliminar publicaciones ************************************************* //

export const deletePublication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await PublicationService.deletePublication(id, req.user._id, req.userRole);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// **************************** END ************************************************ //


// **************************** Restaurar Publicación (Soft Restore) ************************************************* //

export const restorePublication = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await PublicationService.restorePublication(id, req.userRole);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};

// **************************** END ************************************************* //


// ********************************  Seccion de busqueda ************************************************* //

// ******************************** Obtener todas las publicaciones ************************************************* //

export const getAllPublications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, tipoPublicacion, estado, titulo } = req.query;
    const filters = {};
    if (tipoPublicacion) filters.tipoPublicacion = tipoPublicacion;
    if (estado) filters.estado = estado;
    if (titulo) filters.titulo = titulo;

    const result = await PublicationService.getAllPublications(filters, page, limit);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// **************************** END ************************************************ //


// ******************************** Obtener tus propias publicaciones ************************************************* //

export const getUserPublications = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const result = await PublicationService.getUserPublications(req.user._id, page, limit);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// **************************** END ************************************************ //



// ******************************** Obtener publicaciones por ID ************************************************* //

export const getPubById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const publication = await PublicationService.getPubById(id);
    res.status(200).json(publication);
  } catch (error) {
    next(error);
  }
}

// **************************** END ************************************************ //


// ******************************** Obtener publicaciones por el titulo ************************************************* //

export const getPubByTitle = async (req, res, next) => {
  try {
    const { query, page = 1, limit = 10 } = req.query;
    if (!query) {
      throw new BadRequestError('Se requiere un término de búsqueda');
    }
    const result = await PublicationService.searchPublications(query, page, limit);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
}

// **************************** END ************************************************ //