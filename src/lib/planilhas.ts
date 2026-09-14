import * as XLSX from 'xlsx'
import type {
  Avaliador,
  Categoria,
  DadosAvaliadores,
  DadosTrabalhos,
  Funcao,
  Resultado,
  Trabalho,
} from '../types'
import { ROTULO_CATEGORIA, ROTULO_FUNCAO, ROTULO_TIPO_SALA } from '../types'
import { normalizar } from './nomes'

/** Normaliza cabeçalhos preservando dígitos ("Autores2" ≠ "Autores"). */
function normCab(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
}

function separarNomes(valor: unknown): string[] {
  const texto = String(valor ?? '').trim()
  if (!texto) return []
  const separador = texto.includes(';') ? ';' : ','
  return texto
    .split(separador)
    .map((s) => s.trim())
    .filter(Boolean)
}

function ehJr(valor: string): boolean {
  const v = normalizar(valor)
  return v.includes('junior') || /\bjr\b/.test(v)
}

function lerLinhas(dados: ArrayBuffer): Record<string, unknown>[] {
  const wb = XLSX.read(dados)
  const nomeAba = wb.SheetNames.find((n) => !normCab(n).startsWith('instru')) ?? wb.SheetNames[0]
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[nomeAba], { defval: '' })
}

/* ------------------------------------------------------------------ */
/* Importação                                                          */
/* ------------------------------------------------------------------ */

export function importarTrabalhos(dados: ArrayBuffer, nomeArquivo: string): DadosTrabalhos {
  const linhas = lerLinhas(dados)
  const alertas: string[] = []
  if (linhas.length === 0) {
    return { trabalhos: [], alertas: ['Nenhuma linha encontrada na planilha.'], origem: 'template', nomeArquivo }
  }

  const chaves = Object.keys(linhas[0])
  const achar = (cond: (c: string) => boolean) => chaves.find((c) => cond(normCab(c)))

  const colPrograma = achar((c) => c.startsWith('o trabalho submetido'))
  const ehEven3 = Boolean(colPrograma) && Boolean(achar((c) => c === 'modalidade'))

  const colNumero = achar((c) => c === 'numero' || c === 'n' || c === 'no')
  const colTitulo = achar((c) => c === 'titulo')
  const colCategoria = achar((c) => c.startsWith('categoria'))
  const colArea = achar((c) => c.startsWith('area'))
  const colApresentadores = achar((c) => c.startsWith('apresentador') && !c.includes('mail'))
  const colAutores = achar((c) => c === 'autores')
  const colOrientador = achar(
    (c) => c.includes('orientador') && !c.includes('mail') && !c.includes('declaracao'),
  )
  const colEmailOrientador = achar((c) => c.includes('orientador') && c.includes('mail'))

  if (!colTitulo) {
    alertas.push('Coluna "Título" não encontrada — confirme se o arquivo segue o template ou o padrão Even3.')
  }

  const trabalhos: Trabalho[] = []
  let semCategoria = 0
  let semOrientador = 0

  linhas.forEach((linha, i) => {
    const titulo = String(colTitulo ? linha[colTitulo] : '').trim()
    if (!titulo) return
    const autores = separarNomes(colAutores ? linha[colAutores] : '')

    let orientador = ''
    let categoriaBruta = ''
    if (ehEven3) {
      orientador = autores.length > 0 ? autores[autores.length - 1] : ''
      categoriaBruta = String(colPrograma ? linha[colPrograma] : '').trim()
    } else {
      orientador = String(colOrientador ? linha[colOrientador] : '').trim()
      categoriaBruta = String(colCategoria ? linha[colCategoria] : '').trim()
    }
    if (!categoriaBruta) semCategoria++
    if (!orientador) semOrientador++
    const categoria: Categoria = ehJr(categoriaBruta) ? 'jr' : 'geral'

    trabalhos.push({
      id: `t-${i}`,
      numero: String(colNumero ? linha[colNumero] : '').trim() || String(i + 1),
      titulo,
      categoria,
      area: colArea ? String(linha[colArea]).trim() || undefined : undefined,
      apresentadores: separarNomes(colApresentadores ? linha[colApresentadores] : ''),
      autores,
      orientador,
      orientadorEmail: colEmailOrientador
        ? String(linha[colEmailOrientador]).trim() || undefined
        : undefined,
    })
  })

  if (ehEven3) {
    alertas.push(
      'Formato Even3 detectado: a categoria veio da coluna "programa/agência" e o(a) orientador(a) foi considerado(a) o último nome da lista de autores. Confira a prévia antes de sortear.',
    )
  }
  if (semCategoria > 0) alertas.push(`${semCategoria} trabalho(s) sem categoria informada — considerados "Geral".`)
  if (semOrientador > 0) alertas.push(`${semOrientador} trabalho(s) sem orientador(a) identificado(a).`)

  return { trabalhos, alertas, origem: ehEven3 ? 'even3' : 'template', nomeArquivo }
}

export function importarAvaliadores(dados: ArrayBuffer, nomeArquivo: string): DadosAvaliadores {
  const linhas = lerLinhas(dados)
  const alertas: string[] = []
  if (linhas.length === 0) {
    return { avaliadores: [], alertas: ['Nenhuma linha encontrada na planilha.'], nomeArquivo }
  }

  const chaves = Object.keys(linhas[0])
  const achar = (cond: (c: string) => boolean) => chaves.find((c) => cond(normCab(c)))
  const colNome = achar((c) => c.startsWith('nome'))
  const colEmail = achar((c) => c.includes('mail'))
  const colFuncao = achar((c) => c.startsWith('funcao'))
  const colTipo = achar((c) => c.startsWith('tipo'))
  const colInstituicao = achar((c) => c.startsWith('institui') || c.includes('unidade'))

  if (!colNome) alertas.push('Coluna "Nome" não encontrada — confirme se o arquivo segue o template.')
  if (!colFuncao) alertas.push('Coluna "Função" não encontrada — todos serão considerados "Externo".')

  const avaliadores: Avaliador[] = []
  let funcaoVazia = 0

  linhas.forEach((linha, i) => {
    const nome = String(colNome ? linha[colNome] : '').trim()
    if (!nome) return
    const funcaoBruta = normalizar(String(colFuncao ? linha[colFuncao] : ''))
    let funcao: Funcao
    if (funcaoBruta.includes('docente') || funcaoBruta.includes('professor')) {
      funcao = 'docente'
    } else if (
      funcaoBruta.includes('pos') ||
      funcaoBruta.includes('aluno') ||
      funcaoBruta.includes('mestr') ||
      funcaoBruta.includes('doutor')
    ) {
      funcao = 'pos'
    } else {
      funcao = 'externo'
      if (!funcaoBruta) funcaoVazia++
    }
    const tipo: Categoria = ehJr(String(colTipo ? linha[colTipo] : '')) ? 'jr' : 'geral'

    avaliadores.push({
      id: `a-${i}`,
      nome,
      email: colEmail ? String(linha[colEmail]).trim() || undefined : undefined,
      funcao,
      tipo,
      instituicao: colInstituicao ? String(linha[colInstituicao]).trim() || undefined : undefined,
    })
  })

  if (funcaoVazia > 0) {
    alertas.push(`${funcaoVazia} avaliador(es) sem função informada — considerados "Externo".`)
  }

  return { avaliadores, alertas, nomeArquivo }
}

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

function abaInstrucoes(linhas: string[]): XLSX.WorkSheet {
  const ws = XLSX.utils.aoa_to_sheet(linhas.map((l) => [l]))
  ws['!cols'] = [{ wch: 110 }]
  return ws
}

export function baixarTemplateTrabalhos(): void {
  const cabecalho = [
    'Número',
    'Título',
    'Categoria',
    'Área temática',
    'Apresentador(es)',
    'Autores',
    'Orientador(a)',
    'E-mail do(a) orientador(a)',
  ]
  const ws = XLSX.utils.aoa_to_sheet([cabecalho])
  ws['!cols'] = [
    { wch: 10 },
    { wch: 60 },
    { wch: 12 },
    { wch: 28 },
    { wch: 32 },
    { wch: 55 },
    { wch: 32 },
    { wch: 30 },
  ]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Trabalhos')
  XLSX.utils.book_append_sheet(
    wb,
    abaInstrucoes([
      'Template de trabalhos — Sorteio de Salas · CIC Unesp',
      '',
      'Preencha a aba "Trabalhos", uma linha por trabalho:',
      '• Número: identificador do trabalho (ex.: número de submissão).',
      '• Título: título completo do trabalho.',
      '• Categoria: "Geral" ou "PIBIC Jr".',
      '• Área temática: opcional, apenas informativa.',
      '• Apresentador(es): separados por ponto e vírgula (;).',
      '• Autores: todos os autores, separados por ponto e vírgula (;).',
      '• Orientador(a): nome do(a) orientador(a) oficial — usado para impedir que avalie a própria sala.',
      '• E-mail do(a) orientador(a): opcional, melhora a detecção de conflitos com a lista de avaliadores.',
      '',
      'Exemplo de linha:',
      '1701066 | Toxicidade da mistura de microplásticos… | Geral | Ciências Agrárias | Maria Vitória R. Sebastião | Maria Vitória R. Sebastião; Davi S. Nascimento; Ana L. M. Sanches | Ana Letícia Madeira Sanches | madeira.sanches@unesp.br',
      '',
      'Dica: o arquivo exportado do Even3 (ListaResultado) também é aceito diretamente, sem alterações.',
    ]),
    'Instruções',
  )
  XLSX.writeFile(wb, 'Template_Trabalhos_CIC.xlsx')
}

export function baixarTemplateAvaliadores(): void {
  const cabecalho = ['Nome', 'E-mail', 'Função', 'Tipo', 'Instituição/Unidade']
  const ws = XLSX.utils.aoa_to_sheet([cabecalho])
  ws['!cols'] = [{ wch: 40 }, { wch: 30 }, { wch: 18 }, { wch: 12 }, { wch: 30 }]
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Avaliadores')
  XLSX.utils.book_append_sheet(
    wb,
    abaInstrucoes([
      'Template de avaliadores — Sorteio de Salas · CIC Unesp',
      '',
      'Preencha a aba "Avaliadores", uma linha por avaliador(a):',
      '• Nome: nome completo (igual ao usado nos trabalhos, para detectar conflitos de orientação).',
      '• E-mail: opcional, melhora a detecção de conflitos.',
      '• Função: "Docente", "Pós-graduando" ou "Externo". O sorteio garante ao menos 1 docente por sala.',
      '• Tipo: "Geral" ou "PIBIC Jr". Avaliadores PIBIC Jr têm prioridade nas salas PIBIC Jr,',
      '  mas também podem avaliar salas gerais quando sobrar.',
      '• Instituição/Unidade: opcional, apenas informativa.',
    ]),
    'Instruções',
  )
  XLSX.writeFile(wb, 'Template_Avaliadores_CIC.xlsx')
}

/* ------------------------------------------------------------------ */
/* Exportação do resultado                                             */
/* ------------------------------------------------------------------ */

export function exportarResultado(resultado: Resultado): void {
  const wb = XLSX.utils.book_new()

  const resumo: (string | number)[][] = [['Sala', 'Tipo', 'Qtde. trabalhos', 'Avaliadores']]
  for (const s of resultado.salas) {
    resumo.push([
      s.nome,
      ROTULO_TIPO_SALA[s.tipo],
      s.trabalhos.length,
      s.avaliadores.map((a) => a.nome).join('; '),
    ])
  }
  const wsResumo = XLSX.utils.aoa_to_sheet(resumo)
  wsResumo['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 14 }, { wch: 80 }]
  XLSX.utils.book_append_sheet(wb, wsResumo, 'Resumo')

  const trabalhos: string[][] = [
    ['Sala', 'Nº', 'Título', 'Categoria', 'Orientador(a)', 'Apresentador(es)'],
  ]
  for (const s of resultado.salas) {
    for (const t of s.trabalhos) {
      trabalhos.push([
        s.nome,
        t.numero,
        t.titulo,
        ROTULO_CATEGORIA[t.categoria],
        t.orientador,
        t.apresentadores.join('; '),
      ])
    }
  }
  const wsTrabalhos = XLSX.utils.aoa_to_sheet(trabalhos)
  wsTrabalhos['!cols'] = [{ wch: 12 }, { wch: 10 }, { wch: 70 }, { wch: 10 }, { wch: 32 }, { wch: 40 }]
  XLSX.utils.book_append_sheet(wb, wsTrabalhos, 'Trabalhos por sala')

  const avaliadores: string[][] = [['Sala', 'Nome', 'Função', 'Tipo', 'Instituição/Unidade']]
  for (const s of resultado.salas) {
    for (const a of s.avaliadores) {
      avaliadores.push([s.nome, a.nome, ROTULO_FUNCAO[a.funcao], ROTULO_CATEGORIA[a.tipo], a.instituicao ?? ''])
    }
  }
  for (const a of resultado.reserva) {
    avaliadores.push(['— Reserva', a.nome, ROTULO_FUNCAO[a.funcao], ROTULO_CATEGORIA[a.tipo], a.instituicao ?? ''])
  }
  const wsAvaliadores = XLSX.utils.aoa_to_sheet(avaliadores)
  wsAvaliadores['!cols'] = [{ wch: 12 }, { wch: 40 }, { wch: 18 }, { wch: 10 }, { wch: 30 }]
  XLSX.utils.book_append_sheet(wb, wsAvaliadores, 'Avaliadores por sala')

  XLSX.writeFile(wb, 'Resultado_Sorteio_CIC.xlsx')
}
