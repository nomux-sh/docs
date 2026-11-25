# ADR-0005: Extension model

- Status: Accepted
- Date: 2026-11-25

## Context

The core of nomux is almost empty. The core knows Sessions, PTYs, the protocol, the extension hosts and the status engine.
Each other feature is an extension that the user can install and remove: git, files, agent adapters, the browser, notification channels, programming language support, themes and UI languages.

These limits apply:

- An extension that is not in use must not use memory or CPU.
- A failure of an extension must not stop the daemon or a Session.
- An extension must get only the access that the user approved.
- The core must contain no code that is specific to one vendor.
- The official extensions must use the same API as other extensions. The core has no private entry for them.
- An extension has work to do on the Host (for example, read a git repository) and in the client (for example, show a panel). The Host and the client can be different machines.

## Decision

One extension package can contain more than one part. Each kind of part has its own mechanism.

| Part | Where it runs | Mechanism |
|---|---|---|
| Daemon part | On the Host | A separate process. It speaks framed protobuf over stdio with `nomuxd`. |
| UI part | In the client | A WASM component that runs in `wasmtime`. The API is defined in WIT. |
| Programming language | In the client and on the Host | A grammar (WASM), queries and an optional LSP definition. |
| Theme | In the client | Tokens in TOML. |
| Language pack | In the client | Fluent `.ftl` files. |

**Daemon parts.**
`nomuxd` starts a daemon part on demand and stops it when it is idle.
If a daemon part fails, the daemon continues to run.

**UI parts.**
A UI part fills slots: a Tab type, a sidebar section, a right panel section, a command, a status bar item, a settings page and a mobile screen.
A UI part publishes its view data as declarative snapshots with a revision number. The core finds the difference and draws it.
A UI part does not run in the draw loop.
The life cycle is `register` then `dispose`.

**Manifest and permissions.**
Each package has an `extension.toml` file. The manifest gives the name, the version, the parts, the permissions and the compatible versions of the core and the protocol.
Permissions name file system paths, process access, network access and scopes such as `sessions:read`.
At installation, an approval screen shows the permissions to the user.

**Registry.**
The registry is static and is served from a CDN. Packages are addressed by content and are signed with minisign.

**API versions.**
The extension API has its own semantic version, independent of the application version.
An API that will be removed stays for a minimum of two minor versions with a deprecation warning.

## Consequences

- The cost of a feature that the user does not use is zero: its daemon part is not started and its UI part is not loaded.
- A failure of a daemon part is isolated in its own process.
- UI parts are isolated in WASM and get only the capabilities that the host gives.
- The official extensions test the API. If an official extension cannot do something through the API, the API is missing a function.
- The declarative snapshot model limits what a UI part can draw. A UI part cannot draw frames directly.
- Daemon parts have the cost of a process start and of protobuf encoding for each call. Lazy start adds a delay to the first call.
- The project must keep two interface definitions stable: the protobuf interface for daemon parts and the WIT interface for UI parts.
- On Linux, Landlock limits the file access of daemon parts.
- Extensions that are not official go through a review before the registry lists them.

## Alternatives considered

**Features and vendor code in the core.**
One reference product keeps approximately 40 vendor directories in its core.
We did not select it. A feature in the core is loaded for each user, and the core must stay small.

**A private entry in the core for official extensions.**
Official extensions get access that other extensions do not get.
We did not select it. The rule of the project is that official extensions use the same API as all other extensions.

**UI extension code in the draw loop.**
The extension draws its own UI in each frame.
We did not select it. With declarative snapshots, the core controls the drawing and the extension stays out of the draw loop.

## Open questions

The stage identifiers (M1 to M10) come from the [roadmap](../src/content/docs/project/roadmap.md).

- The UI extension API is not frozen. It is frozen only after the official extensions have tested it. Owner: stage M7.
- The content of the WIT interface and of the protobuf interface for daemon parts is not set. Owner: the `extension-api` repository, stage M3 (first version) and stage M7 (final version).
- The full list of permission names is not set. Only file system paths, process, network and `sessions:read` are named. Owner: the `extension-api` repository.
- The sandbox for daemon parts on macOS is not set. Only Landlock on Linux is named. Owner: stage M10 security audit.
- The review process for extensions that are not official is not set. Owner: the `registry` repository, stage M7.
