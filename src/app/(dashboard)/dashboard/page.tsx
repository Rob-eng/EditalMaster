export default function DashboardPage() {
    return (
        <div className="flex flex-col gap-6">
            <h1 className="text-3xl font-bold tracking-tight">O que estudar hoje?</h1>
            <p className="text-muted-foreground">
                Nenhuma métrica ou edital ativo ainda. Por favor, importe seu primeiro edital.
            </p>
        </div>
    );
}
