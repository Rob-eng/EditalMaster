"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Clock, ChevronRight, BarChart3, CalendarDays, Settings2, Split, Trash2, Calendar as CalendarIcon, Check } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { updateTopicStatus, updateTopicPerformance, markAsReadWithReview, completeReview, editMateria, splitMateria, updateTopicoTitle, joinMaterias } from "@/lib/actions/study-actions";
import { toast } from "sonner";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

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
    id: string;
    disciplina: string;
    topicos: Topic[];
    importancia?: string;
}

export function SubjectCard({ id, disciplina, topicos, importancia: initialImportancia }: SubjectCardProps) {
    const [selectedTopic, setSelectedTopic] = useState<Topic | null>(null);
    const [topicToRead, setTopicToRead] = useState<Topic | null>(null);
    const [topicToReview, setTopicToReview] = useState<Topic | null>(null);

    // Edição Matéria
    const [isEditingMateria, setIsEditingMateria] = useState(false);
    const [editNome, setEditNome] = useState(disciplina);
    const [editImp, setEditImp] = useState(initialImportancia || "Média");

    // Divisão Matéria
    const [isSplitting, setIsSplitting] = useState(false);
    const [splitName, setSplitName] = useState(`${disciplina} - Parte 2`);
    const [selectedTopicsForSplit, setSelectedTopicsForSplit] = useState<string[]>([]);

    const [questoes, setQuestoes] = useState("");
    const [acertos, setAcertos] = useState("");
    const [customDate, setCustomDate] = useState<Date | undefined>(new Date());
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

    const handleAction = async (type: "read" | "review", days: number | null, custom?: boolean) => {
        const target = type === "read" ? topicToRead : topicToReview;
        if (!target) return;
        setIsSaving(true);
        try {
            const dateToUse = custom ? customDate : undefined;
            if (type === "read") {
                await markAsReadWithReview(target.id, days, dateToUse);
                setTopicToRead(null);
            } else {
                await completeReview(target.id, target.rev1Concluida ? 2 : 1, days, dateToUse);
                setTopicToReview(null);
            }
            toast.success("Ação realizada com sucesso!");
        } catch (error) {
            toast.error("Erro ao processar.");
        } finally {
            setIsSaving(false);
            setCustomDate(new Date());
        }
    };

    const handleEditMateria = async () => {
        setIsSaving(true);
        try {
            await editMateria(id, { nome: editNome, importancia: editImp });
            setIsEditingMateria(false);
            toast.success("Matéria atualizada!");
        } catch (error) {
            toast.error("Erro ao atualizar!");
        } finally {
            setIsSaving(false);
        }
    };

    const handleSplit = async () => {
        if (selectedTopicsForSplit.length === 0) return;
        setIsSaving(true);
        try {
            await splitMateria(id, splitName, selectedTopicsForSplit);
            setIsSplitting(false);
            toast.success("Matéria dividida com sucesso!");
        } catch (error) {
            toast.error("Erro ao dividir matéria.");
        } finally {
            setIsSaving(false);
        }
    };

    const toggleTopicSelection = (tid: string) => {
        setSelectedTopicsForSplit(prev =>
            prev.includes(tid) ? prev.filter(x => x !== tid) : [...prev, tid]
        );
    };

    return (
        <>
            <Dialog>
                <DialogTrigger render={
                    <Card className="overflow-hidden transition-all hover:shadow-lg cursor-pointer border-l-4 border-l-primary group relative">
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
                                    <CardDescription>{topicos.length} tópicos</CardDescription>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                    <Badge variant={initialImportancia === "Alta" ? "default" : "outline"} className="rounded-full uppercase text-[9px] font-black">
                                        {porcentagemEstudo}% Estudado
                                    </Badge>
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => { e.stopPropagation(); setIsEditingMateria(true); }}
                                    >
                                        <Settings2 className="h-3 w-3" />
                                    </Button>
                                </div>
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
                                                <span className="text-[10px] font-black text-green-700 bg-green-50 px-1.2 py-0.2 rounded border border-green-100">
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
                        <div className="flex justify-between items-center pr-8">
                            <DialogTitle className="text-2xl font-bold flex items-center gap-3">
                                {disciplina}
                                {totalQuestoesMateria > 0 && (
                                    <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full font-black">
                                        MÉDIA: {porcentagemAcertoMateria}%
                                    </span>
                                )}
                            </DialogTitle>
                            <Button variant="outline" size="sm" className="h-8 gap-2" onClick={() => setIsSplitting(true)}>
                                <Split className="h-3 w-3" /> Dividir Matéria
                            </Button>
                        </div>
                        <DialogDescription>Controle de leitura, revisões e edição do edital.</DialogDescription>
                    </DialogHeader>

                    <div className="grid gap-3 mt-6">
                        {topicos.map((topico) => {
                            const topicAccuracy = topico.questoesResolvidas && topico.questoesResolvidas > 0
                                ? Math.round(((topico.acertos || 0) / topico.questoesResolvidas) * 100)
                                : null;

                            return (
                                <div key={topico.id} className="flex items-center justify-between p-3 rounded-xl border bg-card hover:border-primary/30 transition-all shadow-sm group">
                                    <div className="flex flex-col gap-1 max-w-[60%] flex-1">
                                        <div className="flex items-center gap-2">
                                            {editingTopicId === topico.id ? (
                                                <div className="flex items-center gap-2 w-full">
                                                    <Input
                                                        value={editTopicTitle}
                                                        onChange={(e) => setEditTopicTitle(e.target.value)}
                                                        className="h-7 text-xs py-0"
                                                        autoFocus
                                                    />
                                                    <Button size="icon" className="h-6 w-6" onClick={() => handleUpdateTopicTitle(topico.id)}><Check className="h-3 w-3" /></Button>
                                                </div>
                                            ) : (
                                                <span className="font-bold text-xs leading-tight text-foreground truncate">{topico.titulo}</span>
                                            )}

                                            {topicAccuracy !== null && (
                                                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${topicAccuracy >= 70 ? 'bg-green-100 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                                    {topicAccuracy}%
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex gap-2 items-center flex-wrap">
                                            <Badge variant={topico.status === "PENDENTE" ? "outline" : "secondary"} className="text-[9px] uppercase h-3 px-1 font-black">
                                                {topico.status}
                                            </Badge>

                                            {topico.dataDesempenho && (
                                                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                                    Q: {format(new Date(topico.dataDesempenho), "dd/MM", { locale: ptBR })}
                                                </span>
                                            )}

                                            {topico.dataLeitura && !topico.dataRevisao1 && (
                                                <span className="text-[10px] text-blue-600 font-bold flex items-center gap-1">
                                                    Lido: {format(new Date(topico.dataLeitura), "dd/MM", { locale: ptBR })}
                                                </span>
                                            )}

                                            {topico.dataRevisao1 && !topico.rev1Concluida && (
                                                <span className={cn(
                                                    "text-[10px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-full",
                                                    new Date(topico.dataRevisao1) < new Date() ? "bg-red-50 text-red-600" : "bg-orange-50 text-orange-600"
                                                )}>
                                                    R1: {format(new Date(topico.dataRevisao1), "dd/MM", { locale: ptBR })}
                                                </span>
                                            )}

                                            {topico.rev1Concluida && topico.dataRevisao2 && !topico.rev2Concluida && (
                                                <span className={cn(
                                                    "text-[10px] font-bold flex items-center gap-1 px-2 py-0.5 rounded-full",
                                                    new Date(topico.dataRevisao2) < new Date() ? "bg-red-50 text-red-600" : "bg-blue-50 text-blue-600"
                                                )}>
                                                    R2: {format(new Date(topico.dataRevisao2), "dd/MM", { locale: ptBR })}
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2">
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-primary" onClick={() => {
                                            setEditingTopicId(topico.id);
                                            setEditTopicTitle(topico.titulo);
                                        }}>
                                            <Settings2 className="h-3 w-3" />
                                        </Button>
                                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-500" onClick={() => handleDeleteTopic(topico.id)}>
                                            <Trash2 className="h-3 w-3" />
                                        </Button>
                                    </div>

                                    <div className="flex gap-1.5 ml-2">
                                        {topico.status === "PENDENTE" ? (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                className="h-8 text-[10px] font-bold px-2"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setTopicToRead(topico);
                                                }}
                                            >
                                                Lido
                                            </Button>
                                        ) : (
                                            <Button
                                                size="sm"
                                                variant={(!topico.rev1Concluida || !topico.rev2Concluida) ? "secondary" : "ghost"}
                                                className="h-8 text-[10px] font-bold px-2"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    if (!topico.rev2Concluida) setTopicToReview(topico);
                                                }}
                                                disabled={topico.rev2Concluida}
                                            >
                                                {topico.rev1Concluida ? (topico.rev2Concluida ? "Finalizado" : "Revisar R2") : "Revisar R1"}
                                            </Button>
                                        )}

                                        <Button
                                            size="sm"
                                            variant="default"
                                            className="h-8 text-[10px] font-bold shadow-md px-2"
                                            onClick={() => setSelectedTopic(topico)}
                                        >
                                            Questões
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}

                        <div className="mt-4 flex gap-2 p-2 bg-muted/20 border-t border-dashed">
                            <Input
                                placeholder="Adicionar novo tópico..."
                                value={newTopicTitle}
                                onChange={(e) => setNewTopicTitle(e.target.value)}
                                className="h-8 text-xs"
                                onKeyDown={(e) => e.key === 'Enter' && handleAddTopic()}
                            />
                            <Button size="sm" className="h-8 px-4 font-bold" onClick={handleAddTopic} disabled={isSaving}>
                                + Add
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal de Agendamento (Leitura ou Revisão) */}
            <Dialog
                open={!!topicToRead || !!topicToReview}
                onOpenChange={(open) => {
                    if (!open) { setTopicToRead(null); setTopicToReview(null); }
                }}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Próximo Passo: {topicToRead ? "Revisão R1" : "Revisão R2"}</DialogTitle>
                        <DialogDescription>
                            Para o tópico <b>{topicToRead?.titulo || topicToReview?.titulo}</b>.
                            Escolha quando deseja revisar ou finalize agora.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-col gap-4 py-4">
                        <Label className="text-xs uppercase font-black text-muted-foreground">Sugestões Rápidas</Label>
                        <div className="grid grid-cols-3 gap-2">
                            <Button variant="outline" onClick={() => handleAction(topicToRead ? "read" : "review", 1)} disabled={isSaving}>1 dia</Button>
                            <Button variant="outline" onClick={() => handleAction(topicToRead ? "read" : "review", 7)} disabled={isSaving}>7 dias</Button>
                            <Button variant="outline" onClick={() => handleAction(topicToRead ? "read" : "review", 30)} disabled={isSaving}>30 dias</Button>
                        </div>

                        <Label className="text-xs uppercase font-black text-muted-foreground mt-2">Personalizado</Label>
                        <div className="flex items-center gap-2">
                            <Popover>
                                <PopoverTrigger render={
                                    <Button variant="outline" className="flex-1 justify-start gap-2 h-10 font-bold">
                                        <CalendarIcon className="h-4 w-4" />
                                        {customDate ? format(customDate, "dd 'de' MMMM", { locale: ptBR }) : "Escolher data"}
                                    </Button>
                                } />
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        mode="single"
                                        selected={customDate}
                                        onSelect={setCustomDate}
                                        initialFocus
                                    />
                                </PopoverContent>
                            </Popover>
                            <Button
                                onClick={() => handleAction(topicToRead ? "read" : "review", null, true)}
                                disabled={!customDate || isSaving}
                                className="h-10 px-4"
                            >
                                <Check className="h-4 w-4" />
                            </Button>
                        </div>

                        <div className="pt-4 border-t">
                            <Button
                                variant="secondary"
                                className="w-full h-12 font-black gap-2"
                                onClick={() => handleAction(topicToRead ? "read" : "review", null)}
                                disabled={isSaving}
                            >
                                <CheckCircle2 className="h-5 w-5" /> Finalizar Agora
                            </Button>
                        </div>
                    </div>
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

            {/* Modal de Edição de Matéria */}
            <Dialog open={isEditingMateria} onOpenChange={setIsEditingMateria}>
                <DialogContent className="sm:max-w-[450px]">
                    <DialogHeader>
                        <DialogTitle>Editar Matéria</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Nome da Matéria</Label>
                            <Input value={editNome} onChange={(e) => setEditNome(e.target.value)} />
                        </div>
                        <div className="grid gap-2">
                            <Label>Importância</Label>
                            <div className="flex gap-2">
                                {["Alta", "Média", "Baixa"].map((level) => (
                                    <Button
                                        key={level}
                                        type="button"
                                        variant={editImp === level ? "default" : "outline"}
                                        className="flex-1"
                                        onClick={() => setEditImp(level)}
                                    >
                                        {level}
                                    </Button>
                                ))}
                            </div>
                        </div>
                        <Button onClick={handleEditMateria} disabled={isSaving} className="mt-4">
                            Salvar Alterações
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Modal de Divisão de Matéria */}
            <Dialog open={isSplitting} onOpenChange={(open) => { setIsSplitting(open); if (!open) setSelectedTopicsForSplit([]); }}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle>Dividir Matéria</DialogTitle>
                        <DialogDescription>Selecione os tópicos que deseja mover para uma nova matéria.</DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="grid gap-2">
                            <Label>Nome da Nova Matéria</Label>
                            <Input value={splitName} onChange={(e) => setSplitName(e.target.value)} />
                        </div>
                        <Label className="mt-2">Tópicos para Mover ({selectedTopicsForSplit.length})</Label>
                        <div className="max-h-[300px] overflow-y-auto border rounded-xl p-2 space-y-1">
                            {topicos.map((t) => (
                                <div
                                    key={t.id}
                                    className={cn(
                                        "flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors",
                                        selectedTopicsForSplit.includes(t.id) ? "bg-primary/10 border-primary/20" : "hover:bg-muted"
                                    )}
                                    onClick={() => toggleTopicSelection(t.id)}
                                >
                                    <div className={cn(
                                        "w-4 h-4 rounded border flex items-center justify-center",
                                        selectedTopicsForSplit.includes(t.id) ? "bg-primary border-primary" : "border-muted-foreground/30"
                                    )}>
                                        {selectedTopicsForSplit.includes(t.id) && <Check className="h-3 w-3 text-white" />}
                                    </div>
                                    <span className="text-sm truncate">{t.titulo}</span>
                                </div>
                            ))}
                        </div>
                        <Button onClick={handleSplit} disabled={isSaving || selectedTopicsForSplit.length === 0} className="mt-4">
                            Mover Tópicos Selecionados
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
