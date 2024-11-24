import * as ReportService from "../services/reportService.js";
import { BadRequestError } from "../utils/errors.js";
import fs from "fs";
import { promises as fsPromises } from "fs";
import { parseISO, isValid } from 'date-fns';

// #region Exportar CSV de Proyectos por el Administrador ************************************************* //
export const exportReportCSV = async (req, res, next) => {
  try {
    const filters = {};

    if (req.query.search) {
      filters.search = req.query.search;
    }
    if (req.query.selectedProjects) {
      filters.projectIds = req.query.selectedProjects.split(',');
    }
    if (req.query.selectedResearchers) {
      filters.researcherIds = req.query.selectedResearchers.split(',');
    }
    if (req.query.startDate) {
      const startDate = parseISO(req.query.startDate);
      if (isValid(startDate)) {
        filters.startDate = startDate;
      }
    }
    if (req.query.endDate) {
      const endDate = parseISO(req.query.endDate);
      if (isValid(endDate)) {
        filters.endDate = endDate;
      }
    }

    const csv = await ReportService.generateProjectsCSV(filters);
    res.header("Content-Type", "text/csv");
    res.attachment(
      ReportService.generateUniqueFilename("Project_Reports", "csv")
    );
    res.status(200).send(csv);
  } catch (error) {
    next(
      new BadRequestError("Error al generar el informe CSV de proyectos", error)
    );
  }
};

// #endregion *************************************************************** //

// #region Exportar PDF de Proyectos por el Administrador ************************************************* //
export const exportReportPDF = async (req, res, next) => {
  try {
    const filters = {};

    if (req.query.search) {
      filters.search = req.query.search;
    }
    if (req.query.selectedProjects) {
      filters.projectIds = req.query.selectedProjects.split(',');
    }
    if (req.query.selectedResearchers) {
      filters.researcherIds = req.query.selectedResearchers.split(',');
    }
    if (req.query.startDate) {
      const startDate = parseISO(req.query.startDate);
      if (isValid(startDate)) {
        filters.startDate = startDate;
      }
    }
    if (req.query.endDate) {
      const endDate = parseISO(req.query.endDate);
      if (isValid(endDate)) {
        filters.endDate = endDate;
      }
    }

    const { filePath, filename } = await ReportService.generateProjectsPDF(filters);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("end", async () => {
      try {
        await fsPromises.unlink(filePath);
      } catch (unlinkError) {
        console.error("Error deleting temporary file:", unlinkError);
      }
    });

    fileStream.on("error", (error) => {
      console.error("Error in file stream:", error);
      next(new BadRequestError("Error al enviar el archivo PDF", error));
    });
  } catch (error) {
    console.error("Error in exportReportPDF:", error);
    next(
      new BadRequestError("Error al generar el informe PDF de proyectos", error)
    );
  }
};

// #endregion *************************************************************** //

// #region Exportar CSV de Evaluaciones por el Administrador ************************************************* //
export const exportReportInvestigatorsCSV = async (req, res, next) => {
  try {
    const filters = {};

    if (req.query.search) {
      filters.search = req.query.search;
    }
    if (req.query.selectedProjects) {
      filters.projectIds = req.query.selectedProjects.split(',');
    }
    if (req.query.selectedResearchers) {
      filters.researcherIds = req.query.selectedResearchers.split(',');
    }
    if (req.query.startDate) {
      const startDate = parseISO(req.query.startDate);
      if (isValid(startDate)) {
        filters.startDate = startDate;
      }
    }
    if (req.query.endDate) {
      const endDate = parseISO(req.query.endDate);
      if (isValid(endDate)) {
        filters.endDate = endDate;
      }
    }

    const csv = await ReportService.generateEvaluationsCSV(filters);
    res.header("Content-Type", "text/csv");
    res.attachment(
      ReportService.generateUniqueFilename("Evaluations_Report", "csv")
    );
    res.status(200).send(csv);
  } catch (error) {
    next(
      new BadRequestError(
        "Error al generar el informe CSV de evaluaciones",
        error
      )
    );
  }
};

// #endregion *************************************************************** //

// #region Exportar PDF de Evaluaciones por el Administrador ************************************************* //
export const exportReportInvestigatorsPDF = async (req, res, next) => {
  try {
    const filters = {};

    if (req.query.search) {
      filters.search = req.query.search;
    }
    if (req.query.selectedProjects) {
      filters.projectIds = req.query.selectedProjects.split(',');
    }
    if (req.query.selectedResearchers) {
      filters.researcherIds = req.query.selectedResearchers.split(',');
    }
    if (req.query.startDate) {
      const startDate = parseISO(req.query.startDate);
      if (isValid(startDate)) {
        filters.startDate = startDate;
      }
    }
    if (req.query.endDate) {
      const endDate = parseISO(req.query.endDate);
      if (isValid(endDate)) {
        filters.endDate = endDate;
      }
    }

    const { filePath, filename } = await ReportService.generateEvaluationsPDF(filters);
    console.log("Evaluations PDF generated successfully:", filePath);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("end", async () => {
      console.log("File stream ended, deleting temporary file");
      try {
        await fsPromises.unlink(filePath);
        console.log("Temporary file deleted");
      } catch (unlinkError) {
        console.error("Error deleting temporary file:", unlinkError);
      }
    });

    fileStream.on("error", (error) => {
      console.error("Error in file stream:", error);
      next(
        new BadRequestError(
          "Error al enviar el archivo PDF de evaluaciones",
          error
        )
      );
    });
  } catch (error) {
    console.error("Error in exportReportInvestigatorsPDF:", error);
    next(
      new BadRequestError(
        "Error al generar el informe PDF de evaluaciones",
        error
      )
    );
  }
};

// #endregion *************************************************************** //

// #region Exportar CSV de Proyectos por el Investigador ************************************************* //
export const exportInvestigatorProjectsCSV = async (req, res, next) => {
  try {
    const csv = await ReportService.generateProjectsCSVForInvestigator(req.user._id);
    res.header("Content-Type", "text/csv");
    res.attachment(
      ReportService.generateUniqueFilename("My_Projects_Report", "csv")
    );
    res.status(200).send(csv);
  } catch (error) {
    next(
      new BadRequestError("Error al generar el informe CSV de mis proyectos", error)
    );
  }
};

// #endregion *************************************************************** //

// #region Exportar PDF de Proyectos por el Investigador ************************************************* //
export const exportInvestigatorProjectsPDF = async (req, res, next) => {
  try {
    const { filePath, filename } = await ReportService.generateProjectsPDFForInvestigator(req.user._id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("end", async () => {
      try {
        await fsPromises.unlink(filePath);
      } catch (unlinkError) {
        console.error("Error deleting temporary file:", unlinkError);
      }
    });

    fileStream.on("error", (error) => {
      console.error("Error in file stream:", error);
      next(new BadRequestError("Error al enviar el archivo PDF de mis proyectos", error));
    });
  } catch (error) {
    console.error("Error in exportInvestigatorProjectsPDF:", error);
    next(
      new BadRequestError("Error al generar el informe PDF de mis proyectos", error)
    );
  }
};

// #endregion *************************************************************** //

// #region Exportar CSV de Evaluaciones por el Investigador ************************************************* //
export const exportInvestigatorEvaluationsCSV = async (req, res, next) => {
  try {
    const csv = await ReportService.generateEvaluationsCSVForInvestigator(req.user._id);
    res.header("Content-Type", "text/csv");
    res.attachment(
      ReportService.generateUniqueFilename("My_Projects_Evaluations_Report", "csv")
    );
    res.status(200).send(csv);
  } catch (error) {
    next(
      new BadRequestError(
        "Error al generar el informe CSV de evaluaciones de mis proyectos",
        error
      )
    );
  }
};

// #endregion *************************************************************** //

// #region Exportar PDF de Evaluaciones por el Investigador ************************************************* //
export const exportInvestigatorEvaluationsPDF = async (req, res, next) => {
  try {
    const { filePath, filename } = await ReportService.generateEvaluationsPDFForInvestigator(req.user._id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    fileStream.on("end", async () => {
      try {
        await fsPromises.unlink(filePath);
      } catch (unlinkError) {
        console.error("Error deleting temporary file:", unlinkError);
      }
    });

    fileStream.on("error", (error) => {
      console.error("Error in file stream:", error);
      next(
        new BadRequestError(
          "Error al enviar el archivo PDF de evaluaciones de mis proyectos",
          error
        )
      );
    });
  } catch (error) {
    console.error("Error in exportInvestigatorEvaluationsPDF:", error);
    next(
      new BadRequestError(
        "Error al generar el informe PDF de evaluaciones de mis proyectos",
        error
      )
    );
  }
};

// #endregion *************************************************************** //