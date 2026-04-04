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
    try {
        // Tentamos o Flash 1.5 mais básico primeiro
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

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
        console.error("DEBUG: Erro ao chamar o modelo gemini-1.5-flash:", e.message);

        // Diagnóstico: Listar o que realmente podemos usar
        try {
            const modelsResult = await (genAI as any).listModels();
            if (modelsResult && modelsResult.models) {
                const names = modelsResult.models.map((m: any) => m.name).join(", ");
                console.log("LOG DIAGNÓSTICO - Modelos permitidos para sua chave:", names);
            }
        } catch (diagError) {
            console.error("LOG DIAGNÓSTICO - Falha ao listar modelos:", diagError);
        }

        throw e;
    }
}
