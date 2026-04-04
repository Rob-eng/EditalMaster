import AvailabilityGrid from "@/components/features/agenda/AvailabilityGrid";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function AgendaPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    const slots = await prisma.gradeDisponibilidade.findMany({
        where: { userId: session.user.id }
    });

    const initialData: Record<number, number> = {};
    slots.forEach(slot => {
        initialData[slot.diaSemana] = slot.horas;
    });

    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Agenda de Estudos</h1>
                <p className="text-muted-foreground mt-2">
                    Defina sua rotina semanal para que a IA possa distribuir os tópicos do edital de forma otimizada.
                </p>
            </div>

            <AvailabilityGrid initialData={initialData} />
        </div>
    );
}
