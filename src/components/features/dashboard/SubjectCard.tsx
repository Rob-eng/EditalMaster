"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Clock, ChevronRight, BarChart3, CalendarDays } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTopicStatus, updateTopicPerformance, markAsReadWithReview, completeReview } from "@/lib/actions/study-actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";

interface Topic {
    id: string;
    titulo: string;
    status: "PENDENTE" | "ESTUDADO" | "REVISAO" | "ATRASADO" | "CONCLUIDO";
    questoesResolvidas?: number;
    acertos?: number;
    dataLeitura?: Date | string;
    dataRevisao1?: Date | string;
    rev1Concluida?: boolean;
    dataRevisao2?: Date | string;
    rev2Concluida?: boolean;
    dataDesempenho?: Date | string;
}

interface SubjectCardProps {
    disciplina: string;
    topicos: Topic[];
    importancia?: string;
}

export function SubjectCard({ disciplina, topicos, importancia }: SubjectCardProps) {
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [topicToRead, setTopicToRead] = useState<Topic | null>(null);
    const [questoes, setQuestoes] = useState("");
    const [acertos, setAcertos] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const total = topicos.length;
    const concluido = topicos.filter(t => t.status === "CONCLUIDO" || t.status === "ESTUDADO").length;
    const porcentagemEstudo = total > 0 ? Math.round((concluido / total) * 100) : 0;

    const totalQuestoesMateria = topicos.reduce((acc, t) => acc + (t.questoesResolvidas || 0), 0);
    const totalAcertosMateria = topicos.reduce((acc, t) => acc + (t.acertos || 0), 0);
    const porcentagemAcertoMateria = totalQuestoesMateria > 0 ? Math.round((totalAcertosMateria / totalQuestoesMateria) * 100) : 0;

    const getStatusIcon = (status: Topic["status"], topico: Topic) => {
        const today = new Date();
        const isLate = (topico.dataRevisao1 && !topico.rev1Concluida && new Date(topico.dataRevisao1) < today) ||
            (topico.rev1Concluida && topico.dataRevisao2 && !topico.rev2Concluida && new Date(topico.dataRevisao2) < today);

        if (isLate) return <Clock className="h-4 w-4 text-red-500 animate-pulse" />;
        if (status === "ESTUDADO" && !topico.rev1Concluida) return <Clock className="h-4 w-4 text-amber-500" />;

        switch (status) {
            case "CONCLUIDO": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case "ESTUDADO": return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
            case "REVISAO": return <Clock className="h-4 w-4 text-orange-500" />;
            case "ATRASADO": return <Circle className="h-4 w-4 text-red-500" fill="currentColor" opacity={0.5} />;
            default: return <Circle className="h-4 w-4 text-muted-foreground" />;
        }
    };

    const handleSavePerformance = async () => {
        if (!selectedTopic || !questoes || !acertos) return;
        setIsSaving(true);
        try {
            await updateTopicPerformance(selectedTopic.id, {
                questoesResolvidas: parseInt(questoes),
                acertos: parseInt(acertos)
            });
            setSelectedTopic(null);
            setQuestoes("");
            setAcertos("");
            toast.success("Desempenho salvo!");
        } catch (error) {
            toast.error("Erro ao salvar.");
        } finally {
            setIsSaving(false);
        }
    };

    const handleMarkAsRead = async (days: number) => {
        if (!topicToRead) return;
        setIsSaving(true);
        try {
            await markAsReadWithReview(topicToRead.id, days);
            setTopicToRead(null);
            toast.success(`Leitura salva! Revisão agendada em ${days} dia(s).`);
        } catch (error) {
            toast.error("Erro ao agendar revisão.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <>
            <Dialog>
                <DialogTrigger render={
                    <Card className="overflow-hidden transition-all hover:shadow-lg cursor-pointer border-l-4 border-l-primary group">
                        <CardHeader className="pb-2">
                            <div className="flex justify-between items-start">
                                <div className="space-y-1">
                                    <div className="flex items-center gap-2">
                                        <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{disciplina}</CardTitle>
                                        {totalQuestoesMateria > 0 && (
                                            <Badge variant="secondary" className="rounded-full bg-green-50 text-green-700 border-green-100 font-black text-[10px]">
                                                {porcentagemAcertoMateria}% ACERTO
                                            </Badge>
                                        )}
                                    </div>
                                    <CardDescription>{topicos.length} tópicos extraídos</CardDescription>
                                </div>
                                <Badge variant={importancia === "Alta" ? "default" : "outline"} className="rounded-full uppercase text-[10px] font-black">
                                    {porcentagemEstudo}% Lido
                                </Badge>
                            </div>
                            <Progress value={porcentagemEstudo} className="h-2 mt-4" />
                        </CardHeader>
                        <CardContent className="pt-2">
                            <div className="space-y-3">
                                {topicos.slice(0, 3).map((topico) => {
                                    const topicAcc = topico.questoesResolvidas && topico.questoesResolvidas > 0
                                        ? Math.round(((topico.acertos || 0) / topico.questoesResolvidas) * 100)
                                        : null;
                                    return (
                                        <div key={topico.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                                            {getStatusIcon(topico.status, topico)}
                                            <span className="text-sm font-medium truncate flex-1">{topico.titulo}</span>
                                            {topicAcc !== null && (
                                                <span className="text-[10px] font-black text-green-700 bg-green-50 px-1.5 py-0.5 rounded border border-green-100 italic">
                                                    {topicAcc}%
                                                </span>
                                            )}
                                        </div>
                                    );
                                })}
                                <div className="flex items-center justify-center pt-2 text-xs font-semibold text-primary gap-1">
                                    Explorar detalhes e desempenho <ChevronRight className="h-3 w-3" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                } />
                <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                            {disciplina}
                            {totalQuestoesMateria > 0 && (
                                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-black">
                                    MÉDIA: {porcentagemAcertoMateria}%
                                </span>
                            )}
                        </DialogTitle>
                        <DialogDescription>Controle de leitura, revisões e desempenho detalhado.</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-4 mt-6">
                        {topicos.map((topico) => {
                            const topicAccuracy = topico.questoesResolvidas && topico.questoesResolvidas > 0
                                ? Math.round(((topico.acertos || 0) / topico.questoesResolvidas) * 100)
                                : null;

                            return (
                                <div key={topico.id} className="flex items-center justify-between p-4 rounded-2xl border bg-card hover:border-primary/30 transition-all shadow-sm">
                                    <div className="flex flex-col gap-1 max-w-[55%]">
                                        <div className="flex items-center gap-2">
                                            <span className="font-bold text-sm leading-tight text-foreground">{topico.titulo}</span>
                                            {topicAccuracy !== null && (
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${topicAccuracy >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                    {topicAccuracy}%
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-2 items-center flex-wrap">
                                            <Badge variant={topico.status === "PENDENTE" ? "outline" : "secondary"} className="text-[9px] uppercase h-4 px-1 font-black">
                                                {topico.status}
                                            </Badge>

                                            {topico.dataDesempenho && (
                                                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-100">
                                                    <BarChart3 className="h-3 w-3" /> {format(new Date(topico.dataDesempenho), "dd/MM/yy", { locale: ptBR })}
                                                </span>
                                            )}

                                            {topico.dataLeitura && (
                                                <span className="text-[10px] text-muted-foreground flex items-center gap-1 bg-muted px-2 py-0.5 rounded-full">
                                                    <CalendarDays className="h-3 w-3" /> Lido: {format(new Date(topico.dataLeitura), "dd/MM", { locale: ptBR })}
                                                </span>
                                            )}

                                            {topico.dataRevisao1 && !topico.rev1Concluida && (
                                                <span className="text-[10px] text-orange-600 font-bold flex items-center gap-1 bg-orange-50 px-2 py-0.5 rounded-full border border-orange-100">
                                                    <Clock className="h-3 w-3" /> R1: {format(new Date(topico.dataRevisao1), "dd/MM", { locale: ptBR })}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        {topico.status === "PENDENTE" ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-xs font-bold"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTopicToRead(topico);
                                                }}
                                            >
                                                Marcar Lido
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant={(!topico.rev1Concluida || !topico.rev2Concluida) ? "secondary" : "ghost"}
                                                className="h-8 text-xs font-bold"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!topico.rev1Concluida) completeReview(topico.id, 1);
                                                    else if (!topico.rev2Concluida) completeReview(topico.id, 2);
                                                }}
                                                disabled={topico.rev2Concluida}
                                            >
                                                {topico.rev1Concluida ? (topico.rev2Concluida ? "Finalizado" : "Concluir R2") : "Concluir R1"}
                                            </Button>
                                        )}

                                        <Button
                                            size="sm"
                                            variant="default"
                                            className="h-8 text-xs font-bold shadow-md"
                                            onClick={() => setSelectedTopic(topico)}
                                        >
                                            Questões
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal de Agendamento */}
            <Dialog open={!!topicToRead} onOpenChange={(open) => !open && setTopicToRead(null)}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Agendar Revisão</DialogTitle>
                        <DialogDescription>
                            Em quantos dias você deseja realizar a primeira revisão para <b>{topicToRead?.titulo}</b>?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid grid-cols-3 gap-3 py-4">
                        <Button variant="outline" onClick={() => handleMarkAsRead(1)} disabled={isSaving}>1 dia</Button>
                        <Button variant="outline" onClick={() => handleMarkAsRead(7)} disabled={isSaving}>7 dias</Button>
                        <Button variant="outline" onClick={() => handleMarkAsRead(30)} disabled={isSaving}>30 dias</Button>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setTopicToRead(null)}>Cancelar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Modal de Questões */}
            <Dialog open={!!selectedTopic} onOpenChange={(open) => !open && setSelectedTopic(null)}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle>Desempenho em Questões</DialogTitle>
                        <DialogDescription className="text-xs">{selectedTopic?.titulo}</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-6 py-4">
                        <div className="grid gap-2">
                            <Label htmlFor="q">Total de Questões Resolvidas</Label>
                            <Input id="q" type="number" value={questoes} onChange={(e) => setQuestoes(e.target.value)} placeholder="0" className="h-12 text-lg font-bold" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="a">Número de Acertos</Label>
                            <Input id="a" type="number" value={acertos} onChange={(e) => setAcertos(e.target.value)} placeholder="0" className="h-12 text-lg font-bold border-green-200 focus:border-green-500" />
                        </div>
                        <Button onClick={handleSavePerformance} disabled={isSaving} className="h-12 text-lg font-bold">
                            {isSaving ? "Salvando..." : "Salvar e Concluir"}
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
