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

export async function markAsReadWithReview(topicId: string, daysToReview: number) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autorizado");

    const dataLeitura = new Date();
    const dataRevisao1 = new Date();
    dataRevisao1.setDate(dataLeitura.getDate() + daysToReview);

    // Segunda revisão automática (ex: 7 dias após a primeira)
    const dataRevisao2 = new Date(dataRevisao1);
    dataRevisao2.setDate(dataRevisao2.getDate() + 7);

    await prisma.topico.update({
        where: { id: topicId },
        data: {
            status: "ESTUDADO" as StatusTopico,
            dataLeitura,
            dataRevisao1,
            dataRevisao2,
            rev1Concluida: false,
            rev2Concluida: false
        }
    });

    revalidatePath("/dashboard");
}

export async function completeReview(topicId: string, reviewNumber: 1 | 2) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autorizado");

    const updateData = reviewNumber === 1
        ? { rev1Concluida: true }
        : { rev2Concluida: true, status: "CONCLUIDO" as StatusTopico };

    await prisma.topico.update({
        where: { id: topicId },
        data: updateData
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
            status: "CONCLUIDO" as StatusTopico
        }
    });

    revalidatePath("/dashboard");
}
