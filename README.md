# Friendly 21

Public source: [openifsoul/example-friendly-21](https://github.com/openifsoul/example-friendly-21).

Independent original browser host, extracted from the IfSoul demonstration. This
repository owns the game and its adapter; it is not part of a central game catalog
implementation. Engine: DOM/CSS/TypeScript. Source and vector assets
are Apache-2.0; adapted shadcn Button retains its MIT notice in LICENSES.

## Run independently

Use Node 22.18–24 and pnpm 10.15.0. The checked-in lockfile selects the
checksum-pinned `@ifsoul/adapter-sdk@0.7.0` archive under `vendor/`.
The example runs independently of an IfSoul account, provider key or Core checkout.

```sh
pnpm install --frozen-lockfile
pnpm check
pnpm dev
```

Open the printed loopback URL. Scenario mode is deterministic and makes no remote
calls. Pause/resume and restart are in the standalone panel; game-specific controls
remain inside the playfield. Unavailable optional inference falls back visibly.
Build output web-dist is standalone; dist contains package exports.

## Host integration

`@ifsoul/example-friendly-21` exports `mount(container, options)` with SDK
GameMountOptions/MountedGame. Import `./simulation` for independent game rules;
`./adapter` exports createExampleSession (pause/resume/destroy plus bounded chat) for the same SDK bridge lifecycle used
by the standalone panel. All mechanics remain in src/game. The adapter handles
bounded proposals/dialogue and reports, never locomotion or gameplay controllers.
Destroy or abort owns cleanup, including late mount completion.

A consuming application supplies its own trusted bridge/transport and authentication.
The standalone optional connection uses SDK HTTP transport at the same-origin
/api/demo/bridge endpoint. For local development only, set IFSOUL_API_ORIGIN to
an explicit HTTP loopback IfSoul origin before pnpm dev, then select Local IfSoul
proxy. The development server validates the target and rewrites Host/Origin
server-side. This connection needs the separately running trusted local IfSoul
runtime. No Clerk token or provider key is accepted by this example.
Cloud Playground consumes the exported mount inside its own authenticated origin;
standalone cloud authentication and cross-origin hosting are not implemented.

## Package without publication

Run `pnpm build` then `pnpm pack --pack-destination output/packages`.
The example tarball bundles the SDK from the pinned local archive.

Simulation and adapter lifecycle tests run with pnpm test. Browser checks are
separate and headless.
GitHub Actions PR/push checks and local release boundaries are described in the
[execution policy](docs/deployment.md).

## Game controls and limits

Play five rounds with Hit/Stand buttons, H/S while the card table has focus, or Tab/Enter. Aces soften and face cards count ten. The companion sees its own hand and only the count of your hidden cards. Decisions are bounded to legal hit/stand choices; a round report appears after the actual result.

The local .npmrc selects hoisted installation because pnpm bundling requires it.
No dependencies resolve through a sibling checkout. The bundled SDK retains its Apache-2.0 license and notices.

The adjacent chat uses the same adapter bridge and bounded session history as the
game, including host observations and prior user/agent messages. Messages accept
1–600 characters. Scenario and fallback replies retain their provenance labels.
Destroy aborts local chat delivery; it does not claim upstream inference cancellation.

## Portable declarations and validation

Package declarations support strict TypeScript NodeNext consumers without Vite
ambient types or skipLibCheck. After TypeScript emits declarations, the local
build script removes only side-effect CSS imports from .d.ts files. It leaves
JavaScript and stylesheet assets intact. Friendly 21 and Dungeon consumers must
explicitly import the package's `style.css` export in their browser composition.
The standalone entry already includes its game's styles through the game module.

To validate a clean checkout, run `pnpm install --frozen-lockfile` followed by
`pnpm check`.

## Companion portraits

Mira, Rook and Pip each have an original ImageGen portrait embedded in the game
package. The same portraits appear in the first-party chat and companion selector;
the head at the table changes with the selected identity. The table starts at the
top of its host container, with the round label and portrait inside the play area.
Unknown custom identities show their name without assigning another companion's
face. Portrait PNG sources and prompts are retained in the local artwork workspace.

## In-game speech

The host owns its speech bubble, placement and animation. It implements the
optional `MountedGame.say(speech)` presentation API for player-requested chat.
Autonomous/requested game dialogue is displayed after the game's normal freshness
checks. Bubbles type the text visually, announce the whole line accessibly, respect
reduced motion and release timers/animations on pause or destruction. The SDK
returns authored scenario/fallback reactions instead of quoting raw host reports;
model plan explanations are not dialogue. No action authority is added.

## Compatibility

The current IfSoul format is **0.4.0**. Matching version numbers do not make distinct format families interchangeable.
See [compatibility](docs/compatibility.md) for identifiers, validation and archive semantics.
