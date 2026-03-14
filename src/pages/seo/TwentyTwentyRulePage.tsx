import { usePageSEO } from "@/hooks/usePageSEO";
import { SEOLayout } from "./SEOLayout";

export default function TwentyTwentyRulePage() {
  usePageSEO(
    "Regla 20-20-20 para la vista",
    "Qué es la regla 20-20-20, por qué reduce la fatiga visual y cómo Calmo te ayuda a aplicarla con recordatorios suaves mientras trabajás.",
    "/20-20-20-rule"
  );

  return (
    <SEOLayout ctaText="Usar recordatorios 20-20-20 en Calmo">
      <article>
        <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-6">
          Regla 20-20-20: cuidá tu vista frente a la pantalla
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Cada 20 minutos, mirá algo a 20 pies (unos 6 metros) durante 20 segundos. Es una de las formas más simples de reducir la fatiga visual y el cansancio al trabajar con la computadora.
        </p>

        <section className="mb-8">
          <h2 className="font-heading text-xl text-foreground mb-3">
            ¿Por qué funciona la regla 20-20-20?
          </h2>
          <p className="text-muted-foreground mb-4">
            Al fijar la vista en la pantalla durante mucho tiempo, el ojo parpadea menos y el cristalino se mantiene en la misma posición. Eso puede generar sequedad, visión borrosa y dolor de cabeza. Mirar a la distancia durante 20 segundos relaja el músculo ciliar y da un respiro a tus ojos.
          </p>
          <p className="text-muted-foreground">
            No hace falta salir a la calle: alcanza con mirar por la ventana, una pared al fondo de la habitación o un objeto a varios metros. Lo importante es cambiar el enfoque y la distancia.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-heading text-xl text-foreground mb-3">
            Cómo incorporar la regla 20-20-20 en tu día
          </h2>
          <p className="text-muted-foreground mb-4">
            El mayor obstáculo es acordarse. En pleno flujo de trabajo es fácil pasar una hora o más sin levantar la vista. Por eso conviene apoyarse en recordatorios suaves que no interrumpan de golpe: una pequeña pausa cada 20 minutos es suficiente para aplicar la regla sin perder el hilo del trabajo.
          </p>
          <p className="text-muted-foreground">
            Idealmente, combiná la regla 20-20-20 con pausas más largas cada 45–90 minutos para estirar, caminar un poco e hidratarte. Así cuidás tanto la vista como la postura y la circulación.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-heading text-xl text-foreground mb-3">
            Cómo Calmo te ayuda con la regla 20-20-20
          </h2>
          <p className="text-muted-foreground mb-4">
            Calmo incluye recordatorios basados en la regla 20-20-20 durante tus bloques de trabajo. En cada pausa corta te invita a mirar a la distancia durante 20 segundos, con un temporizador integrado para que no tengas que contar mentalmente.
          </p>
          <p className="text-muted-foreground">
            Los recordatorios se adaptan a tu ritmo de trabajo y podés posponerlos unos minutos si estás en medio de una tarea crítica. El objetivo es que la regla 20-20-20 se vuelva un hábito natural sin que tengas que acordarte solo.
          </p>
        </section>
      </article>
    </SEOLayout>
  );
}
