# Boot and Start UI Surfaces – Data‑Driven Architecture

## Purpose
This document formalizes how **boot**, **loading**, and **start menu** UI surfaces fit into a fully **data‑driven, ECS‑based game engine**. It clarifies responsibilities, boundaries, and schema placement so that these early‑lifecycle surfaces remain **flexible, moddable, and declarative** without violating core architectural rules.

The goal is to ensure that *everything the player sees*, including the very first screen, is data‑driven — while preserving determinism, clean layering, and zero ECS/UI coupling.

---

## Core Principle

**Boot and start screens are UI surfaces, not gameplay systems.**

They are:
- Fully data‑driven
- Swappable and overridable by content packs
- Independent of ECS runtime state

They are **not**:
- Part of the game schema
- Consumers of ECS components
- Allowed to read gameplay projections by default

---

## Layer Ownership

### Game Schema (ECS‑Materialized)
Owns:
- Items, characters, maps
- Stats, rules, combat logic
- Anything that becomes ECS entities or components

Constraints:
- Loaded into ECS
- Deterministic
- Participates in saves and replays

### UI Schema (Non‑ECS)
Owns:
- UI surfaces (including boot/start)
- Views, widgets, layout
- Visual assets, transitions
- Event → command bindings

Constraints:
- Never materialized into ECS
- May exist before a world exists
- May be overridden by content packs

**Boot and start surfaces live here.**

---

## Surface Types

### 1. Boot / Loading Surface

**Purpose:**
- Display immediately on application start
- Show loading progress, branding, tips, or animations

**Characteristics:**
- Requires no ECS world
- Uses UI‑local state only
- May receive progress updates from the engine

**Strict prohibitions:**
- No ECS projections
- No entity references
- No gameplay data

This surface must be safe to render when *nothing* in the game exists yet.

---

### 2. Start Menu Surface

**Purpose:**
- Let the player choose between New Game / Load Game / Options

**Characteristics:**
- Fully data‑driven layout and behavior
- May query persistence metadata (save slots, timestamps, thumbnails)
- Emits commands to the engine

**Typical commands:**
- `StartNewGame`
- `LoadGame(saveId)`

**Default constraint:**
- Does not require ECS projections

Optional extensions (advanced):
- Visual previews using stored snapshots
- Explicit, read‑only “preview world” projections (opt‑in only)

---

### 3. Gameplay Surfaces

**Purpose:**
- World exploration, combat, trading, dialogue, etc.

**Characteristics:**
- Subscribe to ECS‑derived projections
- Render live game state
- Drive the turn loop

These surfaces must only mount **after ECS readiness**.

---

## Data‑Driven Flexibility Model

Boot and start surfaces are flexible in the same way as gameplay surfaces:

- Defined by declarative UI surface schema
- Selected and overridden by content packs
- Composed from reusable widgets and views

Flexibility is bounded by **capability declarations**, not by hardcoding.

---

## Capability‑Based Validation

Each surface definition declares what it needs.

Examples:
- `requires: ["persistence:listSaves"]`
- `requires: ["boot:progress"]`
- `forbids: ["ecs:projections"]`

The runtime validates these declarations at load time.

This ensures:
- Boot surfaces cannot accidentally depend on ECS
- Start menus remain safe before world creation
- Gameplay surfaces declare their dependencies explicitly

---

## Command and Effect Flow

- **UI → Engine:** Commands (intent only)
- **Engine → UI:** Effects (surface transitions, focus, feedback)

Typical lifecycle:

1. Application starts
2. BootLoading surface mounts
3. Engine initializes data and ECS world
4. Engine emits `OpenSurface(StartMenu)` or `OpenSurface(Gameplay)`
5. UI switches surfaces

At no point does UI directly query ECS internals.

---

## Deterministic Startup Guarantees

This model guarantees:
- No circular dependencies between UI and ECS
- Safe rendering before world creation
- Predictable startup order
- Clean separation of simulation and presentation

---

## Litmus Test

When deciding whether something belongs in boot/start UI schema, ask:

> “Would this still make sense if ECS did not exist yet?”

- If **yes** → UI schema
- If **no** → gameplay schema

---

## Summary

- Boot and start screens are first‑class, data‑driven UI surfaces
- They live in the UI schema, never in ECS
- They are flexible, moddable, and declarative
- Their power is bounded by explicit capability rules
- Effects and commands remain the only cross‑layer contract

This preserves architectural integrity while allowing complete control over the player’s first impression.

