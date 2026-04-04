import Link from "next/link";
import { ModeToggle } from "@/components/mode-toggle";
import { BookOpen, LogOut } from "lucide-react";
import { auth, signOut } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export async function Navbar() {
    const session = await auth();
    const isLoggedIn = !!session?.user;

    return (
        <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container mx-auto max-w-7xl flex h-16 items-center px-4">
                <div className="flex gap-4 md:gap-8 items-center cursor-pointer">
                    <Link href="/" className="flex items-center space-x-2">
                        <BookOpen className="h-6 w-6 text-primary" />
                        <span className="hidden font-bold sm:inline-block">
                            EditalMaster AI
                        </span>
                    </Link>
                    <nav className="flex items-center space-x-6 text-sm font-medium text-muted-foreground">
                        {isLoggedIn && (
                            <>
                                <Link href="/dashboard" className="transition-colors hover:text-foreground">Dashboard</Link>
                                <Link href="/agenda" className="transition-colors hover:text-foreground">Agenda</Link>
                            </>
                        )}
                    </nav>
                </div>

                <div className="flex flex-1 items-center justify-end space-x-4">
                    <ModeToggle />
                    {isLoggedIn ? (
                        <form action={async () => {
                            "use server";
                            await signOut();
                        }}>
                            <Button variant="ghost" size="sm" className="gap-2">
                                <LogOut className="h-4 w-4" />
                                Sair
                            </Button>
                        </form>
                    ) : (
                        <Link href="/login">
                            <Button variant="outline" size="sm">Entrar</Button>
                        </Link>
                    )}
                </div>
            </div>
        </header>
    );
}
