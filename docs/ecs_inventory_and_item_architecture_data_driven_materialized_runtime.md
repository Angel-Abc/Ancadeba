# ECS Inventory and Item Architecture

This document captures the agreed-upon design for **inventory, equipment, items, tattoos, and piercings** in a **turn-based, ECS-driven game engine**, using a **data-driven authoring model** with **fully materialized runtime state**.

The goals of this architecture are:
- Deterministic simulation and replay
- Stable saves across content changes
- Clear ECS boundaries (state vs logic vs presentation)
- Scalable content authoring
- Efficient, projection-based UI rendering

---

## 1. Core Principles

### 1.1 ECS Owns Runtime Truth
- The ECS world fully defines simulation behavior at runtime.
- No gameplay-relevant data is fetched from external registries during simulation.
- Systems operate exclusively on entities and components.

### 1.2 Data-Driven, Not Data-Executed
- Item templates exist for **authoring and instantiation only**.
- Templates are *materialized* into ECS components when an item entity is spawned.
- Templates do not participate in runtime logic after spawn.

### 1.3 IDs at the Boundaries
- Text, sprites, sounds, icons, and UI labels are referenced by **IDs**, not embedded data.
- Localization and rendering resolve IDs outside ECS.

---

## 2. High-Level Model

### Entity Types
- **Character entities** (player, NPC)
- **Item entities** (weapons, armor, clothing, tattoos, piercings)

Everything that is tradable or removable is an entity.

---

## 3. Character Components

Character entities are intentionally kept thin. They do not duplicate item data.

### 3.1 Inventory / Containment

**Pattern: Container + ContainedIn**

- `Container`
  - Marks the entity as capable of containing items
  - May include capacity or rule metadata

- `ContainedIn { containerId }`
  - Stored on item entities
  - Defines ownership/location

This supports:
- Trading
- Dropping
- Nested containers (bags, chests)

### 3.2 Equipment State

**`EquipmentSlots`**
- Maps `SlotType -> itemEntityId | null`
- Stores *references only*, never stats

Slots are unified across wearables and body modifications:
- Clothing / armor: `Head`, `Torso`, `Legs`, `Feet`, `Hands`, `Back`, etc.
- Piercings: `EarLeft`, `EarRight`, `Nose`, `Brow`, etc.
- Tattoos: `TattooBack`, `TattooFace`, `TattooLeftArm`, etc.

---

## 4. Item Entities (Runtime Components)

Each item instance is a fully materialized ECS entity.

### 4.1 Identity and Presentation

- `DisplayNameId { id }`
- `DescriptionTextId { id }`
- `AppearancePart { spriteId, renderLayer, paletteKey? }`

These components contain **IDs only**, never localized strings or asset blobs.

### 4.2 Equipment Rules

- `Equippable { allowedSlots: SlotType[], layer }`

Slot compatibility and layering are validated by systems.

### 4.3 Gameplay Effects

Gameplay effects are expressed via components on the item entity.

Common patterns:

- Typed components for core mechanics:
  - `Armor { defense, resistances, durability }`
  - `Durability { current, max }`

- Generic stat effects:
  - `Modifiers { entries: [ { stat, op, value } ] }`

This allows composition without duplicating logic on the character.

### 4.4 Ownership / Location

- `ContainedIn { containerId }`

An equipped item is still *contained* by the character; equipment is a state overlay, not a move.

---

## 5. Tattoos and Piercings

Because tattoos and piercings are **tradable** and have **gameplay effects**, they are treated as item entities.

### 5.1 Tattoos

Tattoo entity components:
- `Equippable { allowedSlots: [TattooSlot] }`
- Gameplay components (e.g. `ReputationModifier`, `IntimidationBonus`)
- `AppearancePart`
- Presentation ID components

Application/removal is handled via commands and systems, not by embedding tattoo data on the character.

### 5.2 Piercings

Piercing jewelry entity components:
- `Equippable { allowedSlots: [PiercingSlot] }`
- Gameplay components
- `AppearancePart`

Optional (only if needed later): a separate `Pierced` component on the character to model available body modifications.

---

## 6. Data-Driven Templates (Authoring-Time)

Templates exist to define *canonical item shapes* but are not runtime dependencies.

Template responsibilities:
- Define default component values
- Validate slot compatibility
- Define modifier lists
- Reference presentation IDs

At spawn time:
- A system converts a template into concrete ECS components
- All gameplay-relevant data is copied into the item entity

After spawn:
- Templates are no longer consulted by systems

---

## 7. Systems Overview

### 7.1 Spawn / Instantiate System
- Input: template ID
- Output: fully materialized item entity
- Performs validation once

### 7.2 Equip / Unequip System
- Validates slot rules
- Updates `EquipmentSlots`
- Does not copy stats onto the character

### 7.3 Stat Aggregation (On Demand or Cached)
- Reads equipped item entities
- Aggregates gameplay components
- Either computed on demand or cached in a system-owned component

### 7.4 Trade / Transfer Systems
- Move `ContainedIn` between containers
- Equipment state updated accordingly

---

## 8. UI and Projections

The UI never queries ECS directly.

Projections:
- Read ECS components
- Resolve presentation IDs externally
- Emit memoizable UI models

Typical projections:
- InventoryProjection
- EquipmentProjection
- DerivedStatsProjection
- AppearanceProjection

This ensures:
- Minimal re-renders
- Clear separation of concerns
- No ECS/UI coupling

---

## 9. Determinism and Saves

This model guarantees:
- Saves fully describe behavior
- Replays remain valid
- Content patches do not silently alter existing items

If item balance changes are desired for existing saves, they are applied via **explicit migration systems**.

---

## 10. Non-Goals

- No UI logic in ECS
- No ECS logic in UI
- No template dereferencing during simulation
- No duplicated item stats on characters

---

## 11. Summary

- Inventory and equipment are relationship state, not stat containers
- Items (including tattoos and piercings) are first-class entities
- Templates are authoring tools, not runtime authorities
- ECS state is complete, deterministic, and self-contained
- Presentation is resolved via IDs at the edges

This architecture prioritizes correctness, scalability, and long-term maintainability for an ECS-based game engine.

