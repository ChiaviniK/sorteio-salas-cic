export type Categoria = 'geral' | 'jr'
export type Funcao = 'docente' | 'pos' | 'externo'
export type TipoSala = 'geral' | 'jr' | 'mista'

export interface Trabalho {
  id: string
  numero: string
  titulo: string
  categoria: Categoria
  area?: string
  apresentadores: string[]
  autores: string[]
  orientador: string
  orientadorEmail?: string
}

export interface Avaliador {
  id: string
  nome: string
  email?: string
  funcao: Funcao
  tipo: Categoria
  instituicao?: string
}

export interface Sala {
  id: string
  nome: string
  tipo: TipoSala
  trabalhos: Trabalho[]
  avaliadores: Avaliador[]
}

export type NivelAviso = 'erro' | 'aviso' | 'info'

export interface Aviso {
  nivel: NivelAviso
  mensagem: string
  salaId?: string
}

export interface ConfigSorteio {
  trabalhosPorSala: number
  avaliadoresPorSala: number
  /** PIBIC Jr na mesma sala dos demais trabalhos? */
  jrJunto: boolean
  /** Quantidade de salas exclusivas PIBIC Jr (quando jrJunto = false) */
  salasJr: number
  semente: string
}

export interface Resultado {
  salas: Sala[]
  /** Avaliadores não alocados em nenhuma sala */
  reserva: Avaliador[]
  avisos: Aviso[]
  semente: string
}

export interface DadosTrabalhos {
  trabalhos: Trabalho[]
  alertas: string[]
  origem: 'template' | 'even3'
  nomeArquivo: string
}

export interface DadosAvaliadores {
  avaliadores: Avaliador[]
  alertas: string[]
  nomeArquivo: string
}

export const ROTULO_FUNCAO: Record<Funcao, string> = {
  docente: 'Docente',
  pos: 'Pós-graduando(a)',
  externo: 'Externo(a)',
}

export const ROTULO_CATEGORIA: Record<Categoria, string> = {
  geral: 'Geral',
  jr: 'PIBIC Jr',
}

export const ROTULO_TIPO_SALA: Record<TipoSala, string> = {
  geral: 'Geral',
  jr: 'PIBIC Jr',
  mista: 'Mista',
}
