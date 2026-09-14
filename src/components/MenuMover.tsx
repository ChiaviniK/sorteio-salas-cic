import { useState } from 'react'
import { IconeMover } from './Icones'

export interface OpcaoMover {
  id: string
  rotulo: string
  detalhe?: string
  tom?: 'normal' | 'alerta' | 'erro'
}

export function MenuMover({
  titulo,
  opcoes,
  aoEscolher,
}: {
  titulo: string
  opcoes: OpcaoMover[]
  aoEscolher: (id: string) => void
}) {
  const [aberto, setAberto] = useState(false)

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        title={titulo}
        aria-label={titulo}
        onClick={() => setAberto((v) => !v)}
        className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-unesp-50 hover:text-unesp-700"
      >
        <IconeMover width={15} height={15} />
      </button>
      {aberto && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setAberto(false)} />
          <div className="rolagem-fina absolute right-0 z-50 mt-1 max-h-72 w-64 overflow-auto rounded-xl border border-slate-200 bg-white p-1.5 shadow-xl">
            <p className="px-2.5 py-1.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              {titulo}
            </p>
            {opcoes.length === 0 && (
              <p className="px-2.5 pb-2 text-xs text-slate-400">Nenhum destino disponível.</p>
            )}
            {opcoes.map((opcao) => (
              <button
                key={opcao.id}
                type="button"
                onClick={() => {
                  setAberto(false)
                  aoEscolher(opcao.id)
                }}
                className="flex w-full items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-left text-sm transition-colors hover:bg-unesp-50"
              >
                <span
                  className={
                    opcao.tom === 'erro'
                      ? 'font-semibold text-red-600'
                      : opcao.tom === 'alerta'
                        ? 'font-semibold text-amber-600'
                        : 'text-slate-700'
                  }
                >
                  {opcao.rotulo}
                </span>
                {opcao.detalhe && <span className="shrink-0 text-[11px] text-slate-400">{opcao.detalhe}</span>}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
