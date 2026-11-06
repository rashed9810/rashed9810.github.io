// Research interests and research work.
//
// HONESTY RULES (keep these when you edit):
// - `basis` says what backs each interest. Use 'current' only when there is public work,
//   'thesis' for completed academic work, 'interest' for a stated direction.
// - A paper goes in `works` with status 'published' ONLY when it has a DOI or venue link.
//   Use 'review' for submitted manuscripts and 'ongoing' for work in progress.
//   Groups with no entries are hidden automatically.

export type Basis = 'current' | 'thesis' | 'interest';

export const basisLabel: Record<Basis, string> = {
  current: 'Current work',
  thesis: 'Thesis work',
  interest: 'Stated interest',
};

export const interests: {
  title: string;
  text: string;
  basis: Basis;
  evidence?: { label: string; href?: string };
}[] = [
  {
    title: 'Reliable and verifiable LLM generation',
    text: 'Making language-model output checkable: constraining what a model may change, then verifying citations, equations and numbers survive, with a safe fallback when they do not.',
    basis: 'current',
    evidence: { label: 'Recast', href: 'https://github.com/rashed9810/Recast' },
  },
  {
    title: 'Medical image analysis',
    text: 'Deep learning for diagnostic imaging, starting from chest X-ray disease classification with transfer learning, and biomedical image processing work at Imranslab.',
    basis: 'thesis',
    evidence: { label: 'B.Sc. thesis, IUBAT (2022)' },
  },
  {
    title: 'Foundation and multimodal models',
    text: 'Adapting pretrained models to narrow domains through parameter-efficient fine-tuning, and combining image and text understanding for healthcare tasks.',
    basis: 'interest',
    evidence: { label: 'LoRA fine-tuning project', href: 'https://github.com/rashed9810/Fine-Tuning-LLMs-with-Hugging-face' },
  },
  {
    title: 'Explainable AI',
    text: 'Explanations that let clinicians and researchers see why a model reached a prediction, so its errors can be found before they matter.',
    basis: 'interest',
  },
];

export type WorkStatus = 'published' | 'review' | 'ongoing' | 'completed';

export const statusLabel: Record<WorkStatus, string> = {
  published: 'Published',
  review: 'Under review',
  ongoing: 'Ongoing',
  completed: 'Completed',
};

export type Work = {
  title: string;
  status: WorkStatus;
  kind: string; // e.g. 'Journal article', 'Undergraduate thesis', 'Open-source research tool'
  year: string;
  authors?: string; // write your own name as it appears; it is highlighted automatically
  venue?: string;
  summary: string;
  problem?: string;
  approach?: string;
  stack?: string[];
  findings?: string; // only verified results
  links?: { label: string; href: string }[];
};

export const works: Work[] = [
  {
    title: 'Recast: constraint-preserving rewriting of academic text with LLMs',
    status: 'ongoing',
    kind: 'Open-source research tool',
    year: '2026',
    summary:
      'A paraphrasing system for papers and theses that refuses to change what must stay fixed. It is also my working testbed for verifiable generation.',
    problem:
      'General-purpose LLM rewriters silently drop or alter citations, LaTeX math, references and numbers, and can flip negation or hedging, which is unacceptable in academic writing.',
    approach:
      'Protected spans (citations, math, references) are replaced with lock tokens before generation. After the model rewrites the prose, every token must come back intact or the original paragraph is kept. Heuristic checks then compare numbers, negation, hedging, certainty and length.',
    stack: ['Python', 'FastAPI', 'Next.js', 'TypeScript', 'Docker', 'pytest', 'Ollama and cloud LLM APIs'],
    findings:
      'Covered by a 42-test pytest suite. Meaning checks are heuristics and are documented as such; a formal evaluation is planned.',
    links: [{ label: 'Code', href: 'https://github.com/rashed9810/Recast' }],
  },
  {
    title: 'Lung disease detection from chest X-ray images using deep learning',
    status: 'completed',
    kind: 'Undergraduate thesis',
    year: '2022',
    venue: 'International University of Business Agriculture and Technology (IUBAT)',
    summary:
      'An image classification system for detecting multiple lung diseases from chest radiographs.',
    problem: 'Screening chest X-rays for several lung diseases is slow and depends on specialist availability.',
    approach:
      'VGG-16 transfer learning on a dataset of more than 10,000 chest X-ray images, evaluated on a held-out test set.',
    stack: ['Python', 'CNNs', 'VGG-16', 'Transfer learning'],
  },
];
