import { IconeCheck, IconeDado, IconeEscudo, IconePlanilha } from './Icones'

const PASSOS = [
  { numero: 1, titulo: 'Dados', descricao: 'Envie trabalhos e avaliadores' },
  { numero: 2, titulo: 'Parâmetros', descricao: 'Configure as regras do sorteio' },
  { numero: 3, titulo: 'Resultado', descricao: 'Revise, ajuste e exporte' },
]

interface Props {
  passo: number
  irPara: (passo: number) => void
  podeIr: (passo: number) => boolean
}

export function Cabecalho({ passo, irPara, podeIr }: Props) {
  return (
    <div className="nao-imprimir">
      <header className="sticky top-0 z-40 border-b border-white/10 bg-unesp-900/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4">
          <div className="flex items-baseline gap-3">
            <span className="font-display text-3xl font-black lowercase tracking-tight text-white">
              unesp
            </span>
            <span className="hidden h-6 w-px self-center bg-white/25 sm:block" />
            <span className="hidden font-display text-sm font-semibold uppercase tracking-widest text-unesp-200 sm:block">
              Sorteio de Salas
            </span>
          </div>
          <p className="hidden text-right text-xs leading-tight text-unesp-200 md:block">
            Congresso de Iniciação Científica
            <br />e Tecnológica da Unesp
          </p>
        </div>
      </header>

      <section className="relative overflow-hidden bg-gradient-to-br from-unesp-950 via-unesp-900 to-unesp-600">
        <div className="pointer-events-none absolute -right-24 -top-32 h-96 w-96 rounded-full bg-unesp-400/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-40 -left-16 h-96 w-96 rounded-full bg-white/10 blur-3xl" />
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.07]"
          aria-hidden="true"
        >
          <defs>
            <pattern id="pontos" width="26" height="26" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1.5" fill="white" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#pontos)" />
        </svg>

        <div className="relative mx-auto max-w-6xl px-4 pb-20 pt-14">
          <span className="chip bg-white/10 text-unesp-100 ring-1 ring-white/20">
            <IconeDado width={13} height={13} /> CIC · Unesp
          </span>
          <h1 className="mt-4 max-w-3xl font-display text-4xl font-black leading-tight text-white sm:text-5xl">
            Sorteio de Salas
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-relaxed text-unesp-100 sm:text-lg">
            Distribua trabalhos e avaliadores em salas automaticamente, com regras do congresso
            aplicadas e ajuste fino manual.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            <span className="chip bg-white/10 text-unesp-100 ring-1 ring-white/15">
              <IconeEscudo width={13} height={13} /> 100% no navegador — nada é enviado a servidores
            </span>
            <span className="chip bg-white/10 text-unesp-100 ring-1 ring-white/15">
              <IconeDado width={13} height={13} /> Reprodutível por semente
            </span>
            <span className="chip bg-white/10 text-unesp-100 ring-1 ring-white/15">
              <IconePlanilha width={13} height={13} /> Exporta Excel e impressão
            </span>
          </div>
        </div>
      </section>

      <nav className="mx-auto -mt-9 max-w-5xl px-4" aria-label="Etapas">
        <ol className="card relative z-10 grid grid-cols-3 divide-x divide-slate-200 overflow-hidden">
          {PASSOS.map((p) => {
            const concluido = passo > p.numero
            const ativo = passo === p.numero
            const habilitado = podeIr(p.numero)
            return (
              <li key={p.numero}>
                <button
                  type="button"
                  onClick={() => habilitado && irPara(p.numero)}
                  disabled={!habilitado}
                  className={`flex w-full items-center gap-3 px-4 py-4 text-left transition-colors ${
                    habilitado ? 'cursor-pointer hover:bg-unesp-50/60' : 'cursor-not-allowed'
                  } ${ativo ? 'bg-unesp-50/80' : ''}`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-display text-sm font-extrabold transition-colors ${
                      concluido
                        ? 'bg-emerald-500 text-white'
                        : ativo
                          ? 'bg-unesp-800 text-white shadow-md shadow-unesp-800/30'
                          : 'border-2 border-slate-300 text-slate-400'
                    }`}
                  >
                    {concluido ? <IconeCheck width={16} height={16} /> : p.numero}
                  </span>
                  <span className="min-w-0">
                    <span
                      className={`block font-display text-sm font-bold ${
                        ativo || concluido ? 'text-unesp-900' : 'text-slate-500'
                      }`}
                    >
                      {p.titulo}
                    </span>
                    <span className="hidden truncate text-xs text-slate-500 sm:block">
                      {p.descricao}
                    </span>
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </nav>
    </div>
  )
}
