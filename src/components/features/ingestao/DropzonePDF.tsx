"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DropzonePDF() {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);

    const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
        setError(null);
        if (fileRejections.length > 0) {
            setError("Apenas arquivos PDF são aceitos, ou o arquivo é muito grande (Máximo 10MB).");
            return;
        }

        if (acceptedFiles.length > 0) {
            setFile(acceptedFiles[0]);
        }
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: {
            'application/pdf': ['.pdf']
        },
        maxFiles: 1,
        maxSize: 10485760, // 10MB
    });

    const handleUpload = async () => {
        if (!file) return;

        try {
            const formData = new FormData();
            formData.append("file", file);

            console.log("Submitting file:", file.name);

            const response = await fetch("/api/ingestao", {
                method: "POST",
                body: formData,
            });

            const result = await response.json();
            console.log("Resultado da Ingestão da IA:", result);

            if (result.success) {
                alert("Edital processado com sucesso!");
            } else {
                setError(result.error || "Erro ao processar edital.");
            }
        } catch (err) {
            setError("Falha ao se comunicar com a API.");
        }
    };

    return (
        <div className="w-full">
            <div
                {...getRootProps()}
                className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center justify-center transition-colors cursor-pointer min-h-[300px]
          ${isDragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50"}`}
            >
                <input {...getInputProps()} />

                {file ? (
                    <div className="flex flex-col items-center gap-4 text-center">
                        <File className="w-12 h-12 text-primary" />
                        <div>
                            <p className="font-medium text-lg">{file.name}</p>
                            <p className="text-sm text-muted-foreground">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null); }}>
                            Remover Arquivo
                        </Button>
                    </div>
                ) : (
                    <div className="flex flex-col items-center gap-4 text-center">
                        <div className="p-4 bg-muted rounded-full">
                            <UploadCloud className="w-10 h-10 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-lg font-medium">Arraste e solte o seu Edital em PDF</p>
                            <p className="text-sm text-muted-foreground mt-1">ou clique para procurar em seus arquivos (Máx 10MB)</p>
                        </div>
                    </div>
                )}
            </div>

            {error && (
                <div className="mt-4 flex items-center gap-2 text-destructive bg-destructive/10 p-3 rounded-lg text-sm">
                    <AlertCircle className="w-4 h-4" />
                    {error}
                </div>
            )}

            {file && (
                <div className="mt-6 flex justify-end">
                    <Button size="lg" className="rounded-full shadow-lg" onClick={handleUpload}>
                        Processar Edital via IA
                    </Button>
                </div>
            )}
        </div>
    );
}
