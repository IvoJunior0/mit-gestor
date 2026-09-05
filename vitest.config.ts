import { defineConfig } from "vitest/config";

// Configuração para os testes UNITÁRIOS.
// Não depende de banco de dados: todo acesso ao Prisma é mockado.
export default defineConfig({
    test: {
        include: ["tests/unit/**/*.test.ts"],
        environment: "node",
        globals: false,
        // Alguns módulos leem process.env.JWT_SECRET no import (ex: middlewares).
        // Definimos um valor padrão aqui apenas para os testes unitários.
        env: {
            JWT_SECRET: "segredo-de-teste-unitario",
        },
    },
});
