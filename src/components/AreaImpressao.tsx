import type { Resultado } from '../types'
import { ROTULO_CATEGORIA, ROTULO_FUNCAO, ROTULO_TIPO_SALA } from '../types'

export function AreaImpressao({ resultado }: { resultado: Resultado }) {
  const agora = new Date().toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
  return (
    <div className="area-impressao">
      <h1>Sorteio de Salas — CIC Unesp</h1>
      <p className="subtitulo">
        Congresso de Iniciação Científica e Tecnológica da Unesp · Gerado em {agora} · Semente:{' '}
        {resultado.semente}
      </p>
      {resultado.salas.map((sala, i) => (
        <section key={sala.id} className={i < resultado.salas.length - 1 ? 'quebra-pagina' : undefined}>
          <h2>
            {sala.nome}
            {sala.tipo !== 'geral' ? ` · ${ROTULO_TIPO_SALA[sala.tipo]}` : ''}
          </h2>

          <h3>Avaliadores ({sala.avaliadores.length})</h3>
          <table>
            <thead>
              <tr>
                <th style={{ width: '45%' }}>Nome</th>
                <th>Função</th>
                <th>Tipo</th>
                <th>Instituição/Unidade</th>
              </tr>
            </thead>
            <tbody>
              {sala.avaliadores.map((a) => (
                <tr key={a.id}>
                  <td>{a.nome}</td>
                  <td>{ROTULO_FUNCAO[a.funcao]}</td>
                  <td>{ROTULO_CATEGORIA[a.tipo]}</td>
                  <td>{a.instituicao ?? ''}</td>
                </tr>
              ))}
              {sala.avaliadores.length === 0 && (
                <tr>
                  <td colSpan={4}>—</td>
                </tr>
              )}
            </tbody>
          </table>

          <h3>Trabalhos ({sala.trabalhos.length})</h3>
          <table>
            <thead>
              <tr>
                <th style={{ width: '8%' }}>Nº</th>
                <th>Título</th>
                <th style={{ width: '22%' }}>Orientador(a)</th>
                <th style={{ width: '10%' }}>Categoria</th>
              </tr>
            </thead>
            <tbody>
              {sala.trabalhos.map((t) => (
                <tr key={t.id}>
                  <td>{t.numero}</td>
                  <td>{t.titulo}</td>
                  <td>{t.orientador}</td>
                  <td>{ROTULO_CATEGORIA[t.categoria]}</td>
                </tr>
              ))}
              {sala.trabalhos.length === 0 && (
                <tr>
                  <td colSpan={4}>—</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>
      ))}
    </div>
  )
}
