"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

const data = [
    { name: "Estudado", value: 45, color: "#3b82f6" },
    { name: "Revisão", value: 20, color: "#f97316" },
    { name: "Pendente", value: 35, color: "#94a3b8" },
];

export function StudyAnalytics() {
    return (
        <Card className="h-full">
            <CardHeader>
                <CardTitle className="text-lg">Progresso Visão Geral</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-3 gap-4 w-full mt-4">
                    {data.map((item) => (
                        <div key={item.name} className="flex flex-col items-center">
                            <span className="text-xs text-muted-foreground">{item.name}</span>
                            <span className="text-lg font-bold" style={{ color: item.color }}>{item.value}%</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
