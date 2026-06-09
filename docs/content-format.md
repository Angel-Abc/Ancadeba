# Content Format

Ancadeba games are described by JSON resources. The browser runtime serves these resources from `/resources`, and `packages/content` validates them with Zod schemas before the engine uses them.

The current sample game lives in `sample-games/market-value`.

## Resource Root

A resource root should contain:

```text
game.json
languages/
maps/
surfaces/
styles/
tileSets/
widgets/
```

The game client expects the resource root to be available at `/resources` in the browser. In development and build output this is wired by `apps/game-client/vite.config.ts`.

## `game.json`

`game.json` is the entry point for a game.

Required fields:

- `title`: Translation key for the game title.
- `version`: Game content version.
- `bootSurfaceId`: Surface shown during boot.
- `language`: Initial language ID.
- `languages`: Map of language IDs to language resource paths.
- `surfaces`: Map of surface IDs to surface definition paths.
- `widgets`: Map of widget IDs to widget definition paths.

Optional fields:

- `description`: Translation key for the game description.
- `startSurfaceId`: Surface shown after boot finishes.
- `styles`: CSS files loaded before the game starts.
- `newGames`: Map of new-game IDs to new-game definition paths.
- `maps`: Map of map IDs to map definition paths.
- `tileSets`: Map of tile-set IDs to tile-set definition paths.

Example:

```json
{
  "title": "GAME.TITLE",
  "description": "GAME.DESCRIPTION",
  "version": "1.0.0",
  "bootSurfaceId": "boot-loader",
  "startSurfaceId": "main-menu",
  "language": "en",
  "styles": ["styles/theme.css"],
  "surfaces": {
    "boot-loader": "surfaces/boot-loader.json",
    "main-menu": "surfaces/main-menu.json"
  },
  "widgets": {
    "boot-progress": "widgets/boot-progress.json",
    "main-title": "widgets/main-title.json"
  },
  "newGames": {
    "default": "newGames/default.json"
  },
  "maps": {
    "start-beach": "maps/start-beach.json"
  },
  "tileSets": {
    "outdoor": "tileSets/outdoor.json"
  },
  "languages": {
    "en": ["languages/en/engine.json"]
  }
}
```

Keep all paths relative to the resource root.

## New Games

A new-game definition declares the initial runtime session state for starting a fresh playthrough.

```json
{
  "id": "default",
  "startSurfaceId": "game",
  "mapId": "start-beach",
  "player": {
    "position": {
      "row": 19,
      "column": 2
    }
  }
}
```

`row` and `column` are zero-based map coordinates. Runtime session data stores IDs and player position separately from immutable map and tile-set definitions.

## Languages

Language files contain a `translations` object.

```json
{
  "translations": {
    "GAME.TITLE": "Market Value",
    "GAME.PROGRESS.LOADING": "Loading..."
  }
}
```

UI content should use translation keys rather than hard-coded display text in game resources.

## Surfaces

A surface defines a screen or state of the game UI. It has a `surfaceId` and a `layout`.

Example:

```json
{
  "surfaceId": "main-menu",
  "layout": {
    "type": "grid",
    "rows": 16,
    "columns": 16,
    "widgets": [
      {
        "widgetId": "main-title",
        "position": {
          "column": 0,
          "row": 1
        },
        "size": {
          "width": 16,
          "height": 2
        },
        "border": false
      }
    ]
  }
}
```

The only supported layout type today is `grid`.

## Grid Layout

A grid layout defines:

- `rows`: Number of grid rows. Minimum `1`.
- `columns`: Number of grid columns. Minimum `1`.
- `widgets`: Widget slots placed on the grid.

Each widget slot defines:

- `widgetId`: ID of a widget declared in `game.json`.
- `position.row`: Zero-based row.
- `position.column`: Zero-based column.
- `size.width`: Width in grid columns.
- `size.height`: Height in grid rows.
- `border`: Optional, defaults to `true`.

The schema currently validates basic numeric bounds. It does not yet validate that a widget fits inside the grid.

## Widgets

Widget files share a base `widgetId` field and use `type` as a discriminator.

### Progress

```json
{
  "widgetId": "boot-progress",
  "type": "progress",
  "showPercentage": true
}
```

`showPercentage` is optional and defaults to `false`.

### Title

```json
{
  "widgetId": "main-title",
  "type": "title",
  "font-size": 64,
  "title": "GAME.TITLE"
}
```

`font-size` is optional and defaults to `16`.

### Button Bar

```json
{
  "widgetId": "main-button-bar",
  "type": "button-bar",
  "buttons": [
    {
      "label": "GAME.START-BUTTON",
      "action": {
        "type": "navigate",
        "targetSurfaceId": "game-surface"
      }
    }
  ]
}
```

Supported button actions:

- `navigate`: Switches the active surface to `targetSurfaceId`.
- `new-game`: Initializes a new in-memory session from `newGameId`, then switches to that new-game definition's `startSurfaceId`.
- `exit`: Calls `window.close()`.

Navigation targets should point to surfaces declared in `game.json`. That relationship should be covered by cross-resource validation before content is considered complete.

## Tile Sets

A tile set defines reusable tile definitions for maps.

```json
{
  "id": "outdoor",
  "tiles": [
    {
      "id": "grass",
      "description": "tile.outdoor.grass",
      "color": "lightgreen",
      "walkable": true
    },
    {
      "id": "ocean",
      "description": "tile.outdoor.ocean",
      "image": "images/outdoor/waves.svg",
      "color": "aqua",
      "walkable": false
    }
  ]
}
```

Tile IDs must be unique within a tile set. `description` should be a translation key. `image` is optional and no renderer consumes it yet.

## Maps

A map defines a rectangular tile grid. The `tiles` array maps short row keys to tile references in `tileSetId.tileId` format. The `map` array contains comma-separated row keys.

```json
{
  "id": "start-beach",
  "width": 2,
  "height": 2,
  "tiles": [
    {
      "key": "o1",
      "tile": "outdoor.ocean"
    },
    {
      "key": "g1",
      "tile": "outdoor.grass"
    }
  ],
  "map": ["o1,o1", "g1,g1"]
}
```

Map validation requires:

- `map.length` matches `height`.
- Each row contains exactly `width` comma-separated tile keys.
- Every row tile key is declared in `tiles`.
- Tile keys are unique within the map.
- Tile references use `tileSetId.tileId` format.

## Styles

Styles listed in `game.json` are loaded by the engine before the game starts.

```json
{
  "styles": ["styles/theme.css"]
}
```

Each style path should exist under the resource root. Missing styles fail at runtime when the browser cannot load the generated stylesheet link.

## Adding Content Safely

When adding or changing content:

1. Add or update the JSON resource file.
2. Register the resource path in `game.json` when it is a surface, widget, language, style, map, or tile set.
3. Use translation keys for user-facing strings.
4. Keep IDs stable and unique within their resource map.
5. Run the required checks from `docs/development.md`.

Future validation should verify cross-file references, including:

- `bootSurfaceId`
- `startSurfaceId`
- layout widget IDs
- button navigation targets
- new-game IDs and start/map references
- style paths
- language resource paths
