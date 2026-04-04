"use server";

import prisma from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function saveAvailability(availability: any) {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Não autorizado");

    const userId = session.user.id;

    // Limpa a grade anterior e cria a nova (ou usa upsert se preferir)
    // Para simplificar, vamos deletar as existentes do usuário e criar novas
    await prisma.$transaction([
        prisma.gradeDisponibilidade.deleteMany({
            where: { userId }
        }),
        prisma.gradeDisponibilidade.createMany({
            data: Object.entries(availability).map(([dia, horas]: [string, any]) => ({
                userId,
                diaSemana: parseInt(dia),
                horas: parseFloat(horas),
            }))
        })
    ]);

    revalidatePath("/agenda");
    revalidatePath("/dashboard");
}
