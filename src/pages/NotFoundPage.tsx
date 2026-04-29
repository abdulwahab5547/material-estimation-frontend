import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/layout/Logo";

export function NotFoundPage() {
  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-blueprint px-4">
      <div className="text-center">
        <div className="mx-auto flex justify-center"><Logo size={40} /></div>
        <h1 className="mt-8 text-7xl font-bold text-primary">404</h1>
        <p className="mt-2 text-lg">This wall isn't on the blueprint.</p>
        <p className="text-muted-foreground">The page you were looking for doesn't exist.</p>
        <Button asChild className="mt-6">
          <Link to="/">Back to home</Link>
        </Button>
      </div>
    </div>
  );
}
