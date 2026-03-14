import { Link } from "react-router-dom";
import { Logo } from "@/components/Logo";
import { Heart } from "lucide-react";

const SomoskosmosCredit = () => (
  <span className="text-muted-foreground">
    Diseñado por{" "}
    <a
      href="https://somoskosmos.com"
      target="_blank"
      rel="noopener noreferrer"
      className="text-foreground/80 hover:text-foreground underline underline-offset-2 transition-colors"
    >
      somoskosmos
    </a>
  </span>
);

interface FooterProps {
  variant?: "full" | "minimal";
}

export const Footer = ({ variant = "full" }: FooterProps) => {
  if (variant === "minimal") {
    return (
      <footer className="bg-card border-t border-border py-4" role="contentinfo">
        <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs">
          <span className="text-muted-foreground">© {new Date().getFullYear()} Calmo</span>
          <span className="hidden sm:inline text-muted-foreground">·</span>
          <SomoskosmosCredit />
        </div>
      </footer>
    );
  }

  return (
    <footer className="bg-card border-t border-border" role="contentinfo">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <Logo size="lg" />
            <p className="mt-4 text-muted-foreground max-w-sm">
              Hábitos saludables para trabajar con la computadora, sin dolor. Cuida tu postura y bienestar.
            </p>
            <p className="mt-4 text-sm text-muted-foreground flex items-center gap-1">
              Hecho con <Heart className="h-4 w-4 text-destructive" /> para trabajadores remotos
            </p>
          </div>
          
          <div>
            <h4 className="font-heading text-sm uppercase tracking-wider text-foreground mb-4">
              Producto
            </h4>
            <ul className="space-y-3">
              <li>
                <a href="#features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Funciones
                </a>
              </li>
              <li>
                <a href="#pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Precios
                </a>
              </li>
              <li>
                <a href="#how-it-works" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Cómo funciona
                </a>
              </li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-heading text-sm uppercase tracking-wider text-foreground mb-4">
              Legal
            </h4>
            <ul className="space-y-3">
              <li>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Privacidad
                </Link>
              </li>
              <li>
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                  Términos
                </Link>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="mt-12 pt-8 border-t border-border">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Calmo. Todos los derechos reservados.
            </p>
            <p className="text-xs text-muted-foreground bg-muted px-3 py-1.5 rounded-full">
              ⚠️ Calmo no reemplaza diagnóstico ni tratamiento médico.
            </p>
          </div>
          <p className="mt-4 text-center text-xs">
            <SomoskosmosCredit />
          </p>
        </div>
      </div>
    </footer>
  );
};
