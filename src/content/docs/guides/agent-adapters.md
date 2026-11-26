---
title: Agent adapters and hooks
description: How an agent tool reports its status to nomux through an adapter extension and hooks, how to install the hooks with a diff first without a change to the format of your settings file, and what nomux never does.
---

An agent tool knows what it does: which tool it runs, what it asks you, when a subagent starts. nomux learns this from the **hooks** of the tool.
A hook is a command that the tool runs at an event of its work. For nomux, the command is `nomux hook <tool> <event>`.
An **adapter** is an [extension](/docs/concepts/extensions/) that turns the hook events of one tool into an [agent status](/docs/guides/agent-status/).

The output on this page is the real output of nomux 0.5.0 on Linux. The home directory of the run is shown as `/home/user`.
The adapter in the examples is the [Claude Code adapter](/docs/guides/claude-code/). Its page says how to get it. Claude Code did not run for these examples: the settings files are small files that were made for this page.

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
- The token of the Session (`NOMUX_TOKEN`) proves that the event comes from a process of the Session. A wrong or missing token is refused. The command writes one line to the standard error and still has the exit code 0:

  ```text
  nomux hook: the hook event of session qqmi7lfg was refused: the token of the request is not the token of the session
  ```
- The adapter extension starts at the first event and stops when it is idle.
- The adapter is the first source of the status. A hook event is the most detailed report that a tool can give.

The daemon answers a hook at once. The answer is empty in nomux 0.5.0: nomux does not answer a question of the tool for you.

## Install the hooks

A tool reads its hooks from its settings file. `nomux hooks install` computes the change that the adapter needs. It writes nothing unless you add `--apply`.

The tool must have an adapter first. Without one, the command fails with the exit code 2:

```console
$ nomux hooks install codex
nomux: no extension is the adapter of the tool codex
```

After you install the adapter extension ([Claude Code adapter](/docs/guides/claude-code/#install-the-extension) shows how), the tool is on the list, and its hooks are missing:

```console
$ nomux hooks status
TOOL    ADAPTER             HOOKS
claude  nomux.agent-claude  missing in /home/user/.claude/settings.json
```

Then ask for the change. The file of the example has two keys, and its `allow` list is on one line:

```console
$ cat ~/.claude/settings.json
{
  "model": "sonnet",
  "permissions": {
    "allow": ["Bash(git status)"]
  }
}
$ nomux hooks install claude | head -24
--- /home/user/.claude/settings.json
+++ /home/user/.claude/settings.json
@@ -2,5 +2,262 @@
   "model": "sonnet",
   "permissions": {
     "allow": ["Bash(git status)"]
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
+        ]
+      }
+    ],
+    "UserPromptSubmit": [
```

The whole output has 266 lines: the diff adds 257 lines for 17 events of the tool and removes none. The last line says `dry run: nothing is written. Add --apply to write the change`. The command made no change to the file.

Read the diff before you apply it:

- The install keeps the format of your file: see [The format of your file stays](#the-format-of-your-file-stays). In the example, the `allow` list stays on one line.
- A value that the file has already is not added again.
- The entry runs `nomux` with arguments, without a shell. It has no wrapper script, no timeout and no option for the tool.

When the diff is correct, add `--apply`:

```console
$ nomux hooks install claude --apply | tail -1
the hooks of claude are installed in /home/user/.claude/settings.json
$ nomux hooks status
TOOL    ADAPTER             HOOKS
claude  nomux.agent-claude  installed in /home/user/.claude/settings.json
$ nomux hooks install claude
the hooks of claude are installed in /home/user/.claude/settings.json: nothing to change
```

`--apply` writes the file through a temporary file in the same directory. A symbolic link stays a link.
It also keeps a record in `~/.local/share/nomux/hooks/claude/` (on macOS: `~/Library/Application Support/nomux/hooks/claude/`): the bytes of the file before the install, the checksum of the written file and the entries.

The hooks status of a tool is `installed`, `missing` or `different`. `different` means that the file has some entries of the adapter, but not all. In this run, a file that had lost the entry of one event had the status `different`, and `nomux hooks install claude --apply` added the missing entry. `nomux hooks install` for an installed tool changes nothing.

### The format of your file stays

Since nomux 0.5.0, the install changes only the text that it adds. Each other byte of your file stays: the order of the keys, the indent, the spacing and the end of the file. A new entry gets the indent of your file, or it stays on one line in an object or a list that is on one line. These runs used the real command with four small files.

**Four spaces, an own hook, keys in your order.** The file had `theme`, `hooks` with one `PreToolUse` entry of the user, and `env`. nomux added its entry after the entry of the user, with four spaces for each level. The diff of the file had no removed line, and the keys `theme` and `env` kept their places:

```console
$ nomux hooks install claude | head -22
--- /home/user/.claude/settings.json
+++ /home/user/.claude/settings.json
@@ -5,6 +5,259 @@
             {
                 "matcher": "Bash",
                 "hooks": [{ "type": "command", "command": "/usr/local/bin/audit" }]
+            },
+            {
+                "hooks": [
+                    {
+                        "type": "command",
+                        "command": "nomux",
+                        "args": [
+                            "hook",
+                            "claude",
+                            "PreToolUse"
+                        ]
+                    }
+                ]
+            }
+        ],
+        "SessionStart": [
```

**Tabs and lists on one line.** The file had one tab for each level, an empty `SessionStart` list and a `Stop` list on one line. The new entries have tabs, and the entry for `Stop` stays on the line of the list:

```console
$ nomux hooks install claude | head -8
--- /home/user/.claude/settings.json
+++ /home/user/.claude/settings.json
@@ -1,7 +1,246 @@
 {
 	"model": "opus",
 	"hooks": {
-		"SessionStart": [],
-		"Stop": [{"hooks": [{"type": "command", "command": "echo done"}]}]
$ nomux hooks install claude | grep Stop
-		"Stop": [{"hooks": [{"type": "command", "command": "echo done"}]}]
+		"Stop": [{"hooks": [{"type": "command", "command": "echo done"}]}, {"hooks": [{"type": "command", "command": "nomux", "args": ["hook", "claude", "Stop"]}]}],
```

**A file on one line.** The file `{"model":"sonnet","permissions":{"allow":["Bash(git status)"]}}` stays on one line. The new `hooks` object is on that line too, without spaces after the `:` and the `,`:

```console
$ nomux hooks install claude --apply >/dev/null
$ wc -l < ~/.claude/settings.json
1
$ head -c 160 ~/.claude/settings.json
{"model":"sonnet","permissions":{"allow":["Bash(git status)"]},"hooks":{"SessionStart":[{"hooks":[{"type":"command","command":"nomux","args":["hook","claude","S
```

**A file that does not exist.** The install makes the file, with two spaces of indent and one key, `hooks`. The diff then starts with `--- /dev/null`.

#### The file must be strict JSON

Claude Code 2.1 refuses a settings file that has a comment or a comma after the last value. nomux does the same, and it changes nothing:

```console
$ cat ~/.claude/settings.json
{
  // my model
  "model": "sonnet"
}
$ nomux hooks install claude --apply
nomux: the settings file /home/user/.claude/settings.json cannot get the hooks: key must be a string at line 2 column 3; nothing changed
$ echo $?
1
```

A comma after the last value gives `trailing comma at line 3 column 1`, with the same exit code. Remove the comment or the comma, and run the command again.

## Remove the hooks

`nomux hooks uninstall <tool>` works the same way: it prints the diff, and it writes only with `--apply`. It needs the record of the install, but not the daemon.

```console
$ nomux hooks uninstall claude --apply | tail -1
/home/user/.claude/settings.json has its content from before the install again
$ cmp ~/.claude/settings.json settings.orig && echo same
same
```

`settings.orig` is a copy of the file that was made before the install. The two files have the same bytes.

- If the file did not change after the install, it gets the bytes from before the install again. If it did not exist, nomux removes it.
- If you changed the file after the install, only the entries of nomux go away and your change stays. nomux says it: `changed after the install: only the entries of nomux are removed`.
- Without a record, the command fails with exit code 2: `nomux did not install the hooks of claude`.

Since nomux 0.5.0, the second kind of removal also removes each list and each object that the install made and that has no other value then. A list or an object that the file had before the install stays. In this run, the file with four spaces got a change of its `theme` after the install. The uninstall removed the entries and left this file, with the entry of the user and the new value of `theme`:

```console
$ nomux hooks uninstall claude --apply | tail -1
/home/user/.claude/settings.json changed after the install: only the entries of nomux are removed
$ cat ~/.claude/settings.json
{
    "theme": "light",
    "hooks": {
        "PreToolUse": [
            {
                "matcher": "Bash",
                "hooks": [{ "type": "command", "command": "/usr/local/bin/audit" }]
            }
        ]
    },
    "env": {"EDITOR": "vim"}
}
```

nomux 0.4.0 left an empty list for each event of the tool (`"SessionStart": []` and so on) in this case. nomux 0.5.0 does not. In the file with tabs, the empty list `"SessionStart": []` that the file had before the install stays, because the install did not make it.

## What nomux never does

- It never writes a settings file without `--apply`.
- It never wraps or replaces the command of the tool, and it never adds an option that skips the permission checks of the tool.
- It never answers a permission request, a question or a login for you. The answer of each hook is empty.
- It does not start the tool or change its permission mode.
- `nomux hook` never starts a daemon, a shell or another process.

## The resume command

An adapter can report the **resume command** of an agent: the command that starts the agent again with its earlier conversation. `nomux agent explain` shows it. For the Claude Code adapter, the command is `claude --resume <session>`:

```console
$ nomux agent explain fix-tests | tail -4

from the adapter:
  tool session: 00000000-0000-4000-8000-000000000006
  resume: claude --resume 00000000-0000-4000-8000-000000000006
```

The resume command is words with the quoting of a POSIX shell, without an operator or an expansion. The daemon never gives it to a shell. A [wake](/docs/guides/hibernation/) of a hibernated Session starts it unchanged, and nomux adds no word to it.
A Session whose adapter reported no resume command never hibernates automatically, and `nomux hibernate` refuses it with the reason. The same holds for a Session that no adapter reports as an agent Session, for example a plain shell:

```console
$ nomux hibernate kbyhsoqx
nomux: session kbyhsoqx cannot hibernate: no adapter reports it as an agent session
```

### The kind `prompt`

When an agent waits at its input prompt, nothing that it asked for waits. An adapter reports this as `needs you` with the kind `prompt`, not with `question`. The kind decides if the Session can hibernate: a Session with the kind `question`, `permission` or `auth` cannot, because a resume loses what the agent waits for. A Session with the kind `prompt` can.

The Claude Code adapter of release 0.1.0 reports its notification `idle_prompt` as `question`. With it, a Session at rest does not hibernate:

```console
$ nomux hibernate docs-site
nomux: session 5kjksrbd cannot hibernate: its agent waits for an answer of the user
```

The `main` branch of the `extensions` repository has a change that reports `prompt` for this notification. It is not in a release yet. A build of that branch, in a test run with the same hook data, showed `needs you: prompt` and let the Session hibernate. [Claude Code adapter](/docs/guides/claude-code/#limits) has the details.

## Limits

- `nomux hooks` works on the computer of the tool. `--host` is not permitted: the settings file is on that computer.

  ```console
  $ nomux --host vps hooks status
  nomux: the --host option cannot be used with a `hooks` command: the settings file of a tool is on its own computer, thus run the command there
  ```
- Only JSON settings files work.
- A hook event waits in a queue of 256 events and 4 MiB. A full queue drops the new event. One adapter that hangs delays the events of the other adapters until its call times out.
- An adapter that has the scope `agent:report` can report for each Session of the Host. The token proves where a hook event comes from, not what an extension reports. Install only adapters that you trust. An adapter that has only the scope `hooks:read` gets the events but cannot report: in a test run with the Claude Code adapter and only that scope, the Session showed `idle` with no source. The permissions that the extension asks for are on [Extensions](/docs/guides/extensions/).
- nomux does not send the decision of an approval card back to the tool yet.

## Write an adapter

An adapter is an extension with an `[adapter]` table and two scopes. [Write an extension](/docs/guides/write-an-extension/) says how an extension starts. The methods and the host services of an adapter are in [`docs/adapters.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/adapters.md) of the `nomux` repository, and the messages are in the `proto` repository.

```toml
[adapter]
tools = ["claude"]

[permissions]
scopes = ["hooks:read", "agent:report"]
```

The daemon gives the events of a tool to an installed and enabled extension that names the tool and has the approved scope `hooks:read`. If more than one extension names a tool, the one with the smallest identifier is the adapter.
