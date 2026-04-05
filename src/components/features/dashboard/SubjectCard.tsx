"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Clock, ChevronRight, BarChart3 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateTopicStatus, updateTopicPerformance } from "@/lib/actions/study-actions";
import { toast } from "sonner";

interface Topic {
    id: string;
    titulo: string;
    status: "PENDENTE" | "ESTUDADO" | "REVISAO" | "ATRASADO" | "CONCLUIDO";
    questoesResolvidas?: number;
    acertos?: number;
}

interface SubjectCardProps {
    disciplina: string;
    topicos: Topic[];
    importancia?: string;
}

export function SubjectCard({ disciplina, topicos, importancia }: SubjectCardProps) {
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [questoes, setQuestoes] = useState("");
    const [acertos, setAcertos] = useState("");
    const [isSaving, setIsSaving] = useState(false);

    const total = topicos.length;
    const concluido = topicos.filter(t => t.status === "CONCLUIDO" || t.status === "ESTUDADO").length;
    const porcentagem = total > 0 ? Math.round((concluido / total) * 100) : 0;

    const getStatusIcon = (status: Topic["status"]) => {
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
            // toast.success("Progresso salvo!");
        } catch (error) {
            console.error(error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog>
            <DialogTrigger render={
                <Card className="overflow-hidden transition-all hover:shadow-lg cursor-pointer border-l-4 border-l-primary group">
                    <CardHeader className="pb-2">
                        <div className="flex justify-between items-start">
                            <div>
                                <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{disciplina}</CardTitle>
                                <CardDescription>{topicos.length} tópicos extraídos</CardDescription>
                            </div>
                            <Badge variant={importancia === "Alta" ? "default" : "outline"} className="rounded-full">
                                {porcentagem}%
                            </Badge>
                        </div>
                        <Progress value={porcentagem} className="h-2 mt-4" />
                    </CardHeader>
                    <CardContent className="pt-2">
                        <div className="space-y-3">
                            {topicos.slice(0, 3).map((topico) => (
                                <div key={topico.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/30">
                                    {getStatusIcon(topico.status)}
                                    <span className="text-sm font-medium truncate flex-1">{topico.titulo}</span>
                                </div>
                            ))}
                            <div className="flex items-center justify-center pt-2 text-xs font-semibold text-primary gap-1">
                                Ver tudo e atualizar <ChevronRight className="h-3 w-3" />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            } />
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold">{disciplina}</DialogTitle>
                    <DialogDescription>Gerencie seu progresso em cada tópico desta matéria.</DialogDescription>
                </DialogHeader>

                <div className="space-y-4 mt-4">
                    {topicos.map((topico) => (
                        <div key={topico.id} className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-accent/50 transition-all border-l-4 border-l-muted">
                            <div className="flex flex-col gap-1 max-w-[60%]">
                                <span className="font-semibold text-sm leading-tight">{topico.titulo}</span>
                                <div className="flex gap-2 items-center">
                                    <Badge variant="secondary" className="text-[10px] h-4 px-1">
                                        {topico.status}
                                    </Badge>
                                    {topico.questoesResolvidas ? (
                                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                                            <BarChart3 className="h-3 w-3" /> {topico.acertos}/{topico.questoesResolvidas} acertos
                                        </span>
                                    ) : null}
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <Button
                                    size="sm"
                                    variant={topico.status === "PENDENTE" ? "outline" : "secondary"}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        updateTopicStatus(topico.id, topico.status === "PENDENTE" ? "CONCLUIDO" : "PENDENTE");
                                    }}
                                >
                                    {topico.status === "PENDENTE" ? "Marcar Lido" : "Revisar"}
                                </Button>

                                <Dialog>
                                    <DialogTrigger render={
                                        <Button size="sm" variant="default" onClick={() => setSelectedTopic(topico)}>
                                            Questões
                                        </Button>
                                    } />
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Desempenho em: {topico.titulo}</DialogTitle>
                                        </DialogHeader>
                                        <div className="grid gap-4 py-4">
                                            <div className="grid gap-2">
                                                <Label htmlFor="q">Total de Questões</Label>
                                                <Input id="q" type="number" value={questoes} onChange={(e) => setQuestoes(e.target.value)} placeholder="0" />
                                            </div>
                                            <div className="grid gap-2">
                                                <Label htmlFor="a">Acertos</Label>
                                                <Input id="a" type="number" value={acertos} onChange={(e) => setAcertos(e.target.value)} placeholder="0" />
                                            </div>
                                            <Button onClick={handleSavePerformance} disabled={isSaving}>
                                                {isSaving ? "Salvando..." : "Salvar Progresso"}
                                            </Button>
                                        </div>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    ))}
                </div>
            </DialogContent>
        </Dialog>
    );
}
