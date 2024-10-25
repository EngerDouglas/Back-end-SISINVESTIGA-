import Audit from "../models/Audit.js";
import geoip from "geoip-lite";
import useragent from "express-useragent";

const methodMappers = {
  "GET": "Fetching",
  "POST": "Adding",
  "PUT": "Updating",
  "PATCH": "Updating",
  "DELETE": "Deleting"
};

// Lista de campos sensibles
const sensitiveFields = ['password', 'token', 'newPassword', 'confirmPassword', 'oldPassword'];

// Función para filtrar campos sensibles
const filterSensitiveData = (obj) => {
  if (!obj || typeof obj !== 'object') return obj;

  // Crear una copia profunda del objeto
  const cleanObj = JSON.parse(JSON.stringify(obj));

  const traverseAndFilter = (currentObj) => {
    for (let key in currentObj) {
      if (sensitiveFields.includes(key)) {
        currentObj[key] = '[FILTERED]';
      } else if (typeof currentObj[key] === 'object' && currentObj[key] !== null) {
        traverseAndFilter(currentObj[key]);
      }
    }
  };

  traverseAndFilter(cleanObj);

  return cleanObj;
};

const getActivityDescription = (req) => {
  const method = methodMappers[req.method] || req.method;
  const resource = req.baseUrl || req.originalUrl.split("?")[0];
  return `${method} ${resource}`;
};

const logAuditTrails = (req, res, next) => {
  try {
    const originalJson = res.json;
    res.json = async function (body) {
      // Filtrar datos sensibles
      const filteredPayload = filterSensitiveData(req.body);
      const filteredResponse = filterSensitiveData(body);

      // Obtener información del usuario autenticado
      const user = req.user ? req.user._id : null;

      const activity = getActivityDescription(req);

      // Obtener la dirección IP del usuario
      const ipAddress = req.headers['x-forwarded-for'] || req.connection.remoteAddress || req.socket.remoteAddress || req.ip;

      // Obtener la ubicación geográfica
      const geo = geoip.lookup(ipAddress);
      const location = geo ? `${geo.city || 'Unknown City'}, ${geo.country || 'Unknown Country'}` : 'Unknown Location';

      // Obtener información del dispositivo
      const ua = useragent.parse(req.headers['user-agent']);
      const device = `${ua.browser} on ${ua.os}`;

      // Crear registro de auditoría
      await Audit.create({
        user,
        method: req.method,
        url: req.originalUrl,
        activity,
        params: req.params,
        query: req.query,
        payload: filteredPayload,
        response: filteredResponse,
        ipAddress,
        location,
        device,
        timestamp: new Date()
      });

      return originalJson.call(this, body);
    }
    next();
  } catch (error) {
    console.error("An error occurred logging audit trail:", error.message);
    next();
  }
}

export {
  logAuditTrails
}