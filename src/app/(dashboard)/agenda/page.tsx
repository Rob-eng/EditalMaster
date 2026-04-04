import AvailabilityGrid from "@/components/features/agenda/AvailabilityGrid";

export default function AgendaPage() {
    return (
        <div className="flex flex-col gap-8">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Agenda de Estudos</h1>
                <p className="text-muted-foreground mt-2">
                    Defina sua rotina semanal para que a IA possa distribuir os tópicos do edital de forma otimizada.
                </p>
            </div>

            <AvailabilityGrid />
        </div>
    );
}
