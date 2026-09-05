import { describe, expect, it } from "vitest";
import {
    gerarRefreshToken,
    gerarHashToken,
} from "../../../src/autenticacao/autenticacao.util";

describe("gerarRefreshToken", () => {
    it("deve gerar uma string hexadecimal de 128 caracteres (64 bytes)", () => {
        const token = gerarRefreshToken();

        expect(token).toMatch(/^[a-f0-9]{128}$/);
    });

    it("deve gerar tokens diferentes em chamadas sucessivas", () => {
        const token1 = gerarRefreshToken();
        const token2 = gerarRefreshToken();

        expect(token1).not.toBe(token2);
    });
});

describe("gerarHashToken", () => {
    it("deve gerar um hash SHA-256 (64 caracteres hexadecimais)", () => {
        const hash = gerarHashToken("token-qualquer");

        expect(hash).toMatch(/^[a-f0-9]{64}$/);
    });

    it("deve ser determinístico para a mesma entrada", () => {
        const hash1 = gerarHashToken("mesmo-token");
        const hash2 = gerarHashToken("mesmo-token");

        expect(hash1).toBe(hash2);
    });

    it("deve gerar hashes diferentes para entradas diferentes", () => {
        const hash1 = gerarHashToken("token-a");
        const hash2 = gerarHashToken("token-b");

        expect(hash1).not.toBe(hash2);
    });
});
