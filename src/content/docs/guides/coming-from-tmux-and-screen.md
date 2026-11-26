---
title: Coming from tmux and screen
description: Two cheat sheets that map the tmux and GNU screen commands that people type most to the commands and keys of nomux, and the differences that are on purpose.
---

This page maps the commands of tmux and GNU screen to the commands of `nomux`. The right column of each table is the nomux command. The [CLI reference](/docs/reference/cli/) has each command with its options, its output and its exit codes.

Each nomux command in the two tables was run with nomux 0.5.0 on Linux, but the `--host` row: that row needs a remote Host, and `nomux --help` was the check. The tmux and screen commands are from their own manuals. This page did not run them.

A Session has an identifier and can have a name. Each command that takes a Session takes a target: the identifier, the name, or the start of one of the two. Thus `nomux attach api` and `nomux attach k3xq` both work. [Sessions](/docs/guides/sessions/) has the rules.

## From tmux

| You type in tmux | In nomux |
|---|---|
| `tmux new -s api` | `nomux new -n api -a` |
| `tmux new -d -s api 'cmd'` | `nomux new -n api -- cmd`. `new` does not attach without `-a` or `-A` |
| `tmux new -A -s api` | `nomux new -A -n api` |
| `tmux attach -t api` | `nomux attach api` or `nomux a api`. `-t api` works too |
| `tmux attach` | `nomux attach`, or `nomux` on a terminal: the Session that a client attached to last |
| `tmux attach -d -t api` | `nomux attach -d api` |
| `tmux attach -r -t api` | `nomux attach -r api` |
| `tmux ls` | `nomux ls` |
| `tmux ls -F '#{session_name}'` | `nomux ls --json \| jq -r '.sessions[].name // empty'` |
| `tmux rename -t api web` | `nomux rename api web` |
| `tmux kill-session -t api` | `nomux kill api` |
| `tmux kill-server` | `nomux kill --all` ends the Sessions and asks first on a terminal. `nomux daemon stop` stops the daemon, and the Sessions continue |
| `tmux detach -s api` | `nomux detach api` |
| `tmux send-keys -t api 'ls' Enter` | `nomux send api 'ls'` |
| `tmux send-keys -l -t api 'x'` | `nomux send --no-enter api 'x'` |
| `tmux send-keys -t api C-c` | `nomux send -k api C-c` |
| `tmux pipe-pane -O 'cat >> f'` | `nomux capture -f api >> f` |
| `tmux capture-pane -p -S - -E - -t api` | `nomux capture --lines 100000 api`. The output is as the command wrote it, with its escape sequences |
| `ssh host tmux attach -t api` | `nomux --host host attach api` |
| `C-b d` | `Ctrl-a d`. `Ctrl-\ d` works too |
| `C-b C-b` (send `C-b`) | `Ctrl-a Ctrl-a` sends `Ctrl-a` |
| `set -g prefix C-b` | `nomux attach --prefix C-b`, `NOMUX_PREFIX=C-b`, or `prefix = ["C-b"]` in the `[attach]` table of `config.toml` |

Notes on the rows:

- `tmux ls -F '#{session_name}'` lists only names. In nomux, an unnamed Session has `"name":null`, and `jq -r` prints `null` for it. `// empty` leaves it out.
- `capture --lines 100000` prints all lines that the journal of the Session has. The journal keeps 32 MiB of output at most for one Session.
- `Ctrl-a` and `Ctrl-\` are the default prefix keys, and both work at the same time. [Sessions](/docs/guides/sessions/#prefix-keys) shows how to change them.
- For the habit of tmux, `attach-session`, `new-session`, `list-sessions`, `kill-session` and `rename-session` are aliases. The help does not show them, and their options are the options of nomux, not of tmux.

Different on purpose:

- The CLI of nomux has no windows, panes or key bindings: a Session is one terminal. A layout of Panes and Tabs belongs to the desktop client. It is in development, and nomux 0.5.0 has no desktop client: see the [roadmap](/docs/project/roadmap/).
- `-d` of `tmux new` means "start detached". `nomux new` never attaches without `-a` or `-A`, and `-d` of `nomux attach` means "detach the others", as in `tmux attach -d`.
- `nomux kill` has no `-a`. `tmux kill-session -a` ends each other Session, and `nomux kill --all` ends each Session, also the one that you use.
- A name is unique on the Host, as in tmux. An exact name wins over a longer name with the same start, and a start that more than one Session has is refused with the list of candidates.
- The Sessions continue after a restart of the Host as dormant Sessions. `nomux ls` shows them, and `attach` or `start` starts them again: [After a restart](/docs/guides/after-a-restart/).

## From screen

| You type in screen | In nomux |
|---|---|
| `screen -S api` | `nomux new -n api -a` |
| `screen -dmS api cmd` | `nomux new -n api -- cmd` |
| `screen -ls` | `nomux ls` |
| `screen -r api` | `nomux attach api`. `-r` of `nomux attach` means read-only |
| `screen -r` | `nomux attach`, or `nomux` on a terminal |
| `screen -d -r api` | `nomux attach -d api` |
| `screen -x api` | `nomux attach api`. More than one terminal can attach to one Session |
| `screen -dRR api` | `nomux new -A -n api` |
| `screen -d api` | `nomux detach api` |
| `screen -S api -X sessionname web` | `nomux rename api web` |
| `screen -S api -X quit` | `nomux kill api` |
| `screen -S api -X stuff 'ls\r'` | `nomux send api 'ls'` |
| `screen -S api -X stuff $'\003'` | `nomux send -k api C-c` |
| `screen -L -Logfile f` | `nomux capture -f api >> f`. The daemon keeps the output anyway |
| `screen -S api -X hardcopy -h f` | `nomux capture --lines 100000 api > f` |
| `screen -wipe` | Not necessary. The daemon removes an ended Session after 24 hours (`sessions.ended_retention`), and `nomux kill` removes a dormant Session |
| `C-a d` | `Ctrl-a d`. `Ctrl-\ d` works too |
| `C-a a` (send `C-a`) | `Ctrl-a a` or `Ctrl-a Ctrl-a` |

Notes on the rows:

- `screen -dRR api` attaches to the Session `api`, and starts it if it does not exist. `nomux new -A -n api` does the same. If the Session exists, nomux keeps its command and its directory.
- `sessions.ended_retention` in the `[sessions]` table of `config.toml` sets the retention time of an ended Session. The default is `24h`. With `"5s"`, an ended Session left `nomux ls --all` after the daemon restarted and 5 seconds passed. The [install page](/docs/guides/install/) lists the path of the file.

Different on purpose:

- A name is unique on the Host. screen permits two sessions with one name.
- An exact name always wins over a longer name with the same start. In screen, `-S build` is ambiguous when `build` and `builder` exist.
- nomux has a small configuration file, `config.toml`, for the restore policy, the retention time, the holder pool, the memory limits and the prefix keys. It has no key bindings and no `.screenrc` of commands.
