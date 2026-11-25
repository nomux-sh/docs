---
title: Hızlı başlangıç
description: Bir Session açıp ona attach olun, detach olun, yeniden attach olun, daemon'u durdurun, Session'ın yaşadığını görün ve bir Session'ı sonlandırın.
---

Bu sayfa, [kurulum sayfasındaki](/docs/tr/guides/install/) üç binary'nin kurulu olduğunu varsayar.
Buradaki çıktılar, nomux 0.1.0 ile Linux'ta yapılan tek bir çalıştırmanın gerçek çıktısıdır. Sizdeki session kimlikleri ve process ID'leri farklı olacaktır.

Örneklerde `$` kendi shell'inizin prompt'u, `sh-5.3$` ise Session'ın içindeki shell'in prompt'udur.

## Session açıp attach olmak

```console
$ nomux new --attach -- sh
```

`nomux new`, daemon çalışmıyorsa onu başlatır ve bir Session açar.
`--`'den sonra gelen argümanlar Session'ın komutudur; burada `sh`. Vermezseniz komut kendi shell'iniz olur.
`--attach` ile terminaliniz Session'ın terminali olur: CLI terminali temizler ve Session'ın ekranını gösterir.

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$
```

Bastığınız her tuş Session'a gider. `Ctrl-C` ve `Ctrl-Z` de CLI'a değil, Session'daki programlara ulaşır.

## Detach olmak

Önce `Ctrl-\`, sonra `d` tuşuna basın.

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$
detached from session einqa7tl
$
```

CLI 0 çıkış koduyla biter. Session yaşamaya devam eder; içindeki programlar detach'i fark etmez.
Mesajda session kimliği yazar. Aynı kimliği `nomux ls` de gösterir:

```console
$ nomux ls
ID        STATE    PID
einqa7tl  running  1552422
```

`PID`, holder'ın değil, Session'ın komutunun process ID'sidir.

## Yeniden attach olmak

```console
$ nomux attach einqa7tl
```

Terminalde detach olmadan önceki ekranın aynısı durur:

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$
```

Ekran Session'ın holder'ından gelir; holder onu hiçbir istemci attach değilken de tutar. Ekranını daha önce çizmiş bir program, örneğin bir editör, hemen görünür.

Aynı Session'a aynı anda birden fazla terminal attach olabilir. Hepsi aynı çıktıyı görür, hepsinden yazılabilir.
Burada ikinci bir terminalde aynı `nomux attach einqa7tl` çalıştırılıyor ve komut o terminalden yazılıyor. Sonunda iki terminalde de şu ekran durur:

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$ echo typed in terminal B
typed in terminal B
sh-5.3$
```

Başına geçemediğiniz bir terminali detach etmek için başka bir terminalden `nomux detach` çalıştırın. Bu komut Session'a attach olmuş bütün istemcileri detach eder:

```console
$ nomux detach einqa7tl
detached 1 client from session einqa7tl
```

Attach olan terminalde, detach tuşlarına basılmış gibi `detached from session einqa7tl` yazar.

## Daemon'u durdurmak: Session yaşar

Daemon hiçbir terminalin sahibi değildir. Her Session kendi holder process'inde yaşar.
Bir terminalde Session'a attach olun, ikinci bir terminalden daemon'u durdurun:

```console
$ nomux daemon status
nomuxd 0.1.0 runs: process ID 1552420, 1 session
$ nomux daemon stop
nomuxd stopped
$ nomux daemon status
nomuxd does not run
```

İlk terminaldeki attach 1 çıkış koduyla biter, çünkü bağlantısı daemon üzerinden geçiyordu:

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$ echo typed in terminal B
typed in terminal B
sh-5.3$
nomux: the connection to the daemon failed: the daemon closed the connection. The session continues: run `nomux attach einqa7tl` to attach again
$
```

Şu an çalışan bir daemon yok. Daemon'a ihtiyaç duyan ilk komut yenisini başlatır, yeni daemon da Session'ı bulur:

```console
$ nomux ls
ID        STATE    PID
einqa7tl  running  1552422
$ nomux daemon status
nomuxd 0.1.0 runs: process ID 1552642, 1 session
```

Komutun process ID'si öncekiyle aynı: komut hiç durmadı. Değişen tek şey daemon'un process ID'si.
`nomux attach einqa7tl` yine aynı ekranı gösterir:

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$ echo typed in terminal B
typed in terminal B
sh-5.3$
```

Daemon düzgün kapanmadan ölürse de sonuç değişmez:

```console
$ kill -9 1552642
$ nomux daemon status
nomuxd does not run
$ nomux ls
ID        STATE    PID
einqa7tl  running  1552422
```

Bunun nedenini ve bir Session'ın hangi durumlarda gerçekten sonlandığını [Nasıl çalışır](/docs/tr/concepts/how-it-works/) sayfası anlatır.

## Attach olmadan Session açmak

`--attach` vermezseniz `nomux new` session kimliğini yazdırır ve çıkar. Session'ın komutu istemci olmadan çalışır.
Komutu başka bir dizinde başlatmak için `--cwd` ekleyin. Dizinin var olması gerekir:

```console
$ nomux new --cwd project -- sleep 600
habxocyh
$ nomux ls
ID        STATE    PID
einqa7tl  running  1552422
habxocyh  running  1553082
```

## Session'ı sonlandırmak

Komutu biten Session sonlanır. O anda attach olmuş bir terminal varsa CLI komutun çıkış durumunu yazdırır ve kendisi de aynı çıkış koduyla biter:

```console
sh-5.3$ exit 3
exit

session einqa7tl ended with exit status 3
$ echo $?
3
```

`nomux kill` ise Session'ı dışarıdan sonlandırır. Terminal kapandığında olduğu gibi komuta `SIGHUP` gönderir ve komut bitene kadar bekler:

```console
$ nomux kill habxocyh
session habxocyh ended
```

Sonlanan Session listeden düşer. Aynı Session için ikinci `kill` 2 çıkış koduyla başarısız olur:

```console
$ nomux kill habxocyh
nomux: no session has the identifier habxocyh
$ nomux ls
no sessions
```

## Komutları script'te kullanmak

Her komut `--json` ve `--quiet` seçeneklerini kabul eder. İki Session'ın JSON listesi şöyledir:

```console
$ nomux ls --json
{"schema_version":1,"sessions":[{"id":"einqa7tl","state":"running","pid":1552422},{"id":"habxocyh","state":"running","pid":1553082}]}
```

`--json` ve `--quiet` seçeneklerini `--`'den önce yazın. `--`'den sonra gelen her argüman Session'ın komutuna gider.
`attach` ve `new --attach`, standart girdide bir terminal bekler. Terminali olmayan bir script'te 1 çıkış koduyla başarısız olurlar.

Bütün komutlar, attach sırasındaki tuşlar, JSON dokümanları ve çıkış kodları [CLI başvurusunda](/docs/tr/reference/cli/) yer alır.
