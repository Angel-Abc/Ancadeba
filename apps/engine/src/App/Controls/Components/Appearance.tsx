import { AppearanceComponent as AppearanceComponentData } from '@ancadeba/schemas'
import { useService } from '@ancadeba/ui'
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

  // Get category data
  let category
  try {
    category = categoryStorage.getAppearanceCategoryData(component.categoryId)
  } catch {
    return (
      <div className="appearance-error">
        Category not found: {component.categoryId}
      </div>
    )
  }

  if (!category || !category.gridRows || !category.gridColumns) {
    return (
      <div className="appearance-error">
        Invalid category data: {component.categoryId}
      </div>
    )
  }

  // Get all appearances for this category
  const appearances = appearanceStorage.getAppearancesByCategory(
    component.categoryId
  )

  // Get equipped appearances
  const equippedAppearances = appearanceService.getAllEquippedAppearances()
  const equippedInCategory = equippedAppearances.find(
    (eq) => eq.categoryId === component.categoryId
  )

  // Handle appearance click
  const handleAppearanceClick = (appearanceId: string) => {
    if (equippedInCategory?.appearanceId === appearanceId) {
      // Unequip if already equipped
      appearanceService.unequipAppearance(component.categoryId)
    } else {
      // Equip the appearance
      appearanceService.equipAppearance(component.categoryId, appearanceId)
    }
  }

  // Get category name and description
  const categoryName = languageProvider.getTranslation(category.name)
  const categoryDescription = category.description
    ? languageProvider.getTranslation(category.description)
    : undefined

  // Create grid style
  const gridStyle = {
    gridTemplateRows: `repeat(${category.gridRows}, 1fr)`,
    gridTemplateColumns: `repeat(${category.gridColumns}, 1fr)`,
  }

  return (
    <div className="appearance-component">
      <h3 className="appearance-header">{categoryName}</h3>
      {categoryDescription && (
        <p className="appearance-description">{categoryDescription}</p>
      )}

      <div className="appearance-grid" style={gridStyle}>
        {category.cells.map((cell, index) => {
          // Find appearances that have this slot
          const appearancesForSlot = appearances.filter((appearance) =>
            appearance.slots.some((slot) => slot.slotId === cell.slotId)
          )

          // For simplicity, show the first appearance for this slot
          const appearance = appearancesForSlot[0]
          const isEquipped =
            appearance && equippedInCategory?.appearanceId === appearance.id

          // Calculate grid position
          const gridRowStart = cell.row + 1
          const gridColumnStart = cell.column + 1
          const gridRowEnd = gridRowStart + (cell.rowSpan || 1)
          const gridColumnEnd = gridColumnStart + (cell.columnSpan || 1)

          const cellStyle = {
            gridRow: `${gridRowStart} / ${gridRowEnd}`,
            gridColumn: `${gridColumnStart} / ${gridColumnEnd}`,
          }

          const cellClassName = `appearance-cell ${
            !appearance ? 'empty' : ''
          } ${isEquipped ? 'equipped' : ''}`

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
          const firstImage = slotData?.images?.[0]

          return (
            <div
              key={`${appearance.id}-${index}`}
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
              {firstImage && (
                <img
                  src={firstImage}
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
            appearanceService.unequipAppearance(component.categoryId)
          }
        >
          Remove Equipped
        </button>
      )}
    </div>
  )
}
