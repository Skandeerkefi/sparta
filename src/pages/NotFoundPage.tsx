import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";

function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      
      <main className="flex-grow container flex flex-col items-center justify-center py-12 text-center">
        <h1 className="text-9xl font-bold gradient-text mb-4">404</h1>
        <h2 className="text-3xl font-semibold mb-6">Page Not Found</h2>
        <p className="text-muted-foreground max-w-md mb-8">
          The page you are looking for doesn't exist or has been moved.
          Let's get you back to the homepage.
        </p>
        <Button size="lg" asChild>
          <Link to="/">Return Home</Link>
        </Button>
      </main>
      
      <Footer />
    </div>
  );
}

export default NotFoundPage;