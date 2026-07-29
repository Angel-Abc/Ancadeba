import type { RuntimeGameContent } from '@angelabc/ancadeba-content'

export function createGame(): RuntimeGameContent {
  return {
    gameId: 'locked-observatory',
    title: 'The Locked Observatory',
    description: 'A mysterious observatory.',
    start: {
      locationId: 'entrance-hall',
    },
    items: new Map([
      [
        'brass-key',
        {
          id: 'brass-key',
          name: 'Brass Key',
          description: 'A small brass key with intricate engravings.',
        },
      ],
    ]),
    locations: new Map([
      ['entrance-hall', {
        id: 'entrance-hall',
        name: 'Entrance Hall',
        description: 'Dusty doors lead deeper into the observatory.',
        exits: [
          {
            id: 'entrance-hall-to-main-hall',
            label: 'Pass through the brass doors',
            targetLocationId: 'main-hall',
          },
        ],
        items: [],
        interactions: [],
      }],
      ['main-hall', {
        id: 'main-hall',
        name: 'Main Hall',
        description: 'A large hall with a high ceiling and a grand staircase.',
        exits: [
          {
            id: 'main-hall-to-entrance-hall',
            label: 'Return to the entrance hall',
            targetLocationId: 'entrance-hall',
          },
        ],
        items: [
          {
            itemId: 'brass-key',
            takeLabel: 'Pull the brass key from beneath the staircase',
          },
        ],
        interactions: [],
      }],
    ]),
  }
}

export function requireBrassKeyForEntranceExit(
  game: RuntimeGameContent,
  consumesBrassKey = false,
) {
  const exit = game.locations.get('entrance-hall')!.exits[0]!
  exit.requirement = {
    type: 'item',
    itemId: 'brass-key',
    consumesItem: consumesBrassKey,
    failureMessage: 'The brass doors are locked.',
  }
  return exit
}

export function addEntranceInteraction(
  game: RuntimeGameContent,
  requiresBrassKey = false,
  consumesBrassKey = false,
) {
  const interaction = {
    id: 'repair-observatory-telescope',
    label: 'Repair the telescope',
    completionMessage: 'The telescope is repaired.',
    requirement: requiresBrassKey
      ? {
          itemId: 'brass-key',
          consumesItem: consumesBrassKey,
          failureMessage: 'You need the brass key.',
        }
      : undefined,
  }

  game.locations.get('entrance-hall')!.interactions.push(interaction)
  return interaction
}
