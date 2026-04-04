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

    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">O que estudar hoje?</h1>
                    <p className="text-muted-foreground mt-1">
                        Visualize seu progresso e mantenha o ritmo.
                    </p>
                </div>
                <Link href="/ingestao">
                    <Button className="rounded-full gap-2 shadow-sm">
                        <PlusCircle className="h-4 w-4" />
                        Novo Edital
                    </Button>
                </Link>
            </div>

            {materias.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
                        {materias.map((materia) => (
                            <SubjectCard
                                key={materia.id}
                                disciplina={materia.nome}
                                topicos={materia.topicos.map(t => ({
                                    id: t.id,
                                    titulo: t.titulo,
                                    status: t.status as any
                                }))}
                            />
                        ))}
                    </div>
                    <div>
                        <StudyAnalytics />
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
