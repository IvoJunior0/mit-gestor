import { describe, expect, it, vi, beforeEach } from "vitest";
import {
    criarOrdemServico,
    atualizarOrdemServico,
    deletarOrdemServico,
    adicionarPecaNaOrdemServico,
    atualizarStatusOrdemServico,
} from "../../../src/ordens-servico/ordem-servico.servico";
import { prisma } from "../../../src/prisma";

vi.mock("../../../src/prisma", () => ({
    prisma: {
        maquina: {
            findUnique: vi.fn(),
            update: vi.fn(),
        },
        ordemServico: {
            findUnique: vi.fn(),
            findFirst: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
            delete: vi.fn(),
        },
        usuario: {
            findUnique: vi.fn(),
        },
        peca: {
            findUnique: vi.fn(),
            updateMany: vi.fn(),
        },
        itemOrdemServico: {
            findUnique: vi.fn(),
            create: vi.fn(),
            update: vi.fn(),
        },
        $transaction: vi.fn(),
    },
}));

beforeEach(() => {
    vi.clearAllMocks();
});

describe("criarOrdemServico", () => {
    it("deve rejeitar quando a máquina não existe", async () => {
        vi.mocked(prisma.maquina.findUnique).mockResolvedValue(null);

        await expect(
            criarOrdemServico({
                descricao: "Teste",
                prioridade: "MEDIA",
                maquinaId: "maquina-inexistente",
            }),
        ).rejects.toThrow("Máquina não encontrada");
    });

    it("deve rejeitar quando a máquina já possui uma OS ativa", async () => {
        vi.mocked(prisma.maquina.findUnique).mockResolvedValue({
            id: "maquina-1",
        } as any);

        vi.mocked(prisma.ordemServico.findFirst).mockResolvedValue({
            id: "os-1",
            maquinaId: "maquina-1",
            status: "EM_ANDAMENTO",
        } as any);

        await expect(
            criarOrdemServico({
                descricao: "Troca de rolamento",
                prioridade: "ALTA",
                maquinaId: "maquina-1",
            }),
        ).rejects.toThrow(
            "A máquina já possui uma ordem de serviço em andamento.",
        );
    });

    it("deve permitir criar OS quando a máquina não possui OS ativa", async () => {
        vi.mocked(prisma.maquina.findUnique).mockResolvedValue({
            id: "maquina-1",
        } as any);

        vi.mocked(prisma.ordemServico.findFirst).mockResolvedValue(null);

        vi.mocked(prisma.ordemServico.create).mockResolvedValue({
            id: "os-1",
            descricao: "Troca de rolamento",
            prioridade: "ALTA",
            status: "ABERTA",
            maquinaId: "maquina-1",
        } as any);

        const resultado = await criarOrdemServico({
            descricao: "Troca de rolamento",
            prioridade: "ALTA",
            maquinaId: "maquina-1",
        });

        expect(resultado).toEqual(
            expect.objectContaining({
                id: "os-1",
                descricao: "Troca de rolamento",
            }),
        );

        expect(prisma.ordemServico.create).toHaveBeenCalled();
    });

    it("deve rejeitar quando o técnico não existe", async () => {
        vi.mocked(prisma.maquina.findUnique).mockResolvedValue({
            id: "maquina-1",
        } as any);

        vi.mocked(prisma.ordemServico.findFirst).mockResolvedValue(null);

        vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null);

        await expect(
            criarOrdemServico({
                descricao: "Manutenção",
                prioridade: "MEDIA",
                maquinaId: "maquina-1",
                tecnicoResponsavelId: "tecnico-inexistente",
            }),
        ).rejects.toThrow("Técnico não encontrado.");
    });

    it("deve rejeitar quando o usuário informado não é técnico", async () => {
        vi.mocked(prisma.maquina.findUnique).mockResolvedValue({
            id: "maquina-1",
        } as any);

        vi.mocked(prisma.ordemServico.findFirst).mockResolvedValue(null);

        vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
            id: "usuario-1",
            tipo: "GESTOR",
        } as any);

        await expect(
            criarOrdemServico({
                descricao: "Manutenção",
                prioridade: "MEDIA",
                maquinaId: "maquina-1",
                tecnicoResponsavelId: "usuario-1",
            }),
        ).rejects.toThrow("O usuário informado não possui o tipo TECNICO.");
    });

    it("deve permitir criar OS com técnico válido", async () => {
        vi.mocked(prisma.maquina.findUnique).mockResolvedValue({
            id: "maquina-1",
        } as any);

        vi.mocked(prisma.ordemServico.findFirst).mockResolvedValue(null);

        vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
            id: "tecnico-1",
            tipo: "TECNICO",
        } as any);

        vi.mocked(prisma.ordemServico.create).mockResolvedValue({
            id: "os-1",
            maquinaId: "maquina-1",
            tecnicoResponsavelId: "tecnico-1",
            status: "ABERTA",
        } as any);

        const resultado = await criarOrdemServico({
            descricao: "Manutenção",
            prioridade: "MEDIA",
            maquinaId: "maquina-1",
            tecnicoResponsavelId: "tecnico-1",
        });

        expect(resultado).toEqual(
            expect.objectContaining({
                tecnicoResponsavelId: "tecnico-1",
            }),
        );
    });
});

describe("atualizarOrdemServico", () => {
    it("deve rejeitar quando a OS não existe", async () => {
        vi.mocked(prisma.ordemServico.findUnique).mockResolvedValue(null);

        await expect(
            atualizarOrdemServico("os-inexistente", {
                descricao: "Nova descrição",
            }),
        ).rejects.toThrow("Ordem de serviço não encontrada");
    });

    it("deve rejeitar quando o novo técnico não existe", async () => {
        vi.mocked(prisma.ordemServico.findUnique).mockResolvedValue({
            id: "os-1",
            tecnicoResponsavelId: null,
        } as any);

        vi.mocked(prisma.usuario.findUnique).mockResolvedValue(null);

        await expect(
            atualizarOrdemServico("os-1", {
                tecnicoResponsavelId: "tecnico-inexistente",
            }),
        ).rejects.toThrow("Técnico não encontrado.");
    });

    it("deve rejeitar quando o novo técnico não possui tipo TECNICO", async () => {
        vi.mocked(prisma.ordemServico.findUnique).mockResolvedValue({
            id: "os-1",
        } as any);

        vi.mocked(prisma.usuario.findUnique).mockResolvedValue({
            id: "usuario-1",
            tipo: "OPERADOR",
        } as any);

        await expect(
            atualizarOrdemServico("os-1", {
                tecnicoResponsavelId: "usuario-1",
            }),
        ).rejects.toThrow("O usuário informado não possui o tipo TECNICO.");
    });

    it("deve atualizar uma OS existente", async () => {
        vi.mocked(prisma.ordemServico.findUnique).mockResolvedValue({
            id: "os-1",
            descricao: "Descrição antiga",
        } as any);

        vi.mocked(prisma.ordemServico.update).mockResolvedValue({
            id: "os-1",
            descricao: "Descrição nova",
        } as any);

        const resultado = await atualizarOrdemServico("os-1", {
            descricao: "Descrição nova",
        });

        expect(resultado).toEqual(
            expect.objectContaining({
                descricao: "Descrição nova",
            }),
        );

        expect(prisma.ordemServico.update).toHaveBeenCalled();
    });
});

describe("deletarOrdemServico", () => {
    it("deve rejeitar quando a OS não existe", async () => {
        vi.mocked(prisma.ordemServico.findUnique).mockResolvedValue(null);

        await expect(deletarOrdemServico("os-inexistente")).rejects.toThrow(
            "Ordem de serviço não encontrada",
        );
    });

    it("deve deletar uma OS existente", async () => {
        vi.mocked(prisma.ordemServico.findUnique).mockResolvedValue({
            id: "os-1",
        } as any);

        vi.mocked(prisma.ordemServico.delete).mockResolvedValue({
            id: "os-1",
        } as any);

        const resultado = await deletarOrdemServico("os-1");

        expect(resultado).toEqual(
            expect.objectContaining({
                id: "os-1",
            }),
        );

        expect(prisma.ordemServico.delete).toHaveBeenCalledWith({
            where: {
                id: "os-1",
            },
        });
    });
});

describe("adicionarPecaNaOrdemServico", () => {
    it("deve rejeitar quando a OS não existe", async () => {
        vi.mocked(prisma.$transaction).mockImplementation(
            async (callback: any) => {
                return callback({
                    ordemServico: {
                        findUnique: vi.fn().mockResolvedValue(null),
                    },
                });
            },
        );

        await expect(
            adicionarPecaNaOrdemServico("os-inexistente", {
                pecaId: "peca-1",
                quantidade: 2,
            }),
        ).rejects.toThrow("Ordem de serviço não encontrada");
    });

    it("deve rejeitar quando a peça não existe", async () => {
        vi.mocked(prisma.$transaction).mockImplementation(
            async (callback: any) => {
                return callback({
                    ordemServico: {
                        findUnique: vi.fn().mockResolvedValue({
                            id: "os-1",
                        }),
                    },
                    peca: {
                        findUnique: vi.fn().mockResolvedValue(null),
                    },
                });
            },
        );

        await expect(
            adicionarPecaNaOrdemServico("os-1", {
                pecaId: "peca-inexistente",
                quantidade: 2,
            }),
        ).rejects.toThrow("Peça não encontrada");
    });

    it("deve rejeitar quando o estoque é insuficiente", async () => {
        vi.mocked(prisma.$transaction).mockImplementation(
            async (callback: any) => {
                return callback({
                    ordemServico: {
                        findUnique: vi.fn().mockResolvedValue({
                            id: "os-1",
                        }),
                    },
                    peca: {
                        findUnique: vi.fn().mockResolvedValue({
                            id: "peca-1",
                            quantidadeEstoque: 3,
                        }),
                        updateMany: vi.fn().mockResolvedValue({
                            count: 0,
                        }),
                    },
                });
            },
        );

        await expect(
            adicionarPecaNaOrdemServico("os-1", {
                pecaId: "peca-1",
                quantidade: 5,
            }),
        ).rejects.toThrow("Estoque insuficiente");
    });

    it("deve adicionar uma peça à OS e diminuir o estoque", async () => {
        const tx = {
            ordemServico: {
                findUnique: vi.fn().mockResolvedValue({
                    id: "os-1",
                }),
            },
            peca: {
                findUnique: vi.fn().mockResolvedValue({
                    id: "peca-1",
                    nome: "Rolamento",
                    quantidadeEstoque: 10,
                }),
                updateMany: vi.fn().mockResolvedValue({
                    count: 1,
                }),
            },
            itemOrdemServico: {
                findUnique: vi.fn().mockResolvedValue(null),
                create: vi.fn().mockResolvedValue({
                    id: "item-1",
                    ordemServicoId: "os-1",
                    pecaId: "peca-1",
                    quantidade: 2,
                    peca: {
                        id: "peca-1",
                        nome: "Rolamento",
                    },
                }),
            },
        };

        vi.mocked(prisma.$transaction).mockImplementation(
            async (callback: any) => callback(tx),
        );

        const resultado = await adicionarPecaNaOrdemServico("os-1", {
            pecaId: "peca-1",
            quantidade: 2,
        });

        expect(resultado).toEqual(
            expect.objectContaining({
                id: "item-1",
                quantidade: 2,
            }),
        );

        expect(tx.peca.updateMany).toHaveBeenCalledWith({
            where: {
                id: "peca-1",
                quantidadeEstoque: {
                    gte: 2,
                },
            },
            data: {
                quantidadeEstoque: {
                    decrement: 2,
                },
            },
        });

        expect(tx.itemOrdemServico.create).toHaveBeenCalledWith({
            data: {
                ordemServicoId: "os-1",
                pecaId: "peca-1",
                quantidade: 2,
            },
            include: {
                peca: true,
            },
        });
    });

    it("deve incrementar a quantidade quando a peça já existe na OS", async () => {
        const tx = {
            ordemServico: {
                findUnique: vi.fn().mockResolvedValue({
                    id: "os-1",
                }),
            },
            peca: {
                findUnique: vi.fn().mockResolvedValue({
                    id: "peca-1",
                    nome: "Rolamento",
                    quantidadeEstoque: 10,
                }),
                updateMany: vi.fn().mockResolvedValue({
                    count: 1,
                }),
            },
            itemOrdemServico: {
                findUnique: vi.fn().mockResolvedValue({
                    id: "item-1",
                    ordemServicoId: "os-1",
                    pecaId: "peca-1",
                    quantidade: 3,
                }),
                update: vi.fn().mockResolvedValue({
                    id: "item-1",
                    ordemServicoId: "os-1",
                    pecaId: "peca-1",
                    quantidade: 5,
                    peca: {
                        id: "peca-1",
                        nome: "Rolamento",
                    },
                }),
            },
        };

        vi.mocked(prisma.$transaction).mockImplementation(
            async (callback: any) => callback(tx),
        );

        const resultado = await adicionarPecaNaOrdemServico("os-1", {
            pecaId: "peca-1",
            quantidade: 2,
        });

        expect(resultado).toEqual(
            expect.objectContaining({
                id: "item-1",
                quantidade: 5,
            }),
        );

        expect(tx.peca.updateMany).toHaveBeenCalledWith({
            where: {
                id: "peca-1",
                quantidadeEstoque: {
                    gte: 2,
                },
            },
            data: {
                quantidadeEstoque: {
                    decrement: 2,
                },
            },
        });

        expect(tx.itemOrdemServico.update).toHaveBeenCalledWith({
            where: {
                id: "item-1",
            },
            data: {
                quantidade: {
                    increment: 2,
                },
            },
            include: {
                peca: true,
            },
        });
    });
});

describe("atualizarStatusOrdemServico", () => {
    it("deve rejeitar quando a OS não existe", async () => {
        vi.mocked(prisma.$transaction).mockImplementation(
            async (callback: any) => {
                return callback({
                    ordemServico: {
                        findUnique: vi.fn().mockResolvedValue(null),
                    },
                });
            },
        );

        await expect(
            atualizarStatusOrdemServico("os-inexistente", "EM_ANDAMENTO"),
        ).rejects.toThrow("Ordem de serviço não encontrada");
    });

    it("deve rejeitar uma transição de status inválida", async () => {
        vi.mocked(prisma.$transaction).mockImplementation(
            async (callback: any) => {
                return callback({
                    ordemServico: {
                        findUnique: vi.fn().mockResolvedValue({
                            id: "os-1",
                            status: "ABERTA",
                        }),
                    },
                });
            },
        );

        await expect(
            atualizarStatusOrdemServico("os-1", "CONCLUIDA"),
        ).rejects.toThrow(
            "Não é possível alterar uma ordem de serviço de ABERTA para CONCLUIDA",
        );
    });

    it("deve rejeitar ABERTA → EM_ANDAMENTO sem técnico", async () => {
        vi.mocked(prisma.$transaction).mockImplementation(
            async (callback: any) => {
                return callback({
                    ordemServico: {
                        findUnique: vi.fn().mockResolvedValue({
                            id: "os-1",
                            status: "ABERTA",
                            tecnicoResponsavelId: null,
                        }),
                    },
                });
            },
        );

        await expect(
            atualizarStatusOrdemServico("os-1", "EM_ANDAMENTO"),
        ).rejects.toThrow(
            "A ordem de serviço precisa ter um técnico responsável para ser iniciada",
        );
    });

    it("deve iniciar uma OS e colocar a máquina em manutenção", async () => {
        const tx = {
            ordemServico: {
                findUnique: vi.fn().mockResolvedValue({
                    id: "os-1",
                    status: "ABERTA",
                    maquinaId: "maquina-1",
                    tecnicoResponsavelId: "tecnico-1",
                }),
                update: vi.fn().mockResolvedValue({
                    id: "os-1",
                    status: "EM_ANDAMENTO",
                    maquinaId: "maquina-1",
                    tecnicoResponsavelId: "tecnico-1",
                    iniciadoEm: new Date(),
                }),
            },
            maquina: {
                update: vi.fn().mockResolvedValue({
                    id: "maquina-1",
                    status: "EM_MANUTENCAO",
                }),
            },
        };

        vi.mocked(prisma.$transaction).mockImplementation(
            async (callback: any) => callback(tx),
        );

        const resultado = await atualizarStatusOrdemServico(
            "os-1",
            "EM_ANDAMENTO",
        );

        expect(resultado).toEqual(
            expect.objectContaining({
                id: "os-1",
                status: "EM_ANDAMENTO",
            }),
        );

        expect(tx.maquina.update).toHaveBeenCalledWith({
            where: {
                id: "maquina-1",
            },
            data: {
                status: "EM_MANUTENCAO",
            },
        });

        expect(tx.ordemServico.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: {
                    id: "os-1",
                },
                data: expect.objectContaining({
                    status: "EM_ANDAMENTO",
                    iniciadoEm: expect.any(Date),
                }),
            }),
        );
    });

    it("deve colocar uma OS em aguardando peça sem alterar o início", async () => {
        const iniciadoEm = new Date("2026-09-01T10:00:00Z");

        const tx = {
            ordemServico: {
                findUnique: vi.fn().mockResolvedValue({
                    id: "os-1",
                    status: "EM_ANDAMENTO",
                    maquinaId: "maquina-1",
                    tecnicoResponsavelId: "tecnico-1",
                    iniciadoEm,
                }),
                update: vi.fn().mockResolvedValue({
                    id: "os-1",
                    status: "AGUARDANDO_PECA",
                    iniciadoEm,
                }),
            },
            maquina: {
                update: vi.fn(),
            },
        };

        vi.mocked(prisma.$transaction).mockImplementation(
            async (callback: any) => callback(tx),
        );

        const resultado = await atualizarStatusOrdemServico(
            "os-1",
            "AGUARDANDO_PECA",
        );

        expect(resultado).toEqual(
            expect.objectContaining({
                status: "AGUARDANDO_PECA",
            }),
        );

        expect(tx.ordemServico.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: {
                    status: "AGUARDANDO_PECA",
                },
            }),
        );

        expect(tx.maquina.update).not.toHaveBeenCalled();
    });

    it("deve retornar de aguardando peça para em andamento", async () => {
        const iniciadoEm = new Date("2026-09-01T10:00:00Z");

        const tx = {
            ordemServico: {
                findUnique: vi.fn().mockResolvedValue({
                    id: "os-1",
                    status: "AGUARDANDO_PECA",
                    maquinaId: "maquina-1",
                    tecnicoResponsavelId: "tecnico-1",
                    iniciadoEm,
                }),
                update: vi.fn().mockResolvedValue({
                    id: "os-1",
                    status: "EM_ANDAMENTO",
                    iniciadoEm,
                }),
            },
            maquina: {
                update: vi.fn().mockResolvedValue({
                    id: "maquina-1",
                    status: "EM_MANUTENCAO",
                }),
            },
        };

        vi.mocked(prisma.$transaction).mockImplementation(
            async (callback: any) => callback(tx),
        );

        const resultado = await atualizarStatusOrdemServico(
            "os-1",
            "EM_ANDAMENTO",
        );

        expect(resultado).toEqual(
            expect.objectContaining({
                status: "EM_ANDAMENTO",
            }),
        );

        expect(tx.maquina.update).toHaveBeenCalledWith({
            where: {
                id: "maquina-1",
            },
            data: {
                status: "EM_MANUTENCAO",
            },
        });

        expect(tx.ordemServico.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: {
                    status: "EM_ANDAMENTO",
                },
            }),
        );
    });

    it("deve concluir uma OS e colocar a máquina em operação", async () => {
        const iniciadoEm = new Date("2026-09-01T10:00:00Z");

        const tx = {
            ordemServico: {
                findUnique: vi.fn().mockResolvedValue({
                    id: "os-1",
                    status: "EM_ANDAMENTO",
                    maquinaId: "maquina-1",
                    tecnicoResponsavelId: "tecnico-1",
                    iniciadoEm,
                }),
                update: vi.fn().mockResolvedValue({
                    id: "os-1",
                    status: "CONCLUIDA",
                    iniciadoEm,
                    concluidoEm: new Date(),
                }),
            },
            maquina: {
                update: vi.fn().mockResolvedValue({
                    id: "maquina-1",
                    status: "EM_OPERACAO",
                }),
            },
        };

        vi.mocked(prisma.$transaction).mockImplementation(
            async (callback: any) => callback(tx),
        );

        const resultado = await atualizarStatusOrdemServico(
            "os-1",
            "CONCLUIDA",
        );

        expect(resultado).toEqual(
            expect.objectContaining({
                status: "CONCLUIDA",
            }),
        );

        expect(tx.maquina.update).toHaveBeenCalledWith({
            where: {
                id: "maquina-1",
            },
            data: {
                status: "EM_OPERACAO",
            },
        });

        expect(tx.ordemServico.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: expect.objectContaining({
                    status: "CONCLUIDA",
                    concluidoEm: expect.any(Date),
                }),
            }),
        );
    });

    it("deve cancelar uma OS aberta sem alterar a máquina", async () => {
        const tx = {
            ordemServico: {
                findUnique: vi.fn().mockResolvedValue({
                    id: "os-1",
                    status: "ABERTA",
                    maquinaId: "maquina-1",
                    tecnicoResponsavelId: null,
                }),
                update: vi.fn().mockResolvedValue({
                    id: "os-1",
                    status: "CANCELADA",
                }),
            },
            maquina: {
                update: vi.fn(),
            },
        };

        vi.mocked(prisma.$transaction).mockImplementation(
            async (callback: any) => callback(tx),
        );

        const resultado = await atualizarStatusOrdemServico(
            "os-1",
            "CANCELADA",
        );

        expect(resultado).toEqual(
            expect.objectContaining({
                status: "CANCELADA",
            }),
        );

        expect(tx.maquina.update).not.toHaveBeenCalled();

        expect(tx.ordemServico.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: {
                    status: "CANCELADA",
                },
            }),
        );
    });

    it("deve cancelar uma OS em andamento e liberar a máquina", async () => {
        const iniciadoEm = new Date("2026-09-01T10:00:00Z");

        const tx = {
            ordemServico: {
                findUnique: vi.fn().mockResolvedValue({
                    id: "os-1",
                    status: "EM_ANDAMENTO",
                    maquinaId: "maquina-1",
                    tecnicoResponsavelId: "tecnico-1",
                    iniciadoEm,
                }),
                update: vi.fn().mockResolvedValue({
                    id: "os-1",
                    status: "CANCELADA",
                    iniciadoEm,
                }),
            },
            maquina: {
                update: vi.fn().mockResolvedValue({
                    id: "maquina-1",
                    status: "EM_OPERACAO",
                }),
            },
        };

        vi.mocked(prisma.$transaction).mockImplementation(
            async (callback: any) => callback(tx),
        );

        await atualizarStatusOrdemServico("os-1", "CANCELADA");

        expect(tx.maquina.update).toHaveBeenCalledWith({
            where: {
                id: "maquina-1",
            },
            data: {
                status: "EM_OPERACAO",
            },
        });

        expect(tx.ordemServico.update).toHaveBeenCalledWith(
            expect.objectContaining({
                data: {
                    status: "CANCELADA",
                },
            }),
        );
    });

    it("deve cancelar uma OS aguardando peça e liberar a máquina", async () => {
        const iniciadoEm = new Date("2026-09-01T10:00:00Z");

        const tx = {
            ordemServico: {
                findUnique: vi.fn().mockResolvedValue({
                    id: "os-1",
                    status: "AGUARDANDO_PECA",
                    maquinaId: "maquina-1",
                    tecnicoResponsavelId: "tecnico-1",
                    iniciadoEm,
                }),
                update: vi.fn().mockResolvedValue({
                    id: "os-1",
                    status: "CANCELADA",
                    iniciadoEm,
                }),
            },
            maquina: {
                update: vi.fn().mockResolvedValue({
                    id: "maquina-1",
                    status: "EM_OPERACAO",
                }),
            },
        };

        vi.mocked(prisma.$transaction).mockImplementation(
            async (callback: any) => callback(tx),
        );

        await atualizarStatusOrdemServico("os-1", "CANCELADA");

        expect(tx.maquina.update).toHaveBeenCalledWith({
            where: {
                id: "maquina-1",
            },
            data: {
                status: "EM_OPERACAO",
            },
        });
    });

    it("não deve permitir alterar uma OS concluída", async () => {
        const tx = {
            ordemServico: {
                findUnique: vi.fn().mockResolvedValue({
                    id: "os-1",
                    status: "CONCLUIDA",
                    maquinaId: "maquina-1",
                }),
            },
            maquina: {
                update: vi.fn(),
            },
        };

        vi.mocked(prisma.$transaction).mockImplementation(
            async (callback: any) => callback(tx),
        );

        await expect(
            atualizarStatusOrdemServico("os-1", "EM_ANDAMENTO"),
        ).rejects.toThrow(
            "Não é possível alterar uma ordem de serviço de CONCLUIDA para EM_ANDAMENTO",
        );

        expect(tx.maquina.update).not.toHaveBeenCalled();
    });

    it("não deve permitir alterar uma OS cancelada", async () => {
        const tx = {
            ordemServico: {
                findUnique: vi.fn().mockResolvedValue({
                    id: "os-1",
                    status: "CANCELADA",
                    maquinaId: "maquina-1",
                }),
            },
            maquina: {
                update: vi.fn(),
            },
        };

        vi.mocked(prisma.$transaction).mockImplementation(
            async (callback: any) => callback(tx),
        );

        await expect(
            atualizarStatusOrdemServico("os-1", "ABERTA"),
        ).rejects.toThrow(
            "Não é possível alterar uma ordem de serviço de CANCELADA para ABERTA",
        );

        expect(tx.maquina.update).not.toHaveBeenCalled();
    });

    it("não deve permitir ABERTA → AGUARDANDO_PECA", async () => {
        const tx = {
            ordemServico: {
                findUnique: vi.fn().mockResolvedValue({
                    id: "os-1",
                    status: "ABERTA",
                    maquinaId: "maquina-1",
                }),
            },
        };

        vi.mocked(prisma.$transaction).mockImplementation(
            async (callback: any) => callback(tx),
        );

        await expect(
            atualizarStatusOrdemServico("os-1", "AGUARDANDO_PECA"),
        ).rejects.toThrow(
            "Não é possível alterar uma ordem de serviço de ABERTA para AGUARDANDO_PECA",
        );
    });

    it("não deve permitir ABERTA → CONCLUIDA", async () => {
        const tx = {
            ordemServico: {
                findUnique: vi.fn().mockResolvedValue({
                    id: "os-1",
                    status: "ABERTA",
                    maquinaId: "maquina-1",
                }),
            },
        };

        vi.mocked(prisma.$transaction).mockImplementation(
            async (callback: any) => callback(tx),
        );

        await expect(
            atualizarStatusOrdemServico("os-1", "CONCLUIDA"),
        ).rejects.toThrow(
            "Não é possível alterar uma ordem de serviço de ABERTA para CONCLUIDA",
        );
    });

    it("não deve permitir EM_ANDAMENTO → ABERTA", async () => {
        const tx = {
            ordemServico: {
                findUnique: vi.fn().mockResolvedValue({
                    id: "os-1",
                    status: "EM_ANDAMENTO",
                    maquinaId: "maquina-1",
                }),
            },
        };

        vi.mocked(prisma.$transaction).mockImplementation(
            async (callback: any) => callback(tx),
        );

        await expect(
            atualizarStatusOrdemServico("os-1", "ABERTA"),
        ).rejects.toThrow(
            "Não é possível alterar uma ordem de serviço de EM_ANDAMENTO para ABERTA",
        );
    });

    it("não deve permitir AGUARDANDO_PECA → CONCLUIDA", async () => {
        const tx = {
            ordemServico: {
                findUnique: vi.fn().mockResolvedValue({
                    id: "os-1",
                    status: "AGUARDANDO_PECA",
                    maquinaId: "maquina-1",
                }),
            },
        };

        vi.mocked(prisma.$transaction).mockImplementation(
            async (callback: any) => callback(tx),
        );

        await expect(
            atualizarStatusOrdemServico("os-1", "CONCLUIDA"),
        ).rejects.toThrow(
            "Não é possível alterar uma ordem de serviço de AGUARDANDO_PECA para CONCLUIDA",
        );
    });
});
