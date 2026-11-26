---
title: Agent adapter'ları ve hook'lar
description: Bir agent aracı durumunu nomux'a bir adapter extension'ı ve hook'lar üzerinden nasıl bildirir, hook'lar önce diff görülerek nasıl kurulur ve nomux'un asla yapmadıkları.
---

Bir agent aracı ne yaptığını bilir: hangi aracı çalıştırdığını, size ne sorduğunu, bir subagent'ın ne zaman başladığını. nomux bunu aracın **hook'larından** öğrenir.
Hook, aracın işinin belirli bir olayında çalıştırdığı bir komuttur. nomux için komut `nomux hook <araç> <olay>`'dır.
**Adapter**, bir aracın hook olaylarını [agent durumuna](/docs/tr/guides/agent-status/) çeviren bir [extension](/docs/tr/concepts/extensions/)'dır.

Bu sayfadaki çıktılar, nomux 0.4.0'ın Linux'ta verdiği gerçek çıktılardır. Çalıştırmanın home dizini, geçici `/tmp/nomux-demo` dizinidir.
Örneklerdeki adapter, [Claude Code adapter'ı](/docs/tr/guides/claude-code/)'dır. Onu nasıl edineceğinizi o sayfa anlatır.

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
- Session token'ı (`NOMUX_TOKEN`), olayın Session'ın bir process'inden geldiğini kanıtlar. Yanlış ya da eksik bir token reddedilir.
- Adapter extension'ı ilk olayda başlar, boşta kalınca durur.
- Adapter, durumun ilk kaynağıdır. Bir hook olayı, bir aracın verebileceği en ayrıntılı bildirimdir.

Daemon bir hook'a hemen cevap verir. nomux 0.4.0'da cevap boştur: nomux, aracın bir sorusunu sizin yerinize cevaplamaz.

## Hook'ları kurmak

Bir araç hook'larını ayar dosyasından okur. `nomux hooks install`, adapter'ın ihtiyaç duyduğu değişikliği hesaplar. `--apply` eklemezseniz hiçbir şey yazmaz.

Önce aracın bir adapter'ı olmalı. Yoksa komut başarısız olur:

```console
$ nomux hooks status
no tool has an adapter or installed hooks
$ nomux hooks install claude
nomux: no extension is the adapter of the tool claude
```

Çıkış kodu 2'dir. Adapter'ı kurduktan sonra araç listede görünür, hook'ları ise eksiktir:

```console
$ nomux ext install ./claude-adapter --grant-all
extension nomux.agent-claude 0.1.0 installed with the permissions: scope=hooks:read scope=agent:report
$ nomux hooks status
TOOL    ADAPTER             HOOKS
claude  nomux.agent-claude  missing in /tmp/nomux-demo/.claude/settings.json
```

Sonra değişikliği isteyin. Örnekteki dosyada zaten iki anahtar var; komut bir unified diff yazdırır:

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

Diff'in tamamı 270 satırdır; aracın her olayı için bir girdi var. Komut dosyada hiçbir değişiklik yapmadı: `nomux hooks install claude >/dev/null` 0 çıkış koduyla biter ve dosya öncekiyle aynı kalır.

Uygulamadan önce diff'i okuyun:

- nomux dosyayı iki boşluk girintili JSON olarak yazar. Dosyanızın biçimi değişebilir. Örnekte `allow` dizisinin her değeri artık ayrı bir satırda. Anahtarlar sıralarını korur.
- Dosyada zaten olan bir değer yeniden eklenmez.
- Girdi `nomux`'u argümanlarla, shell olmadan çalıştırır. Wrapper script'i, timeout ve araca özel bir seçenek içermez.

Diff doğruysa `--apply` ekleyin:

```console
$ nomux hooks install claude --apply | tail -1
the hooks of claude are installed in /tmp/nomux-demo/.claude/settings.json
$ nomux hooks status
TOOL    ADAPTER             HOOKS
claude  nomux.agent-claude  installed in /tmp/nomux-demo/.claude/settings.json
$ nomux hooks install claude
the hooks of claude are installed in /tmp/nomux-demo/.claude/settings.json: nothing to change
```

`--apply` dosyayı, aynı dizindeki geçici bir dosya üzerinden yazar. Symbolic link, link olarak kalır.
Ayrıca `~/.local/share/nomux/hooks/claude/` altında (macOS'ta: `~/Library/Application Support/nomux/hooks/claude/`) bir kayıt tutar: dosyanın kurulumdan önceki baytları ve girdiler.

Bir aracın hook durumu `installed`, `missing` veya `different` olur. Kurulu bir araç için `nomux hooks install` hiçbir şeyi değiştirmez.

## Hook'ları kaldırmak

`nomux hooks uninstall <araç>` aynı şekilde çalışır: diff'i yazdırır ve yalnızca `--apply` ile yazar.

```console
$ nomux hooks uninstall claude --apply | tail -1
/tmp/nomux-demo/.claude/settings.json has its content from before the install again
$ cmp ~/.claude/settings.json settings.orig && echo same
same
```

`settings.orig`, kurulumdan önce alınmış bir dosya kopyasıdır. İki dosyanın baytları aynıdır.

- Dosya kurulumdan sonra değişmediyse kurulumdan önceki baytlarına geri döner. Dosya yoksa nomux onu siler.
- Dosyayı kurulumdan sonra değiştirdiyseniz yalnızca nomux'un girdileri gider, değişikliğiniz kalır. nomux bunu söyler: `changed after the install: only the entries of nomux are removed`.
- Kayıt yoksa komut 2 çıkış koduyla başarısız olur: `nomux did not install the hooks of claude`.

Bilinen bir pürüz: ikinci tür kaldırmadan sonra dosya, aracın her olayı için boş bir liste tutar (`"SessionStart": []` gibi). Girdiler gitmiştir; boş listeleri elle silebilirsiniz.

## nomux'un asla yapmadıkları

- `--apply` olmadan hiçbir ayar dosyası yazmaz.
- Aracın komutunu asla sarmaz ya da değiştirmez ve aracın izin kontrollerini atlayan bir seçenek asla eklemez.
- Bir izin isteğini, bir soruyu ya da bir girişi sizin yerinize asla cevaplamaz. Her hook'un cevabı boştur.
- Aracı başlatmaz ve izin modunu değiştirmez.
- `nomux hook` asla bir daemon, shell ya da başka bir process başlatmaz.

## Bu sürümün sınırları

- `nomux hooks`, aracın çalıştığı bilgisayarda çalışır. `--host` kabul edilmez: ayar dosyası o bilgisayardadır.
- Yalnızca JSON ayar dosyaları çalışır.
- Bir hook olayı 256 olaylık ve 4 MiB'lık bir kuyrukta bekler. Dolu kuyruk yeni olayı atar. Takılan bir adapter, çağrısı zaman aşımına uğrayana kadar diğer adapter'ların olaylarını geciktirir.
- `agent:report` kapsamı olan bir adapter, Host'taki her Session için bildirim yapabilir. Token, bir hook olayının nereden geldiğini kanıtlar; bir extension'ın ne bildirdiğini kanıtlamaz. Yalnızca güvendiğiniz adapter'ları kurun. Extension'ın istediği izinler [Extension'lar](/docs/tr/guides/extensions/) sayfasında.
- nomux, bir onay kartının kararını henüz araca geri göndermez.

## Adapter yazmak

Adapter, bir `[adapter]` tablosu ve iki kapsamı olan bir extension'dır. Bir extension'ın nasıl başladığını [Extension yazmak](/docs/tr/guides/write-an-extension/) sayfası anlatır. Bir adapter'ın metotları ve host servisleri `nomux` reposundaki [`docs/adapters.md`](https://github.com/nomux-sh/nomux/blob/v0.4.0/docs/adapters.md) dosyasında, mesajlar ise `proto` reposundadır.

```toml
[adapter]
tools = ["claude"]

[permissions]
scopes = ["hooks:read", "agent:report"]
```

Daemon, bir aracın olaylarını; kurulu, etkin, aracın adını veren ve `hooks:read` kapsamı onaylanmış bir extension'a verir. Birden fazla extension aynı aracın adını veriyorsa kimliği en küçük olan adapter olur.
