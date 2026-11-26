---
title: Scripting Sessions
description: Type into a Session with nomux send, follow its output with capture -f, end many Sessions with kill --all, and use the JSON output, the exit codes and the targets in a script.
---

Each command of nomux works without a terminal, but `attach` and the options `-a` and `-A` of `new`. Thus a script can start a Session, type into it, read its output and end it.
This page shows `send`, `capture -f` and `kill --all`, and what a script needs from the JSON output, the exit codes and the targets.

The output on this page is the real output of nomux 0.5.0 on Linux. Your session identifiers and process IDs are different.
The [quick start](/docs/guides/quick-start/) has the first steps, and [Sessions](/docs/guides/sessions/) has the names and the targets.

## Type into a Session: `send`

`nomux send <target> <text>...` types the text into the terminal of a Session and then presses Enter, as if you typed it.
This Session reads lines and prints each one with a prefix:

```console
$ nomux new -n reader -- sh -c 'while read line; do echo "got: $line"; done'
libqhkc6
$ nomux send reader hello world
$ nomux capture reader --lines 2
hello world
got: hello world
```

The first `hello world` is the echo of the terminal, and the second line is the answer of the program. The output of `send` is empty and its exit code is 0.

Remember these rules:

- `send` joins the words of the text with one space between them. A word that has a space inside keeps it: `nomux send reader 'a   b'` sends three spaces.
- Each word after the target is text, also a word that looks like an option. `nomux send reader --json` types `--json`. Put `--json` and `--quiet` before the target.
- The bytes go in one request, thus they stay together.
- `send` writes at once. It does not wait until the program is ready, and it does not read the answer. Use `capture` to read the answer.
- A text with a line break gives the exit code 1 and sends nothing. Send one line at a time.

```console
$ nomux send reader "two
lines"
nomux: the text has a line break: send one line at a time, or each key with -k
```

### Text without Enter

`--no-enter` sends the text and no Enter. Use it for a draft that you finish later, or for a prompt that needs a key in place of a line:

```console
$ nomux send --no-enter reader draft
$ nomux send -k reader Enter
$ nomux capture reader --lines 2
draft
got: draft
```

### Keys: `-k`

`-k` (`--keys`) makes each word a key name, and `send` adds no Enter. The names are the names of tmux:

- `Enter`, `Escape`, `Tab`, `S-Tab`, `Space`, `BSpace`
- `Up`, `Down`, `Left`, `Right`, `Home`, `End`, `PgUp`, `PgDn`
- `F1` to `F12`
- `C-<letter>` for a key with `Ctrl`, and `M-<character>` for a key with `Alt`

A test Session that prints the bytes that it gets showed what a few of them send: `Up` is `ESC [ A`, `F1` is `ESC O P`, `F12` is `ESC [ 24 ~`, `C-a` is the byte 1, and `M-x` is `ESC x`. A cursor key has the sequence of the normal cursor mode.

A name that `send` does not know gives the exit code 1 and sends nothing, also when the other names are right:

```console
$ nomux send -k reader Foo
nomux: "Foo" is not a key name: give Enter, Escape, Tab, S-Tab, Space, BSpace, Up, Down, Left, Right, Home, End, PgUp, PgDn, F1 to F12, C-<letter> or M-<character>
```

`C-c` interrupts the program of the Session, as it does on a terminal. Here it ends the loop, and the shell of the loop ends with it:

```console
$ nomux send -k reader C-c
$ nomux ls --all
ID        NAME    STATE  PID  COMMAND                                            NOTE
libqhkc6  reader  ended  -    sh -c while read line; do echo "got: $line"; done  signal 2
```

### Which Sessions accept `send`

| Session | Result |
|---|---|
| Running | The text goes to the terminal |
| Dormant | The exit code is 1, and the message says `nomux start <identifier>`. `send` does not start a Session |
| Ended, by identifier | The exit code is 2: `session <identifier> ended: its command does not run` |
| Ended, by name | The exit code is 2, because a name finds only Sessions that are not ended |

## Read the output while it comes: `capture -f`

`nomux capture <target>` prints the last 100 lines of a Session. `nomux capture -f <target>` (`--follow`) prints those lines, and then each byte that the command writes, until the Session ends.
The command attaches as a read-only client: it sends no input and no window size, and it gets each byte one time.

The output goes to a file in this example. The command ends with the exit code 0 when the Session ends:

```console
$ nomux new -n build -- sh -c 'for i in 1 2 3; do echo "step $i"; sleep 1; done'
xxzazneq
$ nomux capture -f build > build.log
$ cat build.log
step 1
step 2
step 3
```

Thus `nomux capture -f api >> api.log` keeps the output of a Session in a file.

The exit code is 0 in each of these cases: the Session ends, you send `SIGINT` or `SIGTERM` to the command, or the reader of the output closes it (`nomux capture -f api | head -2`).
`--lines <n>` sets the number of lines at the start.

This Session printed 300 lines and `done` after 3 seconds. The command stopped with `SIGINT` after 5 seconds:

```console
$ nomux new -n watch -- sh -c 'seq 1 300; sleep 3; echo done; sleep 600'
5th7pjdd
$ nomux capture -f watch > watch.log &
$ kill -INT $!
$ wc -l < watch.log
101
$ head -1 watch.log
201
$ tail -2 watch.log
300
done
```

The file has the last 100 lines from before the start (`201` to `300`) and the line `done` that came later.

Limits of `capture -f`:

- The output is the bytes as the command wrote them, with a carriage return before each line feed and the escape sequences of the command. A shell writes escape sequences for its prompt. Filter them in the script if you need clean text.
- `--json` does not work with it. The output is the bytes of the command, and the error says so (exit code 1).
- For an ended Session, use `capture` without `-f`. With `-f`, nomux 0.5.0 prints the last lines, and then prints `session <identifier> ended: its command does not run` and ends with the exit code 2. This is a known limit: the CLI document of the release says only that the command ends when the Session ends.

## Wait for an answer

`send` does not wait, thus a script reads the output until it sees what it needs. This script starts a Session that squares numbers, sends one number and waits for the answer:

```sh
#!/bin/sh
set -e
nomux new -n calc -- sh -c 'while read n; do echo "square: $((n * n))"; done' >/dev/null
nomux send calc 12
until nomux capture calc | grep -q 'square: 144'; do sleep 0.5; done
nomux capture calc --lines 1 | tr -d '\r'
nomux kill calc
```

```console
$ sh square.sh
square: 144
session calc (sygcspxb) ended
```

Two points about this script:

- The terminal of a Session echoes what you type, so the typed text is in the output too. The pattern must not be in the line that you send. Here `12` is typed and `square: 144` is the answer.
- A line of a terminal Session ends with a carriage return. `grep -q 'square: 144$'` does not match it. Remove the character with `tr -d '\r'` or leave the end of the pattern open. The output of a shell also has escape sequences at the start of a line, thus do not anchor the start of the pattern.

The journal of a Session is written one second after the output at the latest. A `capture` right after a `send` can print less than the program wrote: read again, as the script does.

## End many Sessions: `kill --all`

`nomux kill --all` ends each Session whose command runs, one after the other, and prints one line for each. This is the list of Sessions for the next examples:

```console
$ nomux ls
ID        NAME    STATE    PID      COMMAND
gg5n3iod  web     running  4080188  sleep 600
jzopbhue  worker  running  4080191  sleep 600
tefuuqvp  -       running  4080194  sleep 600
```

`--dry-run` prints the Sessions and ends none. With `--json`, the document is `would_kill`:

```console
$ nomux kill --all --dry-run
session web (gg5n3iod) would end
session worker (jzopbhue) would end
session tefuuqvp would end
$ nomux --json kill --all --dry-run
{"schema_version":1,"would_kill":["gg5n3iod","jzopbhue","tefuuqvp"]}
```

On a terminal, the command asks first, on the standard error. Only `y` or `yes` ends the Sessions. Each other answer, also an empty line, ends none, and the exit code is 1:

```console
$ nomux kill --all
nomux: end 3 sessions? [y/N] n
nomux: no session ended
```

Without a terminal, the command does not ask. It needs `--yes`: else the exit code is 1 and no Session ends.

```console
$ nomux kill --all < /dev/null
nomux: kill --all ends 3 sessions: without a terminal, give --yes
$ nomux kill --all --yes
session web (gg5n3iod) ended
session worker (jzopbhue) ended
session tefuuqvp ended
```

`--yes` also skips the question on a terminal. `--json` gives `killed_sessions`: `{"schema_version":1,"killed_sessions":["mwc2oqo3"]}`.

If no Session runs, the command prints `no session runs`, asks nothing and ends with the exit code 0. If one Session does not end, its error goes to the standard error, the other Sessions still end, and the exit code is the highest code of the failures.

### Dormant Sessions: `--include-dormant`

`kill --all` does not touch a dormant Session. After a restart of the Host, each Session is dormant, and the command must not remove their output. A dormant Session has no command to end. `nomux kill <target>` and `--include-dormant` remove it with its output.

```console
$ nomux ls
ID        NAME     STATE    PID      COMMAND
ayk4q27a  live     running  3968954  sleep 600
kifzbrhd  run      dormant  -        sleep 600
utdbl3b6  sleeper  dormant  -        sleep 600
$ nomux kill --all --yes
session live (ayk4q27a) ended
$ nomux ls
ID        NAME     STATE    PID  COMMAND
kifzbrhd  run      dormant  -    sleep 600
utdbl3b6  sleeper  dormant  -    sleep 600
$ nomux kill --all --yes --include-dormant
session run (kifzbrhd) ended
session sleeper (utdbl3b6) ended
$ nomux ls
no sessions
```

`--dry-run --include-dormant` lists the dormant Sessions too. `kill` has no `-a`: in tmux, `kill-session -a` ends each other Session. `nomux kill --all` ends each Session, and it cannot be used with a target.

## JSON and exit codes

Each command accepts `--json` and `--quiet`, but not together. Put them before the command or before `--`: each argument after `--` belongs to the command of the Session.

| Command | `--quiet` | `--json` |
|---|---|---|
| `new` | The session identifier | `{"schema_version":1,"session":{...}}` with `id`, `name`, `state`, `pid`, `command`, `cwd` and more |
| `ls` | One identifier on each line | `{"schema_version":1,"sessions":[...]}` with the same object for each Session, and its `project` |
| `send` | Nothing | `{"schema_version":1,"sent":{"id":"...","bytes":13}}`: the bytes that the Session got, with the Enter |
| `capture` | The output lines | `{"schema_version":1,"capture":{"id":"...","output":"..."}}` |
| `kill` | Nothing | `{"schema_version":1,"killed":"<identifier>"}` |
| `kill --all` | Nothing | `killed_sessions` or, with `--dry-run`, `would_kill` |
| `attach`, `new -a`, `new -A` | Nothing | One document after the attach ended, with `end`: `detached`, `exited`, `signaled`, `lost` or `unknown` |

```console
$ nomux new --json -n z -- sleep 5 | jq -r .session.id
dcybgmle
$ nomux --quiet ls
dcybgmle
rese27fe
wddj2dq4
$ nomux --json ls | jq -c '.sessions[] | {id, name, state}'
{"id":"dcybgmle","name":"z","state":"running"}
{"id":"rese27fe","name":"x","state":"running"}
{"id":"wddj2dq4","name":"y","state":"running"}
```

An unnamed Session has `"name":null`. With `jq -r`, `.name` prints `null` for it: add `// empty` to leave it out.

An error goes to the standard error as `nomux: <message>`, and the standard output stays empty. With `--json`, the error is one document on the standard error. The text of a message can change: a script must use the exit code, and `kind` and `candidates` in the JSON.

```console
$ nomux --json rename nosuch x
{"schema_version":1,"error":{"code":2,"kind":"not_found","message":"no session has the identifier or the name nosuch, and no session has a name or an identifier that starts with it"}}
$ nomux --json attach job < /dev/null
{"schema_version":1,"error":{"code":1,"kind":"error","message":"attach needs a terminal: the standard input is not a terminal"}}
```

| Code | `kind` | In the commands of this page |
|---:|---|---|
| 0 | | Success |
| 1 | `error` | A wrong command line, a name that is not valid or in use, a target that can be more than one Session, a text with a line break, a key name that is not known, `kill --all` without `--yes` and without a terminal, a dormant Session for `send` |
| 2 | `not_found` | No Session matches the target, or the command of the Session ended |
| 3 | `timeout` | An operation did not complete in the permitted time |
| 4 | `no_permission` | The user has no permission, for example for the socket of the daemon |
| 5 | `version_mismatch` | The CLI and the daemon have no common protocol version |

`attach` and `new -a` can end with the exit status of the command of the Session, thus a value from 1 to 5 can also come from the command. The [CLI reference](/docs/reference/cli/) has the full table.

## Targets in a script

A target is an identifier, a name or the start of one of them. In a script:

- Take the identifier from `nomux new --quiet`, or give a name that you choose, and use it in each next command. An identifier never changes, and an exact name never finds a different Session while the Session lives.
- Do not use the start of a name. A Session that starts later can make a start ambiguous, and then the command ends with the exit code 1 and the candidates. An exact name always wins over a longer name with the same start.
- A name finds only Sessions that are not ended. After the command of a Session ended, use its identifier: `nomux capture <identifier>` still prints its output for 24 hours.
- `nomux new -n <name>` fails with the exit code 1 if a Session has the name. `new -A` needs a terminal, so a script checks first:

```console
$ nomux ls --json | jq -e '.sessions[] | select(.name == "job")' > /dev/null || nomux new -n job -- sleep 600
33yct7jo
```

On the second run the `jq` command finds the Session, and `nomux new` does not run.

## Next steps

- [Sessions](/docs/guides/sessions/): names, targets and the keys of an attach.
- [Coming from tmux and screen](/docs/guides/coming-from-tmux-and-screen/): `send-keys`, `pipe-pane` and `kill-server` in nomux.
- [Remote hosts](/docs/guides/remote-hosts/): the same commands on a server with `--host`.
