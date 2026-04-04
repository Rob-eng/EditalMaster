"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle, Clock } from "lucide-react";

interface Topic {
    id: string;
    titulo: string;
    status: "PENDENTE" | "ESTUDADO" | "REVISAO" | "ATRASADO" | "CONCLUIDO";
}

interface SubjectCardProps {
    disciplina: string;
    topicos: Topic[];
}

export function SubjectCard({ disciplina, topicos }: SubjectCardProps) {
    const total = topicos.length;
    const concluido = topicos.filter(t => t.status === "CONCLUIDO" || t.status === "ESTUDADO").length;
    const porcentagem = Math.round((concluido / total) * 100);

    const getStatusIcon = (status: Topic["status"]) => {
        switch (status) {
            case "CONCLUIDO": return <CheckCircle2 className="h-4 w-4 text-green-500" />;
            case "ESTUDADO": return <CheckCircle2 className="h-4 w-4 text-blue-500" />;
            case "REVISAO": return <Clock className="h-4 w-4 text-orange-500" />;
            case "ATRASADO": return <Circle className="h-4 w-4 text-red-500" fill="currentColor" opacity={0.5} />;
            default: return <Circle className="h-4 w-4 text-muted-foreground" />;
        }
    };

    return (
        <Card className="overflow-hidden transition-all hover:shadow-md">
            <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                    <CardTitle className="text-xl font-bold">{disciplina}</CardTitle>
                    <Badge variant="outline" className="rounded-full">
                        {porcentagem}% Concluído
                    </Badge>
                </div>
                <Progress value={porcentagem} className="h-2 mt-2" />
            </CardHeader>
            <CardContent className="pt-2">
                <div className="space-y-3">
                    {topicos.slice(0, 3).map((topico) => (
                        <div key={topico.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
                            {getStatusIcon(topico.status)}
                            <span className="text-sm font-medium truncate flex-1">{topico.titulo}</span>
                        </div>
                    ))}
                    {topicos.length > 3 && (
                        <p className="text-xs text-muted-foreground text-center pt-2">
                            + {topicos.length - 3} tópicos restantes
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
