import mongoose from 'mongoose';
import Project from '../models/Project.js';  // Asumiendo que ya tienes un modelo Proyecto
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
      nombre, // Cambiamos de titulo a nombre ya que eso está en el body
      descripcion,
      objetivos,
      presupuesto,
      investigadores = [], // Si no hay investigadores en el body, se inicializa como un arreglo vacío
      cronograma,
      hitos,
      recursos,
      estado,
    } = req.body;

    // Validar que `cronograma` tenga las fechas obligatorias
    if (!cronograma || !cronograma.fechaInicio || !cronograma.fechaFin) {
      return res.status(400).json({
        error: 'El cronograma debe incluir fechaInicio y fechaFin',
      });
    }

    // Validar que cada hito tenga nombre y fecha
    if (!hitos || hitos.length === 0) {
      return res.status(400).json({
        error: 'Al menos un hito es obligatorio con nombre y fecha',
      });
    }

    hitos.forEach((hito, index) => {
      if (!hito.nombre || !hito.fecha) {
        return res.status(400).json({
          error: `El hito en la posición ${index + 1} debe tener un nombre y una fecha`,
        });
      }
    });

    // Verificar si ya existe un proyecto con el mismo nombre
    const existingProyecto = await Project.findOne({ nombre });
    if (existingProyecto) {
      return res.status(400).json({ error: 'Ya existe un proyecto con ese nombre' });
    }

    // Añadir al creador del proyecto (usuario autenticado) a la lista de investigadores
    const investigadoresFinal = [...investigadores, req.user._id];

    // Crear nuevo proyecto
    const newProyecto = new Project({
      nombre, // Usamos 'nombre' en lugar de 'titulo'
      descripcion,
      objetivos,
      cronograma: {
        fechaInicio: cronograma.fechaInicio,
        fechaFin: cronograma.fechaFin,
      },
      presupuesto,
      investigadores: investigadoresFinal, // Asignamos los investigadores incluyendo al creador
      hitos: hitos.map((hito) => ({
        nombre: hito.nombre,
        fecha: hito.fecha,
        entregables: hito.entregable ? [hito.entregable] : [], // Convertir 'entregable' en un arreglo
      })),
      recursos,
      estado,
    });

    // Guardar en la base de datos
    await newProyecto.save();

    res.status(201).json({
      message: 'Proyecto creado exitosamente',
      proyecto: newProyecto,
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
    const proyecto = await Project.findById(id);

    if (!proyecto || proyecto.isDeleted) {
      return res.status(404).json({ error: 'Proyecto no encontrado o eliminado' });
    }

    // Verificar que el usuario tenga permisos para actualizar el proyecto
    if (req.userRole !== 'Administrador' && !proyecto.investigadores.includes(req.user._id)) {
      return res.status(403).json({ error: 'No tienes permisos para actualizar este proyecto' });
    }

    // Soft Delete: Verificar si el proyecto está marcado para eliminar
    if (updates.isDeleted) {
      proyecto.isDeleted = true;
    }

    // Verificar si ya existe un proyecto con el mismo nombre (excluyendo el actual)
    if (updates.nombre) {
      const existingProyecto = await Project.findOne({ nombre: updates.nombre, _id: { $ne: id } });
      if (existingProyecto) {
        return res.status(400).json({ error: 'Ya existe un proyecto con ese nombre' });
      }
    }

    // Campos permitidos para actualizar
    const allowedUpdates = [
      'nombre',
      'descripcion',
      'objetivos',
      'presupuesto',
      'cronograma',
      'hitos',
      'investigadores',
      'recursos',
      'estado'
    ];

    // Actualizar solo los campos permitidos
    allowedUpdates.forEach((field) => {
      if (updates[field] !== undefined) {
        if (field === 'hitos') {
          proyecto.hitos = updates.hitos.map(hito => ({
            nombre: hito.nombre,
            fecha: hito.fecha,
            entregables: hito.entregable ? [hito.entregable] : []
          }));
        } else if (field === 'cronograma') {
          proyecto.cronograma = {
            fechaInicio: updates.cronograma.fechaInicio,
            fechaFin: updates.cronograma.fechaFin
          };
        } else {
          proyecto[field] = updates[field];
        }
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
    const proyecto = await Project.findById(id);
    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Verificar permisos del usuario (Administrador o Investigador asignado al proyecto)
    const isInvestigador = proyecto.investigadores.some(investigadorId => investigadorId.equals(req.user._id));
    const isAdmin = req.userRole === 'Administrador';

    if (!isInvestigador && !isAdmin) {
      return res.status(403).json({ error: 'No tienes permisos para eliminar este proyecto.' });
    }

    // Si el proyecto está en estado 'Finalizado' o 'Cancelado', solo el administrador puede eliminarlo
    if ((proyecto.estado === 'Finalizado' || proyecto.estado === 'Cancelado') && !isAdmin) {
      return res.status(400).json({ error: 'Solo los administradores pueden eliminar proyectos en estado finalizado o cancelado.' });
    }

    // Soft delete: Marcar el proyecto como eliminado
    proyecto.isDeleted = true;
    await proyecto.save();

    res.status(200).json({ message: 'Proyecto eliminado (soft delete).' });
  } catch (error) {
    next(error);
  }
};

// **************************** END ************************************************ //

// **************************** Restaurar Proyecto (Revertir Soft Delete) ************************************************* //

export const restoreProyecto = async (req, res) => {
  const { id } = req.params;

  try {
    // Verificar si el proyecto existe y está eliminado
    const proyecto = await Project.findById(id);
    if (!proyecto || !proyecto.isDeleted) {
      return res.status(404).json({ error: 'Proyecto no encontrado o no está eliminado.' });
    }

    // Solo los administradores pueden restaurar proyectos
    if (req.userRole !== 'Administrador') {
      return res.status(403).json({ error: 'No tienes permisos para restaurar este proyecto.' });
    }

    // Restaurar el proyecto (quitar el estado isDeleted)
    proyecto.isDeleted = false;
    await proyecto.save();

    res.status(200).json({ message: 'Proyecto restaurado exitosamente.' });
  } catch (error) {
    res.status(500).json({ message: 'Error al restaurar el proyecto.', error: error.message });
  }
};

// **************************** END ************************************************ //

// **************************** Seccion de busquedas ************************************************* //

// **************************** Obtener todos los Proyectos con Paginación y Filtrado ************************************************* //
export const getAllProyectos = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, estado, nombre } = req.query;

    // Filtros básicos
    const filter = {};
    if (estado) filter.estado = estado;
    if (nombre) filter.nombre = new RegExp(nombre, 'i'); // Búsqueda por texto en 'nombre'

    // Paginación
    const proyectos = await Project.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('investigadores', 'nombre apellido')
      .populate({
        path: 'evaluaciones',
        match: { isDeleted: false },
        populate: { path: 'evaluator', select: 'nombre apellido email' },
      });

    res.status(200).json(proyectos);
  } catch (error) {
    res.status(500).json({ message: 'Error al obtener los proyectos', error: error.message });
  }
};
// **************************** END ************************************************ //


// **************************** Obtener Proyecto por ID ************************************************* //
export const getProyectoById = async (req, res, next) => {
  const { id } = req.params;

  try {
    const proyecto = await Project.findById(id)
    .populate('investigadores', 'nombre apellido especializacion responsabilidades fotoPerfil')
    .populate({
      path: 'evaluaciones',
      match: { isDeleted: false },
      populate: { path: 'evaluator', select: 'nombre apellido email' },
    });

    if (!proyecto || proyecto.isDeleted) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    res.status(200).json(proyecto);
  } catch (error) {
    next(error);
  }
};
// **************************** END ************************************************ //

// **************************** Obtener Proyectos propios ************************************************* //
export const getUserProyectos = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // Buscar proyectos en los que el usuario es investigador
    const proyectos = await Project.find({ investigadores: req.user._id, isDeleted: false })
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('investigadores', 'nombre apellido')
      .populate({
        path: 'evaluaciones',
        match: { isDeleted: false },
        populate: { path: 'evaluator', select: 'nombre apellido email' },
      });

    // Contar total de proyectos
    const totalProyectos = await Project.countDocuments({
      investigadores: req.user._id,
      isDeleted: false,
    });

    // Respuesta estándar
    res.status(200).json({
      total: totalProyectos,
      page: Number(page),
      limit: Number(limit),
      data: proyectos.length ? proyectos : [],
    });
  } catch (error) {
    res.status(500).json({
      message: "Error al obtener los proyectos del usuario",
      error: error.message,
    });
  }
};
// **************************** END ************************************************ //

// **************************** Búsqueda avanzada por texto completo ************************************************* //
export const searchProyectos = async (req, res, next) => {
  const { query } = req.query;

  try {
    // Búsqueda por texto completo (nombre y descripción)
    const proyectos = await Project.find({
      $text: { $search: query }
    }).populate('investigadores', 'nombre apellido')
    .populate({
      path: 'evaluaciones',
      match: { isDeleted: false },
      populate: { path: 'evaluator', select: 'nombre apellido email' },
    });

    if (proyectos.length === 0) {
      return res.status(404).json({ error: 'No se encontraron proyectos que coincidan con la búsqueda' });
    }

    res.status(200).json(proyectos);
  } catch (error) {
    next(error);
  }
};
// **************************** END ************************************************ //
