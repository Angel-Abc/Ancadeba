# Coast Road and Pine Village

Open `square-map` in the editor preview, or export it with
`pnpm export:game sample-games/square-map`.

Move with the direction buttons, WASD, or arrow keys. The camera follows the
player. Forests and houses block movement; sand and grass take longer to cross
than the road. Gold tiles are exits. Press **E** or choose **Interact** beside an
object; clicking the adjacent object's button works too. The feedback below the
map shows the interaction result and coin balance.

## Try the round trip

1. Start on Coast Road at `(9, 4)`. Press **E** to read the signpost directly
   north at `(9, 3)`; it gives directions to Pine Village.
2. Move west once, then north twice, onto the gold gate at `(8, 2)`.
3. The same map view switches to Pine Village and places you at `(1, 4)`, beside its west gate.
4. Move east once to `(2, 4)` and press **E** to open the chest north of you at
   `(2, 3)`. You receive **25 coins**. Press E again: the chest is empty and the
   balance stays at 25. Its reward stays collected across scene visits and saves.
5. Move west twice onto the village gate at `(0, 4)`.
6. You return to Coast Road at `(8, 3)`, just south of the coast gate. Move north
   once to visit the village again.

To try the disappearing pickup, move three tiles east from the village entrance
to `(4, 4)`. Press **E** beside the purple **Berry basket** south at `(4, 5)`.
You collect **3 Wild berry inventory items**; the basket disappears and its tile
becomes passable. The **Backpack** panel below the movement controls shows the items.
Repeated interaction gives no further reward. The basket stays gone across visits
and saves, including when saving while standing on its tile. A new game restores it.

Coordinates start at zero. Arriving at an entrance does not activate a tile-entry
trigger. The exits run only when the player finishes a step onto their tiles, so
each return trip begins with another step.

## Watch the village patrols

The red Courier walks between (5, 2) and (6, 2) every 1.2 gameplay seconds.
Speak to the Courier from the side to request a step south. Speak again to send
the Courier north and resume the route. The green Ranger follows a four-tile loop
after each completed player step. The blue Watchman walks back and forth after
each player turn. Choose **Wait** to advance the Watchman while the Ranger stays put.
Leaving the village or opening the pause menu freezes the Courier’s remaining delay.

## How the exits are authored

The `exploration` scene has one map view, `world-map`, with `followPlayer: true`.
It starts on `coast`. Both maps use the same action bar and `input/movement.json` bindings.

`maps/coast.json` defines the departure tile:

```json
"entryTriggers": [
  { "id": "village-exit", "x": 8, "y": 2, "action": "enter-village" }
]
```

`rules/travel.json` connects that trigger to the village entrance in the exploration scene.

```json
"enter-village": [{
  "when": [],
  "effects": [{
    "type": "enter-scene",
    "scene": "exploration",
    "mapView": "world-map",
    "map": "village",
    "position": { "x": 1, "y": 4 }
  }]
}]
```

`maps/village.json` defines the reverse trigger, `coast-exit`, at `(0, 4)`.
Its `return-coast` action switches the view back to `coast` at `(8, 3)`.
Each entrance is a walkable tile adjacent
to its return exit.

In the editor, the gates have **T** badges on the Maps grid. Choose **Edit
tile-entry triggers**, then click a gate to open its trigger fields or click
another walkable tile to add a trigger. Under
**Rules**, open either **Enter scene** effect. **Charge time from map view** selects
`world-map`. With **Place player at destination tile** enabled, **Destination map**
and the X/Y coordinates specify where the player arrives.

## How the interactions are authored

| Object               | Object tile | Adjacent player tile                       |
| -------------------- | ----------- | ------------------------------------------ |
| Coast Road signpost  | `(9, 3)`    | Initial spawn `(9, 4)`                     |
| Pine Village chest   | `(2, 3)`    | `(2, 4)`, one step east of the entrance    |
| Village berry basket | `(4, 5)`    | `(4, 4)`, three steps east of the entrance |

Both maps declare initially blocking objects in their `objects` array. The sign
uses a brown color, the chest uses a closed sprite tile, and the berry basket uses
a purple color. Their authored actions are `read-signpost`, `open-chest`, and
`collect-berries`. Action-bar slot **12** runs `interact-map` on `world-map`. It uses the `explore/interact` binding, mapped to `KeyE`
in `input/movement.json`. Automatic targeting requires exactly one cardinally
adjacent object, so neither a diagonal approach nor a distant E press activates
the chest. Interaction is also unavailable while a step is pending.

`rules/interactions.json` demonstrates source-scene and `payload-is-target`
conditions. Reading the sign sets `signRead` and an instruction message. The
chest's first branch checks `chestOpened: false`, sets it to true, sets `coins`
to 25, and displays the reward message. Subsequent interactions use an empty-chest
branch that changes only the message. The `interaction-result` text component
displays the shared message and coin balance through state bindings.
The chest's `open` object state matches `chestOpened: true`, switches its label
to **Open chest**, uses the `chest-open` appearance terrain, and sets `blocking`
to false. The chest tile can then be crossed using the underlying grass movement
time (200 ms). The sign remains solid. `assets/objects.json` registers
`assets/chests.svg`, a sheet with two 32×32 tiles: closed on the left, open on the
right. `maps/village.json` selects these tiles and defines the chest's state override.

The basket's `collected` state matches `berriesCollected: true` and sets only
`visible: false`. Hidden objects are absent from collision and interaction even
though their base `blocking` flag is true. `collect-berries` checks the scene,
object ID, and uncollected flag, then transfers the three berry instances to the
player, sets the collected flag, and records a feedback message.
The editor exposes **Object visible** and **State visible** alongside the other
object settings. It keeps hidden objects editable on the grid; play the preview
to see the live visibility change.

`inventory/supplies.json` defines a village-owned `berry-basket` container with
`berry-1`, `berry-2`, and `berry-3` inside. The pickup uses:

```json
{ "type": "collect-items", "items": ["berry-1", "berry-2", "berry-3"], "owner": "player" }
```

The transfer and state change complete together before inventory observers run.
If any berry is unavailable, the entire pickup is rejected and the map basket
stays visible. These are finite inventory instances, so repeat interactions cannot
duplicate them. In Rules, choose **Collect inventory items** to configure the
recipient and item list without JSON editing. The **Backpack** panel shows items carried by the player on either map.

Saving and loading preserves these flags, coins, feedback, and map positions.
Starting a new game resets them, allowing the chest to be collected again. In
the editor, choose **Place or edit map objects** and click an **O** badge to
inspect the label, appearance, action, blocking flag, and **Object states** controls.
The editor grid shows the default closed appearance; play the preview to see it open.
Inspect the **Interact**
slot and input configuration to see how the E key is connected.
