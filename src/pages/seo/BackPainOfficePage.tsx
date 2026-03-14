import { usePageSEO } from "@/hooks/usePageSEO";
import { SEOLayout } from "./SEOLayout";

export default function BackPainOfficePage() {
  usePageSEO(
    "Dolor de espalda en la oficina",
    "Por qué duele la espalda al trabajar sentado, cómo mejorar la postura y las pausas, y cómo Calmo te ayuda con recordatorios y ejercicios para la espalda.",
    "/back-pain-office"
  );

  return (
    <SEOLayout ctaText="Cuidar mi espalda con Calmo">
      <article>
        <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-6">
          Dolor de espalda en la oficina: postura y pausas
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          El dolor de espalda, sobre todo en la zona lumbar, es uno de los problemas más comunes entre quienes trabajan muchas horas sentados. La postura estática y la falta de pausas explican gran parte del malestar. Con buenos hábitos y movimiento regular podés prevenirlo y aliviarlo.
        </p>

        <section className="mb-8">
          <h2 className="font-heading text-xl text-foreground mb-3">
            Por qué duele la espalda al trabajar sentado
          </h2>
          <p className="text-muted-foreground mb-4">
            Estar sentado mucho tiempo aumenta la carga sobre la columna lumbar y los discos. Si además la postura es incorrecta (espalda encorvada, sin apoyo lumbar, piernas sin apoyo), la tensión se acumula y pueden aparecer contracturas, rigidez y dolor. La falta de movimiento hace que la musculatura se debilite o se tense en exceso, y que la circulación empeore.
          </p>
          <p className="text-muted-foreground">
            Factores como la altura del asiento, la distancia al teclado y al monitor, y el tipo de silla influyen. Pero incluso con un buen equipamiento, pasar horas sin pausas suele terminar en molestias.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-heading text-xl text-foreground mb-3">
            Cómo prevenir y aliviar el dolor de espalda en el trabajo
          </h2>
          <p className="text-muted-foreground mb-4">
            Ajustá la silla para tener los pies apoyados, las rodillas a 90° y un buen soporte lumbar. El monitor debe quedar frente a vos, a la altura de los ojos. Cada 45–60 minutos, levantate, caminá un poco y estirá la espalda: inclinaciones suaves hacia adelante, torsiones de columna y estiramientos de lumbar ayudan a soltar la tensión.
          </p>
          <p className="text-muted-foreground">
            Fortalecer la zona media y la espalda con ejercicio regular (fuera del trabajo) también reduce el riesgo de dolor. Las pausas cortas y frecuentes son una de las medidas más efectivas que podés aplicar durante la jornada.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-heading text-xl text-foreground mb-3">
            Cómo Calmo te ayuda con el dolor de espalda
          </h2>
          <p className="text-muted-foreground mb-4">
            Calmo te recuerda hacer pausas en intervalos que vos elegís y te ofrece ejercicios cortos para espalda y lumbar. Las secuencias están pensadas para hacer en la oficina o en casa, sin necesidad de equipamiento, y duran 2–5 minutos. Podés combinarlas con la regla 20-20-20 para la vista.
          </p>
          <p className="text-muted-foreground">
            Los recordatorios se adaptan a tu ritmo: si estás en medio de algo urgente, podés posponer la pausa. El objetivo es que las pausas y los estiramientos de espalda se vuelvan parte de tu rutina y que el dolor de espalda en la oficina deje de ser algo habitual.
          </p>
        </section>
      </article>
    </SEOLayout>
  );
}
