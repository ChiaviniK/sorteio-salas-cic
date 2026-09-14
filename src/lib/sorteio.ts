import type { Avaliador, Aviso, ConfigSorteio, Resultado, Sala, TipoSala, Trabalho } from '../types'
import { mesmaPessoa, normalizar } from './nomes'
import { criarRng, embaralhar, type Rng } from './rng'

/* ------------------------------------------------------------------ */
/* Conflitos                                                           */
/* ------------------------------------------------------------------ */

/** O avaliador é o(a) orientador(a) oficial do trabalho? (restrição rígida) */
export function ehOrientadorDe(av: Avaliador, t: Trabalho): boolean {
  const emailAv = av.email?.trim().toLowerCase()
  const emailOr = t.orientadorEmail?.trim().toLowerCase()
  if (emailAv && emailOr && emailAv === emailOr) return true
  return mesmaPessoa(av.nome, t.orientador)
}

/** O avaliador é coautor (inclui orientadores não oficiais)? (restrição flexível) */
export function ehCoautorDe(av: Avaliador, t: Trabalho): boolean {
  if (ehOrientadorDe(av, t)) return false
  return t.autores.some((autor) => mesmaPessoa(av.nome, autor))
}

export function conflitosRigidos(av: Avaliador, sala: Sala): Trabalho[] {
  return sala.trabalhos.filter((t) => ehOrientadorDe(av, t))
}

export function conflitosSuaves(av: Avaliador, sala: Sala): Trabalho[] {
  return sala.trabalhos.filter((t) => ehCoautorDe(av, t))
}

function chaveOrientador(t: Trabalho): string {
  return normalizar(t.orientador) || `__sem_orientador_${t.id}`
}

/* ------------------------------------------------------------------ */
/* Distribuição de trabalhos                                           */
/* ------------------------------------------------------------------ */

/**
 * Distribui trabalhos nas salas de forma equilibrada, "pulverizando"
 * os trabalhos de um mesmo orientador em salas diferentes.
 */
function distribuirTrabalhos(trabalhos: Trabalho[], salas: Sala[], rng: Rng): void {
  if (salas.length === 0 || trabalhos.length === 0) return
  const n = trabalhos.length
  const k = salas.length
  const capacidade = new Map<string, number>()
  salas.forEach((s, i) => capacidade.set(s.id, Math.floor(n / k) + (i < n % k ? 1 : 0)))

  const grupos = new Map<string, Trabalho[]>()
  for (const t of trabalhos) {
    const chave = chaveOrientador(t)
    const grupo = grupos.get(chave)
    if (grupo) grupo.push(t)
    else grupos.set(chave, [t])
  }

  // Grupos maiores primeiro (a ordenação estável preserva o embaralhamento entre iguais)
  const ordenados = embaralhar([...grupos.values()], rng).sort((a, b) => b.length - a.length)

  for (const grupo of ordenados) {
    for (const trabalho of embaralhar(grupo, rng)) {
      const chave = chaveOrientador(trabalho)
      const comVaga = salas.filter((s) => s.trabalhos.length < (capacidade.get(s.id) ?? 0))
      const candidatas = embaralhar(comVaga.length > 0 ? comVaga : salas, rng)
      let alvo = candidatas[0]
      let melhor: [number, number] = [Infinity, Infinity]
      for (const sala of candidatas) {
        const mesmos = sala.trabalhos.filter((t) => chaveOrientador(t) === chave).length
        if (mesmos < melhor[0] || (mesmos === melhor[0] && sala.trabalhos.length < melhor[1])) {
          melhor = [mesmos, sala.trabalhos.length]
          alvo = sala
        }
      }
      alvo.trabalhos.push(trabalho)
    }
  }
}

/* ------------------------------------------------------------------ */
/* Alocação de avaliadores                                             */
/* ------------------------------------------------------------------ */

/**
 * Aloca avaliadores nas salas respeitando: nunca orientador na sala do
 * orientando (rígida), ao menos um docente por sala, prioridade de
 * avaliadores PIBIC Jr nas salas PIBIC Jr e evitar coautores (flexível).
 * Retorna os avaliadores que ficaram de reserva.
 */
function alocarAvaliadores(
  salas: Sala[],
  avaliadores: Avaliador[],
  cfg: ConfigSorteio,
  rng: Rng,
): Avaliador[] {
  const fila = embaralhar(avaliadores, rng)
  const usados = new Set<string>()
  // Salas PIBIC Jr escolhem primeiro (avaliadores Jr são mais escassos)
  const ordemSalas = [...salas].sort(
    (a, b) => (a.tipo === 'jr' ? 0 : 1) - (b.tipo === 'jr' ? 0 : 1),
  )

  const preferenciaTipo = (av: Avaliador, sala: Sala): number => {
    if (sala.tipo === 'jr') return av.tipo === 'jr' ? 0 : 1
    if (sala.tipo === 'geral') return av.tipo === 'geral' ? 0 : 1
    return 0
  }

  const escolher = (sala: Sala, apenasDocentes: boolean): Avaliador | null => {
    let escolhido: Avaliador | null = null
    let melhor: [number, number] = [Infinity, Infinity]
    for (const av of fila) {
      if (usados.has(av.id)) continue
      if (apenasDocentes && av.funcao !== 'docente') continue
      if (conflitosRigidos(av, sala).length > 0) continue
      const pontos: [number, number] = [preferenciaTipo(av, sala), conflitosSuaves(av, sala).length]
      if (pontos[0] < melhor[0] || (pontos[0] === melhor[0] && pontos[1] < melhor[1])) {
        melhor = pontos
        escolhido = av
      }
    }
    return escolhido
  }

  // 1ª rodada: garante um(a) docente por sala
  if (cfg.avaliadoresPorSala >= 1) {
    for (const sala of ordemSalas) {
      if (sala.trabalhos.length === 0) continue
      const docente = escolher(sala, true)
      if (docente) {
        sala.avaliadores.push(docente)
        usados.add(docente.id)
      }
    }
  }

  // Rodadas seguintes: completa as salas de forma equilibrada
  let progrediu = true
  while (progrediu) {
    progrediu = false
    for (const sala of ordemSalas) {
      if (sala.trabalhos.length === 0) continue
      if (sala.avaliadores.length >= cfg.avaliadoresPorSala) continue
      const av = escolher(sala, false)
      if (av) {
        sala.avaliadores.push(av)
        usados.add(av.id)
        progrediu = true
      }
    }
  }

  return avaliadores.filter((a) => !usados.has(a.id))
}

/* ------------------------------------------------------------------ */
/* Validação                                                           */
/* ------------------------------------------------------------------ */

/** Revalida todas as regras (usada após o sorteio e após ajustes manuais). */
export function validar(salas: Sala[], cfg: ConfigSorteio): Aviso[] {
  const avisos: Aviso[] = []
  for (const sala of salas) {
    if (sala.trabalhos.length > cfg.trabalhosPorSala) {
      avisos.push({
        nivel: 'aviso',
        salaId: sala.id,
        mensagem: `${sala.nome}: ${sala.trabalhos.length} trabalhos (limite configurado: ${cfg.trabalhosPorSala}).`,
      })
    }
    if (sala.trabalhos.length > 0 && !sala.avaliadores.some((a) => a.funcao === 'docente')) {
      avisos.push({
        nivel: 'erro',
        salaId: sala.id,
        mensagem: `${sala.nome}: nenhum(a) docente entre os avaliadores.`,
      })
    }
    if (sala.trabalhos.length > 0 && sala.avaliadores.length < cfg.avaliadoresPorSala) {
      avisos.push({
        nivel: 'aviso',
        salaId: sala.id,
        mensagem: `${sala.nome}: apenas ${sala.avaliadores.length} de ${cfg.avaliadoresPorSala} avaliadores.`,
      })
    }

    for (const av of sala.avaliadores) {
      for (const t of conflitosRigidos(av, sala)) {
        avisos.push({
          nivel: 'erro',
          salaId: sala.id,
          mensagem: `${sala.nome}: ${av.nome} orienta o trabalho nº ${t.numero}, alocado nesta sala.`,
        })
      }
      for (const t of conflitosSuaves(av, sala)) {
        avisos.push({
          nivel: 'aviso',
          salaId: sala.id,
          mensagem: `${sala.nome}: ${av.nome} é coautor(a) do trabalho nº ${t.numero} (recomendado evitar).`,
        })
      }
    }

    const porOrientador = new Map<string, { nome: string; qtd: number }>()
    for (const t of sala.trabalhos) {
      const chave = chaveOrientador(t)
      const atual = porOrientador.get(chave)
      if (atual) atual.qtd += 1
      else porOrientador.set(chave, { nome: t.orientador || '(sem orientador)', qtd: 1 })
    }
    for (const { nome, qtd } of porOrientador.values()) {
      if (qtd >= 2) {
        avisos.push({
          nivel: 'aviso',
          salaId: sala.id,
          mensagem: `${sala.nome}: ${qtd} trabalhos de ${nome} na mesma sala (pulverização parcial).`,
        })
      }
    }

    if (sala.tipo === 'jr') {
      for (const t of sala.trabalhos.filter((tr) => tr.categoria === 'geral')) {
        avisos.push({
          nivel: 'info',
          salaId: sala.id,
          mensagem: `${sala.nome} (PIBIC Jr): contém o trabalho geral nº ${t.numero}.`,
        })
      }
    }
    if (sala.tipo === 'geral') {
      for (const t of sala.trabalhos.filter((tr) => tr.categoria === 'jr')) {
        avisos.push({
          nivel: 'info',
          salaId: sala.id,
          mensagem: `${sala.nome}: contém o trabalho PIBIC Jr nº ${t.numero}.`,
        })
      }
    }
  }
  return avisos
}

/* ------------------------------------------------------------------ */
/* Sorteio                                                             */
/* ------------------------------------------------------------------ */

function novaSala(numero: number, tipo: TipoSala): Sala {
  return { id: `sala-${numero}`, nome: `Sala ${numero}`, tipo, trabalhos: [], avaliadores: [] }
}

export function sortear(
  trabalhos: Trabalho[],
  avaliadores: Avaliador[],
  cfg: ConfigSorteio,
): Resultado {
  const rng = criarRng(cfg.semente)
  const avisos: Aviso[] = []
  const X = Math.max(1, cfg.trabalhosPorSala)
  const jr = trabalhos.filter((t) => t.categoria === 'jr')
  const gerais = trabalhos.filter((t) => t.categoria === 'geral')

  const salas: Sala[] = []
  if (cfg.jrJunto || jr.length === 0) {
    const total = Math.ceil(trabalhos.length / X)
    for (let i = 0; i < total; i++) salas.push(novaSala(i + 1, jr.length > 0 ? 'mista' : 'geral'))
    distribuirTrabalhos(trabalhos, salas, rng)
  } else {
    const qtdGerais = Math.ceil(gerais.length / X)
    const qtdJr = Math.max(1, cfg.salasJr)
    const salasGerais: Sala[] = []
    const salasJr: Sala[] = []
    for (let i = 0; i < qtdGerais; i++) salasGerais.push(novaSala(i + 1, 'geral'))
    for (let i = 0; i < qtdJr; i++) salasJr.push(novaSala(qtdGerais + i + 1, 'jr'))
    if (qtdJr * X < jr.length) {
      avisos.push({
        nivel: 'erro',
        mensagem: `Capacidade insuficiente para o PIBIC Jr: ${qtdJr} sala(s) × ${X} trabalhos < ${jr.length} trabalhos. As salas PIBIC Jr ficarão acima do limite.`,
      })
    }
    distribuirTrabalhos(gerais, salasGerais, rng)
    distribuirTrabalhos(jr, salasJr, rng)
    salas.push(...salasGerais, ...salasJr)
  }

  const reserva = alocarAvaliadores(salas, avaliadores, cfg, rng)
  avisos.push(...validar(salas, cfg))
  return { salas, reserva, avisos, semente: cfg.semente }
}
