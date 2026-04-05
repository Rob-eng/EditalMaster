"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { UploadCloud, File, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";

export function DropzonePDF() {
    const [file, setFile] = useState<File | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [isProcessing, setIsProcessing] = useState(false);
    const [progress, setProgress] = useState(0);

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
        setIsProcessing(true);
        setProgress(10);

        const interval = setInterval(() => {
            setProgress(prev => (prev >= 90 ? 90 : prev + 10));
        }, 1500);

        try {
            const formData = new FormData();
            formData.append("file", file);

            const response = await fetch("/api/ingestao", {
                method: "POST",
                body: formData,
            });

            clearInterval(interval);
            setProgress(100);

            const result = await response.json();
            if (result.success) {
                toast.success("Edital processado com sucesso!");
                window.location.href = "/dashboard";
            } else {
                setError(result.error || "Erro ao processar edital.");
                setIsProcessing(false);
                setProgress(0);
            }
        } catch (err) {
            if (interval) clearInterval(interval);
            setError("Falha ao se comunicar com a API.");
            setIsProcessing(false);
            setProgress(0);
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
                        <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setFile(null); }} disabled={isProcessing}>
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

            {isProcessing && (
                <div className="mt-8 space-y-4 bg-muted/30 p-6 rounded-2xl border border-primary/20">
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-sm font-bold text-primary animate-pulse">Processando Edital com IA...</span>
                        <span className="text-sm font-black">{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-3 shadow-inner" />
                    <p className="text-[10px] text-center text-muted-foreground uppercase tracking-widest font-black">
                        Extraindo matérias e tópicos. Por favor, aguarde.
                    </p>
                </div>
            )}

            {file && !isProcessing && (
                <div className="mt-6 flex justify-end">
                    <Button size="lg" className="rounded-full shadow-lg font-bold px-8 h-14" onClick={handleUpload}>
                        Processar Edital via IA
                    </Button>
                </div>
            )}
        </div>
    );
}
