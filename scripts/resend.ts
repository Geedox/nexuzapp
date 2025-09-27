import { EmailService } from "../src/lib/emailService";
import { config } from "dotenv";
config();

const emailService = new EmailService();

async function main() {
    await emailService.sendWelcomeEmail("adejumoadeyemi32@gmail.com", "Adejumo Adeyemi");
}

main();
