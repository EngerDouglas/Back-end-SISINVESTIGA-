import * as ReportService from "../services/reportService.js";
import { BadRequestError } from "../utils/errors.js";
import fs from "fs";
import { promises as fsPromises } from "fs";

// Administrator controllers
export const exportReportCSV = async (req, res, next) => {
  try {
    const csv = await ReportService.generateProjectsCSV();
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

export const exportReportPDF = async (req, res, next) => {
  try {
    const { filePath, filename } = await ReportService.generateProjectsPDF();

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

export const exportReportInvestigatorsCSV = async (req, res, next) => {
  try {
    const csv = await ReportService.generateEvaluationsCSV();
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

export const exportReportInvestigatorsPDF = async (req, res, next) => {
  try {
    const { filePath, filename } = await ReportService.generateEvaluationsPDF();
    console.log("Investigators PDF generated successfully:", filePath);

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

// Investigator controllers
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