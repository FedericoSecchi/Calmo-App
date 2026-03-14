import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";

/**
 * Portfolio topic cluster - placeholder for future case studies and project showcases.
 * SEO: single H1, semantic sections ready for content.
 */
const PortfolioPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <article>
          <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-4">
            Portfolio
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-8">
            Proyectos y trabajos realizados. Contenido en preparación.
          </p>
          <nav aria-label="Navegación relacionada">
            <Link
              to="/case-studies"
              className="text-primary hover:underline underline-offset-2"
            >
              Ver case studies →
            </Link>
          </nav>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default PortfolioPage;
