import { Navbar } from "@/components/layout/Navbar";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="relative flex min-h-screen flex-col bg-background">
            <Navbar />
            <main className="flex-1 container mx-auto max-w-7xl px-4 py-8">
                {children}
            </main>
        </div>
    );
}
