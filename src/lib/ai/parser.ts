export interface EditalTopic {
    titulo: string;
    importancia_estimada: "Alta" | "Média" | "Baixa";
}

export interface EditalSubject {
    disciplina: string;
    topicos: EditalTopic[];
}

/**
 * Serviço de parsing Inteligente via IA com suporte a schema estrito (Structured Outputs).
 * @param pdfText Texto bruto extraído do PDF do edital.
 * @returns Um array rígido tipado com as matérias e seus tópicos.
 */
export async function parseEditalWithAI(pdfText: string): Promise<EditalSubject[]> {
    console.log("Enviando texto bruto para a IA (Stub)...");

    // TODO: Em produção, substituir com a integração (e.g. `openai.chat.completions.create`)
    // Para garantir o output sem alucinações de schema usando as interfaces definidas no TypeScript
    // com zod e a ferramenta `response_format: { type: "json_schema" }`.

    return [
        {
            disciplina: "Direito Constitucional",
            topicos: [
                { titulo: "Direitos Fundamentais", importancia_estimada: "Alta" },
                { titulo: "Poder Executivo", importancia_estimada: "Média" }
            ]
        },
        {
            disciplina: "Língua Portuguesa",
            topicos: [
                { titulo: "Compreensão e Interpretação de Textos", importancia_estimada: "Alta" },
                { titulo: "Concordância Verbal e Nominal", importancia_estimada: "Alta" },
                { titulo: "Emprego da Crase", importancia_estimada: "Média" }
            ]
        }
    ];
}
