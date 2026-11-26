---
title: "Sessions: names, targets and attach"
description: Give a Session a name, find a Session with a target, start and attach in one command, attach without a target, and use or change the prefix keys of an attach.
---

A Session has a session identifier that the daemon gives and that never changes. It can also have a session name that you give and can change.
This page shows the names, the way a command finds a Session (the target), the short ways to start and attach, and the prefix keys of an attach.

The output on this page is the real output of nomux 0.5.0 on Linux. Your session identifiers and process IDs are different.
The [quick start](/docs/guides/quick-start/) shows the first steps. The [CLI reference](/docs/reference/cli/) has each option.

## Names

`nomux new -n <name>` gives the Session a name. `nomux ls` then has the column `NAME`, with `-` for a Session without a name:

```console
$ nomux new -n api -- sleep 600
y747cduz
$ nomux new -n api-v2 -- sleep 600
y2mq6b3w
$ nomux new -- sleep 600
dct67ccd
$ nomux ls
ID        NAME    STATE    PID      COMMAND
dct67ccd  -       running  4056052  sleep 600
y2mq6b3w  api-v2  running  4056049  sleep 600
y747cduz  api     running  4056043  sleep 600
```

The rules of a name:

- A name has 1 to 64 characters from `A-Z`, `a-z`, `0-9`, `.`, `_` and `-`. The first character is a letter or a digit. Names are case-sensitive: `api` and `API` are two names.
- A name is unique on the Host among the Sessions that are not ended.
- A name is not the session identifier of a different Session.
- A dormant Session keeps its name, also after a restart of the Host. An ended Session keeps its name in `nomux ls --all`, and a new Session can take that name at once.

A name that is not valid, or that a Session already has, gives the exit code 1 and starts no Session. The message of a name in use says how to attach to that Session:

```console
$ nomux new -n api -- sleep 600
nomux: the name api is in use by session y747cduz. Run `nomux new -A -n api` to attach to it, or give a different name
$ nomux new -n "my api" -- sleep 600
nomux: the session name "my api" is not valid: a name has 1 to 64 characters from A-Z, a-z, 0-9, '.', '_' and '-', and starts with a letter or a digit
```

`nomux rename <target> <new-name>` gives a Session a different name. The same name as now succeeds and changes nothing. The name of a different Session gives the exit code 1:

```console
$ nomux rename api-v2 web
session y2mq6b3w is now named web
$ nomux rename web api
nomux: the name api is in use by session y747cduz
```

An ended Session cannot get a new name: the exit code is 2.

## Targets

Each command that takes a Session takes a **target**. A target is the session identifier, the session name, or the start of one of the two. The command tries these steps in this sequence. The first step that finds a Session wins:

| Step | The target is | Sessions that the step searches |
|---|---|---|
| 1 | The session identifier | Each Session, also an ended Session |
| 2 | The session name | The Sessions that are not ended |
| 3 | The start of the session identifier or of the session name of exactly one Session | The Sessions that are not ended |

Thus an exact name wins over a longer name with the same start. With the two Sessions above, `api` is the first Session, and not a start of `api-v2`.

If step 3 finds more than one Session, the command does nothing. It prints the candidates and ends with the exit code 1:

```console
$ nomux capture ap
nomux: ap can be more than one session. Give more of the identifier or of the name of one of them:
  y2mq6b3w  api-v2  sleep 600
  y747cduz  api     sleep 600
```

With `--json`, the error document has the field `candidates`, a list with the identifier, the name and the state of each candidate:

```console
$ nomux --json capture ap
{"schema_version":1,"error":{"code":1,"kind":"error","message":"ap can be more than one session. Give more of the identifier or of the name of one of them:\n  y2mq6b3w  api-v2  sleep 600\n  y747cduz  api     sleep 600","candidates":[{"id":"y2mq6b3w","name":"api-v2","state":"running"},{"id":"y747cduz","name":"api","state":"running"}]}}
```

If no step finds a Session, the exit code is 2:

```console
$ nomux capture zzz
nomux: no session has the identifier or the name zzz, and no session has a name or an identifier that starts with it
```

`-t <target>` does the same as the argument, for the habit of tmux: `nomux attach -t api`. The help does not show it.
A script should use the exact name or the identifier, not the start of a name: a new Session can make a start ambiguous. [Scripting Sessions](/docs/guides/scripting-sessions/) has more.

## Start and attach in one command

`nomux new -a` (`--attach`) starts the Session and attaches your terminal to it. With a name:

```console
$ nomux new -n work -a -- sh
sh-5.3$ echo hi
hi
sh-5.3$
detached from session work (rwxrhrjw)
```

`nomux new -A -n <name>` (`--attach-or-create`) attaches to the Session that has the name, or starts it and attaches. It needs `-n`, and it cannot be used with `-a`.
If the Session exists, the command and `--cwd` are not used, and one line on the standard error says so:

```console
$ nomux new -A -n work -- sleep 5
nomux: session work exists: the command and --cwd are not used
sh-5.3$ echo hi
hi
sh-5.3$ echo again
again
sh-5.3$
detached from session work (rwxrhrjw)
```

The daemon decides in one step. Thus two `nomux new -A -n race` at the same time start one Session, and both commands attach to it.
If the Session is dormant, `-A` starts its command again, as `attach` does: [After a restart](/docs/guides/after-a-restart/) says more.

Both options need a terminal on the standard input. Without one, the command fails with the exit code 1 and starts no Session.

## Attach

`nomux attach <target>` shows a Session in your terminal until you detach or the Session ends. `nomux a` is the short form.

Without a target, `nomux attach` takes the Session that a client attached to last. If no client attached yet, it takes the Session that started last. The daemon keeps the time of the last attach in its memory, thus after a restart of the daemon the Session that started last wins.

```console
$ nomux ls
ID        NAME   STATE    PID      COMMAND
fcmnpcb5  older  running  4061960  sh
tmrd3rsm  newer  running  4061968  sh
$ nomux attach
detached from session newer (tmrd3rsm)
$ nomux a older
detached from session older (fcmnpcb5)
$ nomux attach
detached from session older (fcmnpcb5)
```

The first `attach` has no earlier attach to use, thus it takes `newer`, the Session that started last. After `nomux a older`, `older` is the Session of the last attach.

Bare `nomux`, without a command, does the same on a terminal: it attaches to the Session of `nomux attach`. If the Host has no Session, it starts a Session with your shell and attaches to it.
Without a terminal on the standard input and the standard output, bare `nomux` prints the help on the standard error and ends with the exit code 1.

Two options change what an attach does to the other clients of the Session:

- `-d` (`--detach-others`) detaches the other clients of the Session first, as `nomux detach` does. The other terminals show `detached from session <session>`.
- `-r` (`--read-only`) shows the Session and sends no key and no window size to it. The Session keeps its size. The prefix keys still work, thus `Ctrl-a d` detaches.

A read-only attach shows the output of the Session, also what another client or `nomux send` types. What you type in it goes nowhere.

## Prefix keys

In an attach, each key goes to the Session. A **prefix key** is the exception: it comes before each key that nomux takes for itself. The default prefix keys are `Ctrl-a`, the key of GNU screen, and `Ctrl-\`, the key of nomux 0.4.0. Both are active at the same time.

| Keys | What happens |
|---|---|
| A prefix key and then `d` | Detach. The Session continues |
| A prefix key and then `Ctrl-d` | The same, for a user who still holds `Ctrl` |
| A prefix key two times | The Session gets one prefix key |
| `Ctrl-a` and then `a` | The Session gets one `Ctrl-a`, as in screen. With another prefix of `Ctrl` and a letter, that letter does the same |
| A prefix key and then `?` | The title of the terminal window shows the keys until the next key. The screen does not change |
| A prefix key and then a different key | The Session gets the two keys |

A test Session that prints what it gets (`cat -v`) showed the effect of these keys. It got `^A` for `Ctrl-a Ctrl-a` and for `Ctrl-a a`, `^Ax` for `Ctrl-a x`, `^\` for `Ctrl-\ Ctrl-\`, and `^A^\` for `Ctrl-a Ctrl-\`.

`Ctrl-a ?` sets this window title with the default keys. `keys` is the name of the Session in that run:

```text
nomux keys: C-a d: detach, C-a C-a or C-a a: send C-a; C-\ d: detach, C-\ C-\: send C-\
```

A prefix key waits for the next key. Thus a lone `Ctrl-a` (the start of the line in a shell) arrives after the next key. `Ctrl-a` and then a key that is not in the table, for example `Ctrl-a Ctrl-k`, works as without the prefix: the Session gets both keys.

`nomux attach --help` has the same list.

### Change the prefix keys

The first of these that is set gives the prefix keys:

1. The option `--prefix <key>` of `nomux attach` and of `nomux new -a`. Give it two times for two keys.
2. The environment variable `NOMUX_PREFIX`. Put a comma between two keys: `C-a,C-\`.
3. `prefix` in the `[attach]` table of the configuration file.
4. The default: `Ctrl-a` and `Ctrl-\`.

```console
$ nomux attach --prefix C-b api
$ NOMUX_PREFIX=C-b nomux attach api
```

The configuration file of the computer that runs the CLI has the setting. Its path is `~/.config/nomux/config.toml` on Linux and `~/Library/Application Support/nomux/config.toml` on macOS. If `XDG_CONFIG_HOME` is an absolute path, it is `$XDG_CONFIG_HOME/nomux/config.toml`. The [install page](/docs/guides/install/) lists the file with the other files of nomux.

```toml
[attach]
prefix = ["C-b"]
```

`prefix = "C-b"` works too. With `C-b` as the prefix, the help says `C-b d: detach, C-b C-b or C-b b: send C-b`. A remote Host does not change the setting: the CLI reads the keys on your computer. The daemon does not read the `[attach]` table.

A key has the form `C-<x>`, where `x` is a letter, `\`, `]`, `^`, `_`, `@` or `Space`. A list has two different keys at most.
Some keys cannot be a prefix, because programs need them. A key that has another form is not valid:

```console
$ nomux attach --prefix C-c api
nomux: --prefix: the prefix key C-c cannot be used: programs need it (interrupt, end of input, backspace, tab, new line, Enter, flow control or suspend)
$ nomux attach --prefix 'C-[' api
nomux: --prefix: the prefix key "C-[" is not valid: give C-<x>, where x is a letter, \, ], ^, _, @ or Space, or give none
$ nomux attach --prefix C-a --prefix C-a api
nomux: --prefix: the prefix key C-a is two times in the list
```

The keys `C-c`, `C-d`, `C-h`, `C-i`, `C-j`, `C-m`, `C-q`, `C-s` and `C-z` give the first message. `C-[` and a form such as `c-a` or `x` give the second message. Each of these ends with the exit code 1.
A key that is not valid in `NOMUX_PREFIX` gives the same error with `NOMUX_PREFIX` in place of `--prefix`.
In the configuration file, the CLI refuses the file and names it:

```console
$ nomux attach api
nomux: the configuration file /home/user/.config/nomux/config.toml is not valid: the key `attach.prefix` the prefix key C-c cannot be used: programs need it (interrupt, end of input, backspace, tab, new line, Enter, flow control or suspend)
```

`nomux new -a` with a prefix that is not valid starts no Session.

### No prefix

`none` turns the prefix off: `--prefix none`, `NOMUX_PREFIX=none`, `prefix = "none"` or `prefix = []`. Then each key goes to the Session, also `Ctrl-a` and `Ctrl-\`, and no key detaches.
Detach with `nomux detach <target>` from another terminal, or close the terminal.

### A Session in a Session

If you run `nomux attach` inside a Session, the outer client takes the prefix first. With the default keys, `Ctrl-a a d` sends one `Ctrl-a` to the inner client and then `d`, thus it detaches the inner client:

```console
sh-5.3$ nomux attach inner
inner> echo in-inner
in-inner
inner>
detached from session inner (23lx2g57)
sh-5.3$
```

Or start the inner client with another prefix: `nomux attach --prefix C-b inner`. Then `Ctrl-b d` detaches the inner client, and `Ctrl-a d` detaches the outer client.

A terminal can send keys in the form of the kitty keyboard protocol, and the CLI finds the prefix keys in that form too. This page did not run that case: the [CLI document of the release](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/cli.md) has the rule.

## How an attach ends

| Event | Message | Exit code |
|---|---|---|
| You detach, `nomux detach` detaches the client, or the terminal closes | `detached from session <session>` | 0 |
| The command of the Session ends | `session <session> ended with exit status <n>` | `<n>` |
| A signal ends the command | `session <session> ended by signal <n>` | 128 + `<n>` |
| The daemon stops | An error that says that the Session continues and how to attach again | 1 |
| No Session matches, or the command ended before the attach | An error | 2 |

`<session>` is the name with the identifier, `api (m4ab5ghi)`, or only the identifier of a Session without a name.
With `--json`, an attach prints one document after it ended: [Scripting Sessions](/docs/guides/scripting-sessions/#json-and-exit-codes) shows the fields.

## Next steps

- [Scripting Sessions](/docs/guides/scripting-sessions/): `send`, `capture -f` and `kill --all`.
- [Coming from tmux and screen](/docs/guides/coming-from-tmux-and-screen/): the commands and keys that you know.
- [After a restart](/docs/guides/after-a-restart/): dormant Sessions keep their names.
