// Engineering projects. `featured` shows the large layout (keep only one).
// `codeNote` explains a missing repo link honestly, e.g. 'Code not public'.

export type Project = {
  title: string;
  summary: string;
  points: string[];
  stack: string[];
  category: string;
  repo?: string;
  demo?: string;
  codeNote?: string;
  featured?: boolean;
};

export const projects: Project[] = [
  {
    title: 'Recast',
    category: 'LLM application',
    featured: true,
    summary:
      'A self-hostable rewriting tool for academic text that keeps citations, LaTeX and numbers untouched and verifies every output before showing it.',
    points: [
      'FastAPI backend with a provider layer for local models (Ollama, LM Studio) and cloud APIs (Groq, Gemini, OpenRouter, OpenAI, Anthropic).',
      'Lock-token pipeline with automatic fallback to the original paragraph when verification fails.',
      'Next.js and TypeScript interface, Docker Compose setup and a 42-test pytest suite.',
    ],
    stack: ['FastAPI', 'Next.js', 'TypeScript', 'Docker', 'pytest'],
    repo: 'https://github.com/rashed9810/Recast',
  },
  {
    title: 'Go, line by line',
    category: 'Learning project',
    summary:
      'An interactive, bilingual (English and Bangla) Go course where each lesson steps through real code and shows memory, goroutines or an algorithm changing at every line.',
    points: [
      '26 lessons and 603 animated steps: pointers, slices, interfaces, errors, goroutines, mutexes, context, HTTP middleware and nine DSA patterns.',
      'Predict mode, quizzes and exercises with hints; all 99 Go samples pass gofmt and go vet.',
    ],
    stack: ['Go', 'JavaScript', 'HTML', 'CSS'],
    repo: 'https://github.com/rashed9810/rashed9810.github.io/tree/main/public/go',
    demo: '/go/',
  },
  {
    title: 'OCR and NER document scanner',
    category: 'Computer vision + NLP',
    summary:
      'A web app that reads business cards and documents, extracts text with OCR and labels the extracted fields with named-entity recognition.',
    points: ['Tesseract OCR pipeline with an entity tagger.', 'Browser canvas for correcting detected bounding boxes.'],
    stack: ['Python', 'Tesseract', 'NER', 'JavaScript'],
    repo: 'https://github.com/rashed9810/Develop-OCR-NER-Document-Scanner-App',
  },
  {
    title: 'Fine-tuning LLMs with Hugging Face',
    category: 'Learning project',
    summary:
      'Supervised fine-tuning of an open language model with LoRA adapters and bitsandbytes quantisation to keep memory use low.',
    points: ['transformers, TRL SFTTrainer, PEFT/LoRA, bitsandbytes and accelerate.'],
    stack: ['Hugging Face', 'PEFT', 'TRL', 'bitsandbytes'],
    repo: 'https://github.com/rashed9810/Fine-Tuning-LLMs-with-Hugging-face',
  },
  {
    title: 'Diasporex',
    category: 'Fintech frontend',
    summary: 'Frontend for a cross-border, peer-to-peer money transfer platform supporting more than 10 currencies.',
    points: ['Led frontend development in Next.js and Tailwind CSS.', 'Integrated APIs for real-time exchange rates and multi-currency transactions.'],
    stack: ['Next.js', 'Tailwind CSS', 'REST APIs'],
    codeNote: 'Code not public',
  },
  {
    title: 'Real-time collaborative document editor',
    category: 'Full-stack',
    summary: 'A multi-user editor with live cursors, change tracking and document versioning.',
    points: ['React and WebSockets for live collaboration.', 'Node.js and MongoDB backend for version history; AI grammar suggestions and multi-language support.'],
    stack: ['React', 'WebSockets', 'Node.js', 'MongoDB'],
    codeNote: 'Code not public',
  },
  {
    title: 'Local sports league organiser',
    category: 'Full-stack',
    summary: 'A web app for running local leagues: teams, fixtures and live scores.',
    points: ['Authentication, team management, automated scheduling and score updates.'],
    stack: ['React', 'Django', 'PostgreSQL'],
    codeNote: 'Code not public',
  },
];
