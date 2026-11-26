---
title: Hızlı başlangıç
description: Bir Session açıp ona attach olun, detach olun, yeniden attach olun, Session'a ad verin, daemon'u durdurun, Session'ın yaşadığını görün, çıktısını, durumunu ve belleğini okuyun ve onu sonlandırın.
---

Bu sayfa, [kurulum sayfasındaki](/docs/tr/guides/install/) üç binary'nin kurulu olduğunu varsayar.
Buradaki çıktılar, nomux 0.5.0 ile Linux'ta yapılan tek bir çalıştırmanın gerçek çıktısıdır. Sizdeki session kimlikleri ve process ID'leri farklı olacaktır.

Örneklerde `$` kendi shell'inizin prompt'u, `sh-5.3$` ise Session'ın içindeki shell'in prompt'udur.

## Session açıp attach olmak

```console
$ nomux new --attach -- sh
```

`nomux new`, daemon çalışmıyorsa onu başlatır ve bir Session açar.
`--`'den sonra gelen argümanlar Session'ın komutudur; burada `sh`. Vermezseniz komut kendi shell'iniz olur: bunu [Shell açmak](#shell-açmak) bölümü gösterir.
`--attach` (`-a`) ile terminaliniz Session'ın terminali olur: CLI terminali temizler ve Session'ın ekranını gösterir.

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

Önce `Ctrl-a`, sonra `d` tuşuna basın. `Ctrl-\` ve ardından `d` de çalışır.

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$
detached from session cmyd3fud
$
```

CLI 0 çıkış koduyla biter. Session yaşamaya devam eder; içindeki programlar detach'i fark etmez.
Mesajda session kimliği yazar. Aynı kimliği `nomux ls` de gösterir:

```console
$ nomux ls
ID        STATE    PID      COMMAND
cmyd3fud  running  4107953  sh
```

`PID`, holder'ın değil, Session'ın komutunun process ID'sidir.
Attach sırasındaki diğer tuşları ve prefix tuşlarının nasıl değiştirileceğini [Session'lar](/docs/tr/guides/sessions/#prefix-tuşları) sayfası gösterir.

## Yeniden attach olmak

```console
$ nomux attach cmyd3fud
```

Terminalde detach olmadan önceki ekranın aynısı durur:

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$
```

Ekran Session'ın holder'ından gelir; holder onu hiçbir istemci attach değilken de tutar. Ekranını daha önce çizmiş bir program, örneğin bir editör, hemen görünür.

Aynı Session'a aynı anda birden fazla terminal attach olabilir. Hepsi aynı çıktıyı görür, hepsinden yazılabilir.
Burada ikinci bir terminalde aynı `nomux attach cmyd3fud` çalıştırılıyor ve komut o terminalden yazılıyor. Sonunda iki terminalde de şu ekran durur:

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$ echo typed in terminal B
typed in terminal B
sh-5.3$
```

Başına geçemediğiniz bir terminali detach etmek için başka bir terminalden `nomux detach` çalıştırın. Bu komut Session'a attach olmuş bütün istemcileri detach eder:

```console
$ nomux detach cmyd3fud
detached 1 client from session cmyd3fud
```

Attach olan terminalde, detach tuşlarına basılmış gibi `detached from session cmyd3fud` yazar.

## Session'a ad vermek

Ad, kimlikten daha kısa yazılır. `nomux rename` bir Session'a ad verir; `nomux new -n` adı daha açılırken verir:

```console
$ nomux rename cmyd3fud shell
session cmyd3fud is now named shell
$ nomux new -n api -- sleep 600
ordcoebj
$ nomux ls
ID        NAME   STATE    PID      COMMAND
cmyd3fud  shell  running  4107953  sh
ordcoebj  api    running  4109980  sleep 600
```

Session alan her komut kimliği, adı ya da ikisinden birinin başını kabul eder: `nomux attach shell` ve `nomux attach sh` ikisi de ilk Session'a attach olur. Birden fazla Session'a uyan bir baş, adayların listesiyle birlikte hata verir.

Şu kısa yollar da var:

- `nomux new -n work -a`, `work` Session'ını açar ve ona attach olur.
- `nomux new -A -n shell`, `shell` Session'ına attach olur; yoksa onu açar.
- `nomux attach` hedefsiz, bir istemcinin en son attach olduğu Session'a attach olur. `nomux a` aynı komuttur.
- Terminalde yalın `nomux`, `nomux attach` ile aynı işi yapar. Host'ta hiç Session yoksa shell'inizle bir tane açar.

```console
$ nomux new -A -n shell
detached from session shell (cmyd3fud)
```

Adların ve hedeflerin kurallarını, her seçeneğin ne yaptığını [Session'lar](/docs/tr/guides/sessions/) sayfasında bulursunuz.

## Daemon'u durdurmak: Session yaşar

Daemon hiçbir terminalin sahibi değildir. Her Session kendi holder process'inde yaşar.
Bir terminalde Session'a attach olun, ikinci bir terminalden daemon'u durdurun:

```console
$ nomux daemon status
nomuxd 0.5.0 runs: process ID 4107950, 2 sessions
memory limit: the kernel ends the processes of a session at its limit: a systemd user scope with MemoryMax
configuration file: /home/user/.config/nomux/config.toml
$ nomux daemon stop
nomuxd stopped
$ nomux daemon status
nomuxd does not run
configuration file: /home/user/.config/nomux/config.toml
```

`daemon status` ayrıca işletim sisteminin bir Session'a bellek limiti uygulayıp uygulamadığını ve yapılandırma dosyasının yerini söyler. Daemon çalışmıyorsa çıkış kodu 2 olur.

İlk terminaldeki attach 1 çıkış koduyla biter, çünkü bağlantısı daemon üzerinden geçiyordu:

```console
sh-5.3$ echo hello from the session
hello from the session
sh-5.3$ echo typed in terminal B
typed in terminal B
sh-5.3$ echo second terminal
second terminal
sh-5.3$
nomux: the daemon stopped. The session continues: run `nomux attach shell` to attach again
$
```

Şu an çalışan bir daemon yok. Daemon'a ihtiyaç duyan ilk komut yenisini başlatır, yeni daemon da Session'ları bulur:

```console
$ nomux ls
ID        NAME   STATE    PID      COMMAND
cmyd3fud  shell  running  4107953  sh
ordcoebj  api    running  4109980  sleep 600
$ nomux daemon status
nomuxd 0.5.0 runs: process ID 4112638, 2 sessions
memory limit: the kernel ends the processes of a session at its limit: a systemd user scope with MemoryMax
configuration file: /home/user/.config/nomux/config.toml
```

Komutların process ID'leri öncekiyle aynı: komutlar hiç durmadı. Değişen tek şey daemon'un process ID'si.

Daemon düzgün kapanmadan ölürse de sonuç değişmez:

```console
$ kill -9 4112638
$ nomux daemon status
nomuxd does not run
configuration file: /home/user/.config/nomux/config.toml
$ nomux ls
ID        NAME   STATE    PID      COMMAND
cmyd3fud  shell  running  4107953  sh
ordcoebj  api    running  4109980  sleep 600
```

Bu çalıştırmada `daemon status`, `kill`'den bir saniye sonra çalıştı. Onu `kill` ile aynı anda çalıştırırsanız nomux 0.5.0 `nomux: the connection to the daemon failed: Connection reset by peer (os error 104)` cevabını 1 çıkış koduyla verebilir. Komutu yeniden çalıştırın.

Bunun nedenini [Nasıl çalışır](/docs/tr/concepts/how-it-works/) sayfası anlatır. Host'un yeniden başlaması ise başka bir durum: komut durur ve Session uykuya geçer. Bunu [Yeniden başlatmadan sonra](/docs/tr/guides/after-a-restart/) sayfası gösterir.

## Attach olmadan Session açmak

`--attach` vermezseniz `nomux new` session kimliğini yazdırır ve çıkar. Session'ın komutu istemci olmadan çalışır.
Komutu başka bir dizinde başlatmak için `--cwd` ekleyin. Dizinin var olması gerekir:

```console
$ nomux new --cwd project -- sleep 600
suzsh5xl
$ nomux ls
ID        NAME   STATE    PID      COMMAND
cmyd3fud  shell  running  4107953  sh
suzsh5xl  -      running  4114787  sleep 600
```

## Shell açmak

Komut vermezseniz Session kendi shell'inizi çalıştırır. Daemon, her birinde shell'i çoktan çalışan birkaç holder'ı hazır tutar: [holder havuzu](/docs/tr/guides/holder-pool/). Shell ile açılan yeni bir Session bunlardan birini alır; bu yüzden shell'in prompt'u hemen gelir. Havuz, daemon başlarken değil, daemon'un aldığı ilk istekte başlar.

Havuzdaki bir `bash`, `zsh` ya da `fish`, ilk prompt'tan önce Session'ın dizinine geçer. `--cwd` bir dizin gösteriyorsa ekranda yazılmış bir satır görünmez; shell zaten oradadır:

```console
$ nomux new --cwd project
ws3qfqzs
$ nomux attach ws3qfqzs
bash-5.3$ pwd
/home/user/demo/project
bash-5.3$
```

Yukarıdaki örneklerdeki gibi komutlu bir Session her zaman yeni bir holder alır.

## Session'ın çıktısını okumak

`nomux capture`, bir Session'ın komutunun yazdığı son satırları attach olmadan yazdırır. Varsayılan 100 satırdır; sayıyı `--lines` ile değiştirebilirsiniz.
Bu Session'daki komut 1'den 200'e kadar sayıları yazdırıp bekliyor:

```console
$ nomux new -n count -- sh -c 'seq 1 200; exec sleep 600'
3iljg56n
$ nomux capture count --lines 3
198
199
200
```

Satırlar Session'ın ekranından değil, diskteki journal'ından gelir. Bu yüzden `capture` ekrandan çıkmış satırları da, komutu durmuş bir Session'ın çıktısını da yazdırır.
Holder çıktıyı, okuduktan en geç 1 saniye sonra journal'a yazar. `new`'den hemen sonra çalıştırılan `capture`, komutun yazdığından daha azını yazdırabilir.
Çıktı, komutun yazdığı baytların escape sequence'leriyle birlikte aynısıdır. Bir shell'in çıktısında prompt'unun escape sequence'leri de bulunur.

Attach o anki ekranı ve o andan sonraki çıktıyı gösterir; ekrandan çıkmış satırları göstermez. Onlar için `capture` kullanın. `nomux capture -f` yeni çıktıyı da izler: bunu [Session'ları script'lemek](/docs/tr/guides/scripting-sessions/) sayfası gösterir.

## Durumu ve belleği görmek

`nomux status` her Session için bir satır yazdırır: adı ya da kimliği, komutu, durumu, o durumda geçen süre ve bir mesaj. Hiçbir programın bir şey bildirmediği Session `idle` olur:

```console
$ nomux status
  SESSION   COMMAND                          STATE  FOR  MESSAGE
  count     sh -c seq 1 200; exec sleep 600  idle   1s
  shell     sh                               idle   8s
  suzsh5xl  sleep 600                        idle   3s
  ws3qfqzs  /bin/bash                        idle   3s
```

Bir agent aracı ya da `nomux status set` ile bildiren bir program diğer durumları verir; örneğin `working` ve `needs you`. Bunları [Agent durumu](/docs/tr/guides/agent-status/) sayfası gösterir.

`nomux ls --memory`, her Session'ın process'lerinin komutun çalıştığı anda kullandığı belleği ekler:

```console
$ nomux ls --memory
ID        STATE    MEMORY     PROCESSES  HOLDER     MEASURE  LIMIT  FREED  COMMAND
3iljg56n  running  161.0 KiB  1          275.0 KiB  pss      -      -      sh -c seq 1 200; exec sleep 600
cmyd3fud  running  734.0 KiB  1          271.0 KiB  pss      -      -      sh
suzsh5xl  running  145.0 KiB  1          260.0 KiB  pss      -      -      sleep 600
ws3qfqzs  running  737.0 KiB  1          271.0 KiB  pss      -      -      /bin/bash
total: 1.7 MiB in 4 processes of 4 sessions, and 1.0 MiB in the holders (pss)
```

`MEMORY`, komutun ve ondan türeyen her process'in belleğidir; `PROCESSES` onların sayısıdır. `HOLDER` holder'ın belleğidir ve `MEMORY`'nin parçası değildir. `MEASURE` Linux'ta `pss`, macOS'ta `rss` olur. `LIMIT`, işletim sisteminin Session'a bellek limiti uyguladığı yerde değer alır; `FREED` ise [hazırda bekleyen](/docs/tr/guides/hibernation/) bir Session için değer alır. Sayıların neyi saydığını [Session'ların belleği](/docs/tr/guides/session-memory/) sayfası anlatır.

## Session'ı sonlandırmak

Komutu biten Session sonlanır. O anda attach olmuş bir terminal varsa CLI komutun çıkış durumunu yazdırır ve kendisi de aynı çıkış koduyla biter:

```console
sh-5.3$ exit 3
exit

session shell (cmyd3fud) ended with exit status 3
$ echo $?
3
```

`nomux kill` ise Session'ı dışarıdan sonlandırır. Terminal kapandığında olduğu gibi komuta `SIGHUP` gönderir ve komut bitene kadar bekler:

```console
$ nomux kill suzsh5xl
session suzsh5xl ended
```

`nomux kill --all` çalışan her Session'ı sonlandırır ve terminalde önce sorar: bunu [Session'ları script'lemek](/docs/tr/guides/scripting-sessions/#çok-sayıda-sessionı-sonlandırmak-kill---all) sayfasında bulursunuz.

Biten Session `nomux ls` listesinden düşer. Daemon onu çıktısıyla birlikte 24 saat saklar; `nomux ls --all` onu, komutun nasıl bittiğini söyleyen bir notla gösterir:

```console
$ nomux ls
ID        NAME   STATE    PID      COMMAND
3iljg56n  count  running  4114800  sh -c seq 1 200; exec sleep 600
ws3qfqzs  -      running  4113272  /bin/bash
$ nomux ls --all
ID        NAME     STATE    PID      COMMAND                          NOTE
3iljg56n  count    running  4114800  sh -c seq 1 200; exec sleep 600
54kiobxv  scratch  ended    -        sh                               signal 1
cmyd3fud  shell    ended    -        sh                               exit status 3
ordcoebj  api      ended    -        sleep 600                        signal 1
suzsh5xl  -        ended    -        sleep 600                        signal 1
ws3qfqzs  -        running  4113272  /bin/bash
```

Biten bir Session'ın çıktısını `nomux capture` yine yazdırır. Onun için çalıştırılan diğer her komut 2 çıkış koduyla başarısız olur. Ad yalnızca bitmemiş Session'ları bulur; bu yüzden kimliği kullanın:

```console
$ nomux kill suzsh5xl
nomux: session suzsh5xl ended: its command does not run
```

## Komutları script'te kullanmak

Her komut `--json` ve `--quiet` seçeneklerini kabul eder. Çalışan iki Session'ın JSON listesi şöyledir:

```console
$ nomux ls --json
{"schema_version":1,"sessions":[{"id":"3iljg56n","name":"count","state":"running","pid":4114800,"command":["sh","-c","seq 1 200; exec sleep 600"],"cwd":"/home/user/demo","rows":24,"columns":80,"started_at":1795706787,"epoch":1,"restore_policy":"on-focus","project":null},{"id":"ws3qfqzs","name":null,"state":"running","pid":4113272,"command":["/bin/bash"],"cwd":"/home/user/demo/project","rows":24,"columns":80,"started_at":1795706785,"epoch":1,"restore_policy":"on-focus","project":null}]}
```

`--json` ve `--quiet` seçeneklerini `--`'den önce yazın. `--`'den sonra gelen her argüman Session'ın komutuna gider.
`attach` ve `new --attach`, standart girdide bir terminal bekler. Terminali olmayan bir script'te 1 çıkış koduyla başarısız olurlar.

Bir terminalde `ls` ve `status` tabloları terminalin genişliğine sığar: önce komut sütunu kısaltılır ve kesilen yeri bir üç nokta (`…`) gösterir. Bir script'in çıktısı ile JSON çıktısı hiçbir zaman kısaltılmaz.

Bir Session'a yazmayı, çıktısını izlemeyi ve çok sayıda Session'ı sonlandırmayı [Session'ları script'lemek](/docs/tr/guides/scripting-sessions/) sayfası gösterir. Bütün komutlar, attach sırasındaki tuşlar, JSON dokümanları ve çıkış kodları [CLI başvurusunda](/docs/tr/reference/cli/) yer alır.

## Sıradaki adımlar

- [Session'lar](/docs/tr/guides/sessions/): adlar, hedefler, `-A` ve attach sırasındaki prefix tuşları.
- [Session'ları script'lemek](/docs/tr/guides/scripting-sessions/): `send`, `capture -f` ve `kill --all`.
- [tmux ve screen'den gelenler için](/docs/tr/guides/coming-from-tmux-and-screen/): alıştığınız komutlar.
- [Yeniden başlatmadan sonra](/docs/tr/guides/after-a-restart/): uykudaki Session'lar, geri yükleme politikaları ve oturum açılışında daemon.
- [Uzak Host'lar](/docs/tr/guides/remote-hosts/): aynı komutlar, SSH üzerinden bir sunucuda.
- [Extension'lar](/docs/tr/guides/extensions/): bir extension kurun, izinlerini onaylayın ve onu çağırın.
