import { z } from "zod";

export const criarManutencaoSchema = z.object({
    tipo: z.enum(["PREVENTIVA", "CORRETIVA"]),
    descricao: z.string().min(3),
    realizadaEm: z.coerce.date().optional(),
    proximaManutencao: z.coerce.date().optional(),
    maquinaId: z.string(),
    ordemServicoId: z.string().optional(),
});

export const atualizarManutencaoSchema = z.object({
    descricao: z.string().min(3).optional(),
    realizadaEm: z.coerce.date().optional(),
    proximaManutencao: z.coerce.date().nullable().optional(),
});