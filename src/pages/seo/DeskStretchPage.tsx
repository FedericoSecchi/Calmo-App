import { usePageSEO } from "@/hooks/usePageSEO";
import { SEOLayout } from "./SEOLayout";

export default function DeskStretchPage() {
  usePageSEO(
    "Estiramientos en la oficina y frente a la computadora",
    "Estiramientos simples para cuello, espalda y muñecas que podés hacer en la silla. Cómo Calmo te guía con ejercicios cortos para evitar dolor y tensión.",
    "/desk-stretch"
  );

  return (
    <SEOLayout ctaText="Ver ejercicios en Calmo">
      <article>
        <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-6">
          Estiramientos en la oficina: cuello, espalda y muñecas
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          Pasar muchas horas sentado frente a la computadora genera tensión en cuello, hombros, espalda y muñecas. Con estiramientos cortos y frecuentes podés aliviarla y prevenir molestias a largo plazo.
        </p>

        <section className="mb-8">
          <h2 className="font-heading text-xl text-foreground mb-3">
            Por qué estirar en el trabajo
          </h2>
          <p className="text-muted-foreground mb-4">
            La postura fija y repetitiva hace que algunos músculos se acorten y otros se debiliten. El cuello y la zona cervical suelen cargar con el peso de la cabeza inclinada hacia la pantalla; la espalda baja puede sufrir por horas sentado; y las muñecas, por el tecleo y el mouse. Estirar de forma regular ayuda a recuperar movilidad y a reducir la sensación de rigidez y dolor.
          </p>
          <p className="text-muted-foreground">
            No hace falta una rutina larga: 2–5 minutos cada hora u hora y media suelen ser suficientes si los hacés con constancia. Lo importante es que los recordatorios sean suaves y se adapten a tu ritmo para que sea sostenible.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-heading text-xl text-foreground mb-3">
            Estiramientos que podés hacer en la silla
          </h2>
          <p className="text-muted-foreground mb-4">
            Para el cuello: incliná suavemente la cabeza hacia un hombro y mantené 15–20 segundos; repetí al otro lado. Para hombros: llevá los brazos hacia atrás y entrelazá las manos con las palmas hacia arriba, estirando el pecho. Para espalda baja: sentado, incliná el tronco hacia adelante dejando colgar los brazos entre las piernas. Para muñecas: extendé el brazo con la palma hacia afuera y con la otra mano tirá suavemente de los dedos hacia atrás; repetí con la palma hacia adentro.
          </p>
          <p className="text-muted-foreground">
            Hacé cada movimiento de forma lenta y sin forzar. Si sentís dolor, reducí la intensidad o consultá a un profesional.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-heading text-xl text-foreground mb-3">
            Cómo Calmo te ayuda con los estiramientos
          </h2>
          <p className="text-muted-foreground mb-4">
            Calmo incluye una biblioteca de micro-ejercicios y estiramientos pensados para hacer en la oficina o en casa. Cada pausa puede incluir una secuencia corta guiada (2–5 minutos) para cuello, espalda o muñecas, según lo que elijas o lo que más te convenga en ese momento.
          </p>
          <p className="text-muted-foreground">
            Los recordatorios se integran con tu flujo de trabajo: podés elegir la frecuencia y el tipo de pausa. Así es más fácil convertir los estiramientos en un hábito sin que te invada la jornada.
          </p>
        </section>
      </article>
    </SEOLayout>
  );
}
