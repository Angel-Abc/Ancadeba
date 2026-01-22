# UI Architecture and Effects Design Document

## Purpose
This document consolidates the outcomes of the **"What is an Effect"** and **"ECS vs UI Components"** discussions into a concise architectural reference. It defines terminology, responsibilities, and data-flow rules for the UI layer of a turn-based browser game built on an ECS-driven game engine with a React 19 DOM-based interface.

The goal is to:
- Avoid terminology collisions between ECS and UI concepts
- Establish clear separation of concerns
- Ensure efficient rendering (e.g., avoiding unnecessary minimap redraws)
- Provide a scalable mental model for future features

---

## Terminology

### Entity (ECS)
A unique identifier representing a game object (player, NPC, item, tile, etc.). Entities are data-less and only gain meaning through attached components.

### Component (ECS Component)
A pure data structure associated with an entity (e.g., Position, Inventory, Health). Components must contain no logic.

### System
A unit of game logic that operates on entities matching a component query. Systems mutate game state and may emit **effects**.

### Effect
A discrete, declarative description of something that *should happen* as a consequence of game logic but is *not* game state itself.

Examples:
- "Open trade UI with NPC #42"
- "Append log message"
- "Play sound"

Effects are:
- Produced by systems
- Consumed by non-ECS layers (UI, audio, persistence)
- Ephemeral and not stored as components

### UI Surface
A high-level, mutually exclusive mode of presentation representing *what the player is currently doing*.

Examples:
- World Exploration
- Dialogue
- Combat
- Trading

Only one UI Surface is active at a time.

### UI View
A logical subdivision within a surface that presents a specific concern or dataset.

Examples:
- Minimap View
- Inventory View
- Combat Log View

Views may persist across surfaces or be surface-specific.

### UI Widget
A concrete React construct (component, hook, or composite) responsible for rendering and interaction.

Widgets are implementation details and should not appear in engine-level discussions.

---

## ECS vs UI Concepts

| ECS Concept | UI Analogue | Notes |
|------------|------------|------|
| Entity | Domain Object | UI never owns entities |
| Component | Projection Data | UI uses derived state |
| System | Controller / Reducer | Systems produce effects |
| Effect | UI Intent | Boundary crossing mechanism |
| World State | UI State | UI state is partial and contextual |

**Rule:** The UI never queries ECS internals directly. All UI-relevant data is projected or derived.

---

## Effect Model

### Effect Flow Diagram

```
[ECS System]
     |
     | emits
     v
+-------------+
|   Effect    |
+-------------+
     |
     | dispatched to
     v
+-------------------+
| Effect Dispatcher |
+-------------------+
     |
     +--------------------+-------------------+
     |                    |                   |
     v                    v                   v
[UI Surface]        [Audio System]     [Persistence]
```

This diagram illustrates the one-way flow from ECS systems to non-ECS consumers. Effects never flow back into ECS directly.



### Effect Lifecycle
1. A system executes during a turn
2. The system mutates ECS state
3. The system emits one or more effects
4. Effects are collected in an effect queue
5. Effect handlers dispatch side effects (UI updates, sounds, etc.)

### Effect Categories
- UI Effects (open/close surfaces, focus entity, show dialog)
- Feedback Effects (log messages, animations)
- External Effects (save game, analytics)

Effects must be:
- Serializable
- Order-aware
- Free of UI implementation details

---

## UI Architecture

### UI Layer Diagram (Surface / View / Widget)

```
+--------------------------------------------------+
|                    UI Surface                    |
|  (e.g. Trading, Dialogue, Combat)                 |
|                                                  |
|   +------------------+   +------------------+    |
|   |     UI View      |   |     UI View      |    |
|   | (Inventory View)|   | (NPC View)       |    |
|   +------------------+   +------------------+    |
|            |                     |               |
|            v                     v               |
|       [React Widgets / Hooks / DOM Elements]     |
+--------------------------------------------------+
```

Surfaces define *intent context*. Views define *data concern*. Widgets are implementation details.



### Surface-Based Composition

The UI is structured around **surfaces**, not screens or pages.

A surface:
- Represents a player intent context
- Owns which views are visible
- Subscribes only to relevant projections

Example:
- Trading Surface subscribes to:
  - Player inventory projection
  - NPC inventory projection
- It does *not* subscribe to world map state

### Persistent Views

Certain views (e.g., minimap, global log) may persist across surfaces.

Persistence rules:
- A view remains mounted if its input projection has not changed
- Views subscribe to *narrow*, versioned slices of state

This allows the minimap DOM to remain intact during trading or dialogue.

---

## Rendering Efficiency

### Projection-Based Rendering Diagram

```
[ECS World State]
        |
        | derive
        v
+------------------+
|   Projection     |  (memoized, versioned)
+------------------+
        |
        | subscribe
        v
+------------------+
|    UI View       |
+------------------+
        |
        | renders
        v
     [DOM]
```

If the projection version does not change, the UI view remains stable and React skips rendering work.



### Projection-Based Updates

UI views consume **projections**, not raw ECS data.

A projection:
- Is derived data
- Is memoizable
- Has explicit dependencies

If no dependency changes, the projection version remains stable and React does not re-render.

### Example: Trading Without Minimap Redraw

### Trading Transition Diagram

```
Turn N:
[ECS Trading System]
        |
        | emits OpenTradeSurface
        v
     [Effect]
        |
        v
[UI switches active surface]
        |
        +--> Trading Views mounted
        |
        +--> Minimap View remains mounted

Minimap Projection: unchanged
Result: No minimap DOM updates
```

This explicitly demonstrates how surface transitions do not imply global re-rendering.



- Trading system emits `OpenTradeSurface` effect
- UI switches active surface
- Minimap view remains mounted
- Minimap projection dependencies unchanged
- No DOM updates occur

This model explicitly accommodates selective redraw and high performance.

---

## Full Turn Lifecycle

### Turn Execution Diagram

```
[Player Input]
      |
      | translated into
      v
+-------------------+
|   Player Command  |
+-------------------+
      |
      | applied to
      v
+-------------------+
|     ECS World     |
+-------------------+
      |
      | tick / turn update
      v
+-------------------+
|      Systems      |
| (movement, AI,    |
|  combat, trade)   |
+-------------------+
      |
      +--------------------+
      |                    |
      v                    v
[ECS State Mutations]   [Effects Emitted]
                             |
                             v
                   +-------------------+
                   | Effect Dispatcher |
                   +-------------------+
                             |
          +------------------+------------------+
          |                  |                  |
          v                  v                  v
     [UI Update]        [Audio/FX]        [Persistence]
          |
          | React render (projection-based)
          v
        [DOM]
```

This diagram represents a **single deterministic turn**. Input enters the system only as commands, ECS systems remain authoritative over state, and all cross-layer consequences are expressed as effects.



- Surfaces are implemented as React boundary roots
- Views use fine-grained subscriptions (selectors)
- Effects are bridged into React via an effect dispatcher
- Concurrent features may be used, but ECS remains authoritative

React is treated as a *reactive renderer*, not a state authority.

---

## Design Principles

1. ECS owns game truth
2. UI consumes projections, not components
3. Effects are the only cross-layer contract
4. Surfaces model player intent, not layout
5. Rendering is opt-in and dependency-driven

---

## Non-Goals

- No bidirectional coupling between UI and ECS
- No ECS logic inside React components
- No UI-driven mutation of ECS state

---

## Summary

This architecture cleanly separates simulation, intent, and presentation. By using effects as the boundary and surfaces as the organizing principle, it avoids terminology collisions, supports efficient rendering, and scales naturally as new gameplay modes are introduced.

