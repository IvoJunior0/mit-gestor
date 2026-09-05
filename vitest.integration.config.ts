import { defineConfig } from "vitest/config";
import dotenv from "dotenv";
import path from "node:path";

// Carrega as variáveis do banco de testes (.env.test) para este processo
// ANTES de repassá-las para os processos de teste via `test.env`.
dotenv.config({ path: path.resolve(__dirname, ".env.test") });

// Configuração para os testes de INTEGRAÇÃO.
// Sobem contra um Postgres real (ver docker-compose.yml) e exercitam a
// aplicação Express de ponta a ponta com supertest.
export default defineConfig({
    test: {
        include: ["tests/integration/**/*.test.ts"],
        environment: "node",
        globals: false,
        env: {
            DATABASE_URL: process.env.DATABASE_URL as string,
            JWT_SECRET: process.env.JWT_SECRET as string,
            PORT: process.env.PORT ?? "3001",
        },
        // Roda as migrations uma única vez antes de toda a suíte.
        globalSetup: ["./tests/integration/global-setup.ts"],
        // Os testes compartilham o mesmo banco e limpam as tabelas entre
        // execuções, então rodamos em um único processo/sequencialmente
        // para evitar condições de corrida entre arquivos de teste.
        pool: "forks",
        poolOptions: {
            forks: {
                singleFork: true,
            },
        },
        fileParallelism: false,
        testTimeout: 30_000,
        hookTimeout: 30_000,
    },
});
