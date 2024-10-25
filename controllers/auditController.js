import AuditService from "../services/auditService.js";

// #region Obtener Registros de Auditoría

export const getAuditLogs = async (req, res, next) => {
  try {
    // Obtener los parámetros de consulta (query params)
    const { page = 1, limit = 10, user, activity, method, startDate, endDate } = req.query;

    // Construir los filtros
    const filters = {
      user,
      activity,
      method,
      startDate,
      endDate,
    };

    const auditData = await AuditService.getAuditLogs(filters, page, limit);

    res.status(200).json(auditData);
  } catch (error) {
    next(error);
  }
}

// #endregion