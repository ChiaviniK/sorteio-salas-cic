import type { Avaliador, Aviso, ConfigSorteio, Resultado, Sala, Trabalho } from '../types'
import { ROTULO_CATEGORIA, ROTULO_FUNCAO, ROTULO_TIPO_SALA } from '../types'
import { conflitosRigidos, conflitosSuaves, ehOrientadorDe } from '../lib/sorteio'
import { exportarResultado } from '../lib/planilhas'
import { normalizar } from '../lib/nomes'
import { MenuMover, type OpcaoMover } from './MenuMover'
import {
  IconeAlerta,
  IconeAtualizar,
  IconeCheck,
  IconeDownload,
  IconeImpressora,
  IconeInfo,
} from './Icones'

interface Props {
  resultado: Resultado
  cfg: ConfigSorteio
  aoResortear: () => void
  aoVoltar: () => void
  moverTrabalho: (trabalhoId: string, deSalaId: string, paraSalaId: string) => void
  moverAvaliador: (avaliadorId: string, deSalaId: string | null, paraId: string) => void
}

/* ------------------------------------------------------------------ */

function ChipFuncao({ avaliador }: { avaliador: Avaliador }) {
  const estilos =
    avaliador.funcao === 'docente'
      ? 'bg-unesp-800 text-white'
      : avaliador.funcao === 'pos'
        ? 'bg-slate-200 text-slate-700'
        : 'bg-white text-slate-600 ring-1 ring-slate-300'
  return <span className={`chip !px-2 !text-[10px] ${estilos}`}>{ROTULO_FUNCAO[avaliador.funcao]}</span>
}

function PainelAvisos({ avisos }: { avisos: Aviso[] }) {
  const erros = avisos.filter((a) => a.nivel === 'erro')
  const alertas = avisos.filter((a) => a.nivel === 'aviso')
  const infos = avisos.filter((a) => a.nivel === 'info')

  if (avisos.length === 0) {
    return (
      <div className="flex items-center gap-2.5 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800 ring-1 ring-emerald-200">
        <IconeCheck width={16} height={16} />
        Nenhuma pendência: todas as regras do sorteio foram atendidas.
      </div>
    )
  }

  const grupos: { titulo: string; itens: Aviso[]; cor: string; icone: 'alerta' | 'info'; aberto: boolean }[] = [
    { titulo: 'Conflitos (exigem atenção)', itens: erros, cor: 'red', icone: 'alerta', aberto: true },
    { titulo: 'Recomendações não atendidas', itens: alertas, cor: 'amber', icone: 'alerta', aberto: erros.length === 0 },
    { titulo: 'Informações', itens: infos, cor: 'slate', icone: 'info', aberto: false },
  ]

  return (
    <div className="space-y-2">
      {grupos
        .filter((g) => g.itens.length > 0)
        .map((g) => (
          <details
            key={g.titulo}
            open={g.aberto}
            className={`overflow-hidden rounded-xl ring-1 ${
              g.cor === 'red'
                ? 'bg-red-50 ring-red-200'
                : g.cor === 'amber'
                  ? 'bg-amber-50 ring-amber-200'
                  : 'bg-slate-50 ring-slate-200'
            }`}
          >
            <summary
              className={`flex cursor-pointer items-center gap-2 px-4 py-2.5 text-sm font-semibold ${
                g.cor === 'red' ? 'text-red-800' : g.cor === 'amber' ? 'text-amber-800' : 'text-slate-700'
              }`}
            >
              {g.icone === 'alerta' ? <IconeAlerta width={15} height={15} /> : <IconeInfo width={15} height={15} />}
              {g.titulo}
              <span
                className={`chip !px-2 ${
                  g.cor === 'red'
                    ? 'bg-red-100 text-red-700'
                    : g.cor === 'amber'
                      ? 'bg-amber-100 text-amber-700'
                      : 'bg-slate-200 text-slate-600'
                }`}
              >
                {g.itens.length}
              </span>
            </summary>
            <ul
              className={`space-y-1 px-4 pb-3 text-xs ${
                g.cor === 'red' ? 'text-red-700' : g.cor === 'amber' ? 'text-amber-800' : 'text-slate-600'
              }`}
            >
              {g.itens.map((a, i) => (
                <li key={`${a.mensagem}-${i}`}>• {a.mensagem}</li>
              ))}
            </ul>
          </details>
        ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function CartaoSala({
  sala,
  salas,
  cfg,
  moverTrabalho,
  moverAvaliador,
}: {
  sala: Sala
  salas: Sala[]
  cfg: ConfigSorteio
  moverTrabalho: Props['moverTrabalho']
  moverAvaliador: Props['moverAvaliador']
}) {
  const outras = salas.filter((s) => s.id !== sala.id)

  const opcoesAvaliador = (av: Avaliador): OpcaoMover[] => [
    ...outras.map((s) => ({
      id: s.id,
      rotulo: s.nome + (s.tipo === 'jr' ? ' · Jr' : ''),
      detalhe: `${s.avaliadores.length}/${cfg.avaliadoresPorSala} aval.`,
      tom:
        conflitosRigidos(av, s).length > 0
          ? ('erro' as const)
          : conflitosSuaves(av, s).length > 0
            ? ('alerta' as const)
            : ('normal' as const),
    })),
    { id: 'reserva', rotulo: 'Reserva (sem sala)', tom: 'normal' as const },
  ]

  const opcoesTrabalho = (t: Trabalho): OpcaoMover[] =>
    outras.map((s) => ({
      id: s.id,
      rotulo: s.nome + (s.tipo === 'jr' ? ' · Jr' : ''),
      detalhe: `${s.trabalhos.length}/${cfg.trabalhosPorSala} trab.`,
      tom: s.avaliadores.some((a) => ehOrientadorDe(a, t))
        ? ('erro' as const)
        : s.trabalhos.length >= cfg.trabalhosPorSala ||
            s.trabalhos.some(
              (o) => t.orientador && normalizar(o.orientador) === normalizar(t.orientador),
            )
          ? ('alerta' as const)
          : ('normal' as const),
    }))

  const orientadoresRepetidos = new Set<string>()
  {
    const contagem = new Map<string, number>()
    for (const t of sala.trabalhos) {
      const chave = normalizar(t.orientador)
      if (!chave) continue
      contagem.set(chave, (contagem.get(chave) ?? 0) + 1)
    }
    for (const [chave, qtd] of contagem) if (qtd >= 2) orientadoresRepetidos.add(chave)
  }

  const temDocente = sala.avaliadores.some((a) => a.funcao === 'docente')

  return (
    <article
      className={`card flex flex-col overflow-hidden border-t-4 ${
        sala.tipo === 'jr' ? 'border-t-violet-500' : 'border-t-unesp-700'
      }`}
    >
      <header className="flex items-center justify-between gap-2 border-b border-slate-100 px-4 py-3">
        <div className="flex items-center gap-2">
          <h3 className="font-display text-base font-extrabold text-unesp-950">{sala.nome}</h3>
          {sala.tipo !== 'geral' && (
            <span
              className={`chip !px-2 ${
                sala.tipo === 'jr' ? 'bg-violet-100 text-violet-700' : 'bg-teal-100 text-teal-700'
              }`}
            >
              {ROTULO_TIPO_SALA[sala.tipo]}
            </span>
          )}
        </div>
        <p className="text-[11px] font-medium text-slate-400">
          {sala.trabalhos.length} trab. · {sala.avaliadores.length} aval.
        </p>
      </header>

      <div className="flex flex-1 flex-col gap-4 p-4">
        <section>
          <h4 className="mb-1.5 flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Avaliadores
            {!temDocente && sala.trabalhos.length > 0 && (
              <span className="chip !px-2 bg-red-100 !text-[10px] text-red-700">sem docente</span>
            )}
          </h4>
          <ul className="space-y-0.5">
            {sala.avaliadores.map((av) => {
              const rigidos = conflitosRigidos(av, sala)
              const suaves = conflitosSuaves(av, sala)
              return (
                <li
                  key={av.id}
                  className="-mx-2 flex items-center justify-between gap-1 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-800" title={av.nome}>
                      {av.nome}
                    </p>
                    <div className="mt-0.5 flex flex-wrap items-center gap-1">
                      <ChipFuncao avaliador={av} />
                      {av.tipo === 'jr' && (
                        <span className="chip !px-2 !text-[10px] bg-violet-100 text-violet-700">PIBIC Jr</span>
                      )}
                      {rigidos.length > 0 && (
                        <span className="chip !px-2 !text-[10px] bg-red-100 text-red-700">
                          orienta nº {rigidos.map((t) => t.numero).join(', ')}
                        </span>
                      )}
                      {suaves.length > 0 && (
                        <span className="chip !px-2 !text-[10px] bg-amber-100 text-amber-700">
                          coautor nº {suaves.map((t) => t.numero).join(', ')}
                        </span>
                      )}
                    </div>
                  </div>
                  <MenuMover
                    titulo="Mover avaliador para…"
                    opcoes={opcoesAvaliador(av)}
                    aoEscolher={(destino) => moverAvaliador(av.id, sala.id, destino)}
                  />
                </li>
              )
            })}
            {sala.avaliadores.length === 0 && (
              <li className="text-xs italic text-slate-400">Nenhum avaliador alocado.</li>
            )}
          </ul>
        </section>

        <section className="border-t border-slate-100 pt-3">
          <h4 className="mb-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
            Trabalhos
          </h4>
          <ul className="space-y-0.5">
            {sala.trabalhos.map((t) => (
              <li
                key={t.id}
                className="-mx-2 flex items-center justify-between gap-1 rounded-lg px-2 py-1.5 transition-colors hover:bg-slate-50"
              >
                <div className="min-w-0">
                  <p className="flex items-baseline gap-1.5 text-sm">
                    <span className="shrink-0 font-mono text-[11px] text-slate-400">{t.numero}</span>
                    <span className="truncate font-medium text-slate-800" title={t.titulo}>
                      {t.titulo}
                    </span>
                  </p>
                  <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
                    <span className="truncate text-[11px] text-slate-500" title={t.orientador}>
                      Orient.: {t.orientador || '—'}
                    </span>
                    {t.categoria === 'jr' && (
                      <span className="chip !px-2 !text-[10px] bg-violet-100 text-violet-700">PIBIC Jr</span>
                    )}
                    {t.orientador && orientadoresRepetidos.has(normalizar(t.orientador)) && (
                      <span className="chip !px-2 !text-[10px] bg-amber-100 text-amber-700">
                        orientador repetido
                      </span>
                    )}
                  </div>
                </div>
                <MenuMover
                  titulo="Mover trabalho para…"
                  opcoes={opcoesTrabalho(t)}
                  aoEscolher={(destino) => moverTrabalho(t.id, sala.id, destino)}
                />
              </li>
            ))}
            {sala.trabalhos.length === 0 && (
              <li className="text-xs italic text-slate-400">Nenhum trabalho alocado.</li>
            )}
          </ul>
        </section>
      </div>
    </article>
  )
}

/* ------------------------------------------------------------------ */

export function PassoResultado({
  resultado,
  cfg,
  aoResortear,
  aoVoltar,
  moverTrabalho,
  moverAvaliador,
}: Props) {
  const erros = resultado.avisos.filter((a) => a.nivel === 'erro').length
  const totalTrabalhos = resultado.salas.reduce((soma, s) => soma + s.trabalhos.length, 0)
  const totalAvaliadores = resultado.salas.reduce((soma, s) => soma + s.avaliadores.length, 0)

  return (
    <div className="surgir space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold text-unesp-950">Resultado do sorteio</h2>
          <p className="mt-1 text-sm text-slate-500">
            Semente{' '}
            <code className="rounded-md bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-unesp-800">
              {resultado.semente}
            </code>{' '}
            · use o botão de mover em cada item para ajustes manuais.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" className="btn-fantasma" onClick={aoVoltar}>
            Parâmetros
          </button>
          <button type="button" className="btn-secundario" onClick={aoResortear}>
            <IconeAtualizar width={16} height={16} />
            Re-sortear
          </button>
          <button type="button" className="btn-secundario" onClick={() => window.print()}>
            <IconeImpressora width={16} height={16} />
            Imprimir
          </button>
          <button type="button" className="btn-primario" onClick={() => exportarResultado(resultado)}>
            <IconeDownload width={16} height={16} />
            Exportar Excel
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { rotulo: 'Salas', valor: resultado.salas.length },
          { rotulo: 'Trabalhos', valor: totalTrabalhos },
          { rotulo: 'Avaliadores alocados', valor: totalAvaliadores },
          { rotulo: 'Reserva', valor: resultado.reserva.length },
        ].map((e) => (
          <div key={e.rotulo} className="card px-4 py-3">
            <p className="font-display text-2xl font-black text-unesp-800">{e.valor}</p>
            <p className="text-xs font-medium text-slate-500">{e.rotulo}</p>
          </div>
        ))}
      </div>

      <PainelAvisos avisos={resultado.avisos} />

      <div className="grid items-start gap-5 md:grid-cols-2 xl:grid-cols-3">
        {resultado.salas.map((sala) => (
          <CartaoSala
            key={sala.id}
            sala={sala}
            salas={resultado.salas}
            cfg={cfg}
            moverTrabalho={moverTrabalho}
            moverAvaliador={moverAvaliador}
          />
        ))}
      </div>

      {resultado.reserva.length > 0 && (
        <section className="card p-5">
          <h3 className="font-display text-base font-bold text-unesp-950">
            Reserva{' '}
            <span className="text-sm font-semibold text-slate-400">
              ({resultado.reserva.length} avaliador{resultado.reserva.length > 1 ? 'es' : ''} sem sala)
            </span>
          </h3>
          <ul className="mt-3 grid gap-1 sm:grid-cols-2 xl:grid-cols-3">
            {resultado.reserva.map((av) => (
              <li
                key={av.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-slate-200 px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-800" title={av.nome}>
                    {av.nome}
                  </p>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    <ChipFuncao avaliador={av} />
                    {av.tipo === 'jr' && (
                      <span className="chip !px-2 !text-[10px] bg-violet-100 text-violet-700">
                        {ROTULO_CATEGORIA.jr}
                      </span>
                    )}
                  </div>
                </div>
                <MenuMover
                  titulo="Alocar em…"
                  opcoes={resultado.salas.map((s) => ({
                    id: s.id,
                    rotulo: s.nome + (s.tipo === 'jr' ? ' · Jr' : ''),
                    detalhe: `${s.avaliadores.length}/${cfg.avaliadoresPorSala} aval.`,
                    tom:
                      conflitosRigidos(av, s).length > 0
                        ? ('erro' as const)
                        : conflitosSuaves(av, s).length > 0
                          ? ('alerta' as const)
                          : ('normal' as const),
                  }))}
                  aoEscolher={(destino) => moverAvaliador(av.id, null, destino)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {erros > 0 && (
        <p className="text-center text-xs text-slate-400">
          Dica: conflitos em vermelho podem ser resolvidos movendo o avaliador ou o trabalho para outra
          sala — o painel acima é atualizado a cada ajuste.
        </p>
      )}
    </div>
  )
}
