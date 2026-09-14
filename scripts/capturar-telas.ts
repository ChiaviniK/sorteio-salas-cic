/**
 * Captura as telas da aplicação para o tutorial (docs/imagens/).
 * Pré-requisito: servidor dev ativo em http://localhost:5173/
 * Uso: npx tsx scripts/capturar-telas.ts
 */
import { mkdirSync } from 'node:fs'
import { join } from 'node:path'
import { chromium } from 'playwright'

const URL = 'http://localhost:5173/'
const PASTA = join(import.meta.dirname, '..', 'docs', 'imagens')
const DADOS = join(import.meta.dirname, '..', 'dados-exemplo')

mkdirSync(PASTA, { recursive: true })

const navegador = await chromium.launch()
const pagina = await navegador.newPage({
  viewport: { width: 1440, height: 900 },
  deviceScaleFactor: 2,
})

await pagina.goto(URL, { waitUntil: 'networkidle' })
await pagina.waitForTimeout(1200) // fontes web

// 01 — tela inicial (etapa Dados)
await pagina.screenshot({ path: join(PASTA, '01-inicio.png'), fullPage: true })
console.log('01-inicio.png')

// 02 — dados importados
const inputs = pagina.locator('input[type=file]')
await inputs.nth(0).setInputFiles(join(DADOS, 'ListaResultado_Even3_Sorteio.xlsx'))
await inputs.nth(1).setInputFiles(join(DADOS, 'Avaliadores_CIC.xlsx'))
await pagina.getByText('Tudo pronto! Avance para configurar o sorteio.').waitFor()
await pagina.waitForTimeout(300)
await pagina.screenshot({ path: join(PASTA, '02-dados-importados.png'), fullPage: true })
console.log('02-dados-importados.png')

// 03 — parâmetros
await pagina.getByRole('button', { name: 'Configurar sorteio' }).click()
await pagina.getByText('Parâmetros do sorteio').waitFor()
await pagina.waitForTimeout(300)
await pagina.screenshot({ path: join(PASTA, '03-parametros.png'), fullPage: true })
console.log('03-parametros.png')

// 04 — resultado do sorteio
await pagina.getByRole('button', { name: 'Sortear salas' }).click()
await pagina.getByText('Resultado do sorteio').waitFor()
await pagina.waitForTimeout(400)
await pagina.screenshot({ path: join(PASTA, '04-resultado.png'), fullPage: true })
console.log('04-resultado.png')

// 05 — menu de movimentação (ajuste manual)
const botaoMover = pagina.locator('[title="Mover avaliador para…"]').first()
await botaoMover.scrollIntoViewIfNeeded()
await botaoMover.click()
await pagina.waitForTimeout(300)
await pagina.screenshot({ path: join(PASTA, '05-ajuste-manual.png') })
console.log('05-ajuste-manual.png')
await pagina.mouse.click(10, 10) // fecha o menu

// 06 — visão de impressão (uma sala por página)
await pagina.emulateMedia({ media: 'print' })
await pagina.waitForTimeout(300)
await pagina.screenshot({
  path: join(PASTA, '06-impressao.png'),
  clip: { x: 0, y: 0, width: 1440, height: 950 },
})
console.log('06-impressao.png')

await navegador.close()
console.log('Capturas concluídas em docs/imagens/')
