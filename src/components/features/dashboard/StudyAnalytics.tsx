"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from "recharts";

interface AnalyticsData {
    name: string;
    value: number;
    color: string;
}

interface PerformanceData {
    subject: string;
    acertos: number;
    total: number;
}

interface StudyAnalyticsProps {
    data: AnalyticsData[];
    performanceData?: PerformanceData[];
}

export function StudyAnalytics({ data, performanceData = [] }: StudyAnalyticsProps) {
    const totalTopics = data.reduce((acc, curr) => acc + curr.value, 0);

    return (
        <div className="flex flex-col gap-6">
            <Card className="shadow-lg border-t-4 border-t-primary">
                <CardHeader className="pb-0">
                    <CardTitle className="text-lg font-bold">Progresso Geral</CardTitle>
                </CardHeader>
                <CardContent className="flex flex-col items-center">
                    <div className="h-[200px] w-full relative">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={data}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
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
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.12)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                            <span className="text-xl font-bold block">{totalTopics}</span>
                            <span className="text-[8px] text-muted-foreground uppercase tracking-widest">Tópicos</span>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {performanceData.length > 0 && (
                <Card className="shadow-lg">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-lg font-bold">Desempenho (Questões)</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-[250px] w-full">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={performanceData} layout="vertical" margin={{ left: -20, right: 40 }}>
                                    <CartesianGrid strokeDasharray="3 3" horizontal={false} strokeOpacity={0.1} />
                                    <XAxis type="number" hide />
                                    <YAxis
                                        dataKey="subject"
                                        type="category"
                                        width={80}
                                        fontSize={10}
                                        tick={{ fill: 'currentColor', opacity: 0.7 }}
                                    />
                                    <Tooltip
                                        cursor={{ fill: 'transparent' }}
                                        content={({ active, payload }) => {
                                            if (active && payload && payload.length) {
                                                const data = payload[0].payload;
                                                const percent = Math.round((data.acertos / data.total) * 100);
                                                return (
                                                    <div className="bg-white p-3 rounded-lg shadow-xl border text-[10px]">
                                                        <p className="font-bold border-b pb-1 mb-1">{data.subject}</p>
                                                        <p className="text-muted-foreground">Total: {data.total}</p>
                                                        <p className="text-green-600 font-bold text-xs">Acertos: {data.acertos} ({percent}%)</p>
                                                    </div>
                                                );
                                            }
                                            return null;
                                        }}
                                    />
                                    <Bar dataKey="total" fill="#f1f5f9" radius={[0, 4, 4, 0]} barSize={14} />
                                    <Bar dataKey="acertos" fill="#22c55e" radius={[0, 4, 4, 0]} barSize={14} />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
