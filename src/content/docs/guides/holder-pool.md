---
title: Holder pool
description: What the holder pool is, why a new Session opens fast, the pool.size and pool.idle_time settings, and the known limit that a new Session shows a cd line.
---

A new Session must open in less than 10 ms. The start of a holder takes approximately 1 ms. The start of a shell with its start files takes from 2 ms to more than 200 ms.
Thus the daemon keeps a small number of holders ready, each with the shell of the user already started: the **holder pool**. A new Session with the shell takes one of them.

The output on this page is the real output of nomux 0.4.0 on Linux. The home directory of the run is the temporary directory `/tmp/nomux-demo`.

## What you see

Nothing runs before the first request of a client. After the first request, the daemon fills the pool. Each pooled holder has a directory with the suffix `.pool` in the runtime directory:

```console
$ nomux ls
no sessions
$ ls ~/.nomux/run
66hgjht7.pool
bkidecqo.pool
nomuxd.lock
nomuxd.log
nomuxd.sock
```

- A pooled holder is not a Session. `nomux ls` does not list it, and `nomux daemon status` does not count it.
- It has no state directory and no journal.
- The standard input of a pooled holder is a pipe from the daemon. When the daemon ends, also after `kill -9`, each pooled holder ends with its shell. A holder that has its Session continues, as each Session holder does.
- A new daemon does not take the pooled holders of an earlier daemon. They end by themselves, and the new daemon starts its own pool at its first request.

`nomux new` without a command takes the oldest pooled holder, and the daemon starts the next one after it answered. The Session `bkidecqo` came from the pool. After the take, the pool has a new `.pool` directory, and the holder of the Session has the directory of its Session identifier.

## The settings

The daemon reads the file `~/.config/nomux/config.toml` one time, at its start. A change applies after the next start of the daemon.

```toml
[pool]
size = 2          # 0 to 8; 0 turns the pool off
idle_time = "10m" # a number with the unit s, m, h or d
```

| Key | Default | Function |
|---|---|---|
| `pool.size` | `2` | The number of holders that the daemon keeps ready. |
| `pool.idle_time` | `10m` | How long the pool stays when no Session starts. Then the pool empties, and the next new Session fills it again. |

With `size = 0`, the daemon starts no pooled holder:

```console
$ cat ~/.config/nomux/config.toml
[pool]
size = 0
$ nomux ls
no sessions
$ ls ~/.nomux/run
nomuxd.lock
nomuxd.log
nomuxd.sock
```

With `idle_time = "30s"`, the pool empties after 30 seconds without a new Session:

```console
$ cat ~/.config/nomux/config.toml
[pool]
size = 2
idle_time = "30s"
$ nomux ls
no sessions
$ ls ~/.nomux/run
3a5fgpb3.pool
mitkj4pm.pool
nomuxd.lock
nomuxd.log
nomuxd.sock
```

After 33 seconds without a new Session, `ls ~/.nomux/run` showed only `nomuxd.lock`, `nomuxd.log` and `nomuxd.sock`. The daemon does not poll: one timer for the end of the idle time wakes the task of the pool.

A pooled shell uses memory: approximately 1 MB for the holder with the static build, and the memory of the shell. The default of 2 gives a ready holder to two Sessions that start one after the other. A larger number uses memory that most Hosts do not need.
A file that is not valid does not stop the daemon: it writes the problem to its log and uses the defaults.

## Known limit: the change of the directory is visible

The pooled shell starts in the home directory, before the Session exists. If the Session has another working directory, the daemon types the change of the directory into the shell. The line is on the screen of the Session and in its journal:

```console
$ nomux new --cwd ~/project
mvnfjcys
$ nomux capture mvnfjcys | cat -v
 cd '/tmp/nomux-demo/project'^M
^[[?2004l^M^[[?2004hbash-5.3$ 
```

A Session from a new holder does not show this line. With `pool.size = 0`, the same command shows only the prompt:

```console
$ nomux capture 4yxsgapc | cat -v
^[[?2004hbash-5.3$ 
```

Issue [#74](https://github.com/nomux-sh/nomux/issues/74) is open for this: a new Session from the pool should show only the prompt. Until it is closed, you can turn the pool off with `size = 0`, and a Session opens a little later.

The space before `cd` keeps the line out of the history of a shell that is configured for it (`ignorespace` of bash, `HIST_IGNORE_SPACE` of zsh, and the default of fish).

Other limits:

- The start files of the shell ran in the home directory. A start file that reads the working directory reads the home directory.
- The pool is off if the shell of the user is not `sh`, `bash`, `zsh`, `dash`, `ksh`, `mksh` or `fish`. A working directory with `'`, `\`, a control character or bytes that are not UTF-8 gets a new holder.
- A Session with a command (`nomux new -- <command>`) always gets a new holder. A pooled holder can only give its shell.
- The pool has a holder when the holder is ready, not when its shell completed its start files. A Session that takes the holder in that time shows its prompt later.
- A pooled shell has the [environment of a Session](/docs/guides/session-environment/). It does not have the environment of the client that asks. Issue [#75](https://github.com/nomux-sh/nomux/issues/75) is about that gap for each Session.
