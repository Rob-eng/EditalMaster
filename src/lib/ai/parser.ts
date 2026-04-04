import { GoogleGenerativeAI } from "@google/generative-ai";

export interface EditalTopic {
    titulo: string;
    importancia_estimada: "Alta" | "Média" | "Baixa";
}

export interface EditalSubject {
    disciplina: string;
    topicos: EditalTopic[];
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

/**
 * Serviço de parsing Inteligente via IA Gemini processando PDF diretamente.
 */
export async function parseEditalWithAI(pdfBase64: string): Promise<EditalSubject[]> {
    // Lista de modelos para tentar (em ordem de preferência)
    const modelNames = ["gemini-1.5-flash-001", "gemini-1.5-flash", "gemini-1.5-pro"];
    let lastError: any = null;

    for (const modelName of modelNames) {
        try {
            console.log(`Tentando processar com modelo: ${modelName}...`);
            const model = genAI.getGenerativeModel({ model: modelName });

            const prompt = `Analise este edital em anexo e extraia o conteúdo programático (matérias e tópicos). 
          Diferencie regras do concurso de conteúdo programático.
          Retorne um JSON estrito seguindo este formato:
          [{ "disciplina": "Nome da Matéria", "topicos": [{ "titulo": "Nome do Tópico", "importancia_estimada": "Alta|Média|Baixa" }] }]
          Responda apenas com o JSON bruto, sem blocos de código ou markdown.`;

            const result = await model.generateContent([
                prompt,
                {
                    inlineData: {
                        data: pdfBase64,
                        mimeType: "application/pdf"
                    }
                }
            ]);

            const response = await result.response;
            const text = response.text().replace(/```json|```/g, "").trim();

            return JSON.parse(text) as EditalSubject[];
        } catch (e: any) {
            console.warn(`Falha com o modelo ${modelName}:`, e.message);
            lastError = e;
            // Se for erro de quota ou segurança, não adianta tentar outro modelo
            if (e.message.includes("quota") || e.message.includes("API key")) break;
            continue; // Tenta o próximo modelo
        }
    }

    throw new Error(`Todos os modelos falharam. Erro final: ${lastError?.message}`);
}
