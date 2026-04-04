import { DropzonePDF } from "@/components/features/ingestao/DropzonePDF";

export default function IngestaoPage() {
    return (
        <div className="flex flex-col gap-8 max-w-3xl mx-auto py-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Nova Ingestão de Edital</h1>
                <p className="text-muted-foreground mt-2">
                    Faça o upload do seu edital em PDF. Nossa IA vai extrair as matérias, peso e tópicos automaticamente criando seu ciclo de estudos.
                </p>
            </div>

            <DropzonePDF />
        </div>
    );
}
