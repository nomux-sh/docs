# ADR-0008: Release early with pre-releases

- Status: Accepted
- Date: 2026-11-25

## Context

nomux has many components: the core binaries, the protocol crate, the desktop client, the mobile clients, the extension API and the official extensions.
The work on these components has a fixed order. The [roadmap](../src/content/docs/project/roadmap.md) shows it.

The first plan had one public release at the end, after the full scope was complete.
This plan has two problems:

- **No feedback.** Nobody outside the project can install a component before the end. Design errors in the CLI, the protocol and the extension API stay hidden until a correction is expensive.
- **No visible progress.** A visitor sees repositories without a version. The visitor cannot know which parts work.

A persistent terminal Session is useful without the desktop client, and the protocol crate is useful without the extensions.
Thus a component can have users long before the full scope is complete.

## Decision

**Pre-releases from the first usable version.**
Each component publishes its first usable version as a `0.x` pre-release as soon as it works. After that, the component continues to publish versions.
Each stage of the roadmap ends with a `0.x` pre-release of the components that the stage changed.

**Versions.**
Versions obey [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html).
A version earlier than `1.0.0` is a pre-release: a minor version can have breaking changes, and a patch version cannot.

**Changelog.**
The changelog of each version comes from the commit subjects. Each repository with releases has a `CHANGELOG.md`.

**1.0.0.**
A component gets the version `1.0.0` when the full scope of nomux is complete and each performance target is measured.

**Code signing.**
Code signing of the macOS and Windows artifacts starts with the first stable release. A `0.x` artifact has a checksum and no platform signature.

The steps of a release, the changelog tool and the artifacts of each repository are in the [release guide](https://github.com/nomux-sh/.github/blob/main/RELEASING.md).

## Consequences

- Users can install a component and report problems while the design can still change.
- A visitor sees which components work: each one has a version and a changelog.
- A dependency between nomux repositories always uses a published version. Early releases make this possible from the start.
- Interfaces can change between minor versions before `1.0.0`. Each repository says this in its README, and a breaking change has a `!` in its commit subject and its own changelog group.
- Each repository needs a release workflow and a changelog configuration early, not at the end.
- On macOS and Windows, a `0.x` artifact causes an operating system warning because it has no platform signature. The installation instructions must say this.
- The maintainers must answer reports about pre-releases. This takes time from the work on the next stage.

## Alternatives considered

**One release at the end.**
All components stay without a public version until the full scope is complete and tested.
We did not select it. It gives no feedback before the end and hides the progress of the project.
