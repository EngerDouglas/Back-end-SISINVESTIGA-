import express from "express";
import {
  createRole,
  updateRole,
  getRoles,
  deleteRole,
  restoreRole,
} from "../controllers/roleController.js";
import { auth, authRole } from "../middlewares/auth.js";
import {
  validateCreateRole,
  validateUpdateRole,
} from "../middlewares/validators.js";

const RolesRouter = express.Router();

// Rutas de los roles
RolesRouter.post(
  "/",
  auth,
  authRole(["Administrador"]),
  validateCreateRole,
  createRole
);
RolesRouter.put(
  "/:id",
  auth,
  authRole(["Administrador"]),
  updateRole,
  validateUpdateRole
);
RolesRouter.put("/:id/restore", auth, authRole(["Administrador"]), restoreRole);

RolesRouter.delete("/:id", auth, authRole(["Administrador"]), deleteRole);
RolesRouter.get("/", auth, authRole(["Administrador"]), getRoles);

export default RolesRouter;
