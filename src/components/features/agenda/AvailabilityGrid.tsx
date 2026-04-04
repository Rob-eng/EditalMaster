"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Clock, Save } from "lucide-react";

const DIAS_SEMANA = [
    { id: 0, nome: "Domingo" },
    { id: 1, nome: "Segunda" },
    { id: 2, nome: "Terça" },
    { id: 3, nome: "Quarta" },
    { id: 4, nome: "Quinta" },
    { id: 5, nome: "Sexta" },
    { id: 6, nome: "Sábado" },
];

import { saveAvailability } from "@/lib/actions/agenda-actions";

export default function AvailabilityGrid({ initialData = {} }: { initialData?: { [key: number]: number } }) {
    const [availability, setAvailability] = useState<{ [key: number]: number }>(initialData);
    const [isSaving, setIsSaving] = useState(false);

    const handleUpdateHours = (id: number, hours: string) => {
        const val = parseFloat(hours) || 0;
        setAvailability((prev) => ({ ...prev, [id]: val }));
    };

    const handleSave = async () => {
        setIsSaving(true);
        try {
            await saveAvailability(availability);
            alert("Grade de disponibilidade salva com sucesso!");
        } catch (error) {
            alert("Erro ao salvar disponibilidade.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Minha Carga Horária</CardTitle>
                    <CardDescription>
                        Configure quanto tempo você tem disponível para estudar em cada dia da semana.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {DIAS_SEMANA.map((dia) => (
                            <div key={dia.id} className="flex flex-col gap-2 p-4 border rounded-lg bg-card">
                                <label className="text-sm font-semibold">{dia.nome}</label>
                                <div className="relative">
                                    <Clock className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        type="number"
                                        placeholder="0h"
                                        className="pl-9"
                                        value={availability[dia.id] || ""}
                                        onChange={(e) => handleUpdateHours(dia.id, e.target.value)}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button onClick={handleSave} disabled={isSaving} className="gap-2 rounded-full px-8">
                            <Save className="h-4 w-4" />
                            {isSaving ? "Salvando..." : "Salvar Alterações"}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
