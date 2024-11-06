import Audit from "../models/Audit.js";
import User from "../models/User.js";

class AuditService {
  static async getAuditLogs(filters = {}, page = 1, limit = 10) {
    page = parseInt(page, 10);
    limit = parseInt(limit, 10);

    const query = {};

    // Filtro por usuario
    if (filters.user) {
      const userRegex = new RegExp(filters.user, 'i');
      const users = await User.find({
        $or: [
          { nombre: userRegex },
          { apellido: userRegex },
          { email: userRegex }
        ]
      }).select('_id');
      const userIds = users.map(user => user._id);
      query.user = { $in: userIds };
    }

    // Filtro por actividad (busca coincidencias en el campo 'activity')
    if (filters.activity) {
      query.activity = { $regex: filters.activity, $options: "i" };
    }

    // Filtro por método HTTP
    if (filters.method) {
      query.method = filters.method.toUpperCase();
    }

    // Filtro por rango de fechas
    if (filters.startDate || filters.endDate) {
      query.timestamp = {};
      if (filters.startDate) {
        query.timestamp.$gte = new Date(filters.startDate);
      }
      if (filters.endDate) {
        query.timestamp.$lte = new Date(filters.endDate);
      }
    }

    // Contar el total de registros que cumplen los filtros
    const total = await Audit.countDocuments(query);

    // Obtener los registros paginados y ordenados (más recientes primero)
    const logs = await Audit.find(query)
      .select('-payload -response') // Excluir campos grandes si es necesario
      .sort({ timestamp: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: 'user',
        select: 'nombre apellido email role',
        populate: {
          path: 'role',
          select: 'roleName' 
        }
      })
      .lean();

    return {
      logs,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export default AuditService;