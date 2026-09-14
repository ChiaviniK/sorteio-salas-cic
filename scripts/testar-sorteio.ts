/**
 * Teste de ponta a ponta do motor de sorteio com os dados reais do CIC.
 * Uso: npx tsx scripts/testar-sorteio.ts
 */
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { importarAvaliadores, importarTrabalhos } from '../src/lib/planilhas'
import { ehOrientadorDe, sortear } from '../src/lib/sorteio'
import type { ConfigSorteio } from '../src/types'

function lerArquivo(caminho: string): ArrayBuffer {
  const buffer = readFileSync(caminho)
  return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength) as ArrayBuffer
}

const pasta = join(import.meta.dirname, '..', 'dados-exemplo')
const dadosTrabalhos = importarTrabalhos(
  lerArquivo(join(pasta, 'ListaResultado_Even3_Sorteio.xlsx')),
  'ListaResultado_Even3_Sorteio.xlsx',
)
const dadosAvaliadores = importarAvaliadores(
  lerArquivo(join(pasta, 'Avaliadores_CIC.xlsx')),
  'Avaliadores_CIC.xlsx',
)

console.log(`Trabalhos: ${dadosTrabalhos.trabalhos.length} (origem: ${dadosTrabalhos.origem})`)
console.log(`  PIBIC Jr: ${dadosTrabalhos.trabalhos.filter((t) => t.categoria === 'jr').length}`)
console.log(`  Alertas: ${JSON.stringify(dadosTrabalhos.alertas, null, 1)}`)
console.log(`Avaliadores: ${dadosAvaliadores.avaliadores.length}`)
console.log(`  Docentes: ${dadosAvaliadores.avaliadores.filter((a) => a.funcao === 'docente').length}`)
console.log(`  PIBIC Jr: ${dadosAvaliadores.avaliadores.filter((a) => a.tipo === 'jr').length}`)

const cfg: ConfigSorteio = {
  trabalhosPorSala: 10,
  avaliadoresPorSala: 3,
  jrJunto: false,
  salasJr: 1,
  semente: 'TESTE1',
}

const resultado = sortear(dadosTrabalhos.trabalhos, dadosAvaliadores.avaliadores, cfg)

console.log('\n=== SALAS ===')
for (const sala of resultado.salas) {
  console.log(`\n${sala.nome} [${sala.tipo}] — ${sala.trabalhos.length} trabalhos`)
  console.log(
    `  Avaliadores: ${sala.avaliadores.map((a) => `${a.nome} (${a.funcao}${a.tipo === 'jr' ? '/jr' : ''})`).join(' | ')}`,
  )
  const orientadores = new Map<string, number>()
  for (const t of sala.trabalhos) {
    orientadores.set(t.orientador, (orientadores.get(t.orientador) ?? 0) + 1)
  }
  const repetidos = [...orientadores.entries()].filter(([, q]) => q > 1)
  if (repetidos.length > 0) console.log(`  Orientadores repetidos: ${JSON.stringify(repetidos)}`)
}

console.log('\n=== AVISOS ===')
for (const aviso of resultado.avisos) console.log(`[${aviso.nivel}] ${aviso.mensagem}`)
console.log(`Reserva: ${resultado.reserva.map((a) => a.nome).join(', ') || '(vazia)'}`)

/* ---------------- verificações ---------------- */
let falhas = 0
const falha = (msg: string) => {
  falhas++
  console.error(`✗ FALHA: ${msg}`)
}

// 1. Nenhum orientador avaliando a própria sala (restrição rígida)
for (const sala of resultado.salas) {
  for (const av of sala.avaliadores) {
    for (const t of sala.trabalhos) {
      if (ehOrientadorDe(av, t)) falha(`${sala.nome}: ${av.nome} orienta o trabalho ${t.numero}`)
    }
  }
}

// 2. Todos os trabalhos alocados exatamente uma vez
const idsAlocados = resultado.salas.flatMap((s) => s.trabalhos.map((t) => t.id))
if (idsAlocados.length !== dadosTrabalhos.trabalhos.length) {
  falha(`${idsAlocados.length} trabalhos alocados, esperado ${dadosTrabalhos.trabalhos.length}`)
}
if (new Set(idsAlocados).size !== idsAlocados.length) falha('Trabalho duplicado entre salas')

// 3. Avaliador em no máximo uma sala
const idsAvaliadores = resultado.salas.flatMap((s) => s.avaliadores.map((a) => a.id))
if (new Set(idsAvaliadores).size !== idsAvaliadores.length) falha('Avaliador em mais de uma sala')

// 4. Um docente por sala
for (const sala of resultado.salas) {
  if (sala.trabalhos.length > 0 && !sala.avaliadores.some((a) => a.funcao === 'docente')) {
    falha(`${sala.nome} sem docente`)
  }
}

// 5. Salas Jr contêm apenas trabalhos Jr (e vice-versa, pois jrJunto=false)
for (const sala of resultado.salas) {
  for (const t of sala.trabalhos) {
    if (sala.tipo === 'jr' && t.categoria !== 'jr') falha(`${sala.nome} (jr) contém trabalho geral ${t.numero}`)
    if (sala.tipo === 'geral' && t.categoria !== 'geral') falha(`${sala.nome} (geral) contém trabalho jr ${t.numero}`)
  }
}

// 6. Sala Jr prioriza avaliadores Jr
const salaJr = resultado.salas.find((s) => s.tipo === 'jr')
if (salaJr && salaJr.avaliadores.filter((a) => a.tipo === 'jr').length === 0) {
  falha('Sala PIBIC Jr sem nenhum avaliador PIBIC Jr (havia 4 disponíveis)')
}

// 7. Determinismo: mesma semente → mesmo resultado
const repeticao = sortear(dadosTrabalhos.trabalhos, dadosAvaliadores.avaliadores, cfg)
if (JSON.stringify(repeticao.salas) !== JSON.stringify(resultado.salas)) {
  falha('Sorteio não é determinístico com a mesma semente')
}
const outraSemente = sortear(dadosTrabalhos.trabalhos, dadosAvaliadores.avaliadores, {
  ...cfg,
  semente: 'OUTRA9',
})
if (JSON.stringify(outraSemente.salas) === JSON.stringify(resultado.salas)) {
  falha('Sementes diferentes geraram o mesmo resultado')
}

// 8. Pulverização: nenhum orientador com 3+ trabalhos na mesma sala geral
for (const sala of resultado.salas.filter((s) => s.tipo === 'geral')) {
  const contagem = new Map<string, number>()
  for (const t of sala.trabalhos) contagem.set(t.orientador, (contagem.get(t.orientador) ?? 0) + 1)
  for (const [nome, qtd] of contagem) {
    if (qtd >= 3) falha(`${sala.nome}: ${qtd} trabalhos de ${nome}`)
  }
}

console.log(falhas === 0 ? '\n✓ TODOS OS TESTES PASSARAM' : `\n✗ ${falhas} FALHA(S)`)
process.exit(falhas === 0 ? 0 : 1)
