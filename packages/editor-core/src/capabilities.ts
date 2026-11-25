import { z } from 'zod'

/** Repository operations are explicit; having a method does not imply backend support. */
export const repositoryCapabilitiesSchema = z.object({
  history: z.boolean(),
  assetImport: z.boolean(),
  projectCreation: z.boolean(),
  projectDuplication: z.boolean(),
  projectImport: z.boolean(),
  projectExport: z.boolean(),
  projectRenaming: z.boolean(),
  projectFolderRenaming: z.boolean(),
  projectDeletion: z.boolean(),
  projectRestoration: z.boolean(),
  projectRepair: z.boolean(),
})

export type RepositoryCapabilities = Readonly<z.infer<typeof repositoryCapabilitiesSchema>>

export const editorFeaturesSchema = repositoryCapabilitiesSchema.extend({
  projectDiscovery: z.boolean(),
  gameExport: z.boolean(),
})

export type EditorFeatures = z.infer<typeof editorFeaturesSchema>

export const unavailableEditorFeatures: EditorFeatures = {
  history: false,
  assetImport: false,
  projectCreation: false,
  projectDuplication: false,
  projectImport: false,
  projectExport: false,
  projectRenaming: false,
  projectFolderRenaming: false,
  projectDeletion: false,
  projectRestoration: false,
  projectRepair: false,
  projectDiscovery: false,
  gameExport: false,
}
