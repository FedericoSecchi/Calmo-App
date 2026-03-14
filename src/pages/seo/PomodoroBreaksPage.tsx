import { usePageSEO } from "@/hooks/usePageSEO";
import { SEOLayout } from "./SEOLayout";

export default function PomodoroBreaksPage() {
  usePageSEO(
    "Pausas en la técnica Pomodoro",
    "Cómo combinar la técnica Pomodoro con pausas saludables para la vista y el cuerpo. Por qué las pausas cortas y largas mejoran el enfoque y el bienestar.",
    "/pomodoro-breaks"
  );

  return (
    <SEOLayout ctaText="Usar pausas tipo Pomodoro en Calmo">
      <article>
        <h1 className="font-heading text-3xl md:text-4xl text-foreground mb-6">
          Pausas en la técnica Pomodoro: trabajo enfocado y descanso
        </h1>
        <p className="text-lg text-muted-foreground mb-8">
          La técnica Pomodoro organiza el trabajo en bloques de unos 25 minutos seguidos de pausas cortas. Aprovechar esas pausas para mover el cuerpo, relajar la vista y estirar mejora tanto la concentración como el bienestar físico.
        </p>

        <section className="mb-8">
          <h2 className="font-heading text-xl text-foreground mb-3">
            Qué es la técnica Pomodoro y por qué incluir pausas reales
          </h2>
          <p className="text-muted-foreground mb-4">
            La técnica Pomodoro consiste en trabajar en intervalos de tiempo fijos (típicamente 25 minutos), llamados pomodoros, y tomar una pausa corta de 5 minutos entre ellos. Cada cuatro pomodoros se recomienda una pausa más larga de 15–30 minutos. La idea es mantener el foco en un solo bloque y usar las pausas para recuperarte.
          </p>
          <p className="text-muted-foreground">
            Muchas personas cumplen el tiempo de trabajo pero no aprovechan las pausas: siguen mirando la pantalla o no se mueven. Usar esas pausas para levantarse, mirar a la distancia (regla 20-20-20), estirar cuello y espalda, o caminar un poco potencia los beneficios del método y reduce fatiga visual y tensión muscular.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-heading text-xl text-foreground mb-3">
            Cómo diseñar pausas efectivas en tu Pomodoro
          </h2>
          <p className="text-muted-foreground mb-4">
            En la pausa corta (5 min): alejate de la pantalla, mirá por la ventana o a la distancia 20 segundos (regla 20-20-20), estirá cuello y hombros, y si podés, caminá un poco. En la pausa larga: movete más, estirá espalda y piernas, hidratate y si es posible salí a tomar aire. Evitá llenar las pausas con redes sociales o más pantalla; el objetivo es darle un respiro al cuerpo y a la vista.
          </p>
          <p className="text-muted-foreground">
            Si tus bloques son más largos (por ejemplo 45 o 50 minutos), podés hacer una mini pausa a mitad del bloque para la vista y seguir con una pausa completa al final. Lo importante es que las pausas sean reales y regulares.
          </p>
        </section>

        <section className="mb-8">
          <h2 className="font-heading text-xl text-foreground mb-3">
            Cómo Calmo se integra con tus ciclos tipo Pomodoro
          </h2>
          <p className="text-muted-foreground mb-4">
            Calmo te permite configurar intervalos de trabajo y descanso similares a la técnica Pomodoro. Podés elegir la duración del bloque de trabajo (por ejemplo 25, 45 o 50 minutos) y la duración de la pausa. En cada pausa, Calmo te invita a aplicar la regla 20-20-20 y a hacer ejercicios cortos de cuello, espalda o muñecas.
          </p>
          <p className="text-muted-foreground">
            Así no tenés que acordarte solo de parar: los recordatorios te guían en el momento justo. Podés posponer unos minutos si estás cerrando una tarea. El resultado es una rutina de trabajo enfocado con pausas que cuidan tu vista y tu cuerpo, al estilo Pomodoro pero adaptada a tu ritmo.
          </p>
        </section>
      </article>
    </SEOLayout>
  );
}
