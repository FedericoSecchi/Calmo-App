// Exercise engine data. Step `text` and exercise `name`/`preAlert` are English
// fallbacks; the UI resolves translated strings from the i18n dict using the
// stable step ids and the exercise id.

import { Exercise } from "./exerciseTypes";

export const exercises: Exercise[] = [
  {
    id: "neck-rotation",
    name: "Neck rotation",
    targetDurationSeconds: 120,
    preAlert: "Stop if you feel pain or discomfort",
    supportsMusic: true,
    steps: [
      { id: "prepare-neck", text: "Sit up straight and relax your shoulders", durationSeconds: 10, type: "posture", notifyOnStart: true, notifyOnEnd: false },
      { id: "rotate-right", text: "Turn your head gently to the right", durationSeconds: 15, type: "movement", notifyOnStart: true, notifyOnEnd: false },
      { id: "pause-center", text: "Return to center and breathe", durationSeconds: 5, type: "pause", notifyOnStart: false, notifyOnEnd: false },
      { id: "rotate-left", text: "Turn your head gently to the left", durationSeconds: 15, type: "movement", notifyOnStart: true, notifyOnEnd: false },
      { id: "pause-center-2", text: "Return to center and breathe", durationSeconds: 5, type: "pause", notifyOnStart: false, notifyOnEnd: false },
      { id: "tilt-forward", text: "Tilt your head gently forward", durationSeconds: 10, type: "movement", notifyOnStart: true, notifyOnEnd: false },
      { id: "tilt-back", text: "Tilt your head gently backward", durationSeconds: 10, type: "movement", notifyOnStart: true, notifyOnEnd: false },
      { id: "breathe", text: "Breathe deeply and relax", durationSeconds: 20, type: "breathing", notifyOnStart: true, notifyOnEnd: false },
      { id: "repeat", text: "Repeat the full sequence", durationSeconds: 30, type: "movement", notifyOnStart: true, notifyOnEnd: false },
    ],
  },
  {
    id: "shoulder-stretch",
    name: "Shoulder stretch",
    targetDurationSeconds: 180,
    preAlert: "Move gently and under control",
    supportsMusic: true,
    steps: [
      { id: "prepare-shoulder", text: "Sit up straight", durationSeconds: 10, type: "posture", notifyOnStart: true, notifyOnEnd: false },
      { id: "shoulder-roll-up", text: "Roll your shoulders up and back", durationSeconds: 20, type: "movement", notifyOnStart: true, notifyOnEnd: false },
      { id: "shoulder-roll-down", text: "Roll your shoulders down and forward", durationSeconds: 20, type: "movement", notifyOnStart: true, notifyOnEnd: false },
      { id: "pause", text: "Rest and breathe", durationSeconds: 10, type: "pause", notifyOnStart: false, notifyOnEnd: false },
      { id: "repeat", text: "Repeat the sequence", durationSeconds: 120, type: "movement", notifyOnStart: true, notifyOnEnd: false },
    ],
  },
  {
    id: "wrist-stretch",
    name: "Wrist stretch",
    targetDurationSeconds: 120,
    preAlert: "Stop if you feel pain or discomfort",
    supportsMusic: true,
    steps: [
      { id: "prepare-wrist", text: "Extend your arms in front of you", durationSeconds: 5, type: "posture", notifyOnStart: true, notifyOnEnd: false },
      { id: "flex-up", text: "Flex your wrists upward", durationSeconds: 15, type: "movement", notifyOnStart: true, notifyOnEnd: false },
      { id: "flex-down", text: "Flex your wrists downward", durationSeconds: 15, type: "movement", notifyOnStart: true, notifyOnEnd: false },
      { id: "circles", text: "Rotate your wrists in gentle circles", durationSeconds: 30, type: "movement", notifyOnStart: true, notifyOnEnd: false },
      { id: "breathe", text: "Breathe deeply and relax", durationSeconds: 25, type: "breathing", notifyOnStart: true, notifyOnEnd: false },
      { id: "repeat", text: "Repeat the sequence", durationSeconds: 30, type: "movement", notifyOnStart: true, notifyOnEnd: false },
    ],
  },
  {
    id: "lumbar-flex",
    name: "Seated lumbar flex",
    targetDurationSeconds: 120,
    preAlert: "Move gently and under control",
    supportsMusic: true,
    steps: [
      { id: "prepare-lumbar", text: "Sit on the edge of your chair, back straight", durationSeconds: 10, type: "posture", notifyOnStart: true, notifyOnEnd: false },
      { id: "forward", text: "Lean gently forward", durationSeconds: 20, type: "movement", notifyOnStart: true, notifyOnEnd: false },
      { id: "pause", text: "Hold the position and breathe", durationSeconds: 15, type: "pause", notifyOnStart: false, notifyOnEnd: false },
      { id: "return", text: "Return gently to the starting position", durationSeconds: 10, type: "movement", notifyOnStart: true, notifyOnEnd: false },
      { id: "breathe", text: "Breathe deeply", durationSeconds: 20, type: "breathing", notifyOnStart: true, notifyOnEnd: false },
      { id: "repeat", text: "Repeat the sequence", durationSeconds: 45, type: "movement", notifyOnStart: true, notifyOnEnd: false },
    ],
  },
];

export function getExerciseById(id: string): Exercise | undefined {
  return exercises.find((ex) => ex.id === id);
}
