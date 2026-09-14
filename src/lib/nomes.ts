const PARTICULAS = new Set(['de', 'da', 'do', 'das', 'dos', 'e'])

/** Remove acentos, caixa e pontuação para comparação de nomes. */
export function normalizar(texto: string): string {
  return (texto ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function tokens(nome: string): string[] {
  return normalizar(nome)
    .split(' ')
    .filter((t) => t && !PARTICULAS.has(t))
}

/**
 * Heurística para decidir se dois nomes se referem à mesma pessoa,
 * tolerando abreviações ("Hugo Bendini" ≈ "Hugo do Nascimento Bendini")
 * e falhas de digitação de espaço ("Alex MendonçaCarvalho").
 */
export function mesmaPessoa(a: string, b: string): boolean {
  const ta = tokens(a)
  const tb = tokens(b)
  if (ta.length === 0 || tb.length === 0) return false
  if (ta.join('') === tb.join('')) return true
  const [curto, longo] = ta.length <= tb.length ? [ta, tb] : [tb, ta]
  if (curto.length < 2) return false
  const conjunto = new Set(longo)
  return curto[0] === longo[0] && curto.every((t) => conjunto.has(t))
}
