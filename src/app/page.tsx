import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-6 bg-background">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm lg:flex text-center flex-col gap-6">
        <h1 className="text-4xl font-extrabold tracking-tight lg:text-5xl text-primary">
          EditalMaster AI
        </h1>
        <p className="text-muted-foreground text-lg mb-8">
          Sua plataforma de gestão de estudos inteligente focada em aprovação.
        </p>
        <div className="flex gap-4">
          <Button size="lg" className="rounded-full shadow-lg">
            Começar Ingestão de Edital
          </Button>
          <Button variant="outline" size="lg" className="rounded-full">
            Configurar Agenda
          </Button>
        </div>
      </div>
    </main>
  );
}
