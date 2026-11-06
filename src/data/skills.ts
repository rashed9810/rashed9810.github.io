import type { IconName } from './site';

// Only list tools you can point to in a project, job or the CV.
export const skills: { group: string; icon: IconName; items: string[] }[] = [
  { group: 'Languages', icon: 'code', items: ['Python', 'TypeScript', 'JavaScript', 'SQL', 'Java', 'C/C++'] },
  {
    group: 'Machine learning and vision',
    icon: 'scan',
    items: ['scikit-learn', 'NumPy', 'Pandas', 'OpenCV', 'CNNs', 'Transfer learning (VGG-16)', 'RNN / LSTM', 'Tesseract OCR'],
  },
  {
    group: 'LLMs and generative AI',
    icon: 'message',
    items: ['Hugging Face Transformers', 'PEFT / LoRA', 'TRL', 'bitsandbytes', 'OpenAI API and fine-tuning', 'Ollama', 'Named-entity recognition'],
  },
  { group: 'Backend', icon: 'server', items: ['FastAPI', 'Django', 'Flask', 'Node.js', 'Express', 'REST API design', 'WebSockets'] },
  { group: 'Frontend', icon: 'layout', items: ['React', 'Next.js', 'Tailwind CSS', 'RTK Query', 'TanStack Query'] },
  { group: 'Databases', icon: 'database', items: ['PostgreSQL', 'MongoDB', 'SQLAlchemy'] },
  { group: 'DevOps and tooling', icon: 'box', items: ['Git', 'Docker', 'GitHub Actions', 'pytest', 'Postman', 'Vercel', 'Netlify'] },
  { group: 'Content platforms', icon: 'file', items: ['Contentful (models, CLI, webhooks)', 'GraphiQL', 'WordPress'] },
];
