import { usePageSEO } from "@/hooks/usePageSEO";
import { SEOLayout } from "./SEOLayout";

export default function NeckPainComputerPage() {
  usePageSEO(
    "Dolor de cuello por computadora",
    "Causas del dolor de cuello al trabajar con la PC, cómo prevenirlo con postura y pausas, y cómo Calmo te ayuda con recordatorios y ejercicios para el cuello.",
    "/neck-pain-computer"
  );

  return (
    <SEOLayout ctaText="Prevenir dolor de cuello con Calmo">
      <article>
        <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-6">
          Dolor de cuello por computadora: causas y prevención
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          El dolor de cuello y cervicales es muy frecuente en quienes pasan muchas horas frente a la pantalla. La postura fija, la cabeza adelantada y la falta de pausas suelen estar detrás. Con pequeños cambios y pausas regulares podés aliviarlo y prevenirlo.
        </p>

        <section className="mb-8">
          <h2 className="font-heading text-xl text-foreground mb-3">
            Por qué duele el cuello al trabajar con la computadora
          </h2>
          <p className="text-muted-foreground mb-4">
            Cuando la cabeza se inclina hacia adelante para mirar la pantalla, el peso que soportan el cuello y la musculatura cervical aumenta mucho. Mantener esa postura durante horas tensa los músculos, comprime las vértebras y puede generar contracturas, rigidez y dolor. Sumado a eso, la falta de movimiento y de pausas hace que la tensión se acumule.
          </p>
          <p className="text-muted-foreground">
            Otros factores son la altura del monitor (demasiado bajo o alto), la silla sin buen apoyo lumbar, y pasar mucho tiempo sin cambiar de posición. Identificar estos hábitos es el primer paso para mejorar.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-heading text-xl text-foreground mb-3">
            Cómo prevenir el dolor de cuello en la oficina
          </h2>
          <p className="text-muted-foreground mb-4">
            Ajustá el monitor a la altura de los ojos o un poco por debajo, para no tener que bajar ni subir la cabeza. Mantené la espalda apoyada y la cabeza alineada con el cuerpo. Cada 45–60 minutos, hacé pausas cortas: mové el cuello con suavidad (inclinaciones laterales, mirada arriba y abajo), estirá hombros y evitá pasar más de una hora sin cambiar de postura.
          </p>
          <p className="text-muted-foreground">
            Los estiramientos y ejercicios de movilidad para cuello y hombros, hechos de forma regular, reducen la tensión y la probabilidad de que el dolor se vuelva crónico.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-heading text-xl text-foreground mb-3">
            Cómo Calmo te ayuda con el dolor de cuello
          </h2>
          <p className="text-muted-foreground mb-4">
            Calmo te recuerda tomar pausas en intervalos configurables (por ejemplo cada 45 o 60 minutos) y te ofrece ejercicios cortos pensados para cuello y cervicales. Podés elegir secuencias de 2–5 minutos que se integran en tu jornada sin interrumpirte de golpe.
          </p>
          <p className="text-muted-foreground">
            Si estás en medio de una tarea, podés posponer la pausa unos minutos. El objetivo es que las pausas y los ejercicios de cuello se vuelvan un hábito y que el dolor de cuello por computadora deje de ser algo cotidiano.
          </p>
        </section>
      </article>
    </SEOLayout>
  );
}
