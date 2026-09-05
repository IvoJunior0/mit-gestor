import { execSync } from "node:child_process";
import path from "node:path";
import dotenv from "dotenv";

/**
 * Roda uma única vez, antes de toda a suíte de integração, em um processo
 * separado. Aplica as migrations do Prisma no banco de testes definido em
 * ".env.test" (DATABASE_URL), garantindo que o schema esteja atualizado
 * antes de qualquer teste começar.
 */
export default async function setup() {
    dotenv.config({ path: path.resolve(__dirname, "../../.env.test") });

    if (!process.env.DATABASE_URL) {
        throw new Error(
            "DATABASE_URL não definida. Copie .env.test.example para .env.test " +
                "e ajuste os valores antes de rodar os testes de integração.",
        );
    }

    console.log("\n[integração] Aplicando migrations no banco de testes...\n");

    execSync("npx prisma migrate deploy", {
        env: process.env,
        stdio: "inherit",
    });
}
