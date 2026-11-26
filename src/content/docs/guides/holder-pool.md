---
title: Holder pool
description: What the holder pool is, why a new Session opens fast, how a pooled shell gets the directory of its Session, the pool.size, pool.idle_time and pool.shell_start_files settings, and the limits of the pool.
---

A new Session must open in less than 10 ms. The start of a holder takes approximately 1 ms. The start of a shell with its start files takes from 2 ms to more than 200 ms.
Thus the daemon keeps a small number of holders ready, each with the shell of the user already started: the **holder pool**. A new Session with the shell takes one of them.

The output on this page is the real output of nomux 0.5.0 on Linux. The home directory of the runs is shown as `/home/user`. The shell of the runs is `bash` 5.3.

## What you see

Nothing runs before the first request of a client. After the first request, the daemon fills the pool. Each pooled holder has a directory with the suffix `.pool` in the runtime directory. The directory `pool` has the pool start files and one named pipe for each pooled holder:

```console
$ nomux ls
no sessions
$ ls ~/.nomux/run
3wn4mzd5.pool
g2oryjis.pool
nomuxd.lock
nomuxd.log
nomuxd.sock
pool
$ stat -c '%A %n' ~/.nomux/run/pool/*
prw------- ~/.nomux/run/pool/3wn4mzd5.directory
-rw------- ~/.nomux/run/pool/bashrc
prw------- ~/.nomux/run/pool/g2oryjis.directory
drwx------ ~/.nomux/run/pool/zsh
```

- A pooled holder is not a Session. `nomux ls` does not list it, and `nomux daemon status` does not count it.
- It has no state directory and no journal.
- The standard input of a pooled holder is a pipe from the daemon. When the daemon ends, also after `kill -9`, each pooled holder ends with its shell. A holder that has its Session continues, as each Session holder does.
- A new daemon does not take the pooled holders of an earlier daemon. They end by themselves, and the new daemon starts its own pool at its first request. It removes the directory `pool` of the earlier daemon.

`nomux new` without a command takes the oldest pooled holder, and the daemon starts the next one after it answered. The Session `3wn4mzd5` came from the pool. After the take, the pool has a new `.pool` directory, and the holder of the Session has the directory of its Session identifier:

```console
$ nomux new --cwd ~/project
3wn4mzd5
$ ls ~/.nomux/run
3wn4mzd5
c3ktwchc.pool
g2oryjis.pool
nomuxd.lock
nomuxd.log
nomuxd.sock
pool
```

## How a pooled shell gets its directory

A pooled shell starts in the home directory, before its Session exists. The Session can have another working directory. Nothing is typed into the terminal to change it. The screen of the Session and its journal show only the prompt, and `pwd` shows the directory of the Session:

```console
$ nomux capture 3wn4mzd5 | cat -v
^[[?2004hbash-5.3$ 
$ nomux send 3wn4mzd5 pwd
$ nomux capture 3wn4mzd5 --lines 2 | cat -v
^[[?2004l^M/home/user/project^M
^[[?2004hbash-5.3$ 
```

For `bash`, `zsh` and `fish`, the daemon starts the pooled shell with a **pool start file**. The shell runs your start files while it waits in the pool. Then the pool start file reads the directory of the Session from a named pipe of the holder, before the first prompt, and changes to it. The read waits until a Session takes the holder.

- The pool start files are in the directory `pool` of the runtime directory, which only you can open. Their content is fixed: they have no path and no data of the user.
- The directory comes through the named pipe as data, thus each path works, also a path with a quote, a `$`, a newline or a `-` at the start.
- `bash` starts with `--rcfile`. The file reads `~/.bashrc`, as `bash` does without the option, and then changes the directory.
- `zsh` starts with `ZDOTDIR` set to the directory `pool/zsh`. Its `.zshenv` gives `ZDOTDIR` its own value back, reads your `.zshenv`, and puts a `precmd` function first in `precmd_functions`. The function changes the directory with `cd -q` before the first prompt and then removes itself.

In nomux 0.4.0, the daemon typed a `cd` line into the shell instead, and the line was on the screen and in the journal. nomux 0.5.0 does not.

**What was run:** only `bash`. The computer of the runs has no `zsh` and no `fish`, so their start files were not run. Their description comes from the [documents of nomux](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/daemon.md#holder-pool).

## The settings

The daemon reads the configuration file one time, at its start. A change applies after the next start of the daemon. The file is `~/.config/nomux/config.toml` on Linux and `~/Library/Application Support/nomux/config.toml` on macOS. `nomux daemon status` prints the path.

```toml
[pool]
size = 2                  # 0 to 8; 0 turns the pool off
idle_time = "10m"         # a number with the unit s, m, h or d
shell_start_files = true  # false: the pool takes only Sessions in the home directory
```

| Key | Default | Function |
|---|---|---|
| `pool.size` | `2` | The number of holders that the daemon keeps ready. |
| `pool.idle_time` | `10m` | How long the pool stays when no Session starts. Then the pool empties, and the next new Session fills it again. |
| `pool.shell_start_files` | `true` | A pooled `bash`, `zsh` or `fish` starts with the pool start file. With `false`, the pool takes only Sessions in the home directory. |

With `size = 0`, the daemon starts no pooled holder, and the directory `pool` does not exist:

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

With `idle_time = "30s"`, the pool empties after 30 seconds without a new Session. The directory `pool` stays:

```console
$ cat ~/.config/nomux/config.toml
[pool]
size = 2
idle_time = "30s"
$ nomux ls
no sessions
$ ls ~/.nomux/run
dfjk2ur7.pool
nomuxd.lock
nomuxd.log
nomuxd.sock
pool
tmo5n2cg.pool
```

After 33 seconds without a new Session, `ls ~/.nomux/run` showed `nomuxd.lock`, `nomuxd.log`, `nomuxd.sock` and `pool`. The daemon does not poll: one timer for the end of the idle time wakes the task of the pool.

A pooled shell uses memory: approximately 1 MB for the holder with the static build, and the memory of the shell. The default of 2 gives a ready holder to two Sessions that start one after the other. A larger number uses memory that most Hosts do not need.
A file that is not valid does not stop the daemon: it writes the problem to its log and uses the defaults.

With `shell_start_files = false`, the pool has no pool start file. A Session in the home directory takes a pooled holder, and a Session in another directory gets a new holder. Here the first `nomux new` had `--cwd ~/project`, the second had no directory. The pool did not lose a holder at the first one, and `kejednu6` came from the pool at the second:

```console
$ nomux new --cwd ~/project
sg7bs2pw
$ ls ~/.nomux/run
iejfzqu2.pool
kejednu6.pool
nomuxd.lock
nomuxd.log
nomuxd.sock
sg7bs2pw
$ nomux new
kejednu6
$ ls ~/.nomux/run
4zi2v353.pool
iejfzqu2.pool
kejednu6
nomuxd.lock
nomuxd.log
nomuxd.sock
sg7bs2pw
```

## Limits

- **The start files of your shell ran in the home directory.** They run while the shell waits in the pool, before a Session takes it. A start file that reads the working directory reads the home directory. Here `~/.bashrc` appended `$PWD` to a file. With the pool, the file got three lines with the home directory, from the two pooled shells and the shell that the daemon started after the take. With `pool.size = 0`, a Session in `~/project` gave one line:

  ```console
  $ cat ~/start-dirs.log
  /home/user
  /home/user
  /home/user
  ```

  ```console
  $ cat ~/start-dirs.log
  /home/user/project
  ```

  The first listing is from the run of the pool, the second from a run with `size = 0`. A Session in the home directory, and a Session from a new holder, do not have this difference.
- **Only `bash`, `zsh` and `fish` get the directory of a Session that is not the home directory.** For another shell, the pool takes only Sessions in the home directory, and a Session in another directory gets a new holder. The same applies with `shell_start_files = false`. In a run with `SHELL=/bin/sh`, `nomux new --cwd ~/project` left the two pooled holders in the pool and started a new one (`brz64p2p`), and `nomux new` took a pooled holder (`h4amg2cj`):

  ```console
  $ nomux new --cwd ~/project
  brz64p2p
  $ ls ~/.nomux/run
  brz64p2p
  etpu45w5.pool
  h4amg2cj.pool
  nomuxd.lock
  nomuxd.log
  nomuxd.sock
  $ nomux new
  h4amg2cj
  ```
- **`zsh` can lose the function of nomux.** A start file of yours that gives `precmd_functions` a new value, and does not add to it, removes the function: the shell then stays in the home directory. A system start file that sets `ZDOTDIR` has the same result, because `zsh` then does not read `pool/zsh/.zshenv`. This comes from the documents of nomux. It was not run.
- **A Session with a command gets a new holder.** A pooled holder can only give its shell. `nomux new -- <command>` always starts a new holder.
- **With `sessions.memory_limit`, the pool is off.** A pooled shell starts before its Session, thus without the limit. In a run with `memory_limit = "2G"`, `~/.nomux/run` had no `.pool` directory and no `pool` directory after the first request. [Hibernation and the memory limit](/docs/guides/hibernation/#the-memory-limit) has the limit.
- **The pool has a holder when the holder is ready, not when its shell completed its start files.** A Session that takes the holder in that time shows its prompt later: the shell completes its start files, then reads the directory.
- **A pooled shell has the [environment of a Session](/docs/guides/session-environment/).** It does not have the environment of the client that asks. [Issue #75](https://github.com/nomux-sh/nomux/issues/75) is about that gap for each Session, not only for the pool.
