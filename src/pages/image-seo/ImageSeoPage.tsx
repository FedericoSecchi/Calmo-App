import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Link } from "react-router-dom";

/**
 * Image SEO topic cluster - placeholder for future content.
 * SEO: single H1, semantic structure. When adding images, use alt, width, height, loading="lazy".
 */
const ImageSeoPage = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="container mx-auto px-4 py-16">
        <article>
          <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-4">
            Image SEO
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mb-8">
            Optimización de imágenes para buscadores y rendimiento. Contenido en preparación.
          </p>
          <nav aria-label="Navegación relacionada">
            <Link
              to="/programmatic-seo"
              className="text-primary hover:underline underline-offset-2"
            >
              Programmatic SEO →
            </Link>
          </nav>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default ImageSeoPage;
