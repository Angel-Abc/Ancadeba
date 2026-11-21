import { readFile, readdir } from 'node:fs/promises'
import { describe, expect, it } from 'vite-plus/test'
import { GameLoader, resolveCharacterAppearance } from '@ancadeba/game-runtime'
import { JsonResourceLoader } from '@ancadeba/utilities'
import {
  appearanceLibrarySchema,
  appearanceIssues,
  assetCatalogSchema,
  characterProfileSchema,
  inventoryComponentSchema,
  statusPanelComponentSchema,
  combatSourceSchema,
  characterAppearance,
  graphicAppearanceSchema,
} from '@ancadeba/schemas'

const root = new URL('../sample-games/', import.meta.url)
const bounds = { x: 0, y: 0, width: 100, height: 150 }

describe('shared character artwork', () => {
  it('loads every bundled game through the runtime loader', async () => {
    for (const entry of await readdir(root, { withFileTypes: true })) {
      if (!entry.isDirectory() || entry.name.startsWith('.')) continue
      const directory = new URL(entry.name + '/', root)

      const game = await new GameLoader(
        new JsonResourceLoader(
          {
            readText: (path) => readFile(new URL(path, directory), 'utf8'),
            readBytes: (path) => readFile(new URL(path, directory)),
          },
          { debug: () => '', info: () => '', warn: () => '', error: () => '' },
        ),
      ).load()

      expect(game.scenes.size, entry.name).toBeGreaterThan(0)
    }
  })

  it('inherits individual choices while personal values can replace a preset binding', () => {
    const dynamic = { source: 'game.state', path: ['outfit'] }

    const base = graphicAppearanceSchema.parse({
      slots: {
        shirt: {
          palette: 'forest',
          partBinding: dynamic,
          visible: false,
          colors: { trim: '#556677' },
          bindings: { colors: { trim: dynamic, fabric: dynamic } },
        },
      },
    })

    const merged = characterAppearance(base, {
      slots: { shirt: { part: 'cotton', colors: { trim: '#112233' } } },
    })

    expect(merged.slots.shirt).toMatchObject({
      part: 'cotton',
      visible: false,
      palette: 'forest',
      colors: { trim: '#112233' },
      bindings: { colors: { fabric: dynamic } },
    })
    expect(merged.slots.shirt!.partBinding).toBeUndefined()
    expect(merged.slots.shirt!.bindings!.colors.trim).toBeUndefined()
    expect(base.slots.shirt!.partBinding).toEqual(dynamic)
  })

  it('frames a painted NPC without an inventory and reports broken character references', () => {
    const assets = assetCatalogSchema.parse({
      'schema-version': '1.0.0',
      images: { painting: { format: 'png', source: 'painting.png', bounds } },
    })

    const portraitCrop = { x: 20, y: 10, width: 60, height: 60 }

    const library = appearanceLibrarySchema.parse({
      presets: { civilian: { visual: 'painting', portraitCrop } },
      characters: { merchant: { preset: 'civilian' } },
    })

    expect(appearanceIssues(library, assets)).toEqual([])
    expect(resolveCharacterAppearance(library, 'merchant', 'portrait', assets).crop).toEqual(
      portraitCrop,
    )
    expect(resolveCharacterAppearance(library, 'merchant', 'full-body', assets).crop).toEqual(
      bounds,
    )
    library.characters.merchant!.preset = 'missing'
    expect(appearanceIssues(library, assets)[0]?.path).toEqual([
      'appearances',
      'characters',
      'merchant',
      'preset',
    ])
  })

  it('rejects each retired reference format', async () => {
    const panel = { id: 'example', placement: { row: 1, column: 1 } }
    expect(
      characterProfileSchema.safeParse({ fields: ['hair'], portrait: { visual: 'head' } }).success,
    ).toBe(false)

    for (const previews of [{}, { hero: { composition: 'doll', slots: {} } }])
      expect(
        inventoryComponentSchema.safeParse({
          ...panel,
          type: 'inventory',
          owners: ['hero'],
          previews,
        }).success,
      ).toBe(false)
    expect(
      statusPanelComponentSchema.safeParse({ ...panel, type: 'status-panel', portrait: 'head' })
        .success,
    ).toBe(false)

    const training = JSON.parse(
      await readFile(new URL('graphics/combat/training.json', root), 'utf8'),
    )

    expect(combatSourceSchema.safeParse(training).success).toBe(true)
    training.player.portrait = 'paper-doll'
    expect(combatSourceSchema.safeParse(training).success).toBe(false)
  })
})
