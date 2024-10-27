import RequestService from '../services/requestService.js';

// #region Crear Solicitud ************************************************* //
export const createRequest = async (req, res, next) => {
  try {
    const request = await RequestService.createRequest(req.body, req.user._id);
    res.status(201).json({ message: 'Solicitud creada exitosamente.', solicitud: request });
  } catch (error) {
    next(error);
  }
};
// #endregion *************************************************************** //

// #region Actualizar Solicitud ************************************************* //
export const updateRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await RequestService.updateRequest(id, req.body, req.user._id, req.userRole);
    res.status(200).json({ message: 'Solicitud actualizada exitosamente.', solicitud: request });
  } catch (error) {
    next(error);
  }
};
// #endregion *************************************************************** //

// #region Eliminar Solicitud ************************************************* //
export const deleteRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const result = await RequestService.deleteRequest(id, req.user._id, req.userRole);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
// #endregion *************************************************************** //

// #region Restaurar Solicitud ************************************************* //
export const restoreRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await RequestService.restoreRequest(id, req.userRole);
    res.status(200).json({ message: 'Solicitud restaurada exitosamente.', solicitud: request });
  } catch (error) {
    next(error);
  }
};
// #endregion *************************************************************** //


// #region ***************** Seccion de busquedas ************************************************* //


// #region Obtener todas las Solicitudes con Paginación y Filtrado ************************************************* //
export const getAllRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, estado, tipoSolicitud } = req.query;
    const filters = {};
    if (estado) filters.estado = estado;
    if (tipoSolicitud) filters.tipoSolicitud = tipoSolicitud;

    const result = await RequestService.getAllRequests(filters, page, limit, req.user._id, req.userRole);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
// #endregion *************************************************************** //

// #region Obtener Solicitud por ID ************************************************* //
export const getRequestById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await RequestService.getRequestById(id, req.user._id, req.userRole);
    res.status(200).json(request);
  } catch (error) {
    next(error);
  }
};
// #endregion *************************************************************** //

// #region Obtener Solicitud por ID Administradores ************************************************* //
export const getRequestIdByAdmin = async (req, res, next) => {
  try {
    const { id } = req.params;
    const request = await RequestService.getRequestIdByAdmin(id);
    res.status(200).json(request);
  } catch (error) {
    next(error);
  }
};
// #endregion *************************************************************** //

// #region Obtener Propia Solicitud ************************************************* //
export const getUserRequests = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, estado, tipoSolicitud } = req.query;
    const filters = {};
    if (estado) filters.estado = estado;
    if (tipoSolicitud) filters.tipoSolicitud = tipoSolicitud;

    const result = await RequestService.getUserRequests(req.user._id, filters, page, limit);
    res.status(200).json(result);
  } catch (error) {
    next(error);
  }
};
// #endregion *************************************************************** //

// #endregion *************************************************************** //