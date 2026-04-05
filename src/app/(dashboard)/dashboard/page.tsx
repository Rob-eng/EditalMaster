import { SubjectCard } from "@/components/features/dashboard/SubjectCard";
import { StudyAnalytics } from "@/components/features/dashboard/StudyAnalytics";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
    const session = await auth();
    if (!session?.user?.id) {
        redirect("/login");
    }

    // Busca o edital mais recente do usuário
    const edital = await prisma.edital.findFirst({
        where: { userId: session.user.id },
        include: {
            materias: {
                include: {
                    topicos: true
                }
            }
        },
        orderBy: { createdAt: 'desc' }
    });

    const materias = edital?.materias || [];

    // Cálculo de Analytics Real
    const allTopicos = materias.flatMap((m: any) => m.topicos);
    const stats = {
        CONCLUIDO: allTopicos.filter((t: any) => t.status === "CONCLUIDO").length,
        ESTUDADO: allTopicos.filter((t: any) => t.status === "ESTUDADO").length,
        REVISAO: allTopicos.filter((t: any) => t.status === "REVISAO").length,
        PENDENTE: allTopicos.filter((t: any) => t.status === "PENDENTE" || t.status === "ATRASADO").length,
    };

    const analyticsData = [
        { name: "Concluído", value: stats.CONCLUIDO, color: "#22c55e" },
        { name: "Estudado", value: stats.ESTUDADO, color: "#3b82f6" },
        { name: "Revisão", value: stats.REVISAO, color: "#f97316" },
        { name: "Pendente", value: stats.PENDENTE, color: "#94a3b8" },
    ];

    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter">O que estudar hoje?</h1>
                    <p className="text-muted-foreground mt-2 font-medium">
                        Seu progresso real baseado no edital carregado.
                    </p>
                </div>
                <Link href="/ingestao">
                    <Button className="rounded-full gap-2 shadow-xl hover:scale-105 transition-all h-12 px-6">
                        <PlusCircle className="h-5 w-5" />
                        Novo Edital
                    </Button>
                </Link>
            </div>

            {materias.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <div className="lg:col-span-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {materias.map((materia) => (
                            <SubjectCard
                                key={materia.id}
                                disciplina={materia.nome}
                                importancia={materia.importancia || "Média"}
                                topicos={materia.topicos.map(t => ({
                                    id: t.id,
                                    titulo: t.titulo,
                                    status: t.status as any,
                                    questoesResolvidas: t.questoesResolvidas,
                                    acertos: t.acertos
                                }))}
                            />
                        ))}
                    </div>
                    <div className="lg:col-span-1">
                        <StudyAnalytics data={analyticsData} />
                    </div>
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center p-12 border-2 border-dashed rounded-xl border-muted-foreground/20">
                    <h3 className="text-xl font-medium">Nenhum edital encontrado</h3>
                    <p className="text-muted-foreground mb-6">Carregue um edital para começar seu planejamento.</p>
                    <Link href="/ingestao">
                        <Button>Carregar Primeiro Edital</Button>
                    </Link>
                </div>
            )}
        </div>
    );
}
