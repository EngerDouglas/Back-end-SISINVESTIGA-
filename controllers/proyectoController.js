import Proyecto from '../models/Proyecto.js';  // Asumiendo que ya tienes un modelo Proyecto
import { validationResult } from 'express-validator';

// **************************** Crear Proyecto ************************************************* //
export const createProyecto = async (req, res, next) => {
  try {
    // Validar errores usando express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      titulo,
      descripcion,
      fechaInicio,
      fechaFin,
      presupuesto,
      investigadores,
      hitos,
      entregables
    } = req.body;

    // Validar que el usuario tenga permisos para crear proyectos (ej: administrador o investigador)
    if (!req.user || req.user.role !== 'Administrador' || 'investigador') {
      return res.status(403).json({ error: 'No tienes permisos para crear proyectos' });
    }

    const newProyecto = new Proyecto({
      titulo,
      descripcion,
      fechaInicio,
      fechaFin,
      presupuesto,
      investigadores: [req.user._id], // El creador del proyecto es el investigador principal
      hitos,
      entregables
    });

    await newProyecto.save();

    res.status(201).json({
      message: 'Proyecto creado exitosamente',
      proyecto: newProyecto
    });
  } catch (error) {
    next(error); // Utilizamos un middleware centralizado para manejar errores
  }
};
// **************************** END ************************************************ //


// **************************** Actualizar Proyecto ************************************************* //
export const updateProyecto = async (req, res, next) => {
  const { id } = req.params;
  const updates = req.body;

  try {
    // Validar errores usando express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Revisar si el proyecto existe
    const proyecto = await Proyecto.findById(id);
    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Verificar que el usuario tenga permisos para actualizar el proyecto
    if (req.user.role !== 'Administrador' && !proyecto.investigadores.includes(req.user._id)) {
      return res.status(403).json({ error: 'No tienes permisos para actualizar este proyecto' });
    }

    // Soft Delete: Verificar si el proyecto está marcado para eliminar
    if (updates.isDeleted) {
      proyecto.isDeleted = true;
    }

    // Campos permitidos para actualizar
    const allowedUpdates = [
      'titulo',
      'descripcion',
      'fechaInicio',
      'fechaFin',
      'presupuesto',
      'hitos',
      'entregables',
      'investigadores'
    ];

    // Actualizar solo los campos permitidos
    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        proyecto[field] = updates[field];
      }
    });

    // Guardamos el proyecto actualizado
    await proyecto.save();
    res.status(200).json({
      message: 'Proyecto actualizado correctamente',
      proyecto
    });
  } catch (error) {
    next(error);
  }
};
// **************************** END ************************************************ //


// **************************** Eliminar Proyecto (Soft Delete) ************************************************* //
export const deleteProyecto = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Verificar si el proyecto existe
    const proyecto = await Proyecto.findById(id);
    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Verificar permisos del usuario
    if (req.user.role !== 'Administrador' && !proyecto.investigadores.includes(req.user._id)) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este proyecto' });
    }

    // Soft delete: Marcar el proyecto como eliminado
    proyecto.isDeleted = true;
    await proyecto.save();

    res.status(200).json({ message: 'Proyecto eliminado (soft delete)' });
  } catch (error) {
    next(error);
  }
};
// **************************** END ************************************************ //


// **************************** Obtener todos los Proyectos con Paginación y Filtrado ************************************************* //
export const getAllProyectos = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, estado, titulo } = req.query;

    // Filtros básicos
    const filter = { isDeleted: false };
    if (estado) filter.estado = estado;
    if (titulo) filter.titulo = new RegExp(titulo, 'i'); // Búsqueda por texto

    // Paginación
    const proyectos = await Proyecto.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('investigadores', 'nombre apellido');

    res.status(200).json(proyectos);
  } catch (error) {
    next(error);
  }
};
// **************************** END ************************************************ //


// **************************** Obtener Proyecto por ID ************************************************* //
export const getProyectoById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const proyecto = await Proyecto.findById(id).populate('investigadores', 'nombre apellido');
    if (!proyecto || proyecto.isDeleted) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    res.status(200).json(proyecto);
  } catch (error) {
    next(error);
  }
};
// **************************** END ************************************************ //


// **************************** Búsqueda avanzada por texto completo ************************************************* //
export const searchProyectos = async (req, res, next) => {
  const { query } = req.query;

  try {
    // Búsqueda por texto completo (titulo y descripción)
    const proyectos = await Proyecto.find({
      $text: { $search: query },
      isDeleted: false
    }).populate('investigadores', 'nombre apellido');

    if (proyectos.length === 0) {
      return res.status(404).json({ error: 'No se encontraron proyectos que coincidan con la búsqueda' });
    }

    res.status(200).json(proyectos);
  } catch (error) {
    next(error);
  }
};
// **************************** END ************************************************ //
