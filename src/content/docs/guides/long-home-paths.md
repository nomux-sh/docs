---
title: Long home paths
description: Why a long home directory makes the nomux socket paths too long, how nomux opens the runtime directory through a short link in /tmp, and what to do if a path still does not fit.
---

A Unix socket has a path limit: 103 bytes on macOS and 107 bytes on Linux. nomux keeps its sockets in the runtime directory, `~/.nomux/run`. The longest socket path in that directory is the control socket of a pooled holder, `<runtime directory>/<session identifier>.pool/sock`. It is 19 bytes longer than the runtime directory.
Thus a home directory of more than 73 bytes makes a socket path too long for macOS. On macOS, a long home directory broke `nomux new` with an unclear error in earlier versions ([#65](https://github.com/nomux-sh/nomux/issues/65)). nomux handles it since 0.4.0.

The output on this page is the real output of nomux 0.5.0 on Linux. The home directory of the run is `/tmp/nomux-demo-with-a-long-home-directory-name-that-makes-the-socket-paths-too-long-xxx`, a directory of 88 bytes.

## The rule

If the longest socket path of `~/.nomux/run` has more than 103 bytes, nomux opens the runtime directory through the link `/tmp/nomux-<hash>`. `<hash>` is the FNV-1a hash of 64 bits of the path of the runtime directory, in 16 hexadecimal digits.
The rule uses the limit of macOS on each Host. Thus a client knows the socket of a remote Host from the home directory of that Host only.

```console
$ echo ${#HOME}
88
$ nomux new --cmd sh -c 'echo $NOMUX_SOCK; sleep 3600'
56xhwybn
$ nomux capture 56xhwybn
/tmp/nomux-c6c257ef50042a31/nomuxd.sock
$ readlink /tmp/nomux-c6c257ef50042a31
/tmp/nomux-demo-with-a-long-home-directory-name-that-makes-the-socket-paths-too-long-xxx/.nomux/run
```

The command of the Session has the short path in `NOMUX_SOCK` ([Environment of a Session](/docs/guides/session-environment/)).

- **The files stay in `~/.nomux/run`.** The link gives them a short path only. The socket, the lock, the log and the directories of the holders are in the runtime directory as before:

  ```console
  $ ls ~/.nomux/run
  56xhwybn
  ijbjuh23.pool
  nomuxd.lock
  nomuxd.log
  nomuxd.sock
  pool
  tc4im7y6.pool
  ```

- **The link is checked.** `/tmp` is open to each user. The daemon and the CLI make the link if it does not exist. A file at that path that is not a link of this user to the runtime directory is an error with the path, and nomux does not remove it.
- **A removed link comes back.** A cleanup of `/tmp` can remove the link. The daemon does not stop: the next client or daemon start makes the link again.

  ```console
  $ rm /tmp/nomux-c6c257ef50042a31; nomux ls
  ID        STATE    PID    COMMAND
  56xhwybn  running  12038  sh -c echo $NOMUX_SOCK; sleep 3600
  $ readlink /tmp/nomux-c6c257ef50042a31
  /tmp/nomux-demo-with-a-long-home-directory-name-that-makes-the-socket-paths-too-long-xxx/.nomux/run
  ```

A home directory of 73 bytes needs no link: in a run with such a directory, `NOMUX_SOCK` was a path below the home directory. With 74 bytes, it was a path below `/tmp/nomux-<hash>`.

## A path that does not fit

The link shortens the runtime directory only. A holder checks the path of its control socket before it binds it. A path that is too long, for example from a long `--runtime-directory` of `nomux-holder` or a long session identifier, fails with this message:

```text
the socket path <path> has <n> bytes, and the limit on this system is <limit> bytes
```

This message is from the documents of nomux. It was not run for this page.

## Known open issue

In one run with a home directory of 88 bytes, a holder ended with `SIGABRT` at the first `nomux new` ([issue #85](https://github.com/nomux-sh/nomux/issues/85)). It was seen one time and not reproduced. The runs of this page used a home directory of 88 bytes, and of 73 and 74 bytes, and did not see it. The cause is not known, and it is not known if the long path is the cause. If a `nomux new` fails at the first start with a long home directory, add your report to issue #85.

## Limits

- The link is in `/tmp`. A system where `/tmp` is not writable for the user cannot use a long home directory.
- The hash only names the link. It is not a secret. The runtime directory has the mode 0700, and the socket has the mode 0600: the daemon refuses a connection from another user.
