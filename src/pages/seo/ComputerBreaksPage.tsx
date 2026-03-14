import { usePageSEO } from "@/hooks/usePageSEO";
import { SEOLayout } from "./SEOLayout";

export default function ComputerBreaksPage() {
  usePageSEO(
    "Pausas frente a la computadora: frecuencia e ideas",
    "Por qué tomar pausas al trabajar con la computadora, cada cuánto y qué hacer en cada pausa. Cómo Calmo te ayuda con recordatorios y ejercicios cortos.",
    "/computer-breaks"
  );

  return (
    <SEOLayout ctaText="Configurar mis pausas en Calmo">
      <article>
        <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-6">
          Pausas frente a la computadora: por qué y cada cuánto tomarlas
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Trabajar muchas horas seguidas frente a la pantalla aumenta el cansancio visual, la tensión muscular y el estrés. Tomar pausas cortas y regulares mejora la concentración, la postura y el bienestar sin que tengas que acordarte solo.
        </p>

        <section className="mb-8">
          <h2 className="font-heading text-xl text-foreground mb-3">
            Por qué son importantes las pausas
          </h2>
          <p className="text-muted-foreground mb-4">
            El cuerpo y la vista no están hechos para estar horas en la misma postura ni con el mismo enfoque. Sin pausas, es común que aparezcan dolor de cuello, espalda o muñecas, fatiga visual, dolor de cabeza y menor rendimiento. Las pausas permiten cambiar de postura, relajar la vista, estirar y volver con más energía y menos molestias.
          </p>
          <p className="text-muted-foreground">
            Además, breves descansos pueden mejorar la concentración y la creatividad: el cerebro se beneficia de pequeños “resets” en lugar de jornadas continuas de varias horas.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-heading text-xl text-foreground mb-3">
            Cada cuánto y qué hacer en cada pausa
          </h2>
          <p className="text-muted-foreground mb-4">
            Para la vista, la regla 20-20-20 es muy práctica: cada 20 minutos, mirar algo a 6 metros durante 20 segundos. Para el cuerpo, conviene pausas un poco más largas cada 45–90 minutos: levantarse, caminar un poco, estirar cuello, hombros, espalda y muñecas, y si es posible hidratarse. No hace falta que cada pausa sea muy larga; la clave es la regularidad.
          </p>
          <p className="text-muted-foreground">
            Podés alternar pausas “mini” (solo vista o un par de estiramientos en la silla) con pausas más completas cada una o dos horas. Lo importante es que los recordatorios se adapten a tu tipo de trabajo para que sea sostenible.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-heading text-xl text-foreground mb-3">
            Cómo Calmo te ayuda con las pausas
          </h2>
          <p className="text-muted-foreground mb-4">
            Calmo combina recordatorios de pausas con la regla 20-20-20 y con ejercicios cortos de movilidad. Podés elegir la frecuencia (por ejemplo, cada 45 o 60 minutos) y el tipo de pausa: solo recordatorio visual, o pausa con ejercicios guiados para cuello, espalda o muñecas. Todo se integra con tu flujo de trabajo para que no te interrumpa de golpe.
          </p>
          <p className="text-muted-foreground">
            Si estás en medio de una tarea crítica, podés posponer la pausa unos minutos. El objetivo es que las pausas se vuelvan un hábito natural y que tu cuerpo y tu vista agradezcan a lo largo del día.
          </p>
        </section>
      </article>
    </SEOLayout>
  );
}
