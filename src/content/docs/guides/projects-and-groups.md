---
title: Projects and Groups
description: Put the directories of your work in a tree of Projects and Groups, see the Project of each Session, and see the most urgent status of a whole Group with nomux status --tree.
---

A **Project** is a directory on a Host with a name. A **Group** has a name and holds Projects and other Groups, to any depth. Together they are the **workspace tree** of the Host: you choose the sequence, and the daemon keeps it.

A Session belongs to a Project when its working directory is the directory of the Project or is below it. `nomux ls` shows the Project of each Session, and `nomux status --tree` shows what each Project and each Group is doing.

The output on this page is the real output of nomux 0.5.0 on Linux. The home directory of the runs is shown as `/home/user`. Your identifiers and process IDs are different.

## Make a tree

`nomux group new` makes a Group. `nomux project add` adds a directory as a Project. This run has three directories: `acme-web`, `acme-api` and `notes`.

```console
$ nomux group new "Client work"
made group vr7eyygu2jdk: Client work (revision 1)
$ nomux group new Acme --in "Client work"
made group beogp2b4pcrd: Client work/Acme (revision 2)
$ nomux project add ~/src/acme-web --group "Client work/Acme"
added project h2evg6lqw6s2: Client work/Acme/acme-web (revision 3)
$ nomux project add ~/src/acme-api --group Acme
added project 6pznv5rp7we7: Client work/Acme/acme-api (revision 4)
$ nomux project add ~/src/notes
added project xwhya26auf2n: notes (revision 5)
$ nomux group move notes --to Acme --before acme-web
moved xwhya26auf2n: Client work/Acme/notes (revision 6)
$ nomux group move Acme --to Acme
nomux: a Group cannot move into itself or into a Group below it
```

Each change prints one line: what changed, the identifier of the node, its path after the change and the **revision** of the tree. The revision grows by 1 with each change.

`nomux group ls --tree` lists the tree. A node is indented two spaces below its Group, in the sequence that you chose. `nomux project ls` lists the Projects only:

```console
$ nomux group ls --tree
NAME          KIND     ID            DIRECTORY
Client work   group    vr7eyygu2jdk  -
  Acme        group    beogp2b4pcrd  -
    notes     project  xwhya26auf2n  /home/user/src/notes
    acme-web  project  h2evg6lqw6s2  /home/user/src/acme-web
    acme-api  project  6pznv5rp7we7  /home/user/src/acme-api
$ nomux project ls
ID            PROJECT                    DIRECTORY
xwhya26auf2n  Client work/Acme/notes     /home/user/src/notes
h2evg6lqw6s2  Client work/Acme/acme-web  /home/user/src/acme-web
6pznv5rp7we7  Client work/Acme/acme-api  /home/user/src/acme-api
```

| Command | What it does |
|---|---|
| `nomux project add [<directory>] [--name <name>] [--group <node>]` | Adds a Project. The default name is the last part of the directory. |
| `nomux project ls` | Lists the Projects. |
| `nomux project rm <node>` | Removes a Project from the tree. The directory stays. |
| `nomux group new <name> [--in <group>]` | Makes a Group at the top level, or in a Group. |
| `nomux group rename <node> <name>` | Gives a Group or a Project a new name. |
| `nomux group move <node> ...` | Moves a Group or a Project. It needs `--to <group>`, `--top`, `--before <node>` or `--after <node>`. |
| `nomux group rm <node>` | Removes a Group. Its Groups and Projects take its place in its parent. |
| `nomux group ls [--tree]` | Lists the Groups, or the whole tree. |

`--quiet` prints only the identifier of a node, and `--json` prints one JSON document. There is no `nomux tree` command: `group ls --tree` lists the tree, and `status --tree` shows its status.

## Name a node

A command that takes a `<node>` accepts three forms:

- the **identifier** of 12 characters, which the daemon makes and never changes;
- the **path**: the names from the top level down to the node, with `/` between them, for example `Client work/Acme/acme-web`;
- the **name** alone, if only one node has it, for example `acme-web`.

Two nodes can have the same name, also in the same Group. A name or a path that more than one node has is refused, and the command lists the candidates. A command that needs a Project and gets a Group is refused too:

```console
$ nomux project rm Acme
nomux: beogp2b4pcrd is a Group, not a Project
$ nomux project rm "Client work/Acme/notes"
removed project xwhya26auf2n: Client work/Acme/notes (revision 7)
$ nomux project add ~/src/notes --group Acme
added project rzikpltf6pjx: Client work/Acme/notes (revision 8)
```

In another run, two Projects of the Group `Acme` were both called `site`:

```console
$ nomux project rm Acme/site
nomux: "Acme/site" names 2 nodes: give the identifier of one
  vs2cb3pg4jhs  Acme/site
  yu2m2tkr23kr  Acme/site
```

`group rm` removes the Group and nothing else. Its content moves up one level, in the same sequence. A node that does not exist gives the exit code 2.

## Add a Project

- **The default is the current directory.** `nomux project add` without a directory adds the directory where you run it.
- **In a git repository, the Project is the root of the repository.** The command asks `git rev-parse --show-toplevel`. Here it ran in `~/src/demo-repo/docs/guides`:

  ```console
  $ cd ~/src/demo-repo/docs/guides
  $ nomux project add --name demo
  added project 6fil63rhd6gk: demo (revision 9)
  $ nomux project ls
  ID            PROJECT                    DIRECTORY
  h2evg6lqw6s2  Client work/Acme/acme-web  /home/user/src/acme-web
  6pznv5rp7we7  Client work/Acme/acme-api  /home/user/src/acme-api
  rzikpltf6pjx  Client work/Acme/notes     /home/user/src/notes
  6fil63rhd6gk  demo                       /home/user/src/demo-repo
  ```

  The directory of the Project is `demo-repo`, not `guides`. The rule applies to a directory that you name too. It applies on the local Host only. With `--host`, the directory is necessary and must be an absolute path on the remote Host.
- **The daemon resolves the directory.** It resolves each symbolic link, and the result must be a directory. The Project keeps the resolved path.
- **One directory, one Project.** A second Project with the same directory is refused. A Project can have a directory below the directory of another Project.
- **A directory that does not exist is refused.**

```console
$ nomux project add ~/src/demo-repo
nomux: the Project 6fil63rhd6gk has the directory /home/user/src/demo-repo already
$ nomux project add ~/src/nothing-here
nomux: the directory /home/user/src/nothing-here cannot be used: No such file or directory (os error 2)
```

## The Project of a Session

A Session belongs to the Project whose directory is equal to the working directory of the Session, or is above it. If more than one Project matches, the longest directory wins. The comparison uses whole path components: the Project `/src/app` matches `/src/app/web` and does not match `/src/application`.

`nomux ls` has the column `PROJECT` when a Session has a Project, and `-` for a Session without one. In this run, `archive` is a Project in the directory `notes/archive`, below the Project `notes`:

```console
$ nomux ls
ID        NAME     STATE    PID      PROJECT                    COMMAND
g4lqtfou  todo     running  4083550  Client work/Acme/notes     /bin/bash
le3wzbpq  old      running  4083577  Client work/Acme/archive   /bin/bash
mkdxuvtk  scratch  running  4083580  -                          /bin/bash
phzvucgt  web      running  4083547  Client work/Acme/acme-web  /bin/bash
y25xvaff  api      running  4083584  Client work/Acme/acme-api  /bin/bash
```

- `todo` runs in `notes`, and `old` runs in `notes/archive`: `old` gets the longer match.
- `web` started in `acme-web/packages/ui`, a directory below the Project.
- `scratch` started in the home directory, which no Project holds.

The Project of a Session is not a field of the Session. A client computes it from the working directory and the tree, thus it changes only when the tree changes.

### Symbolic links

The daemon resolves the working directory of a Session one time, when it first describes the Session, and compares the resolved path with the directories of the Projects. A Session that starts in a symbolic link to a Project directory belongs to that Project:

```console
$ ln -s ~/src/acme-web ~/link-web
$ nomux new -n via-link --cwd ~/link-web
gkdxutgo
$ nomux ls
ID        NAME      STATE    PID      PROJECT                    COMMAND
gkdxutgo  via-link  running  4083585  Client work/Acme/acme-web  /bin/bash
```

(The real output had the other Sessions of the run too. They are not in this block.)

A Session can lose its Project when the daemon cannot resolve the directory. The daemon resolves it again when it finds the Session again after a restart. In one run, a Session started in a link, then the daemon stopped and the link was removed. The new daemon could not resolve the path. It used the path that the Session was given, the link, and the link matches no Project: `ls` showed `-` for `PROJECT`.

The documents of nomux give one more case: on macOS, `/tmp` is a link to `/private/tmp`. This was not run for this page, because it needs a Mac.

## See the status of a tree

`nomux status --tree` shows the Sessions below their Projects and Groups. A Group or a Project shows the **most urgent status** of the Sessions below it: the Sessions of the Project, or of each Project in the Group and in each Group below it. `needs you` is first. [Agent status](/docs/guides/agent-status/) has the order of the states.

To get a state beyond `idle` without an agent tool, each Session of this run reported one with `nomux status set` ([Agent status](/docs/guides/agent-status/#report-a-status-from-your-own-program)). The commands came from outside with `nomux send`:

```console
$ nomux send web 'nomux status set working "build"'
$ nomux send api 'nomux status set blocked "run the tests?"'
$ nomux send todo 'nomux status set done "notes saved"'
$ nomux status --tree
  NAME          COMMAND    STATE      FOR  MESSAGE
  scratch       /bin/bash  idle       2s
! Client work/             needs you  1s   run the tests?
!   Acme/                  needs you  1s   run the tests?
*     acme-web             working    1s   build
*       web     /bin/bash  working    1s   build
!     acme-api             needs you  1s   run the tests?
!       api     /bin/bash  needs you  1s   run the tests?
+     notes                done       1s   notes saved
+       todo    /bin/bash  done       1s   notes saved
      archive              idle       2s
        old     /bin/bash  idle       2s
  demo                     -          -
```

- The Sessions without a Project come first. Then each Group (its name ends with `/`) and each Project, in the sequence of the tree and indented for each level.
- `Client work/` and `Acme/` show `needs you`, because `api` below them needs you. `acme-web` shows `working`, because only `web` is below it.
- A Group or a Project without a Session has `-` for its state: see `demo`.
- The first column has the header `NAME`. A Session that has a name shows its name.

## Follow the changes

Each change of the tree makes one event. `nomux events --follow --filter workspace-changed` prints them:

In a second terminal, the run made a Group, renamed it and removed it:

```console
$ nomux events -f --filter workspace-changed
19 workspace revision 19: added con6zsta4tjz "Temp" at position 4
20 workspace revision 20: renamed con6zsta4tjz to "Temp2"
21 workspace revision 21: removed con6zsta4tjz
```

The number in front is the sequence number of the event. `--json` prints one JSON document on each line, with the change and the new node.

## The file of the tree

The daemon keeps the tree in the file `workspace.json` of the state directory: `~/.local/state/nomux` on Linux and `~/Library/Application Support/nomux` on macOS. The file has the mode `0600`. The daemon writes a new file next to it and then renames it, thus a stop of the Host leaves the old tree or the new tree, never a part of one.

The daemon reads the file one time, when it starts. It does not trust the file. A file that the daemon cannot use does not stop the daemon, and the daemon does not delete it:

- It renames the file to `workspace.json.<milliseconds>.damaged`.
- It writes a warning with the reason to its log.
- It starts with an empty tree. The revision of the new tree is the time in milliseconds since the Unix epoch, because the revision of the lost tree is not known and a revision must never decrease.

Here the file had the content `{ not json`. The log line is shortened (without its time and with `/home/user` for the home directory):

```console
$ nomux group ls --tree
the workspace tree is empty
$ ls ~/.local/state/nomux
sessions
workspace.json.1795705667151.damaged
$ nomux group new Fresh
made group fd5phc26fnb2: Fresh (revision 1795705667152)
```

```text
WARN nomuxd::workspace::tree_file: the daemon cannot use the workspace tree file: it keeps the file aside and starts with an empty tree file=/home/user/.local/state/nomux/workspace.json kept=/home/user/.local/state/nomux/workspace.json.1795705667151.damaged reason="key must be a string at line 1 column 3"
```

The daemon never reads the kept file again. You can read it or repair it by hand.

## Limits

| Limit | Value | Message |
|---|---|---|
| Nodes in the tree | 800 | `nomux: the workspace tree has 800 nodes, the limit: remove a node first` |
| A name | 1 to 128 bytes, without a control character | `nomux: the name has 129 bytes: 128 bytes is the limit`, `nomux: the name is empty`, `nomux: the name has a control character` |
| A directory | An absolute path of 1024 bytes at most, in UTF-8 | |

The product measurements say that an idle daemon with a tree of 800 nodes uses approximately 8 MB of resident memory.

## What this version does not do

- **No check for a Project directory that went away.** The daemon adds a directory when you add it and never looks at it again. In a run, the directory of a Project was removed with `rmdir`. `nomux project ls` still listed the Project, and a daemon that started again still had it. Remove such a Project with `nomux project rm`.
- **No default agent and no color** for a Project. They are planned.
- **The desktop client does not show Groups yet.** The group row of the sidebar, which opens and closes a Group and shows its status, is not released.

[CLI reference](/docs/reference/cli/) has the options and the JSON documents. The terms come from the [Glossary](/docs/reference/glossary/). The product document [`docs/workspace.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/workspace.md) has the model and the rules of the tree.
