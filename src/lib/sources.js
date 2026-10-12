export const SOURCES = {
  huggingface: { label: 'Hugging Face', color: 'var(--src-hf)' },
  kaggle: { label: 'Kaggle', color: 'var(--src-kaggle)' },
  uci: { label: 'UCI ML', color: 'var(--src-uci)' },
  google: { label: 'Google', color: 'var(--src-google)' },
  external: { label: 'Direct URL', color: 'var(--ink-soft)' },
}

export const SEARCHABLE = ['huggingface', 'uci', 'kaggle', 'google']

export function sourceOf(id) {
  return SOURCES[id] || SOURCES.external
}
