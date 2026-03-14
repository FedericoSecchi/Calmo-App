import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";

/**
 * Case studies topic cluster - placeholder for future detailed case studies.
 * SEO: single H1, semantic structure for future content.
 */
const CaseStudiesPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <article>
          <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-4">
            Case Studies
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-8">
            Análisis en profundidad de proyectos y resultados. Contenido en preparación.
          </p>
          <nav aria-label="Navegación relacionada">
            <Link
              to="/portfolio"
              className="text-primary hover:underline underline-offset-2"
            >
              Ver portfolio →
            </Link>
          </nav>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default CaseStudiesPage;
