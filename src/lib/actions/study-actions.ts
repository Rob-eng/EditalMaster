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

