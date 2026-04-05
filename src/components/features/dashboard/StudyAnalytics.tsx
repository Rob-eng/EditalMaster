"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from "recharts";

interface AnalyticsData {
    name: string;
    value: number;
    color: string;
}

interface StudyAnalyticsProps {
    data: AnalyticsData[];
}

export function StudyAnalytics({ data }: StudyAnalyticsProps) {
    // Calcula o total para exibir no centro se desejado
    const total = data.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <Card className="h-full shadow-lg border-t-4 border-t-primary">
            <CardHeader className="pb-0">
                <CardTitle className="text-lg font-bold">Progresso Geral</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center">
                <div className="h-[240px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={90}
                                paddingAngle={8}
                                dataKey="value"
                                animationDuration={1200}
                                stroke="none"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    borderRadius: '12px',
                                    border: 'none',
                                    boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
                                    backgroundColor: 'white'
                                }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                        <span className="text-2xl font-bold block">{total}</span>
                        <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Tópicos</span>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-3 w-full mt-4">
                    {data.map((item) => (
                        <div key={item.name} className="flex flex-col p-3 rounded-2xl bg-muted/40 items-start">
                            <div className="flex items-center gap-2 mb-1">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                                <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">{item.name}</span>
                            </div>
                            <span className="text-xl font-black" style={{ color: item.color }}>{item.value}</span>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
}
