import { usePageSEO } from "@/hooks/usePageSEO";
import { SEOLayout } from "./SEOLayout";

export default function EyeStrainPage() {
  usePageSEO(
    "Fatiga visual y cansancio ocular por pantallas",
    "Qué es la fatiga visual, causas y cómo prevenirla con la regla 20-20-20, iluminación y pausas. Cómo Calmo te ayuda a cuidar la vista mientras trabajás.",
    "/eye-strain"
  );

  return (
    <SEOLayout ctaText="Cuidar mi vista con Calmo">
      <article>
        <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-6">
          Fatiga visual: cómo prevenir el cansancio ocular frente a la pantalla
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          La fatiga visual (astenopía) es muy común en quienes pasan muchas horas frente a la computadora. Con buenos hábitos y pausas regulares podés reducir molestias como sequedad, visión borrosa y dolor de cabeza.
        </p>

        <section className="mb-8">
          <h2 className="font-heading text-xl text-foreground mb-3">
            Qué es la fatiga visual y qué la produce
          </h2>
          <p className="text-muted-foreground mb-4">
            La fatiga visual aparece cuando los ojos se cansan por uso prolongado en tareas que exigen enfoque cercano: leer, escribir o mirar pantallas. Los síntomas suelen incluir ojos secos o irritados, visión borrosa momentánea, dolor de cabeza y a veces sensibilidad a la luz. No suele indicar una enfermedad grave, pero afecta el bienestar y la productividad.
          </p>
          <p className="text-muted-foreground">
            Las causas más habituales son muchas horas sin pausas, mala iluminación, reflejos en la pantalla, distancia o altura incorrectas del monitor y parpadeo insuficiente. Pequeños cambios en el entorno y en la frecuencia de las pausas pueden mejorar mucho los síntomas.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-heading text-xl text-foreground mb-3">
            Cómo prevenir la fatiga visual
          </h2>
          <p className="text-muted-foreground mb-4">
            Aplicar la regla 20-20-20: cada 20 minutos, mirar algo a unos 6 metros durante 20 segundos. Parpadear a conciencia y, si usás lentes, asegurarte de que la graduación esté al día. Ajustar el brillo de la pantalla, evitar reflejos y colocar el monitor a un brazo de distancia, con el borde superior a la altura de los ojos o un poco por debajo. Mantener una buena iluminación en la habitación, sin que la pantalla sea la única fuente de luz.
          </p>
          <p className="text-muted-foreground">
            Las pausas cortas y frecuentes son una de las medidas más efectivas: permiten que los ojos cambien de enfoque y se recuperen antes de que el cansancio se acumule.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-heading text-xl text-foreground mb-3">
            Cómo Calmo te ayuda a cuidar la vista
          </h2>
          <p className="text-muted-foreground mb-4">
            Calmo te recuerda hacer pausas siguiendo la regla 20-20-20 durante tus bloques de trabajo. En cada pausa podés mirar a la distancia durante 20 segundos con un temporizador integrado, sin tener que acordarte solo. Los recordatorios son configurables y se pueden posponer unos minutos si estás en medio de algo urgente.
          </p>
          <p className="text-muted-foreground">
            Combinar estas pausas con los ejercicios de cuello y postura que ofrece Calmo ayuda a cuidar tanto la vista como la espalda y el cuello, todo desde la misma rutina de bienestar en el trabajo.
          </p>
        </section>
      </article>
    </SEOLayout>
  );
}
