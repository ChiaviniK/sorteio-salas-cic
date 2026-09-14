import type { Avaliador, ConfigSorteio, Trabalho } from '../types'
import { novaSemente } from '../lib/rng'
import { IconeAlerta, IconeAtualizar, IconeDado, IconeInfo } from './Icones'

interface Props {
  trabalhos: Trabalho[]
  avaliadores: Avaliador[]
  cfg: ConfigSorteio
  aoAlterar: (cfg: ConfigSorteio) => void
  aoSortear: () => void
  aoVoltar: () => void
}

function CampoNumero({
  id,
  rotulo,
  descricao,
  valor,
  min,
  aoAlterar,
}: {
  id: string
  rotulo: string
  descricao: string
  valor: number
  min: number
  aoAlterar: (valor: number) => void
}) {
  return (
    <div>
      <label htmlFor={id} className="rotulo">
        {rotulo}
      </label>
      <input
        id={id}
        type="number"
        min={min}
        value={Number.isFinite(valor) ? valor : ''}
        onChange={(e) => aoAlterar(Math.max(min, Number(e.target.value) || min))}
        className="campo max-w-40 font-display text-lg font-bold"
      />
      <p className="mt-1 text-xs text-slate-500">{descricao}</p>
    </div>
  )
}

export function PassoParametros({ trabalhos, avaliadores, cfg, aoAlterar, aoSortear, aoVoltar }: Props) {
  const jr = trabalhos.filter((t) => t.categoria === 'jr').length
  const gerais = trabalhos.length - jr
  const docentes = avaliadores.filter((a) => a.funcao === 'docente').length
  const avaliadoresJr = avaliadores.filter((a) => a.tipo === 'jr').length

  const X = Math.max(1, cfg.trabalhosPorSala)
  const separaJr = !cfg.jrJunto && jr > 0
  const qtdSalasGerais = separaJr ? Math.ceil(gerais / X) : Math.ceil(trabalhos.length / X)
  const qtdSalasJr = separaJr ? Math.max(1, cfg.salasJr) : 0
  const totalSalas = qtdSalasGerais + qtdSalasJr
  const avaliadoresNecessarios = totalSalas * Math.max(1, cfg.avaliadoresPorSala)
  const salasJrSugeridas = Math.max(1, Math.ceil(jr / X))

  const problemas: { nivel: 'erro' | 'aviso' | 'info'; texto: string }[] = []
  if (separaJr && qtdSalasJr * X < jr) {
    problemas.push({
      nivel: 'erro',
      texto: `${qtdSalasJr} sala(s) PIBIC Jr × ${X} trabalhos não comportam os ${jr} trabalhos PIBIC Jr (sugerido: ${salasJrSugeridas} salas).`,
    })
  }
  if (docentes < totalSalas) {
    problemas.push({
      nivel: 'aviso',
      texto: `Há ${docentes} docentes para ${totalSalas} salas — algumas salas ficarão sem docente.`,
    })
  }
  if (avaliadores.length < avaliadoresNecessarios) {
    problemas.push({
      nivel: 'aviso',
      texto: `Serão necessários ${avaliadoresNecessarios} avaliadores (${totalSalas} salas × ${cfg.avaliadoresPorSala}), mas há ${avaliadores.length} disponíveis.`,
    })
  }
  if (separaJr && avaliadoresJr === 0) {
    problemas.push({
      nivel: 'info',
      texto: 'Nenhum avaliador PIBIC Jr na lista — as salas PIBIC Jr serão completadas com avaliadores gerais.',
    })
  }

  return (
    <div className="surgir grid gap-6 lg:grid-cols-5">
      <section className="card space-y-6 p-6 lg:col-span-3">
        <header>
          <h2 className="font-display text-xl font-bold text-unesp-950">Parâmetros do sorteio</h2>
          <p className="mt-1 text-sm text-slate-500">
            Defina os limites por sala e como o PIBIC Jr será tratado.
          </p>
        </header>

        <div className="grid gap-5 sm:grid-cols-2">
          <CampoNumero
            id="trabalhos-por-sala"
            rotulo="Trabalhos por sala"
            descricao="Quantidade máxima de trabalhos (X) em cada sala."
            valor={cfg.trabalhosPorSala}
            min={1}
            aoAlterar={(v) => aoAlterar({ ...cfg, trabalhosPorSala: v })}
          />
          <CampoNumero
            id="avaliadores-por-sala"
            rotulo="Avaliadores por sala"
            descricao="Quantidade de avaliadores (Y) em cada sala."
            valor={cfg.avaliadoresPorSala}
            min={1}
            aoAlterar={(v) => aoAlterar({ ...cfg, avaliadoresPorSala: v })}
          />
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-800">
                PIBIC Jr na mesma sala dos demais?
              </p>
              <p className="mt-0.5 text-xs text-slate-500">
                {jr === 0
                  ? 'Nenhum trabalho PIBIC Jr foi encontrado na lista.'
                  : cfg.jrJunto
                    ? 'Os trabalhos PIBIC Jr serão misturados aos demais.'
                    : 'Os trabalhos PIBIC Jr terão salas exclusivas.'}
              </p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={cfg.jrJunto}
              disabled={jr === 0}
              onClick={() => aoAlterar({ ...cfg, jrJunto: !cfg.jrJunto })}
              className={`relative h-7 w-12 shrink-0 rounded-full transition-colors disabled:opacity-40 ${
                cfg.jrJunto ? 'bg-unesp-700' : 'bg-slate-300'
              }`}
            >
              <span
                className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${
                  cfg.jrJunto ? 'left-6' : 'left-1'
                }`}
              />
              <span className="sr-only">PIBIC Jr na mesma sala dos demais</span>
            </button>
          </div>

          {separaJr && (
            <div className="mt-4 border-t border-slate-200 pt-4">
              <CampoNumero
                id="salas-jr"
                rotulo="Salas PIBIC Jr"
                descricao={`Sugestão: ${salasJrSugeridas} sala(s) para ${jr} trabalhos PIBIC Jr.`}
                valor={cfg.salasJr}
                min={1}
                aoAlterar={(v) => aoAlterar({ ...cfg, salasJr: v })}
              />
            </div>
          )}
        </div>

        <div>
          <label htmlFor="semente" className="rotulo">
            Semente do sorteio
          </label>
          <div className="flex max-w-64 gap-2">
            <input
              id="semente"
              type="text"
              value={cfg.semente}
              onChange={(e) => aoAlterar({ ...cfg, semente: e.target.value })}
              className="campo font-mono uppercase"
            />
            <button
              type="button"
              className="btn-secundario !px-3"
              title="Gerar nova semente"
              onClick={() => aoAlterar({ ...cfg, semente: novaSemente() })}
            >
              <IconeAtualizar width={16} height={16} />
            </button>
          </div>
          <p className="mt-1 text-xs text-slate-500">
            A mesma semente com os mesmos dados reproduz exatamente o mesmo sorteio (auditável).
          </p>
        </div>
      </section>

      <aside className="space-y-4 lg:col-span-2">
        <section className="card p-6">
          <h3 className="font-display text-sm font-bold uppercase tracking-wider text-slate-500">
            Prévia
          </h3>
          <dl className="mt-4 space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-slate-600">Salas gerais{cfg.jrJunto && jr > 0 ? ' (mistas)' : ''}</dt>
              <dd className="font-display text-lg font-extrabold text-unesp-900">{qtdSalasGerais}</dd>
            </div>
            {separaJr && (
              <div className="flex items-center justify-between">
                <dt className="text-slate-600">Salas PIBIC Jr</dt>
                <dd className="font-display text-lg font-extrabold text-violet-700">{qtdSalasJr}</dd>
              </div>
            )}
            <div className="flex items-center justify-between border-t border-slate-100 pt-3">
              <dt className="font-semibold text-slate-800">Total de salas</dt>
              <dd className="font-display text-2xl font-black text-unesp-800">{totalSalas}</dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-600">Avaliadores necessários</dt>
              <dd
                className={`font-display text-lg font-extrabold ${
                  avaliadores.length < avaliadoresNecessarios ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {avaliadoresNecessarios} / {avaliadores.length}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-slate-600">Docentes disponíveis</dt>
              <dd
                className={`font-display text-lg font-extrabold ${
                  docentes < totalSalas ? 'text-amber-600' : 'text-emerald-600'
                }`}
              >
                {docentes}
              </dd>
            </div>
          </dl>
        </section>

        {problemas.length > 0 && (
          <section className="space-y-2">
            {problemas.map((p) => (
              <div
                key={p.texto}
                className={`flex items-start gap-2 rounded-xl px-3.5 py-2.5 text-xs ring-1 ${
                  p.nivel === 'erro'
                    ? 'bg-red-50 text-red-700 ring-red-200'
                    : p.nivel === 'aviso'
                      ? 'bg-amber-50 text-amber-800 ring-amber-200'
                      : 'bg-unesp-50 text-unesp-800 ring-unesp-200'
                }`}
              >
                {p.nivel === 'info' ? (
                  <IconeInfo width={14} height={14} className="mt-0.5 shrink-0" />
                ) : (
                  <IconeAlerta width={14} height={14} className="mt-0.5 shrink-0" />
                )}
                {p.texto}
              </div>
            ))}
          </section>
        )}

        <div className="flex gap-3">
          <button type="button" className="btn-fantasma" onClick={aoVoltar}>
            Voltar
          </button>
          <button type="button" className="btn-primario flex-1 !py-3 text-base" onClick={aoSortear}>
            <IconeDado width={20} height={20} />
            Sortear salas
          </button>
        </div>
      </aside>
    </div>
  )
}
