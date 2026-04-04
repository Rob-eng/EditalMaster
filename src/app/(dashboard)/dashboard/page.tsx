import { SubjectCard } from "@/components/features/dashboard/SubjectCard";
import { StudyAnalytics } from "@/components/features/dashboard/StudyAnalytics";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";

const MOCK_DATA = [
    {
        id: "1",
        disciplina: "Direito Constitucional",
        topicos: [
            { id: "t1", titulo: "Direitos Fundamentais", status: "ESTUDADO" as const },
            { id: "t2", titulo: "Poder Executivo", status: "REVISAO" as const },
            { id: "t3", titulo: "Poder Legislativo", status: "PENDENTE" as const },
            { id: "t4", titulo: "Controle de Constitucionalidade", status: "PENDENTE" as const },
        ]
    },
    {
        id: "2",
        disciplina: "Direito Administrativo",
        topicos: [
            { id: "t5", titulo: "Organização Administrativa", status: "CONCLUIDO" as const },
            { id: "t6", titulo: "Atos Administrativos", status: "ESTUDADO" as const },
            { id: "t7", titulo: "Licitações", status: "ATRASADO" as const },
        ]
    },
    {
        id: "3",
        disciplina: "Língua Portuguesa",
        topicos: [
            { id: "t8", titulo: "Sintaxe da Oração", status: "ESTUDADO" as const },
            { id: "t9", titulo: "Pontuação", status: "PENDENTE" as const },
        ]
    }
];

export default function DashboardPage() {
    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">O que estudar hoje?</h1>
                    <p className="text-muted-foreground mt-1">
                        Sexta-feira, 3 de Abril - Você tem 4h disponíveis hoje.
                    </p>
                </div>
                <Link href="/ingestao">
                    <Button className="rounded-full gap-2 shadow-sm">
                        <PlusCircle className="h-4 w-4" />
                        Novo Edital
                    </Button>
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {MOCK_DATA.map((subject) => (
                        <SubjectCard key={subject.id} disciplina={subject.disciplina} topicos={subject.topicos} />
                    ))}
                </div>
                <div>
                    <StudyAnalytics />
                </div>
            </div>
        </div>
    );
}
