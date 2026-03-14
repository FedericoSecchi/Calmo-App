import { usePageSEO } from "@/hooks/usePageSEO";
import { SEOLayout } from "./SEOLayout";

export default function FocusCyclesPage() {
  usePageSEO(
    "Ciclos de enfoque y descanso para trabajar mejor",
    "Cómo alternar bloques de trabajo enfocado con pausas mejora la productividad y el bienestar. Ritmos de 45, 60 o 90 minutos y cómo Calmo te ayuda a mantenerlos.",
    "/focus-cycles"
  );

  return (
    <SEOLayout ctaText="Configurar mis ciclos de enfoque en Calmo">
      <article>
        <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-6">
          Ciclos de enfoque y descanso: trabajar mejor con pausas
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Trabajar en ciclos de enfoque (bloques de tiempo concentrado) seguidos de pausas cortas mejora la productividad y reduce el cansancio. Combinar estos ciclos con pausas que cuiden la vista y el cuerpo hace que el trabajo sea más sostenible.
        </p>

        <section className="mb-8">
          <h2 className="font-heading text-xl text-foreground mb-3">
            Qué son los ciclos de enfoque y por qué funcionan
          </h2>
          <p className="text-muted-foreground mb-4">
            Los ciclos de enfoque son bloques de tiempo en los que te dedicás a una tarea sin distracciones (por ejemplo 45, 60 o 90 minutos), seguidos de una pausa de 5–10 minutos. La idea es alinear el trabajo con la capacidad natural de atención: períodos de concentración intensa y descansos que permiten recuperar energía y enfoque.
          </p>
          <p className="text-muted-foreground">
            Este ritmo ayuda a evitar el agotamiento por jornadas continuas, reduce la fatiga visual y la tensión muscular, y suele mejorar la calidad del trabajo porque el cerebro tiene tiempo de procesar y recuperarse. La clave es respetar las pausas y usarlas para mover el cuerpo y relajar la vista.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-heading text-xl text-foreground mb-3">
            Cómo elegir la duración de tus ciclos
          </h2>
          <p className="text-muted-foreground mb-4">
            No hay una duración única: depende de tu tipo de tareas y de cómo te sentís. Bloques de 25–30 minutos (estilo Pomodoro) sirven para tareas muy enfocadas; 45–50 minutos suelen ser cómodos para trabajo profundo con una pausa corta; 60–90 minutos pueden funcionar si tenés reuniones o tareas que requieren más tiempo seguido. Lo importante es que al final de cada bloque haya una pausa real.
          </p>
          <p className="text-muted-foreground">
            En la pausa, conviene levantarse, mirar a la distancia (regla 20-20-20), estirar y si es posible caminar un poco. Así los ciclos no solo mejoran el enfoque sino también la postura y la salud visual.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-heading text-xl text-foreground mb-3">
            Cómo Calmo te ayuda a mantener ciclos de enfoque
          </h2>
          <p className="text-muted-foreground mb-4">
            Calmo te permite configurar la duración del bloque de trabajo y de la pausa según tu ritmo (por ejemplo 45 min trabajo / 5 min pausa, o 60 min / 10 min). Cuando llega el momento de la pausa, te avisa con un recordatorio suave y te ofrece la regla 20-20-20 y ejercicios cortos de movilidad. No tenés que vigilar el reloj: la app te guía para mantener el ciclo de forma constante.
          </p>
          <p className="text-muted-foreground">
            Si en algún momento necesitás posponer la pausa unos minutos, podés hacerlo. El objetivo es que los ciclos de enfoque y descanso se vuelvan un hábito y que trabajes con más foco y menos cansancio al final del día.
          </p>
        </section>
      </article>
    </SEOLayout>
  );
}
