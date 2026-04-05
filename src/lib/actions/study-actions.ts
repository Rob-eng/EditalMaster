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
