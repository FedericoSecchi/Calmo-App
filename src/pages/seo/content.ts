import type { SeoPageKey } from "@/lib/i18n/types";

export interface SeoBodySection {
  h2: string;
  paragraphs: string[];
}

export interface SeoBody {
  h1: string;
  intro: string;
  sections: SeoBodySection[];
}

type Content = Record<SeoPageKey, { en: SeoBody; es: SeoBody }>;

export const SEO_CONTENT: Content = {
  twentyTwenty: {
    en: {
      h1: "The 20-20-20 rule: an easy habit for tired eyes",
      intro:
        "Every 20 minutes, look at something about 20 feet (6 meters) away for 20 seconds. It's one of the simplest ways to ease digital eye strain while you work on a computer.",
      sections: [
        {
          h2: "Why the 20-20-20 rule works",
          paragraphs: [
            "When you stare at a screen for a long time your eyes blink less and the lens stays in the same position. That tends to produce dryness, blurry vision, and headaches.",
            "Looking at the distance for 20 seconds relaxes the ciliary muscle and gives your eyes a short reset. You don't need to leave the room — a window, the far wall, or an object several meters away is enough.",
          ],
        },
        {
          h2: "How to make it a habit",
          paragraphs: [
            "The hard part is remembering. In the middle of focused work it's easy to spend an hour without lifting your eyes.",
            "A gentle reminder every 20 minutes is enough. Pair it with a longer break every 45–90 minutes to stretch, walk a bit, and drink water. Your back, neck, and circulation will thank you too.",
          ],
        },
        {
          h2: "How Calmo helps",
          paragraphs: [
            "Calmo includes 20-20-20 nudges during your focus blocks. At every short break it suggests looking into the distance for 20 seconds, with a built-in timer so you don't have to count.",
            "You can snooze the reminder if you're in the middle of something critical. The goal is to turn the rule into a natural habit without you having to think about it.",
          ],
        },
      ],
    },
    es: {
      h1: "Regla 20-20-20: un hábito simple para los ojos cansados",
      intro:
        "Cada 20 minutos, mirá algo a unos 6 metros durante 20 segundos. Es una de las formas más simples de bajarle a la fatiga visual cuando trabajás con la computadora.",
      sections: [
        {
          h2: "Por qué funciona la regla 20-20-20",
          paragraphs: [
            "Al fijar la vista en la pantalla mucho tiempo, el ojo parpadea menos y el cristalino se queda en la misma posición. Eso suele traer sequedad, visión borrosa y dolor de cabeza.",
            "Mirar a la distancia durante 20 segundos relaja el músculo ciliar y le da un respiro al ojo. No hace falta salir: una ventana, una pared al fondo o un objeto a varios metros alcanza.",
          ],
        },
        {
          h2: "Cómo convertirla en hábito",
          paragraphs: [
            "El tema es acordarse. En pleno flujo es fácil pasar una hora sin levantar la vista.",
            "Un recordatorio suave cada 20 minutos basta. Combinalo con una pausa más larga cada 45–90 minutos para estirar, caminar un poco e hidratarte. Tu espalda, tu cuello y tu circulación también lo van a agradecer.",
          ],
        },
        {
          h2: "Cómo te ayuda Calmo",
          paragraphs: [
            "Calmo incluye empujones 20-20-20 durante tus bloques de foco. En cada pausa corta te invita a mirar a la distancia 20 segundos con un temporizador integrado para no tener que contar.",
            "Si estás en algo crítico, podés posponer el recordatorio unos minutos. La idea es que la regla se vuelva un hábito natural sin que tengas que acordarte.",
          ],
        },
      ],
    },
  },
  deskStretch: {
    en: {
      h1: "Simple desk stretches you can do every day",
      intro:
        "A few short desk stretches, spread through the day, can keep neck, shoulders, and wrists from locking up. Below is a tiny routine you can do without leaving your chair.",
      sections: [
        {
          h2: "A 2-minute desk routine",
          paragraphs: [
            "Shoulder rolls: five slow circles backward, five forward. Keep the movement small and controlled.",
            "Neck tilts: let your right ear fall toward your right shoulder for 15 seconds, then switch sides. Breathe.",
            "Wrist waves: extend your arms, flex your wrists up and down, then draw small circles in both directions.",
            "Seated spinal twist: feet planted, place your left hand on the right knee and twist gently. Hold, breathe, swap sides.",
          ],
        },
        {
          h2: "Make it stick",
          paragraphs: [
            "Short and frequent beats long and rare. Three two-minute breaks spread through the day move the needle more than one long yoga session.",
            "A quiet reminder every 60–90 minutes is enough to build the habit. If you can't do the whole set, roll your shoulders and stretch your wrists — that alone helps.",
          ],
        },
        {
          h2: "How Calmo helps",
          paragraphs: [
            "Calmo plays guided desk stretches in 2–5 minute routines. Each one is silent, text-only, so it doesn't interrupt a call or your flow.",
            "The focus timer suggests a stretch at every long break, and you can pick a specific routine from the exercise library when something feels tight.",
          ],
        },
      ],
    },
    es: {
      h1: "Estiramientos simples para hacer en el escritorio",
      intro:
        "Unos pocos estiramientos cortos, repartidos durante el día, alcanzan para evitar que el cuello, los hombros y las muñecas se traben. Abajo tenés una rutina corta que podés hacer sin salir de la silla.",
      sections: [
        {
          h2: "Rutina de 2 minutos en el escritorio",
          paragraphs: [
            "Rotación de hombros: cinco círculos lentos hacia atrás y cinco hacia adelante. Movimiento chico y controlado.",
            "Inclinación de cuello: dejá caer la oreja derecha hacia el hombro derecho durante 15 segundos y después cambiá. Respirá.",
            "Muñecas: extendé los brazos, flexioná las muñecas hacia arriba y hacia abajo, y hacé círculos chicos en ambos sentidos.",
            "Twist sentado: pies en el piso, mano izquierda en la rodilla derecha y rotá suavemente. Mantené, respirá, cambiá de lado.",
          ],
        },
        {
          h2: "Hacé que se vuelva hábito",
          paragraphs: [
            "Corto y seguido supera a largo y de vez en cuando. Tres pausas de dos minutos repartidas en el día mueven la aguja más que una clase larga de yoga.",
            "Un recordatorio suave cada 60–90 minutos alcanza. Si no podés hacer todo, rotá los hombros y estirá las muñecas: eso solo ya ayuda.",
          ],
        },
        {
          h2: "Cómo te ayuda Calmo",
          paragraphs: [
            "Calmo guía estiramientos en rutinas de 2 a 5 minutos. Son silenciosas y en texto, así que no cortan una llamada ni tu flujo.",
            "El temporizador de foco sugiere un estiramiento en cada pausa larga, y podés elegir una rutina puntual desde la biblioteca cuando algo tira.",
          ],
        },
      ],
    },
  },
  eyeStrain: {
    en: {
      h1: "Computer eye strain: what causes it and how to prevent it",
      intro:
        "Digital eye strain shows up as dryness, blurry vision, headaches, and that heavy feeling behind the eyes after a long session. It's extremely common and extremely preventable.",
      sections: [
        {
          h2: "Why screens tire your eyes",
          paragraphs: [
            "At the screen we blink less (around a third as often), the eye stays focused at the same close distance, and we often work in low light or with glare.",
            "That combination dries the surface of the eye and keeps the focus muscle under constant tension. The result: tiredness, visual noise, and headaches.",
          ],
        },
        {
          h2: "Small habits that help",
          paragraphs: [
            "Follow the 20-20-20 rule: every 20 minutes, look 6 meters away for 20 seconds.",
            "Blink on purpose a few times whenever you remember. Blinking spreads tears and resets the eye surface.",
            "Keep the screen at arm's length and slightly below eye level. Match screen brightness to the room; too dim or too bright is worse than mid.",
            "If you wear glasses, consider a pair tuned for the specific distance to the screen.",
          ],
        },
        {
          h2: "How Calmo helps",
          paragraphs: [
            "Calmo nudges you to look away at the right rhythm. The nudges are gentle: you can snooze them if you're mid-task.",
            "If pain starts to show up, log it inside the app. Your pain log stays on your device and helps you spot the patterns that trigger it.",
          ],
        },
      ],
    },
    es: {
      h1: "Fatiga visual por computadora: qué la causa y cómo prevenirla",
      intro:
        "La fatiga visual digital aparece como sequedad, visión borrosa, dolor de cabeza y esa sensación pesada detrás de los ojos después de un rato largo. Es muy común y muy prevenible.",
      sections: [
        {
          h2: "Por qué las pantallas cansan los ojos",
          paragraphs: [
            "Frente a la pantalla parpadeamos menos (como un tercio de lo normal), el ojo se queda enfocado a la misma distancia cercana y solemos trabajar con poca luz o con reflejos.",
            "Esa combinación seca la superficie del ojo y deja al músculo del foco bajo tensión constante. Resultado: cansancio, ruido visual y dolor de cabeza.",
          ],
        },
        {
          h2: "Hábitos simples que ayudan",
          paragraphs: [
            "Aplicá la regla 20-20-20: cada 20 minutos, mirá algo a 6 metros durante 20 segundos.",
            "Parpadeá a propósito un par de veces cuando te acordés. El parpadeo distribuye lágrimas y resetea la superficie del ojo.",
            "Mantené la pantalla a distancia de brazo y un poco por debajo de la línea de los ojos. Ajustá el brillo al ambiente: ni muy oscuro ni muy brillante.",
            "Si usás anteojos, pensá en un par preparado para la distancia exacta de la pantalla.",
          ],
        },
        {
          h2: "Cómo te ayuda Calmo",
          paragraphs: [
            "Calmo te empuja a despegar la vista en el ritmo adecuado. Los empujones son suaves: podés posponerlos si estás en medio de algo.",
            "Si aparece dolor, lo podés registrar dentro de la app. El registro queda en tu dispositivo y te ayuda a ver qué patrones lo disparan.",
          ],
        },
      ],
    },
  },
  computerBreaks: {
    en: {
      h1: "How often should you take breaks from the computer?",
      intro:
        "There's no single magic number, but there's a working range: short breaks every 20–30 minutes, longer ones every 60–90 minutes. The quality of the break matters as much as the frequency.",
      sections: [
        {
          h2: "A simple break rhythm",
          paragraphs: [
            "Micro-pause every 20–30 minutes: 20 seconds looking away from the screen.",
            "Short break every 60–90 minutes: 2–5 minutes to stand up, drink water, stretch neck and wrists.",
            "Longer pause every 2–3 hours: 10–15 minutes to walk a little and change scenery.",
          ],
        },
        {
          h2: "What to do during the break",
          paragraphs: [
            "The goal is to change: distance (look away), position (stand, stretch), and intensity (relax your eyes and shoulders).",
            "Scrolling your phone doesn't count — your eyes stay on a close screen. A window, a wall, the ceiling, or any object across the room is the right target.",
          ],
        },
        {
          h2: "How Calmo helps",
          paragraphs: [
            "Calmo chains focus blocks with the right kind of breaks. You pick the preset that matches your work (light, standard, focus), and the app handles the timing.",
            "If you need to override, you can snooze a break or add a manual one. All the data stays yours.",
          ],
        },
      ],
    },
    es: {
      h1: "¿Cada cuánto conviene tomar pausas de la computadora?",
      intro:
        "No hay un único número mágico, pero sí un rango útil: pausas cortas cada 20–30 minutos, pausas más largas cada 60–90. La calidad de la pausa importa tanto como la frecuencia.",
      sections: [
        {
          h2: "Un ritmo simple de pausas",
          paragraphs: [
            "Micropausa cada 20–30 minutos: 20 segundos mirando lejos de la pantalla.",
            "Pausa corta cada 60–90 minutos: 2 a 5 minutos para pararte, tomar agua, estirar cuello y muñecas.",
            "Pausa larga cada 2 a 3 horas: 10 a 15 minutos para caminar un poco y cambiar de escenario.",
          ],
        },
        {
          h2: "Qué hacer en la pausa",
          paragraphs: [
            "La idea es cambiar: la distancia (mirar lejos), la posición (pararte, estirar) y la intensidad (relajar ojos y hombros).",
            "Scrollear el celular no cuenta: el ojo sigue en una pantalla cercana. Una ventana, una pared, el techo o cualquier objeto al fondo de la habitación es el blanco adecuado.",
          ],
        },
        {
          h2: "Cómo te ayuda Calmo",
          paragraphs: [
            "Calmo encadena bloques de foco con el tipo de pausa adecuado. Elegís el preset que acompaña tu trabajo (ligero, estándar, foco) y la app se encarga del tiempo.",
            "Si necesitás, podés posponer una pausa o sumar una manual. Los datos quedan tuyos.",
          ],
        },
      ],
    },
  },
  neckPain: {
    en: {
      h1: "Neck pain from the computer: what actually helps",
      intro:
        "Neck pain from computer work usually comes from a mix of posture, long sessions without movement, and screen position. Small changes in each of those knobs reduce the pain a lot.",
      sections: [
        {
          h2: "Fix the setup first",
          paragraphs: [
            "Keep the top of the screen roughly at eye level. If you work on a laptop, add an external keyboard and raise the screen on a stand or stack of books.",
            "Elbows at ~90°, shoulders down and back, feet on the floor. The screen should be about an arm's length away.",
          ],
        },
        {
          h2: "Move the neck a little, often",
          paragraphs: [
            "Every 60–90 minutes do a tiny neck routine: slow left-right rotations, gentle ear-to-shoulder tilts, and a chin tuck (pull the chin straight back without tilting).",
            "Short and frequent beats long and rare. If something hurts a lot, stop and see a professional.",
          ],
        },
        {
          h2: "How Calmo helps",
          paragraphs: [
            "Calmo includes guided neck routines in 2–3 minute blocks. Each one is text-only, so you can do it on a call.",
            "The pain log on your device lets you see which days or routines help, without sending any of that data to a server.",
          ],
        },
      ],
    },
    es: {
      h1: "Dolor de cuello por la computadora: qué ayuda de verdad",
      intro:
        "El dolor de cuello por trabajar con la computadora suele ser una mezcla de postura, sesiones largas sin moverse y posición de la pantalla. Mover un poco cada una de esas perillas baja mucho el dolor.",
      sections: [
        {
          h2: "Primero, el puesto de trabajo",
          paragraphs: [
            "La parte alta de la pantalla cerca de la línea de los ojos. Si trabajás con laptop, sumá teclado externo y elevá la pantalla con un soporte o unos libros.",
            "Codos a 90°, hombros hacia atrás y abajo, pies en el piso. La pantalla a distancia de un brazo.",
          ],
        },
        {
          h2: "Mové el cuello un poco, varias veces",
          paragraphs: [
            "Cada 60–90 minutos hacé una micro-rutina: rotaciones lentas de lado a lado, inclinaciones suaves oreja-hombro y un chin tuck (empujá el mentón hacia atrás sin inclinar la cabeza).",
            "Corto y seguido supera a largo y de vez en cuando. Si algo duele mucho, pará y consultá a un profesional.",
          ],
        },
        {
          h2: "Cómo te ayuda Calmo",
          paragraphs: [
            "Calmo tiene rutinas guiadas de cuello en bloques de 2 a 3 minutos. Son en texto, así que las podés hacer en una llamada.",
            "El registro de dolor queda en tu dispositivo y te permite ver qué días o rutinas te ayudan, sin enviar nada a un servidor.",
          ],
        },
      ],
    },
  },
  backPain: {
    en: {
      h1: "Office back pain: posture and small habits that compound",
      intro:
        "Office back pain rarely comes from one bad day — it builds up from many days with the same posture and no movement. The good news: it also melts away with the same accumulated effect of small, consistent habits.",
      sections: [
        {
          h2: "Chair and screen",
          paragraphs: [
            "Sit all the way back, feet flat on the floor, knees at ~90°. If your chair pushes your lumbar out, add a small cushion.",
            "Keep the screen at eye level and about an arm's length away. Shoulders down, elbows close to your body.",
          ],
        },
        {
          h2: "Move every hour",
          paragraphs: [
            "Stand up for a minute or two every 60–90 minutes. Walk a short loop, do a gentle backbend, roll the shoulders.",
            "A short seated routine helps too: cat-cow in the chair, side bends, and a seated spinal twist. Three minutes is enough to reset.",
          ],
        },
        {
          h2: "How Calmo helps",
          paragraphs: [
            "Calmo keeps the rhythm of breaks for you and offers quick back-friendly routines when it's time. You can snooze any reminder.",
            "Daily streaks make the habit visible. Pain data stays on your device and helps you spot what's working.",
          ],
        },
      ],
    },
    es: {
      h1: "Dolor de espalda en la oficina: postura y hábitos simples que suman",
      intro:
        "El dolor de espalda rara vez viene de un solo mal día: se acumula con muchos días de la misma postura y sin movimiento. La buena noticia: también se desinfla con el mismo efecto acumulado de hábitos chicos y constantes.",
      sections: [
        {
          h2: "Silla y pantalla",
          paragraphs: [
            "Sentate bien atrás, pies apoyados, rodillas a 90°. Si la silla te empuja la lumbar hacia afuera, sumá un cojín chico.",
            "Pantalla a la altura de los ojos y a distancia de un brazo. Hombros hacia abajo, codos cerca del cuerpo.",
          ],
        },
        {
          h2: "Movete una vez por hora",
          paragraphs: [
            "Pará un minuto o dos cada 60–90 minutos. Hacé una vuelta corta, un backbend suave, rotaciones de hombros.",
            "Una rutina sentada corta también suma: gato-vaca en la silla, inclinaciones laterales y un twist. Tres minutos alcanzan para resetear.",
          ],
        },
        {
          h2: "Cómo te ayuda Calmo",
          paragraphs: [
            "Calmo lleva el ritmo de las pausas y te ofrece rutinas rápidas amigables con la espalda cuando toca. Si necesitás, posponés el recordatorio.",
            "Las rachas diarias hacen visible el hábito. Los datos de dolor quedan en tu dispositivo y te ayudan a ver qué está funcionando.",
          ],
        },
      ],
    },
  },
  pomodoroBreaks: {
    en: {
      h1: "Pomodoro breaks: the body side of focus",
      intro:
        "The Pomodoro method (25 minutes of focus, 5 of break) is great for concentration. The quality of the break is what decides whether your body thanks you by Friday.",
      sections: [
        {
          h2: "A body-friendly pomodoro break",
          paragraphs: [
            "Stand up. Look out the window or across the room for 20 seconds — that's the 20-20-20 rule inside a Pomodoro.",
            "Shake out your hands and roll your shoulders.",
            "Drink water. Hydration matters more than most desk workers realize.",
          ],
        },
        {
          h2: "Longer every four cycles",
          paragraphs: [
            "After four Pomodoros, take a 15–20 minute break. Walk, eat something, change the scenery.",
            "That longer pause is where real recovery happens — physical, mental, and emotional.",
          ],
        },
        {
          h2: "How Calmo helps",
          paragraphs: [
            "Calmo's focus timer runs the cycle for you and nudges body-friendly actions during breaks: 20-20-20, a quick stretch, water.",
            "If you're deep in flow, you can snooze a nudge or skip a break. Nothing is forced on you.",
          ],
        },
      ],
    },
    es: {
      h1: "Pausas pomodoro: el lado corporal del foco",
      intro:
        "El método Pomodoro (25 minutos de foco, 5 de pausa) ayuda con la concentración. La calidad de la pausa es lo que decide si tu cuerpo te agradece el viernes.",
      sections: [
        {
          h2: "Una pausa pomodoro amigable con el cuerpo",
          paragraphs: [
            "Pará y pararte. Mirá por la ventana o al fondo de la habitación 20 segundos: eso es la regla 20-20-20 dentro de un pomodoro.",
            "Sacudí las manos y rotá los hombros.",
            "Tomá agua. La hidratación importa más de lo que la mayoría cree.",
          ],
        },
        {
          h2: "Más largo cada cuatro ciclos",
          paragraphs: [
            "Después de cuatro pomodoros, hacé una pausa de 15–20 minutos. Caminá, comé algo, cambiá de escenario.",
            "Esa pausa larga es donde pasa la recuperación de verdad: física, mental y emocional.",
          ],
        },
        {
          h2: "Cómo te ayuda Calmo",
          paragraphs: [
            "El temporizador de Calmo lleva el ciclo por vos y sugiere acciones amigables con el cuerpo en las pausas: 20-20-20, un estiramiento rápido, agua.",
            "Si estás metido en el flow, posponés el recordatorio o saltás la pausa. Nada te lo impone.",
          ],
        },
      ],
    },
  },
  focusCycles: {
    en: {
      h1: "Focus cycles that respect your body",
      intro:
        "A good focus cycle is less about forcing yourself to work for a magic number of minutes and more about matching your energy and giving your body what it needs between blocks.",
      sections: [
        {
          h2: "Pick a block length that fits",
          paragraphs: [
            "Short blocks (25 min) help if you're jumpy or getting back into the habit of focused work.",
            "Longer blocks (50 min) suit deep work and complex tasks, as long as you really take the break at the end.",
          ],
        },
        {
          h2: "Design the break, not just the block",
          paragraphs: [
            "Change the distance (look away), the position (stand, stretch), and the intensity (relax your eyes and shoulders).",
            "Water, a bit of movement, and a few deep breaths beat scrolling your phone for five minutes.",
          ],
        },
        {
          h2: "How Calmo helps",
          paragraphs: [
            "Calmo offers three presets (light, standard, focus) with different block and break lengths. You can switch between them any day.",
            "The timer handles the transitions and quietly suggests what to do in the break.",
          ],
        },
      ],
    },
    es: {
      h1: "Ciclos de foco que respetan tu cuerpo",
      intro:
        "Un buen ciclo de foco no se trata tanto de obligarte a trabajar un número mágico de minutos, sino de acompañar tu energía y darle al cuerpo lo que necesita entre bloques.",
      sections: [
        {
          h2: "Elegí un bloque que te sirva",
          paragraphs: [
            "Bloques cortos (25 minutos) ayudan si estás disperso o si estás volviendo al hábito del trabajo con foco.",
            "Bloques más largos (50 minutos) van bien para trabajo profundo, siempre que después tomes la pausa de verdad.",
          ],
        },
        {
          h2: "Diseñá la pausa, no solo el bloque",
          paragraphs: [
            "Cambiá la distancia (mirar lejos), la posición (pararte, estirar) y la intensidad (relajar ojos y hombros).",
            "Agua, un poco de movimiento y unas respiraciones profundas superan a scrollear el teléfono cinco minutos.",
          ],
        },
        {
          h2: "Cómo te ayuda Calmo",
          paragraphs: [
            "Calmo ofrece tres presets (ligero, estándar, foco) con distintos largos de bloque y pausa. Podés cambiar cualquier día.",
            "El temporizador se encarga de las transiciones y sugiere en silencio qué hacer en la pausa.",
          ],
        },
      ],
    },
  },
};
