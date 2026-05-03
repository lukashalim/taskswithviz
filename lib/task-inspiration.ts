export interface TaskInspiration {
  /** Speaker, saint, or tradition */
  author: string;
  /** Optional grouping (theme or prayer name) */
  context?: string;
  body: string;
}

export const TASK_INSPIRATIONS: TaskInspiration[] = [
  {
    author: "Cal Newport",
    context: "On focus and depth",
    body:
      "Deep work is not some idiosyncratic skill of the modern era; it's instead a 'superpower' in our increasingly competitive twenty-first-century economy. And if you cultivate this ability, you'll thrive.",
  },
  {
    author: "Cal Newport",
    context: "On focus and depth",
    body:
      "To produce at your peak level you need to work for extended periods with full concentration on a single task free from distraction.",
  },
  {
    author: "St. Josemaría Escrivá",
    context: "Sanctifying daily tasks",
    body:
      "Professional work is also an apostolate, an opportunity for giving ourselves to others, to reveal Christ to them and lead them to God.",
  },
  {
    author: "St. Josemaría Escrivá",
    context: "Sanctifying daily tasks",
    body:
      "An hour of study, for a modern apostle, is an hour of prayer.",
  },
  {
    author: "St. Josemaría Escrivá",
    context: "Sanctifying daily tasks",
    body:
      "Put a supernatural reason behind your ordinary professional work, and you will have sanctified that work.",
  },
  {
    author: "Dr. Kevin Majors (OptimalWork)",
    context: "On challenge and growth",
    body:
      "The core of a Deep Work session isn't just getting things done; it's the willingness to be challenged. Growth happens at the boundary of your current ability.",
  },
  {
    author: "Dr. Kevin Majors (OptimalWork)",
    context: "On challenge and growth",
    body:
      "Work is not something we do to get to our 'real life.' Work is the primary place where we practice the virtues that make us who we are.",
  },
  {
    author: "Traditional Catholic prayer",
    context: "Actiones Nostras (often attributed to St. Thomas Aquinas)",
    body:
      "Direct, we beseech Thee, O Lord, all our actions by Thy holy inspirations, and carry them on by Thy gracious assistance, that every prayer and work of ours may begin always from Thee, and through Thee be happily ended. Amen.",
  },
  {
    author: "Traditional (short form)",
    context: "Before work",
    body:
      "Lord, I offer you this work. May it be for your glory and the service of others. Help me to do it with perfection and love.",
  },
];

export function getRandomTaskInspiration(): TaskInspiration {
  const index = Math.floor(Math.random() * TASK_INSPIRATIONS.length);
  const item = TASK_INSPIRATIONS[index];
  if (!item) {
    return TASK_INSPIRATIONS[0]!;
  }
  return item;
}
