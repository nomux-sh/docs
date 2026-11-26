---
title: Agent adapters and hooks
description: How an agent tool reports its status to nomux through an adapter extension and hooks, how to install the hooks with a diff first, and what nomux never does.
---

An agent tool knows what it does: which tool it runs, what it asks you, when a subagent starts. nomux learns this from the **hooks** of the tool.
A hook is a command that the tool runs at an event of its work. For nomux, the command is `nomux hook <tool> <event>`.
An **adapter** is an [extension](/docs/concepts/extensions/) that turns the hook events of one tool into an [agent status](/docs/guides/agent-status/).

The output on this page is the real output of nomux 0.4.0 on Linux. The home directory of the run is the temporary directory `/tmp/nomux-demo`.
The adapter in the examples is the [Claude Code adapter](/docs/guides/claude-code/). Its page says how to get it.

## The path of an event

```text
agent tool, in a Session
  runs the hook: nomux hook <tool> <event>      the data of the event is on its standard input
  nomuxd checks the token of the Session
  the adapter extension of the tool gets the event
  the adapter reports the status to nomuxd      source: adapter
  nomux status, nomux agent explain, nomux events
```

- `nomux hook` never blocks the tool and never breaks it: its exit code is always 0. Without a daemon, outside a Session, or if the daemon does not answer in 80 ms, it ends with no output.
- The token of the Session (`NOMUX_TOKEN`) proves that the event comes from a process of the Session. A wrong or missing token is refused.
- The adapter extension starts at the first event and stops when it is idle.
- The adapter is the first source of the status. A hook event is the most detailed report that a tool can give.

The daemon answers a hook at once. The answer is empty in nomux 0.4.0: nomux does not answer a question of the tool for you.

## Install the hooks

A tool reads its hooks from its settings file. `nomux hooks install` computes the change that the adapter needs. It writes nothing unless you add `--apply`.

The tool must have an adapter first. Without one, the command fails:

```console
$ nomux hooks status
no tool has an adapter or installed hooks
$ nomux hooks install claude
nomux: no extension is the adapter of the tool claude
```

The exit code is 2. After you install the adapter, the tool is on the list, and its hooks are missing:

```console
$ nomux ext install ./claude-adapter --grant-all
extension nomux.agent-claude 0.1.0 installed with the permissions: scope=hooks:read scope=agent:report
$ nomux hooks status
TOOL    ADAPTER             HOOKS
claude  nomux.agent-claude  missing in /tmp/nomux-demo/.claude/settings.json
```

Then ask for the change. The file of the example has two keys already, and the command prints a unified diff:

```console
$ nomux hooks install claude | head -24
--- /tmp/nomux-demo/.claude/settings.json
+++ /tmp/nomux-demo/.claude/settings.json
@@ -1,6 +1,265 @@
 {
   "model": "sonnet",
   "permissions": {
-    "allow": ["Bash(git status)"]
+    "allow": [
+      "Bash(git status)"
+    ]
+  },
+  "hooks": {
+    "SessionStart": [
+      {
+        "hooks": [
+          {
+            "type": "command",
+            "command": "nomux",
+            "args": [
+              "hook",
+              "claude",
+              "SessionStart"
+            ]
+          }
$ nomux hooks install claude | wc -l
270
```

The whole diff has 270 lines, one entry for each event of the tool. The command made no change to the file: `nomux hooks install claude >/dev/null` has the exit code 0 and the file is the same as before.

Read the diff before you apply it:

- nomux writes the file as JSON with two spaces of indent. The formatting of your file can change. In the example, the `allow` array has one line for each value now. The keys keep their order.
- A value that the file has already is not added again.
- The entry runs `nomux` with arguments, without a shell. It has no wrapper script, no timeout and no option for the tool.

When the diff is correct, add `--apply`:

```console
$ nomux hooks install claude --apply | tail -1
the hooks of claude are installed in /tmp/nomux-demo/.claude/settings.json
$ nomux hooks status
TOOL    ADAPTER             HOOKS
claude  nomux.agent-claude  installed in /tmp/nomux-demo/.claude/settings.json
$ nomux hooks install claude
the hooks of claude are installed in /tmp/nomux-demo/.claude/settings.json: nothing to change
```

`--apply` writes the file through a temporary file in the same directory. A symbolic link stays a link.
It also keeps a record in `~/.local/share/nomux/hooks/claude/` (on macOS: `~/Library/Application Support/nomux/hooks/claude/`): the bytes of the file before the install, and the entries.

The hooks status of a tool is `installed`, `missing` or `different`. `nomux hooks install` for an installed tool changes nothing.

## Remove the hooks

`nomux hooks uninstall <tool>` works the same way: it prints the diff, and it writes only with `--apply`.

```console
$ nomux hooks uninstall claude --apply | tail -1
/tmp/nomux-demo/.claude/settings.json has its content from before the install again
$ cmp ~/.claude/settings.json settings.orig && echo same
same
```

`settings.orig` is a copy of the file that was made before the install. The two files have the same bytes.

- If the file did not change after the install, it gets the bytes from before the install again. If it did not exist, nomux removes it.
- If you changed the file after the install, only the entries of nomux go away and your change stays. nomux says it: `changed after the install: only the entries of nomux are removed`.
- Without a record, the command fails with exit code 2: `nomux did not install the hooks of claude`.

A known rough edge: after the second kind of removal, the file keeps an empty list for each event of the tool (`"SessionStart": []` and so on). The entries are gone, and you can delete the empty lists by hand.

## What nomux never does

- It never writes a settings file without `--apply`.
- It never wraps or replaces the command of the tool, and it never adds an option that skips the permission checks of the tool.
- It never answers a permission request, a question or a login for you. The answer of each hook is empty.
- It does not start the tool or change its permission mode.
- `nomux hook` never starts a daemon, a shell or another process.

## Limits

- `nomux hooks` works on the computer of the tool. `--host` is not permitted: the settings file is on that computer.
- Only JSON settings files work.
- A hook event waits in a queue of 256 events and 4 MiB. A full queue drops the new event. One adapter that hangs delays the events of the other adapters until its call times out.
- An adapter that has the scope `agent:report` can report for each Session of the Host. The token proves where a hook event comes from, not what an extension reports. Install only adapters that you trust. The permissions that the extension asks for are on [Extensions](/docs/guides/extensions/).
- nomux does not send the decision of an approval card back to the tool yet.

## Write an adapter

An adapter is an extension with an `[adapter]` table and two scopes. [Write an extension](/docs/guides/write-an-extension/) says how an extension starts. The methods and the host services of an adapter are in [`docs/adapters.md`](https://github.com/nomux-sh/nomux/blob/v0.4.0/docs/adapters.md) of the `nomux` repository, and the messages are in the `proto` repository.

```toml
[adapter]
tools = ["claude"]

[permissions]
scopes = ["hooks:read", "agent:report"]
```

The daemon gives the events of a tool to an installed and enabled extension that names the tool and has the approved scope `hooks:read`. If more than one extension names a tool, the one with the smallest identifier is the adapter.
