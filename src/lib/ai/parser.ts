export interface EditalTopic {
    titulo: string;
    importancia_estimada: "Alta" | "Média" | "Baixa";
}

export interface EditalSubject {
    disciplina: string;
    topicos: EditalTopic[];
}

/**
 * Serviço de parsing Inteligente via REST API do Gemini com diagnóstico de modelos.
 */
export async function parseEditalWithAI(pdfBase64: string): Promise<EditalSubject[]> {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("GEMINI_API_KEY não configurada no ambiente.");
    }

    // DIAGNÓSTICO: Listar modelos disponíveis
    try {
        const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;
        const listResponse = await fetch(listUrl);
        if (listResponse.ok) {
            const listData = await listResponse.json();
            const modelNames = listData.models?.map((m: any) => m.name).join(", ");
            console.log("LOG DIAGNÓSTICO - Modelos disponíveis para sua chave:", modelNames);
        } else {
            console.error("LOG DIAGNÓSTICO - Falha ao listar modelos:", await listResponse.text());
        }
    } catch (err) {
        console.error("LOG DIAGNÓSTICO - Erro na listagem:", err);
    }

    const model = "gemini-1.5-flash"; // Nome padrão
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    console.log(`Iniciando chamada REST para Gemini (${model})...`);

    const prompt = `Analise este edital em anexo e extraia o conteúdo programático (matérias e tópicos). 
    Diferencie regras do concurso de conteúdo programático.
    Retorne um JSON estrito seguindo este formato:
    [{ "disciplina": "Nome da Matéria", "topicos": [{ "titulo": "Nome do Tópico", "importancia_estimada": "Alta|Média|Baixa" }] }]
    Responda apenas com o JSON bruto, sem blocos de código ou markdown.`;

    const response = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [
                {
                    parts: [
                        { text: prompt },
                        {
                            inline_data: {
                                mime_type: "application/pdf",
                                data: pdfBase64,
                            },
                        },
                    ],
                },
            ],
            generationConfig: {
                response_mime_type: "application/json",
            }
        }),
    });

    if (!response.ok) {
        const errorText = await response.text();
        console.error(`Erro na API Gemini (REST): Status ${response.status}`, errorText);
        throw new Error(`Erro na IA: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
        console.error("Resposta vazia da Gemini:", JSON.stringify(data));
        throw new Error("A IA não retornou conteúdo.");
    }

    try {
        return JSON.parse(text) as EditalSubject[];
    } catch (e) {
        console.error("Erro ao processar JSON da IA:", text);
        throw new Error("Formato de resposta da IA inválido.");
    }
}
