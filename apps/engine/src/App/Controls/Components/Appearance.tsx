import { AppearanceComponent as AppearanceComponentData } from '@ancadeba/schemas'
import { useService } from '@ancadeba/ui'
import { useEffect, useState } from 'react'
import {
  IAppearanceService,
  appearanceServiceToken,
} from '../../../appearance/appearanceService'
import {
  IAppearanceCategoryStorage,
  appearanceCategoryStorageToken,
  IAppearanceDataStorage,
  appearanceDataStorageToken,
} from '../../../resourceData/storage'
import {
  ILanguageProvider,
  languageProviderToken,
} from '../../../language/provider'
import {
  IResourceDataProvider,
  resourceDataProviderToken,
} from '../../../resourceData/provider'
import { COMPONENT_KEYS } from '../../../ecs/components'
import { IWorld, WORLD_EVENTS } from '../../../ecs/types'
import { worldToken } from '../../../ecs/world'

interface AppearanceComponentProps {
  component: AppearanceComponentData
}

export function AppearanceComponent({ component }: AppearanceComponentProps) {
  const appearanceService = useService<IAppearanceService>(
    appearanceServiceToken
  )
  const categoryStorage = useService<IAppearanceCategoryStorage>(
    appearanceCategoryStorageToken
  )
  const appearanceStorage = useService<IAppearanceDataStorage>(
    appearanceDataStorageToken
  )
  const languageProvider = useService<ILanguageProvider>(languageProviderToken)
  const resourceDataProvider = useService<IResourceDataProvider>(
    resourceDataProviderToken
  )
  const world = useService<IWorld>(worldToken)

  const categories = categoryStorage.getAllAppearanceCategories()
  const defaultCategoryId =
    categories.find((category) => category.id === component.categoryId)?.id ??
    categories[0]?.id
  const [activeCategoryId, setActiveCategoryId] = useState(defaultCategoryId)
  const [equippedAppearances, setEquippedAppearances] = useState(() =>
    appearanceService.getAllEquippedAppearances()
  )

  useEffect(() => {
    const updateEquippedAppearances = () => {
      setEquippedAppearances(appearanceService.getAllEquippedAppearances())
    }
    const handleAppearanceChange = (payload: { componentKey: string }) => {
      if (payload.componentKey !== COMPONENT_KEYS.appearance) {
        return
      }
      updateEquippedAppearances()
    }
    updateEquippedAppearances()
    const unsubscribeAdded = world.subscribe(
      WORLD_EVENTS.COMPONENT_ADDED,
      handleAppearanceChange
    )
    const unsubscribeUpdated = world.subscribe(
      WORLD_EVENTS.COMPONENT_UPDATED,
      handleAppearanceChange
    )
    const unsubscribeRemoved = world.subscribe(
      WORLD_EVENTS.COMPONENT_REMOVED,
      handleAppearanceChange
    )
    return () => {
      unsubscribeAdded()
      unsubscribeUpdated()
      unsubscribeRemoved()
    }
  }, [appearanceService, world])

  const activeCategory =
    categories.find((category) => category.id === activeCategoryId) ??
    categories[0]

  if (!activeCategory) {
    return (
      <div className="appearance-error">
        No appearance categories available
      </div>
    )
  }

  if (!activeCategory.gridRows || !activeCategory.gridColumns) {
    return (
      <div className="appearance-error">
        Invalid category data: {activeCategory.id}
      </div>
    )
  }

  const appearances = appearanceStorage.getAppearancesByCategory(
    activeCategory.id
  )

  const equippedInCategory = equippedAppearances.find(
    (eq) => eq.categoryId === activeCategory.id
  )

  const equippedAppearance = (() => {
    if (!equippedInCategory) {
      return undefined
    }
    try {
      return appearanceStorage.getAppearanceData(
        equippedInCategory.appearanceId
      )
    } catch {
      return undefined
    }
  })()

  // Handle appearance click
  const handleAppearanceClick = (appearanceId: string) => {
    if (equippedInCategory?.appearanceId === appearanceId) {
      // Unequip if already equipped
      appearanceService.unequipAppearance(activeCategory.id)
    } else {
      // Equip the appearance
      appearanceService.equipAppearance(activeCategory.id, appearanceId)
    }
  }

  // Get category name and description
  const categoryName = languageProvider.getTranslation(activeCategory.name)
  const categoryDescription = activeCategory.description
    ? languageProvider.getTranslation(activeCategory.description)
    : undefined

  // Create grid style
  const gridStyle = {
    gridTemplateRows: `repeat(${activeCategory.gridRows}, 1fr)`,
    gridTemplateColumns: `repeat(${activeCategory.gridColumns}, 1fr)`,
  }
  const assetsUrl = resourceDataProvider.assetsUrl

  return (
    <div className="appearance-component">
      <div className="appearance-tabs" role="tablist">
        {categories.map((category) => {
          const isActive = category.id === activeCategory.id
          const tabClassName = [
            'appearance-tab',
            isActive ? 'is-active' : '',
          ]
            .filter(Boolean)
            .join(' ')
          const categoryLabel = languageProvider.getTranslation(category.name)
          return (
            <button
              key={category.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={tabClassName}
              onClick={() => setActiveCategoryId(category.id)}
            >
              {categoryLabel}
            </button>
          )
        })}
      </div>
      <h3 className="appearance-header">{categoryName}</h3>
      {categoryDescription && (
        <p className="appearance-description">{categoryDescription}</p>
      )}

      <div className="appearance-grid" style={gridStyle}>
        {activeCategory.cells.map((cell, index) => {
          // Find appearances that have this slot
          const appearancesForSlot = appearances.filter((appearance) =>
            appearance.slots.some((slot) => slot.slotId === cell.slotId)
          )

          const equippedSlot = equippedAppearance?.slots.find(
            (slot) => slot.slotId === cell.slotId
          )
          const appearance = equippedSlot
            ? equippedAppearance
            : appearancesForSlot[0]
          const isEquipped =
            appearance && equippedAppearance?.id === appearance.id

          // Calculate grid position
          const gridRowStart = cell.row + 1
          const gridColumnStart = cell.column + 1
          const gridRowEnd = gridRowStart + (cell.rowSpan || 1)
          const gridColumnEnd = gridColumnStart + (cell.columnSpan || 1)

          const cellStyle = {
            gridRow: `${gridRowStart} / ${gridRowEnd}`,
            gridColumn: `${gridColumnStart} / ${gridColumnEnd}`,
          }

          const cellClassName = [
            'appearance-cell',
            !appearance ? 'empty' : '',
            isEquipped ? 'equipped' : '',
          ]
            .filter(Boolean)
            .join(' ')

          if (!appearance) {
            return (
              <div
                key={`${cell.slotId}-${index}`}
                className={cellClassName}
                style={cellStyle}
              >
                <span className="appearance-slot-label">{cell.slotId}</span>
              </div>
            )
          }

          // Get appearance data
          const appearanceName = languageProvider.getTranslation(
            appearance.name
          )
          const slotData = appearance.slots.find(
            (slot) => slot.slotId === cell.slotId
          )
          const imagePath = slotData?.image
          const imageUrl = imagePath ? assetsUrl + '/' + imagePath : undefined

          return (
            <div
              key={`${cell.slotId}-${index}`}
              className={cellClassName}
              style={cellStyle}
              onClick={() => handleAppearanceClick(appearance.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleAppearanceClick(appearance.id)
                }
              }}
            >
              {isEquipped && <span className="equipped-badge">Equipped</span>}
              {imageUrl && (
                <img
                  src={imageUrl}
                  alt={appearanceName}
                  className="appearance-image"
                />
              )}
              <p className="appearance-name">{appearanceName}</p>
            </div>
          )
        })}
      </div>

      {equippedInCategory && (
        <button
          className="appearance-remove-button"
          onClick={() =>
            appearanceService.unequipAppearance(activeCategory.id)
          }
        >
          Remove Equipped
        </button>
      )}
    </div>
  )
}
