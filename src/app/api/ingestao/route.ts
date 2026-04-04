import { NextResponse } from 'next/server';
import { parseEditalWithAI } from '@/lib/ai/parser';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';

export async function POST(request: Request) {
    try {
        const session = await auth();
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Não autorizado.' }, { status: 401 });
        }

        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
        }

        const arrayBuffer = await file.arrayBuffer();
        const base64 = Buffer.from(arrayBuffer).toString('base64');

        // Processamento real via Gemini
        const parsedData = await parseEditalWithAI(base64);

        // Persistência no Banco de Dados via Transação
        const edital = await prisma.$transaction(async (tx) => {
            const newEdital = await tx.edital.create({
                data: {
                    userId: session.user?.id!,
                    titulo: file.name.replace('.pdf', ''),
                    banca: "IA Extracted",
                    materias: {
                        create: parsedData.map((m) => ({
                            nome: m.disciplina,
                            importancia: "Alta", // IA simplificada
                            topicos: {
                                create: m.topicos.map((t) => ({
                                    titulo: t.titulo,
                                    status: "PENDENTE",
                                })),
                            },
                        })),
                    },
                },
            });
            return newEdital;
        });

        return NextResponse.json({ success: true, data: edital });
    } catch (error) {
        console.error('Erro na Ingestão:', error);
        return NextResponse.json({ error: 'Erro interno ao processar o Edital.' }, { status: 500 });
    }
}
