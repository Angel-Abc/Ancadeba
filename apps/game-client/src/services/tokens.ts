import { token } from '@ancadeba/utils'
import {
  type IBootService,
  type IBootProgressTracker,
  BootServiceLogName,
  BootProgressTrackerLogName,
  type IWorldService,
  WorldServiceLogName,
  type IResourceRepository,
  ResourceRepositoryLogName,
  type ISurfaceSelector,
  SurfaceSelectorLogName,
} from './types'

export const bootProgressTrackerToken = token<IBootProgressTracker>(
  BootProgressTrackerLogName,
)
export const bootServiceToken = token<IBootService>(BootServiceLogName)
export const worldServiceToken = token<IWorldService>(WorldServiceLogName)
export const resourceRepositoryToken = token<IResourceRepository>(
  ResourceRepositoryLogName,
)
export const surfaceSelectorToken = token<ISurfaceSelector>(
  SurfaceSelectorLogName,
)
