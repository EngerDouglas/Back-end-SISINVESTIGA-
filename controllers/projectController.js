import mongoose from 'mongoose';
import Project from '../models/Project.js';  // Asumiendo que ya tienes un modelo Proyecto
import { validationResult } from 'express-validator';
<<<<<<< HEAD

=======
>>>>>>> 97bcc74 (create project fix)
// **************************** Crear Proyecto ************************************************* //
export const createProyecto = async (req, res, next) => {
  try {
    // Validar errores usando express-validator
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
<<<<<<< HEAD
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

    const newProyecto = new Project({
      titulo,
      descripcion,
      fechaInicio,
      fechaFin,
      presupuesto,
      investigadores: [req.user._id], // El creador del proyecto es el investigador principal
      hitos,
      entregables
    });

=======
      nombre, // Cambiamos de titulo a nombre ya que eso está en el body
      descripcion,
      objetivos,
      presupuesto,
      investigadores,
      cronograma,
      hitos,
      recursos,
      estado
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

    // Crear nuevo proyecto
    const newProyecto = new Project({
      nombre,  // Usamos 'nombre' en lugar de 'titulo'
      descripcion,
      objetivos,
      cronograma: {
        fechaInicio: cronograma.fechaInicio,
        fechaFin: cronograma.fechaFin,
      },
      presupuesto,
      investigadores,
      hitos: hitos.map(hito => ({
        nombre: hito.nombre,
        fecha: hito.fecha,
        entregables: hito.entregable ? [hito.entregable] : [] // Convertir 'entregable' en un arreglo
      })),
      recursos,
      estado
    });

    // Guardar en la base de datos
>>>>>>> 97bcc74 (create project fix)
    await newProyecto.save();

    res.status(201).json({
      message: 'Proyecto creado exitosamente',
      proyecto: newProyecto
    });
  } catch (error) {
<<<<<<< HEAD
    next(error); // Utilizamos un middleware centralizado para manejar errores
  }
};
// **************************** END ************************************************ //

=======
    next(error);
  }
};
// **************************** END ***************************************
>>>>>>> 97bcc74 (create project fix)

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
<<<<<<< HEAD
    if (!proyecto) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
=======
    if (!proyecto || proyecto.isDeleted) {
      return res.status(404).json({ error: 'Proyecto no encontrado o eliminado' });
>>>>>>> 97bcc74 (create project fix)
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
<<<<<<< HEAD
        proyecto[field] = updates[field];
=======
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
>>>>>>> 97bcc74 (create project fix)
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

<<<<<<< HEAD

=======
>>>>>>> 97bcc74 (create project fix)
// **************************** Eliminar Proyecto (Soft Delete) ************************************************* //
export const deleteProyecto = async (req, res, next) => {
  const { id } = req.params;

  try {
    // Verificar si el proyecto existe
    const proyecto = await Project.findById(id);
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
    const { page = 1, limit = 10, estado, nombre } = req.query;

    // Filtros básicos
    const filter = {};
    if (estado) filter.estado = estado;
    if (nombre) filter.nombre = new RegExp(nombre, 'i'); // Búsqueda por texto en 'nombre'

    // Paginación
    const proyectos = await Project.find(filter)
      .skip((page - 1) * limit)
      .limit(Number(limit))
      .populate('investigadores', 'nombre apellido');

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
    const proyecto = await Project.findById(id).populate('investigadores', 'nombre apellido');
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
    // Búsqueda por texto completo (nombre y descripción)
    const proyectos = await Project.find({
      $text: { $search: query }
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
