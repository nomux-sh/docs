---
title: Agent adapter'ları ve hook'lar
description: Bir agent aracı durumunu nomux'a bir adapter extension'ı ve hook'lar üzerinden nasıl bildirir, hook'lar ayar dosyanızın biçimini bozmadan önce diff görülerek nasıl kurulur ve nomux'un asla yapmadıkları.
---

Bir agent aracı ne yaptığını bilir: hangi aracı çalıştırdığını, size ne sorduğunu, bir subagent'ın ne zaman başladığını. nomux bunu aracın **hook'larından** öğrenir.
Hook, aracın işinin belirli bir olayında çalıştırdığı bir komuttur. nomux için komut `nomux hook <araç> <olay>`'dır.
**Adapter**, bir aracın hook olaylarını [agent durumuna](/docs/tr/guides/agent-status/) çeviren bir [extension](/docs/tr/concepts/extensions/)'dır.

Bu sayfadaki çıktılar, nomux 0.5.0'ın Linux'ta verdiği gerçek çıktılardır. Çalıştırmanın home dizini `/home/user` olarak gösterilir.
Örneklerdeki adapter, [Claude Code adapter'ı](/docs/tr/guides/claude-code/)'dır. Onu nasıl edineceğinizi o sayfa anlatır. Bu örnekler için Claude Code çalıştırılmadı: ayar dosyaları, bu sayfa için hazırlanmış küçük dosyalardır.

## Bir olayın yolu

```text
agent tool, in a Session
  runs the hook: nomux hook <tool> <event>      the data of the event is on its standard input
  nomuxd checks the token of the Session
  the adapter extension of the tool gets the event
  the adapter reports the status to nomuxd      source: adapter
  nomux status, nomux agent explain, nomux events
```

- `nomux hook` aracı asla bloklamaz ve asla bozmaz: çıkış kodu her zaman 0'dır. Daemon yoksa, Session'ın dışındaysa ya da daemon 80 ms içinde cevap vermezse çıktı vermeden biter.
- Session token'ı (`NOMUX_TOKEN`), olayın Session'ın bir process'inden geldiğini kanıtlar. Yanlış ya da eksik bir token reddedilir. Komut standart hataya bir satır yazar ve çıkış kodu yine 0 olur:

  ```text
  nomux hook: the hook event of session qqmi7lfg was refused: the token of the request is not the token of the session
  ```
- Adapter extension'ı ilk olayda başlar, boşta kalınca durur.
- Adapter, durumun ilk kaynağıdır. Bir hook olayı, bir aracın verebileceği en ayrıntılı bildirimdir.

Daemon bir hook'a hemen cevap verir. nomux 0.5.0'da cevap boştur: nomux, aracın bir sorusunu sizin yerinize cevaplamaz.

## Hook'ları kurmak

Bir araç hook'larını ayar dosyasından okur. `nomux hooks install`, adapter'ın ihtiyaç duyduğu değişikliği hesaplar. `--apply` eklemezseniz hiçbir şey yazmaz.

Önce aracın bir adapter'ı olmalı. Yoksa komut 2 çıkış koduyla başarısız olur:

```console
$ nomux hooks install codex
nomux: no extension is the adapter of the tool codex
```

Adapter extension'ını kurduktan sonra ([nasıl yapılacağını Claude Code adapter'ı sayfası](/docs/tr/guides/claude-code/#extension-kurulumu) gösterir) araç listede görünür, hook'ları ise eksiktir:

```console
$ nomux hooks status
TOOL    ADAPTER             HOOKS
claude  nomux.agent-claude  missing in /home/user/.claude/settings.json
```

Sonra değişikliği isteyin. Örnekteki dosyada iki anahtar var ve `allow` listesi tek satırda:

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

Çıktının tamamı 266 satırdır: diff, aracın 17 olayı için 257 satır ekler ve hiçbir satırı silmez. Son satır `dry run: nothing is written. Add --apply to write the change` der. Komut dosyada hiçbir değişiklik yapmadı.

Uygulamadan önce diff'i okuyun:

- Kurulum dosyanızın biçimini korur: bkz. [Dosyanızın biçimi aynı kalır](#dosyanızın-biçimi-aynı-kalır). Örnekte `allow` listesi tek satırda kalır.
- Dosyada zaten olan bir değer yeniden eklenmez.
- Girdi `nomux`'u argümanlarla, shell olmadan çalıştırır. Wrapper script'i, timeout ve araca özel bir seçenek içermez.

Diff doğruysa `--apply` ekleyin:

```console
$ nomux hooks install claude --apply | tail -1
the hooks of claude are installed in /home/user/.claude/settings.json
$ nomux hooks status
TOOL    ADAPTER             HOOKS
claude  nomux.agent-claude  installed in /home/user/.claude/settings.json
$ nomux hooks install claude
the hooks of claude are installed in /home/user/.claude/settings.json: nothing to change
```

`--apply` dosyayı, aynı dizindeki geçici bir dosya üzerinden yazar. Symbolic link, link olarak kalır.
Ayrıca `~/.local/share/nomux/hooks/claude/` altında (macOS'ta: `~/Library/Application Support/nomux/hooks/claude/`) bir kayıt tutar: dosyanın kurulumdan önceki baytları, yazılan dosyanın sağlama toplamı ve girdiler.

Bir aracın hook durumu `installed`, `missing` veya `different` olur. `different`, dosyada adapter'ın bazı girdilerinin olduğu ama hepsinin olmadığı anlamına gelir. Bu çalıştırmada, bir olayın girdisini kaybetmiş bir dosya `different` durumundaydı ve `nomux hooks install claude --apply` eksik girdiyi ekledi. Kurulu bir araç için `nomux hooks install` hiçbir şeyi değiştirmez.

### Dosyanızın biçimi aynı kalır

nomux 0.5.0'dan beri kurulum yalnızca eklediği metni değiştirir. Dosyanızın her diğer baytı yerinde kalır: anahtarların sırası, girinti, boşluklar ve dosyanın sonu. Yeni bir girdi dosyanızın girintisini alır; tek satırda olan bir nesnede ya da listede ise tek satırda kalır. Bu çalıştırmalarda gerçek komut dört küçük dosyayla kullanıldı.

**Dört boşluk, kullanıcının kendi hook'u, kendi sıranızdaki anahtarlar.** Dosyada `theme`, kullanıcının tek bir `PreToolUse` girdisi olan `hooks` ve `env` vardı. nomux kendi girdisini kullanıcının girdisinden sonra, her seviye için dört boşlukla ekledi. Dosyanın diff'inde silinen satır yoktu ve `theme` ile `env` anahtarları yerlerinde kaldı:

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

**Sekmeler ve tek satırdaki listeler.** Dosyada her seviye için bir sekme, boş bir `SessionStart` listesi ve tek satırda bir `Stop` listesi vardı. Yeni girdiler sekme kullanır ve `Stop` girdisi listenin satırında kalır:

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

**Tek satırlık bir dosya.** `{"model":"sonnet","permissions":{"allow":["Bash(git status)"]}}` dosyası tek satırda kalır. Yeni `hooks` nesnesi de o satırdadır; `:` ve `,` işaretlerinden sonra boşluk yoktur:

```console
$ nomux hooks install claude --apply >/dev/null
$ wc -l < ~/.claude/settings.json
1
$ head -c 160 ~/.claude/settings.json
{"model":"sonnet","permissions":{"allow":["Bash(git status)"]},"hooks":{"SessionStart":[{"hooks":[{"type":"command","command":"nomux","args":["hook","claude","S
```

**Olmayan bir dosya.** Kurulum dosyayı yapar: iki boşluk girinti ve tek anahtar, `hooks`. Diff o zaman `--- /dev/null` ile başlar.

#### Dosya katı JSON olmalı

Claude Code 2.1, yorum satırı ya da son değerden sonra virgül içeren bir ayar dosyasını reddeder. nomux da aynısını yapar ve hiçbir şeyi değiştirmez:

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

Son değerden sonraki bir virgül, aynı çıkış koduyla `trailing comma at line 3 column 1` mesajını verir. Yorumu ya da virgülü silin ve komutu yeniden çalıştırın.

## Hook'ları kaldırmak

`nomux hooks uninstall <araç>` aynı şekilde çalışır: diff'i yazdırır ve yalnızca `--apply` ile yazar. Kurulumun kaydına ihtiyaç duyar ama daemon'a ihtiyaç duymaz.

```console
$ nomux hooks uninstall claude --apply | tail -1
/home/user/.claude/settings.json has its content from before the install again
$ cmp ~/.claude/settings.json settings.orig && echo same
same
```

`settings.orig`, kurulumdan önce alınmış bir dosya kopyasıdır. İki dosyanın baytları aynıdır.

- Dosya kurulumdan sonra değişmediyse kurulumdan önceki baytlarına geri döner. Dosya yoksa nomux onu siler.
- Dosyayı kurulumdan sonra değiştirdiyseniz yalnızca nomux'un girdileri gider, değişikliğiniz kalır. nomux bunu söyler: `changed after the install: only the entries of nomux are removed`.
- Kayıt yoksa komut 2 çıkış koduyla başarısız olur: `nomux did not install the hooks of claude`.

nomux 0.5.0'dan beri ikinci tür kaldırma, kurulumun yaptığı ve artık başka değeri olmayan her listeyi ve her nesneyi de kaldırır. Dosyanın kurulumdan önce zaten sahip olduğu bir liste ya da nesne kalır. Bu çalıştırmada dört boşluklu dosyanın `theme` değeri kurulumdan sonra değiştirildi. Kaldırma girdileri sildi ve kullanıcının girdisini ile `theme`'in yeni değerini taşıyan şu dosyayı bıraktı:

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

nomux 0.4.0 bu durumda aracın her olayı için boş bir liste bırakıyordu (`"SessionStart": []` gibi). nomux 0.5.0 bırakmaz. Sekmeli dosyada, dosyanın kurulumdan önce sahip olduğu boş `"SessionStart": []` listesi kalır, çünkü onu kurulum yapmadı.

## nomux'un asla yapmadıkları

- `--apply` olmadan hiçbir ayar dosyası yazmaz.
- Aracın komutunu asla sarmaz ya da değiştirmez ve aracın izin kontrollerini atlayan bir seçenek asla eklemez.
- Bir izin isteğini, bir soruyu ya da bir girişi sizin yerinize asla cevaplamaz. Her hook'un cevabı boştur.
- Aracı başlatmaz ve izin modunu değiştirmez.
- `nomux hook` asla bir daemon, shell ya da başka bir process başlatmaz.

## Devam komutu

Bir adapter, agent'ın **devam komutunu** bildirebilir: agent'ı önceki konuşmasıyla yeniden başlatan komut. `nomux agent explain` onu gösterir. Claude Code adapter'ı için komut `claude --resume <session>`'dır:

```console
$ nomux agent explain fix-tests | tail -4

from the adapter:
  tool session: 00000000-0000-4000-8000-000000000006
  resume: claude --resume 00000000-0000-4000-8000-000000000006
```

Devam komutu, POSIX shell'in tırnak kurallarıyla yazılmış sözcüklerdir; operatör ya da genişletme içermez. Daemon onu asla bir shell'e vermez. Hazırda bekleyen bir Session'ın [uyandırılması](/docs/tr/guides/hibernation/) onu değiştirmeden başlatır ve nomux ona hiçbir sözcük eklemez.
Adapter'ı devam komutu bildirmemiş bir Session kendiliğinden asla hazırda beklemez ve `nomux hibernate` onu nedeniyle birlikte reddeder. Hiçbir adapter'ın agent Session olarak bildirmediği bir Session için de aynısı geçerlidir; örneğin düz bir shell:

```console
$ nomux hibernate kbyhsoqx
nomux: session kbyhsoqx cannot hibernate: no adapter reports it as an agent session
```

### `prompt` türü

Bir agent giriş prompt'unda beklerken, istediği hiçbir şey beklemiyor demektir. Adapter bunu `question` ile değil, `prompt` türüyle `needs you` olarak bildirir. Tür, Session'ın hazırda bekleyip bekleyemeyeceğini belirler: `question`, `permission` ya da `auth` türündeki bir Session bekleyemez, çünkü devam etmek agent'ın beklediği şeyi kaybettirir. `prompt` türündeki bir Session bekleyebilir.

0.1.0 sürümündeki Claude Code adapter'ı `idle_prompt` bildirimini `question` olarak bildirir. Bu yüzden boştaki bir Session hazırda beklemez:

```console
$ nomux hibernate docs-site
nomux: session 5kjksrbd cannot hibernate: its agent waits for an answer of the user
```

`extensions` reposunun `main` dalında, bu bildirim için `prompt` bildiren bir değişiklik var. Henüz bir release'te değil. Aynı hook verisiyle yapılan bir deneme çalıştırmasında, o dalın bir derlemesi `needs you: prompt` gösterdi ve Session'ın hazırda beklemesine izin verdi. Ayrıntılar [Claude Code adapter'ı](/docs/tr/guides/claude-code/#bu-sürümün-sınırları) sayfasında.

## Bu sürümün sınırları

- `nomux hooks`, aracın çalıştığı bilgisayarda çalışır. `--host` kabul edilmez: ayar dosyası o bilgisayardadır.

  ```console
  $ nomux --host vps hooks status
  nomux: the --host option cannot be used with a `hooks` command: the settings file of a tool is on its own computer, thus run the command there
  ```
- Yalnızca JSON ayar dosyaları çalışır.
- Bir hook olayı 256 olaylık ve 4 MiB'lık bir kuyrukta bekler. Dolu kuyruk yeni olayı atar. Takılan bir adapter, çağrısı zaman aşımına uğrayana kadar diğer adapter'ların olaylarını geciktirir.
- `agent:report` kapsamı olan bir adapter, Host'taki her Session için bildirim yapabilir. Token, bir hook olayının nereden geldiğini kanıtlar; bir extension'ın ne bildirdiğini kanıtlamaz. Yalnızca güvendiğiniz adapter'ları kurun. Yalnızca `hooks:read` kapsamı olan bir adapter olayları alır ama bildirim yapamaz: Claude Code adapter'ı ve yalnızca bu kapsamla yapılan bir deneme çalıştırmasında Session, kaynaksız `idle` gösterdi. Extension'ın istediği izinler [Extension'lar](/docs/tr/guides/extensions/) sayfasında.
- nomux, bir onay kartının kararını henüz araca geri göndermez.

## Adapter yazmak

Adapter, bir `[adapter]` tablosu ve iki kapsamı olan bir extension'dır. Bir extension'ın nasıl başladığını [Extension yazmak](/docs/tr/guides/write-an-extension/) sayfası anlatır. Bir adapter'ın metotları ve host servisleri `nomux` reposundaki [`docs/adapters.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/adapters.md) dosyasında, mesajlar ise `proto` reposundadır.

```toml
[adapter]
tools = ["claude"]

[permissions]
scopes = ["hooks:read", "agent:report"]
```

Daemon, bir aracın olaylarını; kurulu, etkin, aracın adını veren ve `hooks:read` kapsamı onaylanmış bir extension'a verir. Birden fazla extension aynı aracın adını veriyorsa kimliği en küçük olan adapter olur.
