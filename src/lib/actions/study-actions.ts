"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { StatusTopico } from "@prisma/client";

export async function updateTopicStatus(topicId: string, status: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autorizado");

    await prisma.topico.update({
        where: { id: topicId },
        data: { status: status as StatusTopico }
    });

    revalidatePath("/dashboard");
}

export async function markAsReadWithReview(topicId: string, daysToReview: number | null, customDate?: Date) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autorizado");

    const dataLeitura = new Date();
    let dataRevisao1: Date | null = null;
    let status: StatusTopico = "CONCLUIDO";

    if (daysToReview !== null || customDate) {
        dataRevisao1 = customDate ? new Date(customDate) : new Date();
        if (!customDate && daysToReview) {
            dataRevisao1.setDate(dataLeitura.getDate() + daysToReview);
        }
        status = "ESTUDADO";
    }

    // Segunda revisão automática se houver a primeira (+7 dias)
    const dataRevisao2 = dataRevisao1 ? new Date(dataRevisao1) : null;
    if (dataRevisao2) dataRevisao2.setDate(dataRevisao2.getDate() + 7);

    await prisma.topico.update({
        where: { id: topicId },
        data: {
            status,
            dataLeitura,
            dataRevisao1,
            dataRevisao2,
            rev1Concluida: false,
            rev2Concluida: false
        } as any
    });

    // Grava histórico de leitura
    await prisma.sessaoEstudo.create({
        data: {
            topicoId: topicId,
            dataAgendada: dataLeitura,
            dataRealizada: dataLeitura,
            duracaoMin: 0 // Pode ser expandido no futuro
        }
    });

    revalidatePath("/dashboard");
}

export async function completeReview(topicId: string, reviewNumber: 1 | 2, nextReviewDays?: number | null, customDate?: Date) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autorizado");

    let updateData: any = {};
    const now = new Date();

    if (reviewNumber === 1) {
        updateData.rev1Concluida = true;
        if (nextReviewDays !== null || customDate) {
            const dataRevisao2 = customDate ? new Date(customDate) : new Date();
            if (!customDate && nextReviewDays) {
                dataRevisao2.setDate(now.getDate() + nextReviewDays);
            }
            updateData.dataRevisao2 = dataRevisao2;
            updateData.status = "REVISAO";
        } else {
            updateData.status = "CONCLUIDO";
        }
    } else {
        updateData.rev2Concluida = true;
        updateData.status = "CONCLUIDO";
    }

    await prisma.topico.update({
        where: { id: topicId },
        data: updateData
    });

    // Grava histórico de revisão
    await prisma.revisao.create({
        data: {
            topicoId: topicId,
            ordem: reviewNumber,
            dataAgendada: now, // Simplificado
            dataRealizada: now
        }
    });

    revalidatePath("/dashboard");
}

export async function updateTopicPerformance(topicId: string, data: { questoesResolvidas: number, acertos: number }) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autorizado");

    await prisma.topico.update({
        where: { id: topicId },
        data: {
            questoesResolvidas: Number(data.questoesResolvidas),
            acertos: Number(data.acertos),
            dataDesempenho: new Date(),
            status: "CONCLUIDO" as StatusTopico
        } as any
    });

    // Grava histórico de performance via SessaoEstudo (marcando como questões)
    await prisma.sessaoEstudo.create({
        data: {
            topicoId: topicId,
            dataAgendada: new Date(),
            dataRealizada: new Date(),
            duracaoMin: data.questoesResolvidas // Usamos duracaoMin para guardar Qtd Questões temporariamente ou campos JSON no futuro
        }
    });

    revalidatePath("/dashboard");
}

// Ações de Edição do Edital
export async function editMateria(materiaId: string, data: { nome: string, importancia: string }) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autorizado");

    await prisma.materia.update({
        where: { id: materiaId },
        data: {
            nome: data.nome,
            importancia: data.importancia
        }
    });
    revalidatePath("/dashboard");
}

export async function splitMateria(materiaId: string, newName: string, topicIds: string[]) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autorizado");

    const originalMateria = await prisma.materia.findUnique({
        where: { id: materiaId }
    });
    if (!originalMateria) throw new Error("Matéria não encontrada");

    // Cria nova matéria
    const newMateria = await prisma.materia.create({
        data: {
            editalId: originalMateria.editalId,
            nome: newName,
            importancia: originalMateria.importancia
        }
    });

    // Move tópicos
    await prisma.topico.updateMany({
        where: { id: { in: topicIds } },
        data: { materiaId: newMateria.id }
    });

    revalidatePath("/dashboard");
}

export async function updateTopicoTitle(topicId: string, titulo: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autorizado");

    await prisma.topico.update({
        where: { id: topicId },
        data: { titulo }
    });
    revalidatePath("/dashboard");
}

export async function addTopico(materiaId: string, titulo: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autorizado");

    await prisma.topico.create({
        data: {
            materiaId,
            titulo,
            status: "PENDENTE"
        }
    });
    revalidatePath("/dashboard");
}

export async function deleteTopico(topicId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autorizado");

    await prisma.topico.delete({
        where: { id: topicId }
    });
    revalidatePath("/dashboard");
}

export async function moveTopicsToMateria(topicIds: string[], targetMateriaId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autorizado");

    await prisma.topico.updateMany({
        where: { id: { in: topicIds } },
        data: { materiaId: targetMateriaId }
    });

    revalidatePath("/dashboard");
}

export async function deleteStudySession(sessionId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autorizado");

    // Primeiro buscamos a sessão para saber o quanto subtrair do tópico
    const sessao = await prisma.sessaoEstudo.findUnique({
        where: { id: sessionId },
        include: { topico: true }
    });

    if (!sessao) throw new Error("Sessão não encontrada");

    // Subtrai do tópico
    const questionsToRemove = sessao.duracaoMin || 0;
    const currentTotal = sessao.topico.questoesResolvidas || 0;
    const currentHits = sessao.topico.acertos || 0;

    // Proporção de acertos estimada para subtrair (já que não salvamos acertos na SessaoEstudo V3)
    const hitsToRemove = Math.min(currentHits, Math.round(questionsToRemove * (currentHits / (currentTotal || 1))));

    await prisma.topico.update({
        where: { id: sessao.topicoId },
        data: {
            questoesResolvidas: Math.max(0, currentTotal - questionsToRemove),
            acertos: Math.max(0, currentHits - hitsToRemove)
        }
    });

    await prisma.sessaoEstudo.delete({
        where: { id: sessionId }
    });

    revalidatePath("/dashboard");
    revalidatePath("/analytics");
}

export async function resetTopicPerformance(topicId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autorizado");

    await prisma.$transaction([
        prisma.topico.update({
            where: { id: topicId },
            data: {
                questoesResolvidas: 0,
                acertos: 0,
                dataDesempenho: null
            }
        }),
        prisma.sessaoEstudo.deleteMany({
            where: { topicoId: topicId }
        })
    ]);

    revalidatePath("/dashboard");
    revalidatePath("/analytics");
}

export async function joinMaterias(sourceMateriaId: string, targetMateriaId: string) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autorizado");

    // Move todos os tópicos da origem para o destino
    await prisma.topico.updateMany({
        where: { materiaId: sourceMateriaId },
        data: { materiaId: targetMateriaId }
    });

    // Remove a matéria de origem
    await prisma.materia.delete({
        where: { id: sourceMateriaId }
    });

    revalidatePath("/dashboard");
}


