import { NextResponse } from 'next/server';
import { parseEditalWithAI } from '@/lib/ai/parser';

export async function POST(request: Request) {
    try {
        const formData = await request.formData();
        const file = formData.get('file') as File;

        if (!file) {
            return NextResponse.json({ error: 'Nenhum arquivo enviado.' }, { status: 400 });
        }

        // Idealmente usaríamos algo como `pdf-parse`
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        // Abstração da lógica para obter o texto do PDF
        const mockTextContent = `Simulando extração de dados do edital ${file.name} com ${buffer.length} bytes...`;

        // Utiliza parser estrito da IA garantindo o contrato definido
        const parsedData = await parseEditalWithAI(mockTextContent);

        // WIP: Aqui o Prisma seria chamado para salvar no banco
        // const novoEdital = await prisma.edital.create({ ... })
        // for (const disciplina of parsedData) {
        //    await prisma.materia.create({ ... })
        // }

        return NextResponse.json({ success: true, data: parsedData });
    } catch (error) {
        console.error('Erro na Ingestão:', error);
        return NextResponse.json({ error: 'Erro interno ao processar o Edital.' }, { status: 500 });
    }
}
