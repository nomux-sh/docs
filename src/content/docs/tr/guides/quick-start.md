---
title: Hızlı başlangıç
description: Bir Session açıp ona attach olun, detach olun, yeniden attach olun, daemon'u durdurun, Session'ın yaşadığını görün, çıktısını, durumunu ve belleğini okuyun ve onu sonlandırın.
---

Bu sayfa, [kurulum sayfasındaki](/docs/tr/guides/install/) üç binary'nin kurulu olduğunu varsayar.
Buradaki çıktılar, nomux 0.4.0 ile Linux'ta yapılan tek bir çalıştırmanın gerçek çıktısıdır. Sizdeki session kimlikleri ve process ID'leri farklı olacaktır.

Örneklerde `$` kendi shell'inizin prompt'u, `sh-5.3$` ise Session'ın içindeki shell'in prompt'udur.

## Session açıp attach olmak

```console
$ nomux new --attach -- sh
```

`nomux new`, daemon çalışmıyorsa onu başlatır ve bir Session açar.
`--`'den sonra gelen argümanlar Session'ın komutudur; burada `sh`. Vermezseniz komut kendi shell'iniz olur: bunu [Shell açmak](#shell-açmak) bölümü gösterir.
`--attach` ile terminaliniz Session'ın terminali olur: CLI terminali temizler ve Session'ın ekranını gösterir.

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$
```

Bastığınız her tuş Session'a gider. `Ctrl-C` ve `Ctrl-Z` de CLI'a değil, Session'daki programlara ulaşır.

`--cmd <komut> [argüman...]` aynı işin ikinci biçimidir. İki biçimi aynı komut satırında kullanmayın. `--cmd`'den sonra gelen bir `--`'nin komuta ait olup olmadığını `nomux` bilemez; bu yüzden satırı 1 çıkış koduyla reddeder ve hiçbir Session açmaz:

```console
$ nomux new --cmd sh -- -c true
error: the argument '--cmd <COMMAND>...' cannot be used with '--': nomux cannot know where the command of the session starts. Give the command in one form: `nomux new --cmd <command> [argument...]` or `nomux new -- <command> [argument...]`. For a command that has `--` as an argument, use the second form

Usage: nomux new [OPTIONS] [-- <COMMAND>...]

For more information, try '--help'.
```

Argümanlarından biri `--` olan bir komut için `--`'li biçimi kullanın: `nomux new -- git log -- notes.txt`.

## Detach olmak

Önce `Ctrl-\`, sonra `d` tuşuna basın.

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$
detached from session d3g6u2x6
$
```

CLI 0 çıkış koduyla biter. Session yaşamaya devam eder; içindeki programlar detach'i fark etmez.
Mesajda session kimliği yazar. Aynı kimliği `nomux ls` de gösterir:

```console
$ nomux ls
ID        STATE    PID     COMMAND
d3g6u2x6  running  885451  sh
```

`PID`, holder'ın değil, Session'ın komutunun process ID'sidir.

## Yeniden attach olmak

```console
$ nomux attach d3g6u2x6
```

Terminalde detach olmadan önceki ekranın aynısı durur:

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$
```

Ekran Session'ın holder'ından gelir; holder onu hiçbir istemci attach değilken de tutar. Ekranını daha önce çizmiş bir program, örneğin bir editör, hemen görünür.

Aynı Session'a aynı anda birden fazla terminal attach olabilir. Hepsi aynı çıktıyı görür, hepsinden yazılabilir.
Burada ikinci bir terminalde aynı `nomux attach d3g6u2x6` çalıştırılıyor ve komut o terminalden yazılıyor. Sonunda iki terminalde de şu ekran durur:

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$ echo typed in terminal B
typed in terminal B
sh-5.3$
```

Başına geçemediğiniz bir terminali detach etmek için başka bir terminalden `nomux detach` çalıştırın. Bu komut Session'a attach olmuş bütün istemcileri detach eder:

```console
$ nomux detach d3g6u2x6
detached 1 client from session d3g6u2x6
```

Attach olan terminalde, detach tuşlarına basılmış gibi `detached from session d3g6u2x6` yazar.

## Daemon'u durdurmak: Session yaşar

Daemon hiçbir terminalin sahibi değildir. Her Session kendi holder process'inde yaşar.
Bir terminalde Session'a attach olun, ikinci bir terminalden daemon'u durdurun:

```console
$ nomux daemon status
nomuxd 0.4.0 runs: process ID 885447, 1 session
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
nomux: the daemon stopped. The session continues: run `nomux attach d3g6u2x6` to attach again
$
```

Şu an çalışan bir daemon yok. Daemon'a ihtiyaç duyan ilk komut yenisini başlatır, yeni daemon da Session'ı bulur:

```console
$ nomux ls
ID        STATE    PID     COMMAND
d3g6u2x6  running  885451  sh
$ nomux daemon status
nomuxd 0.4.0 runs: process ID 886734, 1 session
```

Komutun process ID'si öncekiyle aynı: komut hiç durmadı. Değişen tek şey daemon'un process ID'si.

Daemon düzgün kapanmadan ölürse de sonuç değişmez:

```console
$ kill -9 886734
$ nomux daemon status
nomuxd does not run
$ nomux ls
ID        STATE    PID     COMMAND
d3g6u2x6  running  885451  sh
```

Bunun nedenini [Nasıl çalışır](/docs/tr/concepts/how-it-works/) sayfası anlatır. Host'un yeniden başlaması ise başka bir durum: komut durur ve Session uykuya geçer. Bunu [Yeniden başlatmadan sonra](/docs/tr/guides/after-a-restart/) sayfası gösterir.

## Attach olmadan Session açmak

`--attach` vermezseniz `nomux new` session kimliğini yazdırır ve çıkar. Session'ın komutu istemci olmadan çalışır.
Komutu başka bir dizinde başlatmak için `--cwd` ekleyin. Dizinin var olması gerekir:

```console
$ nomux new --cwd project -- sleep 600
m6jfaybz
$ nomux ls
ID        STATE    PID     COMMAND
d3g6u2x6  running  885451  sh
m6jfaybz  running  886750  sleep 600
```

## Shell açmak

Komut vermezseniz Session kendi shell'inizi çalıştırır. Daemon, her birinde shell'i çoktan çalışan birkaç holder'ı hazır tutar: [holder havuzu](/docs/tr/guides/holder-pool/). Shell ile açılan yeni bir Session bunlardan birini alır; bu yüzden shell'in prompt'u hemen gelir. Havuz, daemon başlarken değil, daemon'un aldığı ilk istekte başlar.

Havuzdan gelen bir Session home dizininizde başlar. `--cwd` başka bir dizin gösteriyorsa nomux shell'e ` cd '<dizin>'` yazar. Bu satır Session'ın ekranında görünür. Satır bir boşlukla başlar; bu sayede böyle ayarlanmış bir shell satırı geçmişine eklemez:

```console
$ nomux new --cwd project
aipxxh7r
$ nomux attach aipxxh7r
bash-5.3$  cd '/tmp/nomux-demo/project'
bash-5.3$
```

Yukarıdaki örneklerdeki gibi komutlu bir Session her zaman yeni bir holder alır ve `cd` satırı olmaz.

## Session'ın çıktısını okumak

`nomux capture`, bir Session'ın komutunun yazdığı son satırları attach olmadan yazdırır. Varsayılan 100 satırdır; sayıyı `--lines` ile değiştirebilirsiniz.
Bu Session'daki komut 1'den 200'e kadar sayıları yazdırıp bekliyor:

```console
$ nomux new -- sh -c 'seq 1 200; exec sleep 600'
wuvotgo2
$ nomux capture wuvotgo2 --lines 3
198
199
200
```

Satırlar Session'ın ekranından değil, diskteki journal'ından gelir. Bu yüzden `capture` ekrandan çıkmış satırları da, komutu durmuş bir Session'ın çıktısını da yazdırır.
Holder çıktıyı, okuduktan en geç 1 saniye sonra journal'a yazar. `new`'den hemen sonra çalıştırılan `capture`, komutun yazdığından daha azını yazdırabilir.
Çıktı, komutun yazdığı baytların escape sequence'leriyle birlikte aynısıdır. Bir shell'in çıktısında prompt'unun escape sequence'leri de bulunur.

Attach o anki ekranı ve o andan sonraki çıktıyı gösterir; ekrandan çıkmış satırları göstermez. Onlar için `capture` kullanın.

## Durumu ve belleği görmek

`nomux status` her Session için bir satır yazdırır: komutu, durumu, o durumda geçen süre ve bir mesaj. Hiçbir programın bir şey bildirmediği Session `idle` olur:

```console
$ nomux status
  SESSION   COMMAND                          STATE  FOR  MESSAGE
  d3g6u2x6  sh                               idle   9s
  m6jfaybz  sleep 600                        idle   9s
  wuvotgo2  sh -c seq 1 200; exec sleep 600  idle   9s
```

Bir agent aracı ya da `nomux status set` ile bildiren bir program diğer durumları verir; örneğin `working` ve `needs you`. Bunları [Agent durumu](/docs/tr/guides/agent-status/) sayfası gösterir.

`nomux ls --memory`, her Session'ın process'lerinin komutun çalıştığı anda kullandığı belleği ekler:

```console
$ nomux ls --memory
ID        STATE    MEMORY     PROCESSES  HOLDER     MEASURE  COMMAND
d3g6u2x6  running  749.0 KiB  1          282.0 KiB  pss      sh
m6jfaybz  running  145.0 KiB  1          268.0 KiB  pss      sleep 600
wuvotgo2  running  151.0 KiB  1          290.0 KiB  pss      sh -c seq 1 200; exec sleep 600
total: 1.0 MiB in 3 processes of 3 sessions, and 840.0 KiB in the holders (pss)
```

`MEMORY`, komutun ve ondan türeyen her process'in belleğidir; `PROCESSES` onların sayısıdır. `HOLDER` holder'ın belleğidir ve `MEMORY`'nin parçası değildir. `MEASURE` Linux'ta `pss`, macOS'ta `rss` olur. Sayıların neyi saydığını [Session'ların belleği](/docs/tr/guides/session-memory/) sayfası anlatır.

## Session'ı sonlandırmak

Komutu biten Session sonlanır. O anda attach olmuş bir terminal varsa CLI komutun çıkış durumunu yazdırır ve kendisi de aynı çıkış koduyla biter:

```console
sh-5.3$ exit 3
exit

session d3g6u2x6 ended with exit status 3
$ echo $?
3
```

`nomux kill` ise Session'ı dışarıdan sonlandırır. Terminal kapandığında olduğu gibi komuta `SIGHUP` gönderir ve komut bitene kadar bekler:

```console
$ nomux kill m6jfaybz
session m6jfaybz ended
```

Biten Session `nomux ls` listesinden düşer. Daemon onu çıktısıyla birlikte 24 saat saklar; `nomux ls --all` onu, komutun nasıl bittiğini söyleyen bir notla gösterir:

```console
$ nomux ls
ID        STATE    PID     COMMAND
wuvotgo2  running  886755  sh -c seq 1 200; exec sleep 600
$ nomux ls --all
ID        STATE    PID     COMMAND                          NOTE
d3g6u2x6  ended    -       sh                               exit status 3
m6jfaybz  ended    -       sleep 600                        signal 1
wuvotgo2  running  886755  sh -c seq 1 200; exec sleep 600
```

Biten bir Session'ın çıktısını `nomux capture` yine yazdırır. Onun için çalıştırılan diğer her komut 2 çıkış koduyla başarısız olur:

```console
$ nomux kill m6jfaybz
nomux: session m6jfaybz ended: its command does not run
```

## Komutları script'te kullanmak

Her komut `--json` ve `--quiet` seçeneklerini kabul eder. Üç Session'ın, biri bitmeden önceki JSON listesi şöyledir:

```console
$ nomux ls --json
{"schema_version":1,"sessions":[{"id":"d3g6u2x6","state":"running","pid":885451,"command":["sh"],"cwd":"/tmp/nomux-demo","rows":24,"columns":80,"started_at":1795690878,"epoch":1,"restore_policy":"on-focus"},{"id":"m6jfaybz","state":"running","pid":886750,"command":["sleep","600"],"cwd":"/tmp/nomux-demo/project","rows":24,"columns":80,"started_at":1795690885,"epoch":1,"restore_policy":"on-focus"},{"id":"wuvotgo2","state":"running","pid":886755,"command":["sh","-c","seq 1 200; exec sleep 600"],"cwd":"/tmp/nomux-demo","rows":24,"columns":80,"started_at":1795690885,"epoch":1,"restore_policy":"on-focus"}]}
```

`--json` ve `--quiet` seçeneklerini `--`'den önce yazın. `--`'den sonra gelen her argüman Session'ın komutuna gider.
`attach` ve `new --attach`, standart girdide bir terminal bekler. Terminali olmayan bir script'te 1 çıkış koduyla başarısız olurlar.

Bir terminalde `ls` ve `status` tabloları terminalin genişliğine sığar: önce komut sütunu kısaltılır ve kesilen yeri bir üç nokta (`…`) gösterir. Bir script'in çıktısı ile JSON çıktısı hiçbir zaman kısaltılmaz.

Bütün komutlar, attach sırasındaki tuşlar, JSON dokümanları ve çıkış kodları [CLI başvurusunda](/docs/tr/reference/cli/) yer alır.

## Sıradaki adımlar

- [Yeniden başlatmadan sonra](/docs/tr/guides/after-a-restart/): uykudaki Session'lar, geri yükleme politikaları ve oturum açılışında daemon.
- [Uzak Host'lar](/docs/tr/guides/remote-hosts/): aynı komutlar, SSH üzerinden bir sunucuda.
- [Extension'lar](/docs/tr/guides/extensions/): bir extension kurun, izinlerini onaylayın ve onu çağırın.
