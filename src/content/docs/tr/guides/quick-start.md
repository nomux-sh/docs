---
title: Hızlı başlangıç
description: Bir Session açıp ona attach olun, detach olun, yeniden attach olun, daemon'u durdurun, Session'ın yaşadığını görün, çıktısını okuyun ve onu sonlandırın.
---

Bu sayfa, [kurulum sayfasındaki](/docs/tr/guides/install/) üç binary'nin kurulu olduğunu varsayar.
Buradaki çıktılar, nomux 0.3.0 ile Linux'ta yapılan tek bir çalıştırmanın gerçek çıktısıdır. Sizdeki session kimlikleri ve process ID'leri farklı olacaktır.

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
detached from session kodx55mz
$
```

CLI 0 çıkış koduyla biter. Session yaşamaya devam eder; içindeki programlar detach'i fark etmez.
Mesajda session kimliği yazar. Aynı kimliği `nomux ls` de gösterir:

```console
$ nomux ls
ID        STATE    PID      COMMAND
kodx55mz  running  2624204  sh
```

`PID`, holder'ın değil, Session'ın komutunun process ID'sidir.

## Yeniden attach olmak

```console
$ nomux attach kodx55mz
```

Terminalde detach olmadan önceki ekranın aynısı durur:

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$
```

Ekran Session'ın holder'ından gelir; holder onu hiçbir istemci attach değilken de tutar. Ekranını daha önce çizmiş bir program, örneğin bir editör, hemen görünür.

Aynı Session'a aynı anda birden fazla terminal attach olabilir. Hepsi aynı çıktıyı görür, hepsinden yazılabilir.
Burada ikinci bir terminalde aynı `nomux attach kodx55mz` çalıştırılıyor ve komut o terminalden yazılıyor. Sonunda iki terminalde de şu ekran durur:

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$ echo typed in terminal B
typed in terminal B
sh-5.3$
```

Başına geçemediğiniz bir terminali detach etmek için başka bir terminalden `nomux detach` çalıştırın. Bu komut Session'a attach olmuş bütün istemcileri detach eder:

```console
$ nomux detach kodx55mz
detached 1 client from session kodx55mz
```

Attach olan terminalde, detach tuşlarına basılmış gibi `detached from session kodx55mz` yazar.

## Daemon'u durdurmak: Session yaşar

Daemon hiçbir terminalin sahibi değildir. Her Session kendi holder process'inde yaşar.
Bir terminalde Session'a attach olun, ikinci bir terminalden daemon'u durdurun:

```console
$ nomux daemon status
nomuxd 0.3.0 runs: process ID 2624202, 1 session
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
nomux: the daemon stopped. The session continues: run `nomux attach kodx55mz` to attach again
$
```

Şu an çalışan bir daemon yok. Daemon'a ihtiyaç duyan ilk komut yenisini başlatır, yeni daemon da Session'ı bulur:

```console
$ nomux ls
ID        STATE    PID      COMMAND
kodx55mz  running  2624204  sh
$ nomux daemon status
nomuxd 0.3.0 runs: process ID 2624275, 1 session
```

Komutun process ID'si öncekiyle aynı: komut hiç durmadı. Değişen tek şey daemon'un process ID'si.

Daemon düzgün kapanmadan ölürse de sonuç değişmez:

```console
$ kill -9 2624275
$ nomux daemon status
nomuxd does not run
$ nomux ls
ID        STATE    PID      COMMAND
kodx55mz  running  2624204  sh
```

Bunun nedenini [Nasıl çalışır](/docs/tr/concepts/how-it-works/) sayfası anlatır. Host'un yeniden başlaması ise başka bir durum: komut durur ve Session uykuya geçer. Bunu [Yeniden başlatmadan sonra](/docs/tr/guides/after-a-restart/) sayfası gösterir.

## Attach olmadan Session açmak

`--attach` vermezseniz `nomux new` session kimliğini yazdırır ve çıkar. Session'ın komutu istemci olmadan çalışır.
Komutu başka bir dizinde başlatmak için `--cwd` ekleyin. Dizinin var olması gerekir:

```console
$ nomux new --cwd project -- sleep 600
3fvz2ujk
$ nomux ls
ID        STATE    PID      COMMAND
3fvz2ujk  running  2624294  sleep 600
kodx55mz  running  2624204  sh
```

## Session'ın çıktısını okumak

`nomux capture`, bir Session'ın komutunun yazdığı son satırları attach olmadan yazdırır. Varsayılan 100 satırdır; sayıyı `--lines` ile değiştirebilirsiniz.
Bu Session'daki komut 1'den 200'e kadar sayıları yazdırıp bekliyor:

```console
$ nomux new -- sh -c 'seq 1 200; exec sleep 600'
f4dr3ij2
$ nomux capture f4dr3ij2 --lines 3
198
199
200
```

Satırlar Session'ın ekranından değil, diskteki journal'ından gelir. Bu yüzden `capture` ekrandan çıkmış satırları da, komutu durmuş bir Session'ın çıktısını da yazdırır.
Çıktı, komutun yazdığı baytların escape sequence'leriyle birlikte aynısıdır. Bir shell'in çıktısında prompt'unun escape sequence'leri de bulunur.

Attach o anki ekranı ve o andan sonraki çıktıyı gösterir; ekrandan çıkmış satırları göstermez. Onlar için `capture` kullanın.

## Session'ı sonlandırmak

Komutu biten Session sonlanır. O anda attach olmuş bir terminal varsa CLI komutun çıkış durumunu yazdırır ve kendisi de aynı çıkış koduyla biter:

```console
sh-5.3$ exit 3
exit

session kodx55mz ended with exit status 3
$ echo $?
3
```

`nomux kill` ise Session'ı dışarıdan sonlandırır. Terminal kapandığında olduğu gibi komuta `SIGHUP` gönderir ve komut bitene kadar bekler:

```console
$ nomux kill 3fvz2ujk
session 3fvz2ujk ended
```

Biten Session `nomux ls` listesinden düşer. Daemon onu çıktısıyla birlikte 24 saat saklar; `nomux ls --all` onu, komutun nasıl bittiğini söyleyen bir notla gösterir:

```console
$ nomux ls
ID        STATE    PID      COMMAND
f4dr3ij2  running  2624301  sh -c seq 1 200; exec sleep 600
$ nomux ls --all
ID        STATE    PID      COMMAND                          NOTE
3fvz2ujk  ended    -        sleep 600                        signal 1
f4dr3ij2  running  2624301  sh -c seq 1 200; exec sleep 600
kodx55mz  ended    -        sh                               exit status 3
```

Biten bir Session'ın çıktısını `nomux capture` yine yazdırır. Onun için çalıştırılan diğer her komut 2 çıkış koduyla başarısız olur:

```console
$ nomux kill 3fvz2ujk
nomux: session 3fvz2ujk ended: its command does not run
```

## Komutları script'te kullanmak

Her komut `--json` ve `--quiet` seçeneklerini kabul eder. Üç Session'ın, biri bitmeden önceki JSON listesi şöyledir:

```console
$ nomux ls --json
{"schema_version":1,"sessions":[{"id":"3fvz2ujk","state":"running","pid":2624294,"command":["sleep","600"],"cwd":"/tmp/nomux-demo/project","rows":24,"columns":80,"started_at":1795655661,"epoch":1,"restore_policy":"on-focus"},{"id":"f4dr3ij2","state":"running","pid":2624301,"command":["sh","-c","seq 1 200; exec sleep 600"],"cwd":"/tmp/nomux-demo","rows":24,"columns":80,"started_at":1795655661,"epoch":1,"restore_policy":"on-focus"},{"id":"kodx55mz","state":"running","pid":2624204,"command":["sh"],"cwd":"/tmp/nomux-demo","rows":24,"columns":80,"started_at":1795655650,"epoch":1,"restore_policy":"on-focus"}]}
```

`--json` ve `--quiet` seçeneklerini `--`'den önce yazın. `--`'den sonra gelen her argüman Session'ın komutuna gider.
`attach` ve `new --attach`, standart girdide bir terminal bekler. Terminali olmayan bir script'te 1 çıkış koduyla başarısız olurlar.

Bütün komutlar, attach sırasındaki tuşlar, JSON dokümanları ve çıkış kodları [CLI başvurusunda](/docs/tr/reference/cli/) yer alır.

## Sıradaki adımlar

- [Yeniden başlatmadan sonra](/docs/tr/guides/after-a-restart/): uykudaki Session'lar, geri yükleme politikaları ve oturum açılışında daemon.
- [Uzak Host'lar](/docs/tr/guides/remote-hosts/): aynı komutlar, SSH üzerinden bir sunucuda.
- [Extension'lar](/docs/tr/guides/extensions/): bir extension kurun, izinlerini onaylayın ve onu çağırın.
