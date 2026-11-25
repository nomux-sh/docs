---
title: Hızlı başlangıç
description: Bir Session açın, Session'ları listeleyin, daemon'u durdurun, Session'ların yaşadığını görün ve bir Session'ı sonlandırın.
---

Bu sayfa, [kurulum sayfasındaki](/docs/tr/guides/install/) üç binary'nin kurulu olduğunu varsayar.
Buradaki çıktılar, `main`'den alınmış bir build ile yapılan tek bir çalıştırmanın gerçek çıktısıdır. Sizdeki session kimlikleri ve process ID'leri farklı olacaktır.

:::note
Bir Session'ın terminaline bağlanmak (attach) henüz mümkün değil. Session açabilir, listeleyebilir ve sonlandırabilirsiniz; Session'ın komutu istemci olmadan çalışır.
İşin ne durumda olduğunu [yol haritası](/docs/tr/project/roadmap/) gösterir.
:::

## Session açmak

```console
$ nomux new --cmd sh
2uc2d5iq
```

`nomux new`, daemon çalışmıyorsa onu başlatır, bir Session açar ve session kimliğini yazdırır.
`--cmd` Session'ın komutunu verir; burada `sh`. `--cmd` vermezseniz komut kendi shell'iniz olur.

Bu noktadan sonra Session'ın CLI'a ihtiyacı kalmaz. CLI çıkar, komut çalışmaya devam eder.

Komutu başka bir dizinde başlatmak için `--cwd` ekleyin. Dizinin var olması gerekir:

```console
$ nomux new --cwd project --cmd sleep 600
bzxw7xjk
```

## Session'ları listelemek

```console
$ nomux ls
ID        STATE    PID
2uc2d5iq  running  1057040
bzxw7xjk  running  1057045
```

`PID`, holder'ın değil, Session'ın komutunun process ID'sidir.

## Daemon'u durdurmak: Session'lar yaşar

Daemon hiçbir terminalin sahibi değildir. Her Session kendi holder process'inde yaşar.

```console
$ nomux daemon status
nomuxd 0.0.0 runs: process ID 1057038, 2 sessions
$ nomux daemon stop
nomuxd stopped
$ nomux daemon status
nomuxd does not run
```

Şu an çalışan bir daemon yok. Daemon'a ihtiyaç duyan ilk komut yenisini başlatır, yeni daemon da iki Session'ı bulur:

```console
$ nomux ls
ID        STATE    PID
2uc2d5iq  running  1057040
bzxw7xjk  running  1057045
$ nomux daemon status
nomuxd 0.0.0 runs: process ID 1057056, 2 sessions
```

İki komutun process ID'leri öncekiyle aynı: komutlar hiç durmadı. Değişen tek şey daemon'un process ID'si.

Daemon düzgün kapanmadan ölürse de sonuç değişmez:

```console
$ kill -9 1057056
$ nomux daemon status
nomuxd does not run
$ nomux ls
ID        STATE    PID
2uc2d5iq  running  1057040
bzxw7xjk  running  1057045
```

Bunun nedenini ve bir Session'ın hangi durumlarda gerçekten sonlandığını [Nasıl çalışır](/docs/tr/concepts/how-it-works/) sayfası anlatır.

## Session'ı sonlandırmak

```console
$ nomux kill 2uc2d5iq
session 2uc2d5iq ended
```

`nomux kill`, terminal kapandığında olduğu gibi komuta `SIGHUP` gönderir ve komut bitene kadar bekler.
Aynı Session için ikinci `kill` 2 çıkış koduyla başarısız olur:

```console
$ nomux kill 2uc2d5iq
nomux: no session has the identifier 2uc2d5iq
```

Komutu kendiliğinden biten Session da sonlanır ve listeden düşer.

```console
$ nomux kill bzxw7xjk
session bzxw7xjk ended
$ nomux ls
no sessions
```

## Komutları script'te kullanmak

Her komut `--json` ve `--quiet` seçeneklerini kabul eder. İki Session'ın JSON listesi şöyledir:

```console
$ nomux ls --json
{"schema_version":1,"sessions":[{"id":"2uc2d5iq","state":"running","pid":1057040},{"id":"bzxw7xjk","state":"running","pid":1057045}]}
```

`--json` ve `--quiet` seçeneklerini `--cmd`'den önce yazın. `--cmd`'den sonra gelen her argüman Session'ın komutuna gider.

Bütün komutlar, JSON dokümanları ve çıkış kodları [CLI başvurusunda](/docs/tr/reference/cli/) yer alır.
