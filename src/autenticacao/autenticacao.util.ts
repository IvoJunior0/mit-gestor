import crypto from "node:crypto";

export function gerarRefreshToken(): string {
    return crypto.randomBytes(64).toString("hex");
}

export function gerarHashToken(token: string): string {
    return crypto.createHash("sha256").update(token).digest("hex");
}
