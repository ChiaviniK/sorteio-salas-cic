import { useRef, useState, type ReactNode } from 'react'
import type { DadosAvaliadores, DadosTrabalhos } from '../types'
import { ROTULO_CATEGORIA, ROTULO_FUNCAO } from '../types'
import { baixarTemplateAvaliadores, baixarTemplateTrabalhos } from '../lib/planilhas'
import {
  IconeAlerta,
  IconeDownload,
  IconePessoas,
  IconePlanilha,
  IconeSeta,
  IconeUpload,
} from './Icones'

/* ------------------------------------------------------------------ */

function ZonaArquivo({
  aoReceber,
  nomeArquivo,
}: {
  aoReceber: (arquivo: File) => void
  nomeArquivo?: string
}) {
  const [arrastando, setArrastando] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          inputRef.current?.click()
        }
      }}
      onDragOver={(e) => {
        e.preventDefault()
        setArrastando(true)
      }}
      onDragLeave={() => setArrastando(false)}
      onDrop={(e) => {
        e.preventDefault()
        setArrastando(false)
        const arquivo = e.dataTransfer.files?.[0]
        if (arquivo) aoReceber(arquivo)
      }}
      className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed px-6 py-8 text-center transition-colors ${
        arrastando
          ? 'border-unesp-500 bg-unesp-50'
          : nomeArquivo
            ? 'border-emerald-300 bg-emerald-50/50 hover:border-emerald-400'
            : 'border-slate-300 hover:border-unesp-400 hover:bg-slate-50'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept=".xlsx,.xls,.csv"
        className="hidden"
        onChange={(e) => {
          const arquivo = e.target.files?.[0]
          if (arquivo) aoReceber(arquivo)
          e.target.value = ''
        }}
      />
      {nomeArquivo ? (
        <>
          <IconePlanilha className="text-emerald-600" width={26} height={26} />
          <p className="max-w-full truncate text-sm font-semibold text-emerald-800">{nomeArquivo}</p>
          <p className="text-xs text-slate-500">Clique ou arraste outro arquivo para substituir</p>
        </>
      ) : (
        <>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-unesp-100 text-unesp-700">
            <IconeUpload width={20} height={20} />
          </span>
          <p className="text-sm font-semibold text-slate-700">Arraste a planilha aqui</p>
          <p className="text-xs text-slate-500">ou clique para escolher (.xlsx)</p>
        </>
      )}
    </div>
  )
}

/* ------------------------------------------------------------------ */

function CartaoImportacao({
  icone,
  titulo,
  descricao,
  aoBaixarTemplate,
  aoReceber,
  nomeArquivo,
  alertas,
  children,
}: {
  icone: ReactNode
  titulo: string
  descricao: string
  aoBaixarTemplate: () => void
  aoReceber: (arquivo: File) => void
  nomeArquivo?: string
  alertas?: string[]
  children?: ReactNode
}) {
  return (
    <article className="card flex flex-col gap-4 p-5">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-unesp-800 text-white">
            {icone}
          </span>
          <div>
            <h2 className="font-display text-lg font-bold text-unesp-950">{titulo}</h2>
            <p className="text-xs text-slate-500">{descricao}</p>
          </div>
        </div>
        <button type="button" className="btn-secundario !px-3 !py-2 text-xs" onClick={aoBaixarTemplate}>
          <IconeDownload width={14} height={14} />
          Template
        </button>
      </header>

      <ZonaArquivo aoReceber={aoReceber} nomeArquivo={nomeArquivo} />

      {alertas && alertas.length > 0 && (
        <ul className="space-y-1.5">
          {alertas.map((alerta) => (
            <li
              key={alerta}
              className="flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800 ring-1 ring-amber-200"
            >
              <IconeAlerta width={14} height={14} className="mt-0.5 shrink-0" />
              {alerta}
            </li>
          ))}
        </ul>
      )}

      {children}
    </article>
  )
}

function Estatistica({ valor, rotulo, tom = 'azul' }: { valor: number; rotulo: string; tom?: 'azul' | 'roxo' | 'neutro' }) {
  const cores =
    tom === 'roxo'
      ? 'bg-violet-50 text-violet-800 ring-violet-200'
      : tom === 'neutro'
        ? 'bg-slate-50 text-slate-700 ring-slate-200'
        : 'bg-unesp-50 text-unesp-800 ring-unesp-200'
  return (
    <span className={`chip ${cores} ring-1`}>
      <strong className="font-display">{valor}</strong> {rotulo}
    </span>
  )
}

/* ------------------------------------------------------------------ */

interface Props {
  dadosTrabalhos: DadosTrabalhos | null
  dadosAvaliadores: DadosAvaliadores | null
  aoImportarTrabalhos: (arquivo: File) => void
  aoImportarAvaliadores: (arquivo: File) => void
  aoContinuar: () => void
}

export function PassoDados({
  dadosTrabalhos,
  dadosAvaliadores,
  aoImportarTrabalhos,
  aoImportarAvaliadores,
  aoContinuar,
}: Props) {
  const trabalhos = dadosTrabalhos?.trabalhos ?? []
  const avaliadores = dadosAvaliadores?.avaliadores ?? []
  const jr = trabalhos.filter((t) => t.categoria === 'jr').length
  const orientadores = new Set(trabalhos.map((t) => t.orientador).filter(Boolean)).size
  const docentes = avaliadores.filter((a) => a.funcao === 'docente').length
  const avaliadoresJr = avaliadores.filter((a) => a.tipo === 'jr').length
  const pronto = trabalhos.length > 0 && avaliadores.length > 0

  return (
    <div className="surgir space-y-6">
      <div className="grid gap-6 lg:grid-cols-2">
        <CartaoImportacao
          icone={<IconePlanilha width={20} height={20} />}
          titulo="Trabalhos"
          descricao="Template próprio ou exportação do Even3"
          aoBaixarTemplate={baixarTemplateTrabalhos}
          aoReceber={aoImportarTrabalhos}
          nomeArquivo={dadosTrabalhos?.nomeArquivo}
          alertas={dadosTrabalhos?.alertas}
        >
          {dadosTrabalhos && trabalhos.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <Estatistica valor={trabalhos.length} rotulo="trabalhos" />
                <Estatistica valor={trabalhos.length - jr} rotulo="gerais" tom="neutro" />
                <Estatistica valor={jr} rotulo="PIBIC Jr" tom="roxo" />
                <Estatistica valor={orientadores} rotulo="orientadores" tom="neutro" />
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Nº</th>
                      <th className="px-3 py-2 font-semibold">Título</th>
                      <th className="px-3 py-2 font-semibold">Orientador(a)</th>
                      <th className="px-3 py-2 font-semibold">Cat.</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {trabalhos.slice(0, 5).map((t) => (
                      <tr key={t.id}>
                        <td className="px-3 py-2 font-mono text-slate-500">{t.numero}</td>
                        <td className="max-w-0 truncate px-3 py-2" title={t.titulo}>
                          {t.titulo}
                        </td>
                        <td className="max-w-36 truncate px-3 py-2 text-slate-600" title={t.orientador}>
                          {t.orientador || '—'}
                        </td>
                        <td className="px-3 py-2">
                          <span
                            className={`chip !px-2 ${
                              t.categoria === 'jr'
                                ? 'bg-violet-100 text-violet-700'
                                : 'bg-unesp-100 text-unesp-700'
                            }`}
                          >
                            {ROTULO_CATEGORIA[t.categoria]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {trabalhos.length > 5 && (
                  <p className="border-t border-slate-100 bg-slate-50 px-3 py-1.5 text-center text-[11px] text-slate-400">
                    + {trabalhos.length - 5} trabalhos
                  </p>
                )}
              </div>
            </div>
          )}
        </CartaoImportacao>

        <CartaoImportacao
          icone={<IconePessoas width={20} height={20} />}
          titulo="Avaliadores"
          descricao="Preencha o template com função e tipo"
          aoBaixarTemplate={baixarTemplateAvaliadores}
          aoReceber={aoImportarAvaliadores}
          nomeArquivo={dadosAvaliadores?.nomeArquivo}
          alertas={dadosAvaliadores?.alertas}
        >
          {dadosAvaliadores && avaliadores.length > 0 && (
            <div className="space-y-3">
              <div className="flex flex-wrap gap-1.5">
                <Estatistica valor={avaliadores.length} rotulo="avaliadores" />
                <Estatistica valor={docentes} rotulo="docentes" tom="neutro" />
                <Estatistica valor={avaliadores.length - docentes} rotulo="demais" tom="neutro" />
                <Estatistica valor={avaliadoresJr} rotulo="PIBIC Jr" tom="roxo" />
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-xs">
                  <thead className="bg-slate-50 text-left text-slate-500">
                    <tr>
                      <th className="px-3 py-2 font-semibold">Nome</th>
                      <th className="px-3 py-2 font-semibold">Função</th>
                      <th className="px-3 py-2 font-semibold">Tipo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {avaliadores.slice(0, 5).map((a) => (
                      <tr key={a.id}>
                        <td className="max-w-0 truncate px-3 py-2" title={a.nome}>
                          {a.nome}
                        </td>
                        <td className="px-3 py-2 text-slate-600">{ROTULO_FUNCAO[a.funcao]}</td>
                        <td className="px-3 py-2">
                          <span
                            className={`chip !px-2 ${
                              a.tipo === 'jr'
                                ? 'bg-violet-100 text-violet-700'
                                : 'bg-unesp-100 text-unesp-700'
                            }`}
                          >
                            {ROTULO_CATEGORIA[a.tipo]}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {avaliadores.length > 5 && (
                  <p className="border-t border-slate-100 bg-slate-50 px-3 py-1.5 text-center text-[11px] text-slate-400">
                    + {avaliadores.length - 5} avaliadores
                  </p>
                )}
              </div>
            </div>
          )}
        </CartaoImportacao>
      </div>

      <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
        <p className="text-sm text-slate-500">
          {pronto
            ? 'Tudo pronto! Avance para configurar o sorteio.'
            : 'Envie as duas planilhas para continuar.'}
        </p>
        <button type="button" className="btn-primario" disabled={!pronto} onClick={aoContinuar}>
          Configurar sorteio
          <IconeSeta width={16} height={16} />
        </button>
      </div>
    </div>
  )
}
