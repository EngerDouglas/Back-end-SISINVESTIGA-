import nodemailer from "nodemailer";
import nodemailerExpressHandlebars from "nodemailer-express-handlebars";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class EmailService {
  constructor() {
    this.transporter = null;
  }

  initialize() {
    try {
      this.transporter = nodemailer.createTransport({
        service: "gmail",
        host: "smtp.gmail.com",
        port: 587,
        auth: {
          user: process.env.MAIL_USERNAME,
          pass: process.env.MAIL_PASSWORD,
        },
        pool: true,
        maxConnections: 5,
        maxMessages: 50,
      });

      const viewPath = path.resolve(__dirname, "../templates");

      const handlebarOptions = {
        viewEngine: {
          extName: ".hbs",
          partialsDir: viewPath,
          layoutsDir: viewPath,
          defaultLayout: false,
        },
        viewPath: viewPath,
        extName: ".hbs",
      };

      this.transporter.use(
        "compile",
        nodemailerExpressHandlebars(handlebarOptions)
      );
    } catch (error) {
      throw error;
    }
  }

  async sendMail(email, subject, templateName, context) {
    if (!this.transporter) {
      throw new Error("Email service not initialized");
    }

    const cssFilePath = path.resolve(
      __dirname,
      "../templates/assets/css/styles.css"
    );
    const css = fs.readFileSync(cssFilePath, "utf8");

    context.css = css;

    // Agregar la imagen como adjunto con un Content-ID (CID)
    const logoFilePath = path.resolve(
      __dirname,
      "../templates/assets/img/LogoWebUCSD.png"
    );

    const mailOptions = {
      from: process.env.MAIL_USERNAME,
      to: email,
      subject: subject,
      template: templateName,
      context: context,
      attachments: [
        {
          filename: "LogoWebUCSD.png",
          path: logoFilePath,
          cid: "logo@ucsd", // CID que usaremos en el HTML
        },
      ],
    };

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log("Email sent: ", info.response);
      return info;
    } catch (error) {
      console.error("Error sending email: ", error);
      throw error;
    }
  }

  // *********************** Envio de Notificaciones de Login ******************* //

  async sendLoginNotification(user, loginInfo) {
    const context = {
      userName: `${user.nombre} ${user.apellido}`,
      location: loginInfo.location || "Ubicación desconocida",
      ipAddress: loginInfo.ipAddress || "IP desconocida",
      device: loginInfo.device || "Dispositivo desconocido",
      year: new Date().getFullYear(),
    };

    return this.sendMail(
      user.email,
      "Notificación de Inicio de Sesión",
      "login_notification",
      context
    );
  }

  // *********************** END ******************* //

  // *********************** Envio de Notificaciones de Registro ******************* //
  async sendRegistrationConfirmation(user) {
    const context = {
      userName: `${user.nombre} ${user.apellido}`,
      userEmail: user.email,
      year: new Date().getFullYear(),
    };

    return this.sendMail(
      user.email,
      "Bienvenido a SISINVESTIGA",
      "register_account",
      context
    );
  }

  // *********************** END ******************* //

  // *********************** Envio de Notificaciones de Olvide Contraseña ******************* //
  async sendForgotPasswordEmail(user, resetLink) {
    const context = {
      userName: `${user.nombre} ${user.apellido}`,
      resetLink: resetLink,
      year: new Date().getFullYear(),
    };

    return this.sendMail(
      user.email,
      "Restablecimiento de Contraseña - SISINVESTIGA",
      "forgot_password",
      context
    );
  }
  // *********************** END ******************* //

  // *********************** Envio de Notificaciones de Confirmar Reseteo de Contraseña ******************* //
  async sendResetPasswordConfirmationEmail(user) {
    const context = {
      userName: `${user.nombre} ${user.apellido}`,
      year: new Date().getFullYear(),
    };

    return this.sendMail(
      user.email,
      "Confirmación de Restablecimiento de Contraseña - SISINVESTIGA",
      "reset_password",
      context
    );
  }
    // *********************** END ******************* //
}

export default new EmailService();
