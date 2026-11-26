---
title: Environment of a Session
description: Which environment variables the command of a Session gets, which ones nomux sets and removes, why the environment of your terminal does not pass, and how to give a Session a language.
---

The command of a Session gets the environment of the daemon, with a few changes that nomux makes. The holder makes them.
This matters when a service manager starts the daemon: launchd gives a job `PATH=/usr/bin:/bin:/usr/sbin:/sbin` and no `TERM` and no `LANG`, and a systemd user service has no `TERM`.

The output on this page is the real output of nomux 0.4.0 on Linux. The home directory of the run is the temporary directory `/tmp/nomux-demo`.

## What the command gets

| Source | Variables |
|---|---|
| The daemon | Each variable of the environment of the daemon, except the ones in the next rows. |
| nomux, always | `TERM=xterm-256color`, `COLORTERM=truecolor`, `NOMUX_SESSION_ID`, `NOMUX_SOCK` and `NOMUX_TOKEN`. A value of the daemon is replaced. |
| nomux, if the daemon has no locale | `LC_CTYPE=C.UTF-8` on Linux and `LC_CTYPE=UTF-8` on macOS: a character set of UTF-8. Only if `LC_ALL`, `LC_CTYPE` and `LANG` have no value. |
| Never passed | `COLUMNS`, `LINES`, `TERM_PROGRAM` and `TERM_PROGRAM_VERSION`. They describe the terminal of the program that started the daemon. |

The three variables of nomux:

| Variable | Value |
|---|---|
| `NOMUX_SESSION_ID` | The session identifier. |
| `NOMUX_SOCK` | The socket of the daemon. |
| `NOMUX_TOKEN` | A random token of 128 bits, new at each start of the holder. |

A program in the Session uses them to say which Session it is in, for example `nomux status set` ([Agent status](/docs/guides/agent-status/#report-a-status-from-your-own-program)) and `nomux hook` ([Agent adapters and hooks](/docs/guides/agent-adapters/)).
The token proves that a request comes from a process of the Session. The processes of the Session inherit it. A process of the same user outside the Session can read the environment of a process of the Session, thus the token is not a defence against it. No log, no journal and no file of nomux has the token. A restore gives the Session a new token.

## An example

Here the daemon started with a small environment, as a service manager gives it: `TERM=screen`, `COLUMNS=120`, `LINES=40` and `TERM_PROGRAM=demo`, and no locale. The shell variable `small` holds that environment. The command of the Session printed its environment. The value of the token is replaced with `<hidden>` in the command.

```console
$ small="env -i HOME=$HOME PATH=$HOME/.local/bin:/usr/bin:/bin TERM=screen COLUMNS=120 LINES=40 TERM_PROGRAM=demo"
$ $small nomux ls
no sessions
$ $small nomux new --cmd sh -c 'env | sort | sed "s/^NOMUX_TOKEN=.*/NOMUX_TOKEN=<hidden>/"; sleep 3600'
pxusdkeb
$ nomux capture pxusdkeb
COLORTERM=truecolor
HOME=/tmp/nomux-demo
LC_CTYPE=C.UTF-8
NOMUX_SESSION_ID=pxusdkeb
NOMUX_SOCK=/tmp/nomux-demo/.nomux/run/nomuxd.sock
NOMUX_TOKEN=<hidden>
PATH=/tmp/nomux-demo/.local/bin:/usr/bin:/bin
PWD=/tmp/nomux-demo/project
SHLVL=1
TERM=xterm-256color
_=/usr/bin/env
```

- `TERM=screen` of the daemon became `xterm-256color`.
- `COLUMNS`, `LINES` and `TERM_PROGRAM` are gone.
- The daemon had no locale, thus the Session got `LC_CTYPE=C.UTF-8`.

A daemon that has a locale keeps it. Here the daemon started with `LANG=tr_TR.UTF-8` and the same small environment:

```console
$ $small nomux new --cmd sh -c 'env | sort | grep -E "^(LANG|LC_|TERM|COLORTERM)"; sleep 3600'
2envbsrk
$ nomux capture 2envbsrk
COLORTERM=truecolor
LANG=tr_TR.UTF-8
TERM=xterm-256color
```

nomux adds no `LC_CTYPE` then. (In that run, `small` was `env -i HOME=$HOME PATH=$HOME/.local/bin:/usr/bin:/bin LANG=tr_TR.UTF-8`, and the daemon was new.)

## Why `TERM` is not the terminal of your client

The terminal of a Session is the terminal of nomux, which follows xterm. A Session has clients with different terminals at different times. So `TERM` is always `xterm-256color`, and `COLORTERM` is always `truecolor`.

## What does not pass from the client

The environment of the terminal that runs `nomux new` does not go to the Session. The control protocol has no field for it. If the daemon started from your terminal, it has the environment of that terminal at that time, and the Session gets it. The next client with another environment does not change it.

Thus a client with a different locale, or with variables like `SSH_AUTH_SOCK` or `DISPLAY`, does not give them to its Session. Issue [#75](https://github.com/nomux-sh/nomux/issues/75) is open for this gap.

## Give Sessions a language

A daemon of a service manager can have no locale. Then the C library uses the locale `C`, which has no characters outside ASCII. The fallback of nomux gives a UTF-8 character set. It does not give a language, a format of dates or a format of numbers.

To give each Session a language, give `LANG` to the service:

- Linux: `Environment=` in the unit that `nomux daemon install-service` wrote (`~/.config/systemd/user/nomuxd.service`), for example `Environment=LANG=en_US.UTF-8`.
- macOS: `EnvironmentVariables` in the launchd agent (`~/Library/LaunchAgents/sh.nomux.nomuxd.plist`).

The Linux and macOS lines come from the documents of nomux. They were not run for this page.

## Restore and the pool

- A restore starts the command again with the environment of the daemon at the time of the restore, with the same rules.
- A shell from the [holder pool](/docs/guides/holder-pool/) gets the same environment, because no part comes from the client.
- A Session on a remote Host has the environment of the daemon of that Host.
