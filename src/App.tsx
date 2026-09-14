import { useState } from 'react'
import type { Avaliador, ConfigSorteio, DadosAvaliadores, DadosTrabalhos, Resultado } from './types'
import { importarAvaliadores, importarTrabalhos } from './lib/planilhas'
import { novaSemente } from './lib/rng'
import { sortear, validar } from './lib/sorteio'
import { AreaImpressao } from './components/AreaImpressao'
import { Cabecalho } from './components/Cabecalho'
import { IconeFechar } from './components/Icones'
import { PassoDados } from './components/PassoDados'
import { PassoParametros } from './components/PassoParametros'
import { PassoResultado } from './components/PassoResultado'

export default function App() {
  const [passo, setPasso] = useState(1)
  const [dadosTrabalhos, setDadosTrabalhos] = useState<DadosTrabalhos | null>(null)
  const [dadosAvaliadores, setDadosAvaliadores] = useState<DadosAvaliadores | null>(null)
  const [cfg, setCfg] = useState<ConfigSorteio>({
    trabalhosPorSala: 10,
    avaliadoresPorSala: 3,
    jrJunto: false,
    salasJr: 1,
    semente: novaSemente(),
  })
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [erroArquivo, setErroArquivo] = useState<string | null>(null)

  const aoImportarTrabalhos = async (arquivo: File) => {
    try {
      setDadosTrabalhos(importarTrabalhos(await arquivo.arrayBuffer(), arquivo.name))
      setResultado(null)
      setErroArquivo(null)
    } catch {
      setErroArquivo(`Não foi possível ler "${arquivo.name}". Confirme se é uma planilha .xlsx válida.`)
    }
  }

  const aoImportarAvaliadores = async (arquivo: File) => {
    try {
      setDadosAvaliadores(importarAvaliadores(await arquivo.arrayBuffer(), arquivo.name))
      setResultado(null)
      setErroArquivo(null)
    } catch {
      setErroArquivo(`Não foi possível ler "${arquivo.name}". Confirme se é uma planilha .xlsx válida.`)
    }
  }

  const continuarParaParametros = () => {
    if (!dadosTrabalhos || !dadosAvaliadores) return
    const jr = dadosTrabalhos.trabalhos.filter((t) => t.categoria === 'jr').length
    setCfg((atual) => ({
      ...atual,
      salasJr: Math.max(1, Math.ceil(jr / Math.max(1, atual.trabalhosPorSala))),
    }))
    setPasso(2)
  }

  const executarSorteio = (config: ConfigSorteio) => {
    if (!dadosTrabalhos || !dadosAvaliadores) return
    setResultado(sortear(dadosTrabalhos.trabalhos, dadosAvaliadores.avaliadores, config))
    setPasso(3)
  }

  const resortear = () => {
    const novoCfg = { ...cfg, semente: novaSemente() }
    setCfg(novoCfg)
    executarSorteio(novoCfg)
  }

  const moverTrabalho = (trabalhoId: string, deSalaId: string, paraSalaId: string) => {
    setResultado((atual) => {
      if (!atual) return atual
      const salas = atual.salas.map((s) => ({
        ...s,
        trabalhos: [...s.trabalhos],
        avaliadores: [...s.avaliadores],
      }))
      const origem = salas.find((s) => s.id === deSalaId)
      const destino = salas.find((s) => s.id === paraSalaId)
      if (!origem || !destino) return atual
      const indice = origem.trabalhos.findIndex((t) => t.id === trabalhoId)
      if (indice < 0) return atual
      const [trabalho] = origem.trabalhos.splice(indice, 1)
      destino.trabalhos.push(trabalho)
      return { ...atual, salas, avisos: validar(salas, cfg) }
    })
  }

  const moverAvaliador = (avaliadorId: string, deSalaId: string | null, paraId: string) => {
    setResultado((atual) => {
      if (!atual) return atual
      const salas = atual.salas.map((s) => ({
        ...s,
        trabalhos: [...s.trabalhos],
        avaliadores: [...s.avaliadores],
      }))
      const reserva = [...atual.reserva]

      let avaliador: Avaliador | undefined
      if (deSalaId) {
        const origem = salas.find((s) => s.id === deSalaId)
        if (!origem) return atual
        const indice = origem.avaliadores.findIndex((a) => a.id === avaliadorId)
        if (indice < 0) return atual
        ;[avaliador] = origem.avaliadores.splice(indice, 1)
      } else {
        const indice = reserva.findIndex((a) => a.id === avaliadorId)
        if (indice < 0) return atual
        ;[avaliador] = reserva.splice(indice, 1)
      }

      if (paraId === 'reserva') {
        reserva.push(avaliador)
      } else {
        const destino = salas.find((s) => s.id === paraId)
        if (!destino) return atual
        destino.avaliadores.push(avaliador)
      }
      return { ...atual, salas, reserva, avisos: validar(salas, cfg) }
    })
  }

  const podeIr = (destino: number) =>
    destino === 1 ||
    (destino === 2 && !!dadosTrabalhos && !!dadosAvaliadores) ||
    (destino === 3 && !!resultado)

  return (
    <div className="flex min-h-screen flex-col">
      <Cabecalho passo={passo} irPara={setPasso} podeIr={podeIr} />

      <main className="nao-imprimir mx-auto w-full max-w-6xl flex-1 px-4 pb-16 pt-10">
        {erroArquivo && (
          <div className="mb-6 flex items-center justify-between gap-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 ring-1 ring-red-200">
            {erroArquivo}
            <button
              type="button"
              className="rounded-lg p-1 hover:bg-red-100"
              aria-label="Fechar aviso"
              onClick={() => setErroArquivo(null)}
            >
              <IconeFechar width={14} height={14} />
            </button>
          </div>
        )}

        {passo === 1 && (
          <PassoDados
            dadosTrabalhos={dadosTrabalhos}
            dadosAvaliadores={dadosAvaliadores}
            aoImportarTrabalhos={aoImportarTrabalhos}
            aoImportarAvaliadores={aoImportarAvaliadores}
            aoContinuar={continuarParaParametros}
          />
        )}

        {passo === 2 && dadosTrabalhos && dadosAvaliadores && (
          <PassoParametros
            trabalhos={dadosTrabalhos.trabalhos}
            avaliadores={dadosAvaliadores.avaliadores}
            cfg={cfg}
            aoAlterar={setCfg}
            aoSortear={() => executarSorteio(cfg)}
            aoVoltar={() => setPasso(1)}
          />
        )}

        {passo === 3 && resultado && (
          <PassoResultado
            resultado={resultado}
            cfg={cfg}
            aoResortear={resortear}
            aoVoltar={() => setPasso(2)}
            moverTrabalho={moverTrabalho}
            moverAvaliador={moverAvaliador}
          />
        )}
      </main>

      <footer className="nao-imprimir border-t border-slate-200 bg-white py-6 text-center text-xs leading-relaxed text-slate-500">
        Congresso de Iniciação Científica e Tecnológica da Unesp ·{' '}
        <a
          href="https://github.com/ChiaviniK/sorteio-salas-cic/blob/main/docs/TUTORIAL.md"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-unesp-700 hover:underline"
        >
          Tutorial de uso
        </a>
        <br />
        As planilhas são processadas apenas no seu navegador — nenhum dado é enviado a servidores.
      </footer>

      {resultado && <AreaImpressao resultado={resultado} />}
    </div>
  )
}
