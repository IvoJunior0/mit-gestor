import { z } from "zod";

export const criarManutencaoSchema = z.object({
    tipo: z.enum(["PREVENTIVA", "CORRETIVA"]),
    descricao: z.string().min(3),
    dataInicio: z.coerce.date(),
    dataFim: z.coerce.date().optional(),
    custo: z.number().min(0).optional(),
    maquinaId: z.string(),
    ordemServicoId: z.string().optional(),
});

export const atualizarManutencaoSchema = z.object({
    descricao: z.string().min(3).optional(),
    dataInicio: z.coerce.date().optional(),
    dataFim: z.coerce.date().nullable().optional(),
    custo: z.number().min(0).optional(),
});
