export type Rng = () => number

function hashSemente(texto: string): number {
  let h = 1779033703 ^ texto.length
  for (let i = 0; i < texto.length; i++) {
    h = Math.imul(h ^ texto.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return h >>> 0
}

/** Gerador pseudoaleatório determinístico (mulberry32) a partir de uma semente textual. */
export function criarRng(semente: string): Rng {
  let a = hashSemente(semente || 'cic-unesp')
  return () => {
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Fisher–Yates sem mutar o array original. */
export function embaralhar<T>(itens: readonly T[], rng: Rng): T[] {
  const copia = [...itens]
  for (let i = copia.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[copia[i], copia[j]] = [copia[j], copia[i]]
  }
  return copia
}

export function novaSemente(): string {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}
