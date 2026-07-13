export interface GameManifest {
    formatVersion: 1
    id: string
    title: string
    description: string
    content: {
        locations: string
    }
    start: {
        locationId: string
    }
} 

