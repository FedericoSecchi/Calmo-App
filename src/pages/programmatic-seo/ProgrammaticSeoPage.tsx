import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";

/**
 * Programmatic SEO topic cluster - placeholder for future content.
 * SEO: single H1, semantic structure.
 */
const ProgrammaticSeoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <article>
          <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-4">
            Programmatic SEO
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-8">
            Contenido sobre SEO programático. En preparación.
          </p>
          <nav aria-label="Navegación relacionada">
            <Link
              to="/image-seo"
              className="text-primary hover:underline underline-offset-2"
            >
              Image SEO →
            </Link>
          </nav>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default ProgrammaticSeoPage;
