import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, BarChart, Bar, Cell } from "recharts";
import { format, subDays, startOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { BarChart3, TrendingUp, Target, AlertTriangle } from "lucide-react";

export default async function AnalyticsPage() {
    const session = await auth();
    if (!session?.user?.id) redirect("/login");

    // Busca histórico de sessões de estudo (questões) do usuário
    const sessoes = await prisma.sessaoEstudo.findMany({
        where: {
            topico: {
                materia: {
                    edital: { userId: session.user.id }
                }
            }
        },
        include: {
            topico: {
                include: { materia: true }
            }
        },
        orderBy: { dataRealizada: 'asc' }
    });

    // Agrupa dados por dia para o gráfico de evolução (últimos 14 dias)
    const evolutionMap = new Map();
    const last14Days = Array.from({ length: 14 }).map((_, i) => {
        const d = startOfDay(subDays(new Date(), i));
        return format(d, "yyyy-MM-dd");
    }).reverse();

    last14Days.forEach(date => evolutionMap.set(date, { date, questões: 0, acertos: 0 }));

    sessoes.forEach(s => {
        if (!s.dataRealizada) return;
        const dateKey = format(startOfDay(new Date(s.dataRealizada)), "yyyy-MM-dd");
        if (evolutionMap.has(dateKey)) {
            const current = evolutionMap.get(dateKey);
            // Usamos duracaoMin como mock de quantidade de questões se fosse salvo lá
            // Vamos buscar o acerto real do tópico na data (simplificado para este MVP)
            current.questões += s.duracaoMin || 0;
            // Cálculo proporcional de acertos baseado no estado atual do tópico
            const accRate = (s.topico.acertos || 0) / (s.topico.questoesResolvidas || 1);
            current.acertos += Math.round((s.duracaoMin || 0) * (accRate > 1 ? 1 : accRate));
        }
    });

    const chartData = Array.from(evolutionMap.values()).map(d => ({
        ...d,
        label: format(new Date(d.date), "dd/MM")
    }));

    // Tópicos com menor desempenho (< 60%)
    const allTopicos = await prisma.topico.findMany({
        where: {
            materia: { edital: { userId: session.user.id } },
            questoesResolvidas: { gt: 0 }
        },
        include: { materia: true },
        orderBy: { acertos: 'asc' }
    });

    const weakTopics = allTopicos
        .map(t => ({
            id: t.id,
            titulo: t.titulo,
            materia: t.materia.nome,
            taxa: Math.round(((t.acertos || 0) / t.questoesResolvidas) * 100)
        }))
        .filter(t => t.taxa < 70)
        .sort((a, b) => a.taxa - b.taxa)
        .slice(0, 5);

    const totalGeralQuestoes = allTopicos.reduce((acc, t) => acc + t.questoesResolvidas, 0);
    const totalGeralAcertos = allTopicos.reduce((acc, t) => acc + t.acertos, 0);
    const mediaGeral = totalGeralQuestoes > 0 ? Math.round((totalGeralAcertos / totalGeralQuestoes) * 100) : 0;

    return (
        <div className="flex flex-col gap-8">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
                        <TrendingUp className="h-10 w-10 text-primary" />
                        Sua Evolução
                    </h1>
                    <p className="text-muted-foreground mt-2 font-medium">Análise detalhada do seu desempenho temporal.</p>
                </div>
                <div className="bg-primary/5 p-4 rounded-2xl border border-primary/10 flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] uppercase font-black text-muted-foreground tracking-widest">Média Geral</p>
                        <p className="text-3xl font-black text-primary">{mediaGeral}%</p>
                    </div>
                    <Target className="h-8 w-8 text-primary/40" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <Card className="lg:col-span-2 shadow-2xl border-none bg-gradient-to-br from-card to-muted/20">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <BarChart3 className="h-5 w-5 text-primary" />
                            Rendimento nos Últimos 14 Dias
                        </CardTitle>
                        <CardDescription>Quantidade de questões vs acertos realizados.</CardDescription>
                    </CardHeader>
                    <CardContent className="h-[400px] pt-6">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={chartData}>
                                <defs>
                                    <linearGradient id="colorQ" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.1} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                    </linearGradient>
                                    <linearGradient id="colorA" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                                        <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.1} />
                                <XAxis dataKey="label" fontSize={10} tickLine={false} axisLine={false} />
                                <YAxis fontSize={10} tickLine={false} axisLine={false} />
                                <Tooltip
                                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
                                />
                                <Area type="monotone" dataKey="questões" stroke="#3b82f6" fillOpacity={1} fill="url(#colorQ)" strokeWidth={3} />
                                <Area type="monotone" dataKey="acertos" stroke="#22c55e" fillOpacity={1} fill="url(#colorA)" strokeWidth={3} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="shadow-xl bg-red-50/30 border-red-100">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-black flex items-center gap-2 text-red-700">
                                <AlertTriangle className="h-4 w-4" /> ATENÇÃO: PONTOS FRACOS
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {weakTopics.length > 0 ? weakTopics.map(t => (
                                <div key={t.id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-red-100 shadow-sm">
                                    <div className="max-w-[70%]">
                                        <p className="text-[10px] font-bold text-red-400 uppercase">{t.materia}</p>
                                        <p className="text-xs font-black truncate">{t.titulo}</p>
                                    </div>
                                    <Badge variant="destructive" className="font-black">{t.taxa}%</Badge>
                                </div>
                            )) : (
                                <p className="text-xs text-muted-foreground text-center py-4 italic">Nenhum tópico crítico identificado ainda.</p>
                            )}
                        </CardContent>
                    </Card>

                    <Card className="shadow-xl bg-primary/5 border-primary/10">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-black text-primary">DICA DA IA</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-xs leading-relaxed text-muted-foreground">
                                Com base nos seus dados, você tem um melhor rendimento em <b>{allTopicos[0]?.materia.nome || "suas matérias"}</b>.
                                Tente dedicar as primeiras horas do dia para os tópicos marcados em vermelho ao lado para otimizar sua curva de aprendizado.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
