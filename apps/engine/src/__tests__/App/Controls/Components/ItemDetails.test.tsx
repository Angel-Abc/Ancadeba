import { describe, it, expect, vi } from 'vitest'
import { render } from '@testing-library/react'
import { Container, loggerToken, type ILogger } from '@ancadeba/utils'
import { IocProvider } from '@ancadeba/ui'
import { ItemDetailsComponent } from '../../../../App/Controls/Components/ItemDetails'
import type { ItemDetailsComponent as ItemDetailsComponentData } from '@ancadeba/schemas'
import {
  gameStateProviderToken,
  type IGameStateProvider,
} from '../../../../gameState.ts/provider'
import {
  resourceDataProviderToken,
  type IResourceDataProvider,
} from '../../../../resourceData/provider'
import {
  languageProviderToken,
  type ILanguageProvider,
} from '../../../../language/provider'

const createLogger = (): ILogger => ({
  debug: () => '',
  info: () => '',
  warn: () => '',
  error: () => '',
  fatal: () => {
    throw new Error('fatal')
  },
})

describe('App/Controls/Components/ItemDetails', () => {
  it('renders empty state when no item is selected', () => {
    // Arrange
    const logger = createLogger()
    const container = new Container(logger)

    const gameStateProvider: IGameStateProvider = {
      getValue: vi.fn().mockReturnValue(undefined),
      getFlag: vi.fn(),
      activeSceneId: 'test-scene',
      activeMapId: null,
      mapPosition: undefined,
      gameTitle: 'Test Game',
      inputRanges: undefined,
    }

    const resourceDataProvider: IResourceDataProvider = {
      getItemData: vi.fn(),
      assetsUrl: '/assets/',
      getSceneData: vi.fn(),
      getCssFilePaths: vi.fn(() => []),
      resolveComponent: vi.fn(),
      getMapData: vi.fn(),
      getComponentDefinition: vi.fn(),
      hasComponentDefinition: vi.fn(() => false),
      getAppearanceCategoryData: vi.fn(),
      getAppearanceData: vi.fn(),
      getAllAppearanceCategories: vi.fn(() => []),
      getAppearancesByCategory: vi.fn(() => []),
      getLanguageFilePaths: vi.fn(() => []),
    }

    const languageProvider: ILanguageProvider = {
      getTranslation: vi.fn((key) => key),
    }

    container.register({ token: loggerToken, useValue: logger })
    container.register({
      token: gameStateProviderToken,
      useValue: gameStateProvider,
    })
    container.register({
      token: resourceDataProviderToken,
      useValue: resourceDataProvider,
    })
    container.register({
      token: languageProviderToken,
      useValue: languageProvider,
    })

    const component: ItemDetailsComponentData = {
      type: 'item-details',
      'itemId-field': 'selectedInventoryItemId',
      location: { x: 0, y: 0 },
      size: { width: 6, height: 6 },
      visible: true,
      border: { width: 0, padding: 0, margin: 0 },
    }

    // Act
    const { getByText } = render(
      <IocProvider container={container}>
        <ItemDetailsComponent component={component} />
      </IocProvider>
    )

    // Assert
    expect(getByText('Item Details')).toBeInTheDocument()
    expect(getByText('No item selected')).toBeInTheDocument()
  })

  it('renders item details when item is selected', () => {
    // Arrange
    const logger = createLogger()
    const container = new Container(logger)

    const gameStateProvider: IGameStateProvider = {
      getValue: vi.fn().mockReturnValue('health-potion'),
      getFlag: vi.fn(),
      activeSceneId: 'test-scene',
      activeMapId: null,
      mapPosition: undefined,
      gameTitle: 'Test Game',
      inputRanges: undefined,
    }

    const resourceDataProvider: IResourceDataProvider = {
      getItemData: vi.fn().mockReturnValue({
        id: 'health-potion',
        name: 'items.health-potion.name',
        description: 'items.health-potion.description',
        type: 'consumable',
        weight: 0.5,
        stackable: true,
        maxStack: 10,
        image: '/images/items/health-potion.png',
      }),
      assetsUrl: '/assets/',
      getSceneData: vi.fn(),
      getCssFilePaths: vi.fn(() => []),
      resolveComponent: vi.fn(),
      getMapData: vi.fn(),
      getComponentDefinition: vi.fn(),
      hasComponentDefinition: vi.fn(() => false),
      getAppearanceCategoryData: vi.fn(),
      getAppearanceData: vi.fn(),
      getAllAppearanceCategories: vi.fn(() => []),
      getAppearancesByCategory: vi.fn(() => []),
      getLanguageFilePaths: vi.fn(() => []),
    }

    const languageProvider: ILanguageProvider = {
      getTranslation: vi.fn((key) => `Translated: ${key}`),
    }

    container.register({ token: loggerToken, useValue: logger })
    container.register({
      token: gameStateProviderToken,
      useValue: gameStateProvider,
    })
    container.register({
      token: resourceDataProviderToken,
      useValue: resourceDataProvider,
    })
    container.register({
      token: languageProviderToken,
      useValue: languageProvider,
    })

    const component: ItemDetailsComponentData = {
      type: 'item-details',
      'itemId-field': 'selectedInventoryItemId',
      location: { x: 0, y: 0 },
      size: { width: 6, height: 6 },
      visible: true,
      border: { width: 0, padding: 0, margin: 0 },
    }

    // Act
    const { getByText } = render(
      <IocProvider container={container}>
        <ItemDetailsComponent component={component} />
      </IocProvider>
    )

    // Assert
    expect(getByText('Item Details')).toBeInTheDocument()
    expect(
      getByText('Translated: items.health-potion.name')
    ).toBeInTheDocument()
    expect(
      getByText('Translated: items.health-potion.description')
    ).toBeInTheDocument()
    expect(getByText(/Type:/)).toBeInTheDocument()
    expect(getByText(/consumable/)).toBeInTheDocument()
    expect(getByText(/Weight:/)).toBeInTheDocument()
    expect(getByText(/0.5/)).toBeInTheDocument()
  })

  it('renders error state when item is not found', () => {
    // Arrange
    const logger = createLogger()
    const container = new Container(logger)

    const gameStateProvider: IGameStateProvider = {
      getValue: vi.fn().mockReturnValue('non-existent-item'),
      getFlag: vi.fn(),
      activeSceneId: 'test-scene',
      activeMapId: null,
      mapPosition: undefined,
      gameTitle: 'Test Game',
      inputRanges: undefined,
    }

    const resourceDataProvider: IResourceDataProvider = {
      getItemData: vi.fn().mockReturnValue(undefined),
      assetsUrl: '/assets/',
      getSceneData: vi.fn(),
      getCssFilePaths: vi.fn(() => []),
      resolveComponent: vi.fn(),
      getMapData: vi.fn(),
      getComponentDefinition: vi.fn(),
      hasComponentDefinition: vi.fn(() => false),
      getAppearanceCategoryData: vi.fn(),
      getAppearanceData: vi.fn(),
      getAllAppearanceCategories: vi.fn(() => []),
      getAppearancesByCategory: vi.fn(() => []),
      getLanguageFilePaths: vi.fn(() => []),
    }

    const languageProvider: ILanguageProvider = {
      getTranslation: vi.fn((key) => key),
    }

    container.register({ token: loggerToken, useValue: logger })
    container.register({
      token: gameStateProviderToken,
      useValue: gameStateProvider,
    })
    container.register({
      token: resourceDataProviderToken,
      useValue: resourceDataProvider,
    })
    container.register({
      token: languageProviderToken,
      useValue: languageProvider,
    })

    const component: ItemDetailsComponentData = {
      type: 'item-details',
      'itemId-field': 'selectedInventoryItemId',
      location: { x: 0, y: 0 },
      size: { width: 6, height: 6 },
      visible: true,
      border: { width: 0, padding: 0, margin: 0 },
    }

    // Act
    const { getByText } = render(
      <IocProvider container={container}>
        <ItemDetailsComponent component={component} />
      </IocProvider>
    )

    // Assert
    expect(getByText('Item Details')).toBeInTheDocument()
    expect(getByText(/Item not found: non-existent-item/)).toBeInTheDocument()
  })
})
