import { loggerToken, type ILogger } from '@ancadeba/utils'
import {
  type IWidgetRegistry,
  type WidgetFactory,
  WidgetRegistryLogName,
} from './types'

/**
 * Default implementation of the widget registry.
 * Stores widget type to React component factory mappings.
 */
export class WidgetRegistry implements IWidgetRegistry {
  public static readonly logName: string = WidgetRegistryLogName

  private readonly widgets: Map<string, WidgetFactory> = new Map()

  constructor(private readonly logger: ILogger) {
    this.logger.debug(WidgetRegistry.logName, 'WidgetRegistry initialized')
  }

  register(type: string, factory: WidgetFactory): void {
    if (this.widgets.has(type)) {
      this.logger.warn(
        WidgetRegistry.logName,
        'Widget type {0} is already registered, overwriting',
        type,
      )
    }

    this.widgets.set(type, factory)
    this.logger.debug(
      WidgetRegistry.logName,
      'Registered widget type: {0}',
      type,
    )
  }

  get(type: string): WidgetFactory | undefined {
    return this.widgets.get(type)
  }

  has(type: string): boolean {
    return this.widgets.has(type)
  }

  getTypes(): string[] {
    return Array.from(this.widgets.keys())
  }
}

export const widgetRegistryDependencies = [loggerToken]
