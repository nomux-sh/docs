---
title: CLI başvurusu
description: nomux CLI'ının bütün komutları; seçenekleri, çıktıları, JSON dokümanları ve çıkış kodlarıyla.
sidebar:
  label: CLI
---

`nomux`, CLI'dır. Daemon'a bağlanır, isteklerini gönderir ve sonucu yazdırır. Terminalinizi yalnızca `attach` kullanır.
Komutların kullanımını [hızlı başlangıç](/docs/tr/guides/quick-start/) sayfasında görebilirsiniz.

CLI'ın yardım metinleri ve mesajları İngilizcedir; bu sayfada oldukları gibi verilmiştir.

## Bütün komutlar için geçerli kurallar

- Hiçbir komut soru sormaz. Komut yalnızca argümanlarını ve ortam değişkenlerini okur. Tek istisna `attach`'tir: klavyenizi ve ekranınızı bir Session'a verir.
- Bütün komutlar aynı [çıkış kodlarını](#çıkış-kodları) kullanır. `attach` bunlara Session'ın komutunun çıkış durumunu da ekler.
- Her komut `--json`, `--quiet` ve `--host <ad>` seçeneklerini kabul eder. `--json` ile `--quiet` birlikte kullanılamaz.
- `--host` verilmezse komut local Host'un daemon'unu kullanır. `--host <ad>` ile SSH üzerinden uzak bir Host'un daemon'unu kullanır. Bkz. [`--host`](#--host).
- Daemon'a ihtiyaç duyan komut, cevap veren bir daemon yoksa onu başlatır ve en fazla 5 saniye bekler. `daemon` komutları, `ext validate`, `hook`, `status set` ve `hooks uninstall` daemon başlatmaz.
- `status set` ve `hook` yalnızca bir Session'ın içinde çalışır. Ortamlarından `NOMUX_SESSION_ID`, `NOMUX_SOCK` ve `NOMUX_TOKEN` değişkenlerini okurlar. Üç değişkeni [Session'ın ortamı](/docs/tr/guides/session-environment/) sayfası anlatır. Home dizini uzunsa `NOMUX_SOCK`, kısa bir bağlantının içindeki bir yoldur; nedeni [uzun home dizinleri](/docs/tr/guides/long-home-paths/) sayfasındadır.
- Metin çıktısında yalnızca Session'ın durumu ve Session'daki işin durumu renklidir; o da standart çıktı bir terminalse ve `NO_COLOR` değişkeni tanımlı değilse.
- Terminalde, metin çıktısındaki tablo terminalin genişliğine sığar. Önce komut sütunu kısaltılır, ardından not, mesaj ya da neden sütunu. Kesilen yeri bir üç nokta (`…`) gösterir; kısaltılan sütun başlığının genişliğini korur. Böylece durum ve mesaj görünür kalır. Standart çıktı bir terminal değilse ve JSON çıktısında hiçbir şey kısaltılmaz.

## Genel kullanım

```text
Sessions that stay alive on the host when the client disconnects

Usage: nomux [OPTIONS] [COMMAND]

Commands:
  new             Start a new session and print its identifier
  ls              List the sessions
  attach          Show a session in this terminal. To detach, press Ctrl-\ and then d. A dormant session starts again
  start           Start the command of a dormant session again
  capture         Print the last output lines of a session
  restore-policy  Set when a dormant session starts again
  detach          Detach the clients that are attached to a session. The session continues
  kill            End a session. A dormant session is removed with its output
  status          Show the status of each session: what works, what is done, what needs you
  agent           Explain the status of the sessions
  events          Print the events of the host when they come, until a signal stops the command
  daemon          Show or stop the daemon, and start it at login
  host            Add, list, remove and check the remote hosts
  ext             Install, list, remove and call the extensions of a host
  hook            Send one event of an agent tool to the daemon of the session. A tool calls this command from its hooks: it reads the data of the event from the standard input
  hooks           Install, remove and show the hooks of an agent tool in its settings file
  version         Print the version

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -V, --version      Print the version
  -h, --help         Print help
```

Bir komut vermek zorunludur. Komutsuz `nomux` hata yazdırır ve 1 çıkış koduyla biter:

```console
$ nomux
error: a command is necessary

Usage: nomux [OPTIONS] [COMMAND]

For more information, try '--help'.
```

| Seçenek | Ne yapar |
|---|---|
| `--json` | Sonucu tek satırlık tek bir JSON dokümanı olarak yazdırır. Bkz. [JSON çıktısı](#json-çıktısı). |
| `-q`, `--quiet` | Yalnızca bir script'in ihtiyaç duyduğu kısmı yazdırır. Bkz. [sessiz çıktı](#sessiz-çıktı). |
| `--host <NAME>` | Uzak bir Host'un daemon'unu kullanır. Bkz. [`--host`](#--host). |
| `-V`, `--version` | `version` komutu gibi sürümü yazdırır. |
| `-h`, `--help` | CLI'ın ya da tek bir komutun yardım metnini yazdırır. |

Her komut `--json`, `--quiet` ve `--host` seçeneklerini kabul eder. Aşağıdaki yardım metinlerinde görünürler; yardım metinlerinin altındaki tablolarda tekrar edilmezler.

### `--host`

`--host <ad>`, komutun uzak bir Host'un daemon'unu kullanmasını sağlar. `<ad>`, [`nomux host add`](#nomux-host-add) komutunun yazdığı yapılandırma dosyasındaki bir Host'tur. Bağlantının ayrıntıları [Uzak Host'lar](/docs/tr/guides/remote-hosts/) sayfasındadır.

```sh
nomux --host vps new --attach
nomux --host vps ls --json
```

- Her komut önce Host'ta CLI'ın sürümündeki binary'lerin bulunduğundan emin olur. Yoksa `host add` gibi onları kurar ve bununla ilgili tek satırı standart hataya yazar.
- `--host` ile `new --cwd <dir>`, Host'ta mutlak bir yol ister. `--cwd` verilmezse komut Host'taki home dizininizde başlar.
- `--host`, `host` komutlarıyla, `daemon install-service` ve `daemon uninstall-service` ile, `status set` ile ve `hooks` komutlarıyla kullanılamaz. Bu komutlar `--host` ile 1 çıkış koduyla biter. `version`, CLI'ın sürümünü yazdırır. `hook`, `--host`'u yok sayar.
- SSH hatasının çıkış kodu 1'dir. Host hiçbir anahtarı kabul etmezse çıkış kodu 4'tür.

Yapılandırma dosyasında olmayan bir ad 2 çıkış kodunu verir:

```console
$ nomux --host vps ls
nomux: no host has the name vps. `nomux host ls` shows the hosts, and `nomux host add` adds one
$ nomux --host vps daemon install-service --dry-run
nomux: the --host option cannot be used with this command: run it on the host
$ nomux --host vps hooks status
nomux: the --host option cannot be used with a `hooks` command: the settings file of a tool is on its own computer, thus run the command there
$ nomux --host vps status set working
nomux: the --host option cannot be used with `status set`: the session is on the host of this process
```

Uzak bir Host'a bağlanan komutlar bu sayfa için çalıştırılmadı.

## Session komutları

### `nomux new`

Yeni bir Session açar ve session kimliğini yazdırır. `--attach` verilirse Session'a attach olur.

```text
Usage: nomux new [OPTIONS] [-- <COMMAND>...]

Arguments:
  [COMMAND]...  The same as --cmd: each argument after -- belongs to the command

Options:
      --cwd <DIR>         The working directory of the command [default: the current directory]
      --json              Print the result as one JSON document
      --attach            Attach to the new session
  -q, --quiet             Print only the necessary part of the result
      --cmd <COMMAND>...  The command of the session and its arguments [default: the shell of the user]. Each argument after --cmd belongs to the command, also an option of nomux
      --host <NAME>       Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help              Print help
```

| Seçenek | Varsayılan | Ne yapar |
|---|---|---|
| `--cwd <DIR>` | CLI'ın çalıştığı dizin | Komutun çalışma dizini. Göreli yol, CLI'ın çalıştığı dizine göre çözülür. Dizinin var olması gerekir. |
| `--attach` | Kapalı | Terminali, [`nomux attach`](#nomux-attach) gibi yeni Session'a attach eder. Komut bu durumda session kimliğini değil, attach'in sonucunu yazdırır. |
| `-- <COMMAND>...` | Kullanıcının shell'i: daemon'un `SHELL` değişkeni, yoksa `/bin/sh` | Session'ın komutu ve argümanları. |
| `--cmd <COMMAND>...` | Aynısı | `--`'nin ikinci yazılışı. İki yazılış birlikte kullanılamaz. |

**`--` ya da `--cmd`'den sonra gelen her argüman Session'ın komutuna gider; `nomux`'un kendi seçeneklerinden biri olsa bile.** Bu yüzden `nomux`'un seçenekleri komuttan önce yazılır:

```sh
nomux new --json -- sleep 300      # --json is an option of nomux
nomux new -- sleep 300 --json      # --json is an argument of sleep
```

```console
$ nomux new --cwd project -- sleep 600
gurnvh37
```

**İki yazılış birlikte kullanılamaz.** Önce `--cmd`, sonra `--` içeren bir komut satırı kullanım hatasıdır: çıkış kodu 1'dir ve Session açılmaz. `nomux`, o `--`'nin komutun bir argümanı mı yoksa ikinci yazılışın başlangıcı mı olduğunu bilemez.

```console
$ nomux new --cmd sh -- -c true
error: the argument '--cmd <COMMAND>...' cannot be used with '--': nomux cannot know where the command of the session starts. Give the command in one form: `nomux new --cmd <command> [argument...]` or `nomux new -- <command> [argument...]`. For a command that has `--` as an argument, use the second form

Usage: nomux new [OPTIONS] [-- <COMMAND>...]

For more information, try '--help'.
```

Bu yüzden argümanlarından biri `--` olan komut, ikinci yazılışı ister. İlk `--`'den sonraki her `--` komuta aittir:

```sh
nomux new -- git log -- notes.txt        # the second -- is an argument of git
```

Komut, daemon'un ortam değişkenlerini alır; [Session'ın ortamı](/docs/tr/guides/session-environment/) sayfasının anlattığı değişiklikler de uygulanır: `TERM=xterm-256color`, `COLORTERM=truecolor`, daemon'da locale yoksa UTF-8 karakter kümesi ve `NOMUX_SESSION_ID`, `NOMUX_SOCK` ve `NOMUX_TOKEN` değişkenleri. Bir istemci attach olana kadar terminali 24 satır, 80 sütundur; attach olan istemci Session'a kendi terminalinin pencere boyutunu verir.

Komut başlatılamazsa ya da dizin yoksa çıkış kodu 1'dir ve Session açılmaz:

```console
$ nomux new -- /nonexistent-binary
nomux: the session did not start: nomux-holder: cannot start the command: No such file or directory (os error 2)
$ nomux new --cwd /nonexistent-directory
nomux: the working directory /nonexistent-directory is not an absolute path of a directory
```

`--attach` bir terminal ister. Terminal yoksa çıkış kodu 1'dir ve Session açılmaz:

```console
$ nomux new --attach -- sh < /dev/null
nomux: attach needs a terminal: the standard input is not a terminal
```

### `nomux ls`

Çalışabilecek Session'ları listeler: komutu çalışan Session'lar, uykudaki Session'lar ve bozuk Session'lar. `--all` ile biten Session'ları da listeler.

```text
Usage: nomux ls [OPTIONS]

Options:
  -a, --all          Also list the sessions whose command ended
      --json         Print the result as one JSON document
      --memory       Show the memory that the processes of each session use now
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux ls
ID        STATE    PID     COMMAND
gurnvh37  running  959485  sleep 600
ijzhc3lz  running  959490  sh
$ nomux ls --all
ID        STATE    PID     COMMAND    NOTE
gurnvh37  running  959485  sleep 600
ijzhc3lz  ended    -       sh         exit status 3
vn3n3l6r  running  959494  sleep 300
```

Hiç Session yoksa komut `no sessions` yazdırır.

- `PID`, Session'ın komutunun process ID'sidir. Session'ın process'i yoksa ya da daemon bunu bilmiyorsa `-` görünür.
- `COMMAND`, program ve argümanlarıdır; aralarında birer boşluk vardır.
- `NOTE` sütunu yalnızca bir Session'ın notu varsa görünür: biten bir Session'ın komutunun nasıl bittiği (`exit status <n>` ya da `signal <n>`) veya Session'ın tanımının neden bozuk olduğu.

| Durum | Anlamı |
|---|---|
| `running` | Session'ın komutu çalışıyor. |
| `unreachable` | Session'ın holder'ı çalışıyor ama daemon'un ona bağlantısı yok. Daemon yeniden bağlanmayı dener. |
| `dormant` | Session'ın process'i yok: holder'ı gitmiş, komutu bitmemiş. `attach` ya da `start` komutu yeniden başlatır. Bkz. [Yeniden başlatmadan sonra](/docs/tr/guides/after-a-restart/). |
| `ended` | Session'ın komutu bitti. Daemon Session'ı ve çıktısını saklama süresi boyunca, varsayılan olarak 24 saat tutar. Yalnızca `ls --all` gösterir. |
| `damaged` | Daemon Session'ın tanımını okuyamıyor. Not, nedenini söyler. `kill` Session'ı siler. |
| `unknown` | Daemon CLI'dan daha yeni ve CLI'ın tanımadığı bir durum gönderdi. |

Bir terminalde tablo, terminalin genişliğine sığar. Önce komut sütunu kısaltılır; kesilen yeri bir üç nokta (`…`) gösterir. Aşağıdakiler, 50 sütunluk bir terminalde `nomux ls` ve `nomux ls --all` çıktılarıdır:

```text
ID        STATE    PID     COMMAND
4irabyqw  running  951676  sh
a7l2lbgk  running  951365  sh -c sleep 600 & sl…
kitzeuit  running  948557  sleep 600
r67mfnfw  running  951666  sh -c echo server st…
xrysxwhn  running  948560  sh -c seq 1 200; exe…
```

```text
ID        STATE    PID     COMMAND   NOTE
4irabyqw  running  951676  sh
6sxcisjq  ended    -       sleep 6…  signal 1
a7l2lbgk  running  951365  sh -c s…
fiktbeos  ended    -       sh        exit status 3
iizairlj  ended    -       sh        signal 9
kitzeuit  running  948557  sleep 6…
r67mfnfw  running  951666  sh -c e…
xrysxwhn  running  948560  sh -c s…
```

Kısaltılan sütun başlığının genişliğini korur; bu yüzden ikinci tabloda `COMMAND` 7 sütundur. Bir terminalde olmayan tablo, örneğin bir pipe'taki tablo, hiçbir zaman kısaltılmaz.

#### `nomux ls --memory`

`--memory` ile komut, her Session'ın process'lerinin komutun çalıştığı anda kullandığı belleği de gösterir. Belleği daemon yalnızca bu komut için ölçer: `--memory` olmadan `ls` hiçbir şey ölçmez.

```console
$ nomux ls --memory
ID        STATE    MEMORY     PROCESSES  HOLDER     MEASURE  COMMAND
3ohij454  dormant  -          -          -          -        sh
bxebg7jh  running  147.0 KiB  1          274.0 KiB  pss      sh -c seq 1 200; exec sleep 600
gurnvh37  running  148.0 KiB  1          262.0 KiB  pss      sleep 600
v6srainn  running  150.0 KiB  1          273.0 KiB  pss      sh -c echo server started; exec sleep 600
vn3n3l6r  running  150.0 KiB  1          265.0 KiB  pss      sleep 300
total: 595.0 KiB in 4 processes of 4 sessions, and 1.0 MiB in the holders (pss)
```

| Sütun | Anlamı |
|---|---|
| `MEMORY` | Komutun process ağacının belleği: komut ve ondan türeyen her process. |
| `PROCESSES` | Bu ağaçtaki process sayısı. |
| `HOLDER` | Session'ın holder'ının belleği. `MEMORY`'nin parçası değildir. |
| `MEASURE` | `pss`: birden fazla process'in kullandığı sayfayı bir kez sayan orantılı set boyutu. `rss`: böyle bir sayfayı her process için sayan resident set boyutu. Linux `pss`, macOS `rss` verir. |

- Process'i olmayan bir Session'ın dört sütunu da `-` olur ve toplam satırına girmez.
- Tabloda `PID` ve `NOTE` sütunları yoktur. `--memory` olmadan `ls` bu sütunları gösterir.
- Bir boyutun birimi `KiB`, `MiB` ya da `GiB`'dir (1024 byte, 1024 KiB, 1024 MiB) ve bir ondalık basamağı vardır. JSON çıktısında byte sayısı bulunur.
- Session'ların ölçüsü aynı değilse toplam satırında `pss and rss` yazar: toplam bu durumda iki türden değer içerir.
- `--memory`, `--all` ile birlikte çalışır.
- Bu seçeneği bilmeyen eski bir daemon hatayla cevap verir ve çıkış kodu 1 olur.
- `--host` ile uzak Host'un daemon'u, o Host'taki process'leri ölçer.

Daemon'un nasıl ölçtüğünü, değerlerin neyi saymadığını ve komutun ne kadar sürdüğünü [Session belleği](/docs/tr/guides/session-memory/) sayfası anlatır.

### `nomux attach`

Terminalinizi bir Session'ın terminali yapar; siz detach olana ya da Session sonlanana kadar. Uykudaki bir Session yeniden başlar.

```text
Usage: nomux attach [OPTIONS] <ID>

Arguments:
  <ID>  The session identifier

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help

Keys during an attach:
  Ctrl-\ d       Detach. The session continues
  Ctrl-\ Ctrl-\  Send one Ctrl-\ to the session

Each other key goes to the session. The exit code is the exit status of the
command if the session ends during the attach, and 0 after a detach.
```

Attach sırasında şunlar olur:

1. Session, terminalinizin pencere boyutunu alır.
2. Terminal Session'ın o anki ekranını gösterir. Ekranını daha önce çizmiş bir program, örneğin bir editör, hemen görünür.
3. Bastığınız her tuş Session'a gider; Session'ın yazdığı her byte terminalinizde görünür. Terminal raw moddadır: `Ctrl-C` ve `Ctrl-Z` Session'daki programlara ulaşır.
4. Pencerenin boyutu değişirse Session yeni boyutu alır.

Uykudaki bir Session'da attach önce komutu, Session'ın çalışma dizininde ve terminalinizin pencere boyutuyla yeniden başlatır. Terminal önce eski çıktının sonunu, ardından `--- nomux: the session started again. The output before this line is from the command that stopped ---` satırını, sonra da yeni komutun ekranını gösterir. Session'ın önceki process'leri geri gelmez.

Komut, standart girdide bir terminal bekler.
Aynı Session'a aynı anda birden fazla terminal attach olabilir. Hepsi aynı çıktıyı görür, hepsinden yazılabilir.
Session'ın tek bir pencere boyutu vardır: en son attach olan ya da boyutu en son değişen terminalinki. Boyutu farklı olan terminal, çıktıyı programların o boyut için ürettiği hâliyle görür.

Attach, Session'ın ekranını gösterir; ekrandan çıkmış satırları göstermez. Onları [`nomux capture`](#nomux-capture) yazdırır.

#### Tuşlar

Önek tuşu `Ctrl-\`'dir. Raw modda olmayan bir terminal bu tuş için `SIGQUIT` gönderir; bu yüzden ona iş yükleyen program neredeyse yoktur.

| Tuşlar | Ne yapar |
|---|---|
| `Ctrl-\`, ardından `d` | Detach. Session yaşamaya devam eder |
| İki kez `Ctrl-\` | Session'a tek bir `Ctrl-\` gönderir |
| `Ctrl-\`, ardından başka bir tuş | İki tuşu da Session'a gönderir |

Bu sürümde tuşlar değiştirilemez.

#### Attach nasıl biter

Her durumda terminal eski moduna döner. CLI terminalin alternate screen'ini kullanmaz: attach bittiğinde terminalde Session'ın son ekranı durur, mesaj da onun altına yazılır.

| Olay | Mesaj | Çıkış kodu |
|---|---|---|
| Siz detach olursunuz, `nomux detach` istemciyi detach eder ya da terminal kapanır | `detached from session <id>` | 0 |
| Session'ın komutu biter | `session <id> ended with exit status <n>` | `<n>`: komutun çıkış durumu |
| Session'ın komutunu bir sinyal sonlandırır | `session <id> ended by signal <n>` | 128 + `<n>`; shell'in verdiği değerle aynı |
| Session sonlanır ama daemon çıkış durumunu alamaz | `session <id> ended; its exit status is not known` | 1 |
| Daemon durur ya da çöker | Session'ın yaşadığını ve nasıl yeniden attach olunacağını söyleyen bir hata | 1 |
| Uzak Host'a bağlantı kopar | Attach yeniden bağlanır. Yaklaşık 48 saniye bağlantı olmazsa nasıl yeniden attach olunacağını söyleyen bir hata | Hatadan sonra 1 |
| CLI `SIGTERM`, `SIGHUP`, `SIGINT` ya da `SIGQUIT` alır | Bir hata | 1 |
| Verilen kimlikte bir Session yok ya da Session'ın komutu attach'ten önce bitmiş | Bir hata | 2 |
| Session uykuda ve geri yükleme politikası `manual`, ya da komutu başlatılamıyor | Bir hata | 1 |

Yani `attach`'in çıkış kodu [çıkış kodları](#çıkış-kodları) tablosunda olmayan bir değer olabilir; 1 ile 5 arasındaki değerler de Session'ın komutundan gelebilir.

Aşağıda attach'in dört bitişi var: detach, 3 çıkış durumuyla biten komut, sinyalle sonlanan komut ve duran daemon.

```console
detached from session 3ohij454
```

```console
sh-5.3$ exit 3
exit

session 6u5wjcn4 ended with exit status 3
```

```console
sh-5.3$ kill -9 $$

session 5hi3yzhd ended by signal 9
```

Son ikisinin çıkış kodu 3 ve 137'dir.

```console
nomux: the daemon stopped. The session continues: run `nomux attach l7blp5b2` to attach again
```

Verilen kimlikte bir Session yoksa ya da Session bitmişse:

```console
$ nomux attach aaaaaaaa
nomux: no session has the identifier aaaaaaaa
$ nomux attach ijzhc3lz
nomux: session ijzhc3lz ended: its command does not run
```

Terminali olmayan bir `attach`, Session'ı aramadan önce başarısız olur: çıkış kodu 1'dir ve mesaj `nomux: attach needs a terminal: the standard input is not a terminal` olur.

### `nomux start`

Uykudaki bir Session'ın komutunu attach olmadan yeniden başlatır.

```text
Usage: nomux start [OPTIONS] <ID>

Arguments:
  <ID>  The session identifier

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

Komut, Session'ın çalışma dizininde ve Session'ın son pencere boyutuyla başlar. Geri yükleme politikası `manual` olsa da başlar.

```console
$ nomux start 3ohij454
session 3ohij454 runs
```

- Komutu zaten çalışan bir Session'da komut başarılı olur ve hiçbir şeyi değiştirmez.
- Biten bir Session'da çıkış kodu 2'dir: `nomux: session ijzhc3lz ended: its command does not run`.
- Komut başlatılamazsa, örneğin çalışma dizini silinmişse, çıkış kodu 1'dir ve Session uykuda kalır.

### `nomux capture`

Bir Session'ın son çıktı satırlarını attach olmadan yazdırır.

```text
Usage: nomux capture [OPTIONS] <ID>

Arguments:
  <ID>  The session identifier

Options:
      --json         Print the result as one JSON document
      --lines <N>    The number of lines [default: 100]
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux new -- sh -c 'seq 1 200; exec sleep 600'
bxebg7jh
$ nomux capture bxebg7jh --lines 3
198
199
200
```

- Satırlar, Session'ın diskteki journal'ından gelir. Bu yüzden komut ekrandan çıkmış satırları, geri yüklemeden önceki satırları ve uykudaki ya da biten bir Session'ın satırlarını da yazdırır.
- Çıktı, komutun yazdığı byte'ların kendisidir; escape dizileri de içindedir. Bir satır, terminale geldiği gibi carriage return ve line feed ile biter.
- Session'ın daha az satırı varsa komut bütün çıktısını yazdırır.
- `--quiet` ile çıktı aynıdır.

### `nomux restore-policy`

Uykudaki bir Session'ın ne zaman yeniden başlayacağını belirler.

```text
Usage: nomux restore-policy [OPTIONS] <ID> <POLICY>

Arguments:
  <ID>      The session identifier
  <POLICY>  auto: when the daemon starts. on-focus: at the first attach. manual: only with `nomux start`

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

| Politika | Komut ne zaman yeniden başlar |
|---|---|
| `auto` | Daemon başladığında, örneğin oturum açılışında |
| `on-focus` | İlk `attach` ya da `start` ile. Varsayılan budur |
| `manual` | Yalnızca `start` ile. `attach` 1 çıkış koduyla başarısız olur |

```console
$ nomux restore-policy v6srainn auto
session v6srainn has the restore policy auto
$ nomux restore-policy 3ohij454 sometimes
error: invalid value 'sometimes' for '<POLICY>': a restore policy is `auto`, `on-focus` or `manual`

For more information, try '--help'.
```

Varsayılan politika, Host'un yapılandırma dosyasındaki `[restore]` tablosunun `default_policy` anahtarıdır. Dosya [Yeniden başlatmadan sonra](/docs/tr/guides/after-a-restart/) sayfasındadır.

### `nomux detach`

Bir Session'a attach olmuş bütün istemcileri, başka bir terminalden ya da bir script'ten detach eder. Session yaşamaya devam eder.

```text
Usage: nomux detach [OPTIONS] <ID>

Arguments:
  <ID>  The session identifier

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

Bu istemcilerin her biri, detach tuşlarına basılmış gibi biter. Attach olmuş istemci yoksa da komut başarılıdır:

```console
$ nomux detach 7uk6xzoz
detached 1 client from session 7uk6xzoz
$ nomux detach 7uk6xzoz
detached 0 clients from session 7uk6xzoz
```

Verilen kimlikte bir Session yoksa çıkış kodu 2'dir.
Kimlik vermek zorunludur. Kendi terminalinizi detach etmek için detach tuşlarını kullanın.

### `nomux kill`

Bir Session'ı sonlandırır ve komutu bitene kadar bekler. Uykudaki bir Session'ı çıktısıyla birlikte siler.

```text
Usage: nomux kill [OPTIONS] <ID>

Arguments:
  <ID>  The session identifier

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

Session'ın komutuna `SIGHUP` gönderilir. Komut 2 saniye sonra hâlâ çalışıyorsa `SIGKILL` gönderilir. Session bundan sonra biten bir Session'dır: `ls --all` onu saklama süresi boyunca gösterir.

```console
$ nomux kill vn3n3l6r
session vn3n3l6r ended
```

Verilen kimlikte bir Session yoksa ya da komutu zaten bitmişse çıkış kodu 2'dir. Aynı Session için ikinci `kill` de bu yüzden 2 ile biter:

```console
$ nomux kill vn3n3l6r
nomux: session vn3n3l6r ended: its command does not run
```

Uykudaki ve bozuk Session'ların sonlandırılacak bir komutu yoktur. `kill` böyle bir Session'ı state dizinindeki dosyalarıyla birlikte siler: çıktısı da gider.

## Daemon komutları

### `nomux daemon status`

Daemon'un çalışıp çalışmadığını gösterir. Daemon çalışıyorsa çıkış kodu 0, çalışmıyorsa 2'dir. Bu komut daemon başlatmaz.

```text
Usage: nomux daemon status [OPTIONS]

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux daemon status
nomuxd 0.4.0 runs: process ID 942506, 6 sessions
$ nomux daemon stop
nomuxd stopped
$ nomux daemon status
nomuxd does not run
```

### `nomux daemon stop`

Daemon'u durdurur. Session'lar çalışmaya devam eder. Bu komut daemon başlatmaz.
O anda bir Session'a attach olmuş istemci hata verir ve 1 çıkış koduyla biter. Bkz. [attach nasıl biter](#attach-nasıl-biter).

```text
Usage: nomux daemon stop [OPTIONS]

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

Çalışan bir daemon yoksa da çıkış kodu 0'dır, çünkü sonuç aynıdır. Komut bu durumda `nomuxd does not run` yazdırır.

### `nomux daemon install-service`

Daemon'u oturum açılışında başlatan servis dosyasını yazar: Linux'ta bir systemd kullanıcı unit'i, macOS'ta bir launchd agent'ı.

```text
Usage: nomux daemon install-service [OPTIONS]

Options:
      --dry-run      Print the path and the content of the file, and write nothing
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux daemon install-service
wrote /tmp/nomux-demo/.config/systemd/user/nomuxd.service
To start the daemon at each login, run: systemctl --user daemon-reload && systemctl --user enable --now nomuxd.service
```

- Komut yalnızca kullanıcının yapılandırma dizinlerine yazar: Linux'ta `$XDG_CONFIG_HOME/systemd/user` ya da `~/.config/systemd/user`, macOS'ta `~/Library/LaunchAgents`. `sudo` gerekmez.
- Hiçbir program başlatmaz. Çıktısında, dosyayı servis yöneticisine veren komut yazar.
- `nomuxd`, `nomux` ile aynı dizinde olmalıdır: dosyada onun yolu yazılıdır.

Dosyanın içeriği ve satırlarının açıklaması [Yeniden başlatmadan sonra](/docs/tr/guides/after-a-restart/) sayfasındadır.

### `nomux daemon uninstall-service`

Servis dosyasını siler.

```text
Usage: nomux daemon uninstall-service [OPTIONS]

Options:
      --dry-run      Print the path of the file, and remove nothing
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux daemon uninstall-service --dry-run
would remove /tmp/nomux-demo/.config/systemd/user/nomuxd.service
$ nomux daemon uninstall-service
removed /tmp/nomux-demo/.config/systemd/user/nomuxd.service
The daemon that runs continues. To make the service manager forget the file, run: systemctl --user daemon-reload
$ nomux daemon uninstall-service
no service file: /tmp/nomux-demo/.config/systemd/user/nomuxd.service does not exist
```

Dosya yoksa da çıkış kodu 0'dır. Çalışan daemon çalışmaya devam eder.

## Host komutları

Bu komutlar, bilgisayarınızdaki yapılandırma dosyasında duran uzak Host'ları yönetir. Bağlantı, güven kuralları ve nomux'un Host'a yazdıkları [Uzak Host'lar](/docs/tr/guides/remote-hosts/) sayfasındadır.
Bir Host'a bağlanan komutlar (`host add` ve bir Host verilen `host doctor`) bu sayfa için çalıştırılmadı. Anlatımları nomux 0.4.0'ın [`docs/cli.md`](https://github.com/nomux-sh/nomux/blob/v0.4.0/docs/cli.md) dosyasından alındı; o dosya bu komutları 0.3.0 dokümanıyla aynı biçimde anlatır.

### `nomux host add`

SSH ile bir Host'a bağlanır, oraya nomux'u kurar ve Host'u kaydeder.

```text
Usage: nomux host add [OPTIONS] <SSH-TARGET>

Arguments:
  <SSH-TARGET>  The SSH destination: [user@]host, ssh://[user@]host[:port] or a Host name of ~/.ssh/config

Options:
      --json         Print the result as one JSON document
      --name <NAME>  The name of the host for --host [default: the host part of the destination]
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

Komut bağlanır, Host'un sistemini ve işlemcisini bulur, Host'ta yoksa CLI'ın sürümündeki üç binary'yi `~/.nomux/bin/<sürüm>` altına kurar, çalışan daemon yoksa daemon'u başlatır ve yapılandırma dosyasına `[hosts.<ad>]` yazar. Host'u yalnızca bu adımların hepsi başarılı olursa kaydeder.

- Ad yalnızca `a`-`z`, `A`-`Z`, `0`-`9`, `.`, `_` ve `-` karakterlerinden oluşur.
- Komutu aynı ad ve aynı hedefle tekrar çalıştırabilirsiniz. Ad zaten başka bir hedefle kayıtlıysa komut başarısız olur.
- Bilinmeyen bir host anahtarı hatadır; hata mesajında parmak izi ve anahtarı ekleyen `ssh` komutu yazar.

### `nomux host ls`

Yapılandırma dosyasındaki Host'ları listeler. Hiçbir Host'a bağlanmaz.

```text
Usage: nomux host ls [OPTIONS]

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux host ls
NAME  SSH
vps   deploy@vps.example.com
```

Hiç Host yoksa komut `no hosts` yazdırır.

### `nomux host rm`

Bir Host'u yapılandırma dosyasından siler. Host'ta hiçbir şey değişmez.

```text
Usage: nomux host rm [OPTIONS] <NAME>

Arguments:
  <NAME>  The name of the host

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux host rm vps
host vps removed
$ nomux host rm vps
nomux: no host has the name vps
```

Dosyada bu ad yoksa çıkış kodu 2'dir.

### `nomux host doctor`

Bir Host'un bağlantısını, platformunu, binary'lerini, izinlerini ve daemon'unu kontrol eder. Host'ta hiçbir şeyi değiştirmez.

```text
Usage: nomux host doctor [OPTIONS] [NAME]

Arguments:
  [NAME]  The name of the host [default: each host of the configuration file]

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

Kontroller `connection`, `platform`, `binaries`, `permissions`, `daemon` ve `versions`'tır. Her birinin ne zaman geçtiği [Uzak Host'lar](/docs/tr/guides/remote-hosts/) sayfasındadır. Her Host'un her kontrolü geçtiyse çıkış kodu 0, bir kontrol başarısız olduysa 1'dir.

```console
$ nomux host doctor
no hosts
```

## Extension komutları

Bu komutlar daemon'un extension host'unu kullanır. Kullanımları [Extension'lar](/docs/tr/guides/extensions/) sayfasındadır.

### `nomux ext ls`

Kurulu extension'ları listeler.

```text
Usage: nomux ext ls [OPTIONS]

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux ext ls
ID          NAME  VERSION  STATE    PERMISSIONS                             REASON
nomux.echo  Echo  0.1.0    stopped  -
nomux.git   Git   0.1.0    stopped  fs=/tmp/nomux-demo/project,process=git
```

Hiç extension yoksa komut `no extensions` yazdırır.

| Durum | Anlamı |
|---|---|
| `stopped` | Extension etkin ve process'i çalışmıyor. Sonraki çağrı onu başlatır |
| `starting` | Process başladı ama hazır değil |
| `running` | Process çalışıyor. 60 saniye çağrı gelmezse durur |
| `failed` | Process çöktü. Bir süre bekledikten sonra gelen ilk çağrı onu yeniden başlatır. `REASON` hatayı söyler |
| `disabled` | Daemon extension'ı başlatmaz. `REASON` nedenini söyler: kullanıcı devre dışı bıraktı ya da extension art arda 5 kez çöktü |
| `unknown` | Daemon CLI'dan daha yeni ve CLI'ın tanımadığı bir durum gönderdi |

### `nomux ext install`

Host'taki bir dizinden, seçeneklerin onayladığı izinlerle bir extension kurar.

```text
Usage: nomux ext install [OPTIONS] <DIRECTORY>

Arguments:
  <DIRECTORY>  The directory of the package, which has the file extension.toml

Options:
      --grant <PERMISSION>  Approve one permission that the extension asks for: fs=<directory>, process=<program>, network or scope=<scope>
      --json                Print the result as one JSON document
      --grant-all           Approve each permission that the extension asks for, but not a directory that starts with ${worktree}
  -q, --quiet               Print only the necessary part of the result
      --host <NAME>         Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help                Print help
```

| Komut satırı | Sonuç |
|---|---|
| `--grant` de `--grant-all` de yok ve manifest bir izin istiyor | Komut izinleri yazdırır, hiçbir şey kurmaz ve 4 çıkış koduyla biter |
| Bir ya da daha fazla `--grant <izin>` | Extension yalnızca bu izinleri alır, diğerlerini almaz |
| `--grant-all` | Extension istediği her izni alır; yalnızca `${worktree}` ile başlayan dizin hariç: onu `--grant fs=<dizin>` ile verin |
| Manifest hiçbir izin istemiyor | Komut extension'ı kurar |

| Biçim | Manifest'teki izin |
|---|---|
| `fs=<directory>` | `fs` listesinden bir öğe. `${worktree}` ile başlayan bir öğe için, öğenin geri kalanıyla biten mutlak bir yol |
| `process=<program>` | `process` listesinden bir öğe |
| `network` | `network = true` |
| `scope=<scope>` | `scopes` listesinden bir öğe, örneğin `scope=sessions:read` |

```console
$ nomux ext install ./nomux-git --grant-all --grant fs=/tmp/nomux-demo/project
extension nomux.git 0.1.0 installed with the permissions: fs=/tmp/nomux-demo/project process=git
```

Manifest'in istemediği bir `--grant`, geçersiz bir manifest ve zaten kurulu bir extension 1 çıkış kodunu verir; bu durumda hiçbir şey kurulmaz.
`--host` ile `<DIRECTORY>`, uzak Host'ta mutlak bir yoldur. Komut extension'ın process'ini başlatmaz.

### `nomux ext rm`

Bir extension'ı durdurur; paketini, state'ini ve verisini siler.

```text
Usage: nomux ext rm [OPTIONS] <ID>

Arguments:
  <ID>  The identifier of the extension

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux ext rm nomux.echo
extension nomux.echo removed
$ nomux ext rm nomux.echo
nomux: no extension has the identifier nomux.echo
```

### `nomux ext enable` ve `nomux ext disable`

`enable` bir extension'ı etkinleştirir; daemon onu art arda çöktüğü için devre dışı bıraktıysa da. `disable` bir extension'ı devre dışı bırakır ve process'ini durdurur.

```text
Usage: nomux ext enable [OPTIONS] <ID>

Arguments:
  <ID>  The identifier of the extension
```

```text
Usage: nomux ext disable [OPTIONS] <ID>

Arguments:
  <ID>  The identifier of the extension
```

Seçenekler `ext rm` ile aynıdır.

```console
$ nomux ext disable nomux.echo
extension nomux.echo disabled
$ nomux ext enable nomux.echo
extension nomux.echo enabled
$ nomux ext enable nomux.none
nomux: no extension has the identifier nomux.none
```

`enable`, `disable` ve `rm` verilen kimlikte bir extension yoksa 2 çıkış koduyla biter.

### `nomux ext call`

Bir extension'ın bir metodunu çağırır ve sonucun payload'ını, başka hiçbir byte eklemeden standart çıktıya yazar. Extension'ın process'i çalışmıyorsa daemon onu başlatır.

```text
Usage: nomux ext call [OPTIONS] <ID> <METHOD>

Arguments:
  <ID>      The identifier of the extension
  <METHOD>  The name of the method

Options:
      --json                  Print the result as one JSON document
      --payload <TEXT|@FILE>  The payload of the call, in the encoding of the method: a text, or @<file> for the content of a file [default: an empty payload]
  -q, --quiet                 Print only the necessary part of the result
      --host <NAME>           Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help                  Print help
```

```console
$ nomux ext call nomux.echo echo --payload @request.bin > response.bin
$ nomux ext call nomux.echo nothing
nomux: the extension answered with an error: the extension has no method `nothing`
```

| Sonuç | Çıkış kodu |
|---|---|
| Metot bir sonuç verdi | 0 |
| Verilen kimlikte bir extension yok, ya da extension böyle bir metodu veya öğesi olmadığını söyledi | 2 |
| Extension 30 saniye içinde cevap vermedi ya da kendi zaman aşımı hatasıyla cevap verdi | 3 |
| Extension gereken izni olmadığını söyledi | 4 |
| Extension devre dışı, process'i başlatılamıyor ya da çöktü, veya extension başka bir hatayla cevap verdi | 1 |

`@` ile başlayan bir metni bir dosyaya koymanız gerekir.

### `nomux ext validate`

Bu bilgisayardaki bir dizinin `extension.toml` dosyasını kontrol eder. Daemon gerektirmez ve `--host`'u yok sayar.

```text
Usage: nomux ext validate [OPTIONS] <DIRECTORY>

Arguments:
  <DIRECTORY>  The directory of the package, which has the file extension.toml

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux ext validate ./nomux-git
extension.toml is valid: nomux.git 0.1.0 (Git) asks for the permissions: fs=${worktree} process=git
$ nomux ext validate ./nothing
nomux: the file ./nothing/extension.toml does not exist
```

Geçerli bir manifest'te çıkış kodu 0, geçersiz bir manifest'te 1, dosyası olmayan bir dizinde 2'dir. Komut paketin diğer dosyalarını kontrol etmez.

## Durum komutları

Bu komutlar, her Session'daki işin ne yaptığını, neyi beklediğini ya da neyi tamamladığını gösterir. Modeli, durumun kaynaklarını ve onları birleştiren kuralları [Agent durumu](/docs/tr/guides/agent-status/) sayfası anlatır. Terimler sözlükte: [agent durumu](/docs/tr/reference/glossary/#agent-durumu).

Bu bölümdeki örnekler, tek bir daemon'daki beş Session'dan gelir:

| Session'ın komutu | Durumu nereden geliyor |
|---|---|
| `sh build.sh` | `nomux status set working "build the docs"` çalıştıran bir script: öz bildirim. |
| `sh ask.sh` | `blocked` durumlu bir OSC 7501 bildirimi yazan bir script: program durumu. |
| `sh replay.sh permission-request 4` | Claude Code'un kaydedilmiş 4 hook olayını `nomux hook claude <olay>` ile gönderen bir script: adapter. |
| `sh replay.sh background-subagent 6` | Aynısı; bir subagent başlatan bir çalışmanın 6 kaydedilmiş olayıyla: Alt işli adapter. |
| `sh` | Hiçbir şey bildirmeyen bir shell. |

Claude Code adapter'ı nomux 0.4.0 ile yayımlanmadı. Örnekler onun bir build'ini kullanır; build `nomux ext install ./claude-adapter --grant-all` ile kuruldu. Her script ilk bildiriminden önce bir saniye bekler.

### `nomux status`

Her Session'ın durumunu gösterir: neyin çalıştığını, neyin bittiğini ve neyin sizi beklediğini.

```text
Usage: nomux status [OPTIONS]
       nomux status <COMMAND>

Commands:
  set  Report the status of the session of this process. The command works only inside a nomux session

Options:
      --json         Print the result as one JSON document
      --tree         Also show the Child work of each session
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

| Seçenek | Ne yapar |
|---|---|
| `--tree` | Her Alt işi, Session'ının altında bir satır olarak gösterir; her seviye için iki boşluk içeri alınır. Hiçbir kaynağın bildirmediği bir Alt işin durumu `-` olur. |

```console
$ nomux status
  SESSION   COMMAND                             STATE                  FOR  MESSAGE
* 3i7kj4zx  sh replay.sh background-subagent 6  working                2s
* 43ks3umx  sh build.sh                         working                3s   build the docs
! ab56frrn  sh ask.sh                           needs you: question    3s   which branch?
  hsleq2qd  sh                                  idle                   4s
! n4taafjh  sh replay.sh permission-request 4   needs you: permission  2s   touch b.txt
$ nomux status --tree
  SESSION              COMMAND                             STATE                  FOR  MESSAGE
* 3i7kj4zx             sh replay.sh background-subagent 6  working                2s
*   a45f24c823c444cb5                                      working                2s
* 43ks3umx             sh build.sh                         working                3s   build the docs
! ab56frrn             sh ask.sh                           needs you: question    3s   which branch?
  hsleq2qd             sh                                  idle                   4s
! n4taafjh             sh replay.sh permission-request 4   needs you: permission  2s   touch b.txt
$ nomux status --quiet
ab56frrn
n4taafjh
```

Her satırda şunlar vardır: durumun işareti, session kimliği, komut, durum, durumda geçen süre (`FOR`) ve mesaj.

- Satırlar session kimliğine göre sıralıdır. Komut, biten olmayan her Session için ve son Agent çalışmasını saklayan (aşağıya bakın) her biten Session için bir satır yazdırır. Hiç Session yoksa `no sessions` yazdırır.
- Satırın durumu, Session'ın ve Alt işlerinin en acil durumudur. Bir kaynak bekleyişin türünü söylüyorsa `needs you` bunu taşır: `needs you: permission`, `needs you: question` ya da `needs you: auth`.
- İşaretler: `!` needs you, `x` error, `+` done, `*` working; idle için işaret yoktur.
- Daemon'un tahmin ettiği bir durumun yanında `(guess)` yazar; örneğin ön planda `sleep 600` çalıştıran bir shell için `working (guess)`. Tahmin, shell'in prompt işaretlerinden ya da terminalin ön plandaki programından gelir; bir programın bildiriminden asla.
- Sizin gördüğünüz bir sonucun yanında `(seen)` yazar; örneğin `done (seen)`. Bir Session'a attach olmak, onun sonuçlarını görüldü olarak işaretler.
- `--quiet` ile komut, sizi bekleyen her Session'ın kimliğini, her satıra bir tane olarak yazdırır. Çıkış kodu her durumda 0'dır.
- `--json` ile doküman aynı Session'ları içerir. Alanlar [JSON bölümündeki `status`](#status) başlığındadır.

Biten bir Session, son Agent çalışmasını saklar: saklanan çalışma. Yukarıdaki örnekteki `n4taafjh` Session'ına uygulanan `nomux kill`, onun satırını değiştirir. Bekleyen iş artık `done` olur ve satır, daemon Session'ı silene kadar kalır:

```console
$ nomux kill n4taafjh
session n4taafjh ended
$ nomux status
  SESSION   COMMAND                             STATE                FOR  MESSAGE
* 3i7kj4zx  sh replay.sh background-subagent 6  working              8s
* 43ks3umx  sh build.sh                         working              8s   build the docs
! ab56frrn  sh ask.sh                           needs you: question  8s   which branch?
  hsleq2qd  sh                                  idle                 9s
+ n4taafjh  sh replay.sh permission-request 4   done                 0s
```

### `nomux status set`

Komutun çalıştığı Session'ın durumunu bildirir. OSC 7501 yazmayan bir script ya da araç bunu kullanır: durum bir öz bildirimdir.

```text
Usage: nomux status set [OPTIONS] <STATE> [MESSAGE]

Arguments:
  <STATE>    The state of the work in the session. idle takes the report back [possible values: working, done, blocked, error, idle]
  [MESSAGE]  What the work does, waits for or completed: one line

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

| Durum | Agent durumu |
|---|---|
| `working` | `working` |
| `done` | `done` |
| `blocked` | `needs you` |
| `error` | `error` |
| `idle` | Komut bildirimini geri alır. |

```console
$ nomux status set working "tests run"
session ab5azvpo: working
$ nomux status set blocked "run the tests?"
session ab5azvpo: needs you
$ nomux status set error "2 tests failed"
session ab5azvpo: error
$ nomux status set idle
session ab5azvpo: the report is taken back
```

- Komut, holder'ın bir Session'ın her process'ine verdiği `NOMUX_SESSION_ID`, `NOMUX_SOCK` ve `NOMUX_TOKEN` değişkenlerini okur. `NOMUX_SOCK`'taki socket'e bağlanır. Daemon başlatmaz ve `--host` kabul etmez.
- Bir bildirim, bir sonrakine kadar kalır.
- Mesaj tek satırdır; en fazla 512 byte olabilir ve kontrol karakteri içeremez. Çok uzun bir mesaj ya da satır sonu içeren mesaj 1 çıkış kodunu verir:

```console
$ nomux status set done "$(printf 'a\nb')"
nomux: the message must be one line of text without a control character
$ nomux status set done "$(head -c 600 /dev/zero | tr '\0' a)"
nomux: the message has 600 bytes: 512 at most
```

- 4 çıkış kodu, komutun kendi Session'ını kanıtlayamadığı anlamına gelir: bir değişken tanımlı değil (komut bir Session'da çalışmıyor), token yanlış, Session'ın process'i yok ya da holder'ı token üretemeyecek kadar eski.

```console
$ nomux status set working
nomux: NOMUX_SESSION_ID is not set: `nomux status set` works only inside a nomux session
$ NOMUX_TOKEN=0000 nomux status set done
nomux: the status of session ab5azvpo did not change: the token of the request is not the token of the session
```

`--quiet` ile komut hiçbir şey yazdırmaz.

### `nomux agent explain`

Her kaynağın bir Session'ın durumu hakkında ne söylediğini gösterir. Bir durum beklediğiniz gibi değilse bunu kullanın.

```text
Usage: nomux agent explain [OPTIONS] <ID>

Arguments:
  <ID>  The session identifier

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

İlk satır, Session'ın durumudur ve kaynağını da yazar. Altındaki liste, her kaynağı karar verme sırasıyla gösterir: ne söylediğini ve nedenini, yani kaynağın notunu. Hiçbir şey bildirmeyen bir kaynak da listede yer alır.

```console
$ nomux agent explain 43ks3umx
session 43ks3umx: working for 3s, from self-report; message from self-report: build the docs

sources, in the sequence in which they decide:
  adapter             nothing: no adapter extension reported a status
  program status      nothing: no program of the session reported a status
  self-report         working: build the docs (a program of the session reported it with `nomux status set`)
  session restore     nothing: the session did not lose a process with work that ran or waited
  prompt marks        nothing: the shell of the session sent no prompt mark
  foreground program  nothing: the command of the session is in the foreground of its terminal
```

Session'ın Alt işi varsa çıktı onları listeler. Bir adapter ayrıntı verdiyse çıktı onlarla biter: aracın session kimliği ve resume komutu.

```console
$ nomux agent explain 3i7kj4zx
session 3i7kj4zx: working for 2s, from adapter

sources, in the sequence in which they decide:
  adapter             working (an adapter extension reported it from the events of the agent tool)
  program status      nothing: no program of the session reported a status
  self-report         nothing: no program of the session reported a status with `nomux status set`
  session restore     nothing: the session did not lose a process with work that ran or waited
  prompt marks        nothing: the shell of the session sent no prompt mark
  foreground program  nothing: the command of the session is in the foreground of its terminal

child work:
  a45f24c823c444cb5: working for 2s, from adapter

from the adapter:
  tool session: 00000000-0000-4000-8000-000000000003
  resume: claude --resume 00000000-0000-4000-8000-000000000003
```

Biten bir Session için komut, daemon Session'ı silene kadar saklanan çalışmasını, aracın resume komutuyla birlikte yazdırır. Durum `session restore` kaynağından gelir:

```console
$ nomux agent explain n4taafjh
session n4taafjh: done for 0s, from session restore

sources, in the sequence in which they decide:
  adapter             nothing: no adapter extension reported a status
  program status      nothing: the session has no process
  self-report         nothing: no program of the session reported a status with `nomux status set`
  session restore     done (the session lost its process: the status is what the session had then, and work that ran or waited is shown as complete)
  prompt marks        nothing: the session has no process
  foreground program  nothing: the session has no process

from the adapter:
  tool session: 00000000-0000-4000-8000-000000000006
  resume: claude --resume 00000000-0000-4000-8000-000000000006
```

Verilen kimlikte bir Session yoksa ya da biten bir Session'ın saklanan çalışması yoksa çıkış kodu 2'dir:

```console
$ nomux agent explain aaaaaaaa
nomux: no session that is not ended has the identifier aaaaaaaa
```

`--quiet` ile komut hiçbir şey yazdırmaz. `--json` ile doküman, [`agent explain`](#agent-explain) dokümanıdır.

### `nomux events`

Host'un olaylarını geldikçe yazdırır; bir sinyal komutu durdurana kadar. Bu sürümdeki tek kip `--follow`'dur.

```text
Usage: nomux events [OPTIONS] --follow

Options:
      --follow
          Wait for the events. This is the only mode now

      --json
          Print the result as one JSON document

      --filter <TYPE>
          Print only the events of this type. Give the option more than one time for more types

          Possible values:
          - agent-run-changed: The status of a session or of its Child work changed
          - agent-run-removed: A session ended or was removed
          - extension-event:   The daemon part of an extension sent an event

  -q, --quiet
          Print only the necessary part of the result

      --host <NAME>
          Use the daemon of a remote host of `nomux host ls` [default: the local host]

  -h, --help
          Print help (see a summary with '-h')
```

`--follow` olmadan `nomux events` 1 çıkış koduyla biter ve argüman ayrıştırıcının kullanım mesajını yazdırır.

| Seçenek | Ne yapar |
|---|---|
| `--follow` | Olaylara abone olur ve her olayı geldiğinde yazdırır. |
| `--filter <type>` | Yalnızca bir türün olaylarını yazdırır: `agent-run-changed`, `agent-run-removed` ya da `extension-event`. Daha fazla tür için seçeneği birden çok kez verin. Snapshot her zaman yazdırılır. |

Aşağıdaki, bir Session `sh report.sh` çalıştırırken (`nomux status set` ile `working`, `blocked` ve `done` bildiren bir script) ve `nomux kill` durumu olmayan bir Session'ı sonlandırırken alınan metin çıktısıdır:

```console
$ nomux events --follow
12 52bhqxil working build the docs
13 52bhqxil needs you deploy to production?
14 52bhqxil done docs built
15 52bhqxil done docs built
16 rado2qro removed
```

- Komut, başladıktan sonraki olayları yazdırır. Daemon'da komutun ihtiyaç duyduğu olaylar yoksa bir snapshot gelir.
- Bir satır, değişiklik için `<seq> <session> <state> <message>`; biten ya da silinen bir Session için `<seq> <session> removed`; bir extension olayı için `<seq> extension <id>: <name> (<n> bytes)`; snapshot için `<seq> snapshot: ...` biçimindedir. Metinde kaynak yoktur: 15. satır, Session'ın komutu bittiğinde ve kaynak `self-report`'tan `session restore`'a geçtiğinde gelir. Olayın JSON dokümanı kaynağı gösterir.
- `<seq>`, olayın daemon'un olay günlüğündeki sırasıdır. Daemon yeniden başlayınca numaralar yeniden başlar.
- `--quiet` ile çıktı aynı satırlardır.
- Çıkış kodu şu durumlarda 0'dır: `SIGINT` (Ctrl-C) ya da `SIGTERM` komutu durdurduğunda, daemon bağlantıyı kapattığında (örneğin `nomux daemon stop` sonrası) ve standart çıktıyı okuyan taraf onu kapattığında.

`--json` ile her satır bir JSON dokümanıdır (NDJSON). Filtre verilirse komut yalnızca filtrenin adını verdiği türlerin olaylarını yazdırır. Aşağıdaki, aynı kill sırasında alınan `nomux events --follow --json --filter agent-run-removed` çıktısıdır:

```console
$ nomux events --follow --json --filter agent-run-removed
{"schema_version":1,"event":{"seq":16,"at_ms":1795691221747,"type":"agent_run_removed","session":"rado2qro"}}
```

Bu bölümde bu sayfa için çalıştırılmayanlar: bir `extension-event` ve bir `snapshot` satırı. Claude Code adapter'ı hiçbir extension olayı göndermez; daemon da snapshot'ı yalnızca fazla geride kalmış bir istemciye gönderir.

## Hook komutları

Bir agent aracı, örneğin Claude Code, işinin her olayında bir komut çalıştırır. nomux için bu komut `nomux hook <araç> <olay>`'dır. Aracın adapter extension'ı olayları bir duruma çevirir. Bir olayın izlediği yolu [Agent adapter'ları](/docs/tr/guides/agent-adapters/) sayfası, Claude Code hook'larının kullanımını [Claude Code](/docs/tr/guides/claude-code/) sayfası anlatır.

Bu bölümdeki örnekler Claude Code adapter'ını kullanır; adapter nomux 0.4.0 ile yayımlanmadı. Paket onun bir build'idir. `nomux ext install ./claude-adapter --grant-all` onu çalıştırmanın home dizinine kurdu; ayar dosyası da o home dizinindeki `~/.claude/settings.json`'dur. Dosyada, ilk örnekten önce kullanıcının kendi bir hook'u vardı:

```json
{
  "model": "sonnet",
  "hooks": {
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": "notify-send",
            "args": ["done"]
          }
        ]
      }
    ]
  }
}
```

### `nomux hook`

Bir agent aracının tek bir olayını Session'ın daemon'una gönderir. Bir araç bu komutu kendi hook'larından çağırır: olayın verisini standart girdiden okur.

```text
Usage: nomux hook [OPTIONS] <TOOL> <EVENT>

Arguments:
  <TOOL>   The name of the tool, as its adapter extension names it
  <EVENT>  The name of the event

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

`hooks install` bu çağrıyı aracın ayar dosyasına yazar; komutu kendiniz yazmazsınız. Aşağıdaki, olayın verisi Claude Code'un verdiği biçimde olan bir veri dosyasıyla tek bir olayın çağrısıdır:

```console
$ nomux hook claude PermissionRequest < replay/permission-request/04-PermissionRequest.json
$ echo $?
0
```

Komut hiçbir şey yazdırmaz: bu sürümde araç için cevap boştur.

- Komut, olayın verisini standart girdiden okurken en fazla 256 KiB alır; girdinin sonuna kadar ya da en fazla 40 ms bekler. Daha büyük girdi verisiz gider. Terminal, girdi sayılmaz.
- `NOMUX_SESSION_ID`, `NOMUX_SOCK` ve `NOMUX_TOKEN` değişkenlerini okur, `NOMUX_SOCK`'taki socket'e bağlanır ve tek bir istek gönderir. Daemon, shell ya da başka bir process başlatmaz. `--host` etkisizdir.
- Bir hook, aracını bloklamamalı ve bozmamalıdır: **çıkış kodu her zaman 0'dır.** Session'ın dışında, daemon yokken ve daemon komutun başlamasından sonra 80 ms içinde cevap vermezse komut çıktısız biter. Daemon hook'a, adapter olayı almadan önce cevap verir.
- Daemon olayı reddederse, örneğin token yanlışsa, komut standart hataya tek satır yazar. Çıkış kodu yine 0'dır:

```console
$ echo '{}' | NOMUX_TOKEN=wrong nomux hook claude Stop
nomux hook: the hook event of session jyekle7t was refused: the token of the request is not the token of the session
```

- Adapter'ı olmayan bir araç için çıktı olmaz ve hiçbir durum değişmez.
- `--json` ve `--quiet` ile komut, araç için cevabı bunlarsız olduğu gibi yazdırır: hiçbir şey.

### `nomux hooks`

`hooks` komutları, bir agent aracının hook'larını bu bilgisayardaki ayar dosyasında değiştirir ve gösterir. Hook'ların hangi girdilere ihtiyaç duyduğunu aracın adapter extension'ı tarif eder. `--host` kabul edilmez: aracın ayar dosyası aracın kendi bilgisayarındadır.

```text
Usage: nomux hooks [OPTIONS] <COMMAND>

Commands:
  install    Show the change that the hooks of a tool need in its settings file. Write it only with --apply
  uninstall  Show how the removal of the hooks of a tool changes its settings file. Write it only with --apply
  status     Show each tool: its adapter, and if its hooks are installed, missing or different

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

nomux, `--apply` olmadan hiçbir ayar dosyası yazmaz; bir aracın komutunu hiçbir zaman sarmaz ya da değiştirmez ve aracın izin kontrollerini atlayan hiçbir seçenek eklemez.

### `nomux hooks install`

Bir aracın hook'larının ayar dosyasında gerektirdiği değişikliği gösterir; yalnızca `--apply` ile yazar.

```text
Usage: nomux hooks install [OPTIONS] <TOOL>

Arguments:
  <TOOL>  The name of the tool, as its adapter extension names it

Options:
      --dry-run      Print the change and write nothing. This is the default
      --json         Print the result as one JSON document
      --apply        Write the change to the settings file of the tool
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

Komut adapter'dan kurulum planını ister, ayar dosyasının yeni içeriğini hesaplar ve bunu unified diff olarak yazdırır. Claude Code adapter'ının diff'i 266 satırdır: Claude Code'un her olayı için bir hook. Aşağıdaki ilk komut, `| head -20` ile ilk 20 satırını; ikincisi de çıktının son satırını gösterir:

```console
$ nomux hooks install claude | head -20
--- /tmp/nomux-demo/.claude/settings.json
+++ /tmp/nomux-demo/.claude/settings.json
@@ -7,7 +7,262 @@
           {
             "type": "command",
             "command": "notify-send",
-            "args": ["done"]
+            "args": [
+              "done"
+            ]
+          }
+        ]
+      },
+      {
+        "hooks": [
+          {
+            "type": "command",
+            "command": "nomux",
+            "args": [
+              "hook",
$ nomux hooks install claude | tail -1
dry run: nothing is written. Add --apply to write the change
```

Dosya, kullanıcının hook'unu korur: `Stop` için yeni hook ondan sonra gelir. Komut dosyayı iki boşluk girintili JSON olarak yazar; bu yüzden tek satırda yazdığınız bir değer birkaç satıra bölünebilir, örnekteki `"args": ["done"]` satırında olduğu gibi.

`--apply` ile komut aynı diff'i yazdırır ve dosyayı yazar. Son satır bunu söyler:

```console
$ nomux hooks install claude --apply | tail -1
the hooks of claude are installed in /tmp/nomux-demo/.claude/settings.json
$ nomux hooks install claude --apply
the hooks of claude are installed in /tmp/nomux-demo/.claude/settings.json: nothing to change
```

- `--dry-run` varsayılandır ve bunu yeniden söyler. `--dry-run` ile `--apply` birlikte kullanılamaz: çıkış kodu 1'dir.
- Ayar dosyasının yerine, aynı dizindeki geçici bir dosya geçer; sembolik bağlantı bağlantı olarak kalır. Dosyanın anahtarları sırasını korur. Dosyada zaten olan bir değer yeniden eklenmez: yukarıdaki ikinci komut hiçbir şeyi değiştirmez ve çıkış kodu 0'dır.
- Olmayan bir dosya oluşturulur: diff bu durumda `--- /dev/null` ile başlar.
- `--apply` ayrıca nomux'un veri dizinindeki `hooks/<araç>/` altına bir kayıt yazar (Linux'ta `~/.local/share/nomux`, macOS'ta `~/Library/Application Support/nomux`): kurulumdan önceki dosyanın byte'ları, yazılan dosyanın checksum'ı ve girdiler.
- Aracın adapter'ı yoksa çıkış kodu 2'dir: `nomux: no extension is the adapter of the tool claude`. JSON olmayan bir ayar dosyası 1 çıkış kodunu ve `nomux: the settings file /tmp/nomux-demo/.claude/settings.json cannot get the hooks: key must be a string at line 1 column 3; nothing changed` mesajını verir. Bu durumların hiçbirinde bir şey yazılmaz.

### `nomux hooks uninstall`

Bir aracın hook'larının kaldırılmasının ayar dosyasını nasıl değiştireceğini gösterir; yalnızca `--apply` ile yazar.

```text
Usage: nomux hooks uninstall [OPTIONS] <TOOL>

Arguments:
  <TOOL>  The name of the tool

Options:
      --dry-run      Print the change and write nothing. This is the default
      --json         Print the result as one JSON document
      --apply        Write the change to the settings file of the tool
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

Komut yalnızca `hooks install --apply`'ın yazdığı kaydı ister; daemon'u istemez.

- Ayar dosyası kurulumdan sonra değişmediyse dosya, kurulumdan önceki byte'larına geri döner. Dosya yoksa silinir.
- Dosya değiştiyse yalnızca nomux'un girdileri kaldırılır.

```console
$ nomux hooks uninstall claude | tail -1
dry run: nothing is written. Add --apply to write the change
$ nomux hooks uninstall claude --apply | tail -1
/tmp/nomux-demo/.claude/settings.json has its content from before the install again
$ nomux hooks uninstall claude --apply
nomux: nomux did not install the hooks of claude
```

Son komutun çıkış kodu 2'dir: nomux o aracın hook'larını kurmadı, bu yüzden kaydı yok.

### `nomux hooks status`

Adapter'ı ya da kaydı olan her aracı gösterir: adapter'ı, hook'larının ayar dosyasındaki durumunu ve dosyanın yolunu.

```text
Usage: nomux hooks status [OPTIONS]

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux hooks status
TOOL    ADAPTER             HOOKS
claude  nomux.agent-claude  missing in /tmp/nomux-demo/.claude/settings.json
$ nomux hooks install claude --apply | tail -1
the hooks of claude are installed in /tmp/nomux-demo/.claude/settings.json
$ nomux hooks status
TOOL    ADAPTER             HOOKS
claude  nomux.agent-claude  installed in /tmp/nomux-demo/.claude/settings.json
```

| Durum | Anlamı |
|---|---|
| `installed` | Ayar dosyasında kurulum planının her girdisi var. |
| `missing` | Ayar dosyasında girdilerin hiçbiri yok ya da dosya yok. |
| `different` | Ayar dosyasında kurulum planının girdilerinin bir kısmı var; kurulum diğerlerini ekler. |
| `not known` | nomux ayar dosyasını okuyamıyor. Metin nedenini söyler; örneğin JSON olmayan bir dosya için. |

Adapter'ı ya da kaydı olan bir araç yoksa komut `no tool has an adapter or installed hooks` yazdırır. Çıkış kodu her durumda 0'dır. `--quiet` ile komut hiçbir şey yazdırmaz.

## Diğer komutlar

### `nomux version`

Sürümü yazdırır. `nomux --version` ve `nomux -V` de aynı işi görür.

```text
Usage: nomux version [OPTIONS]

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux version
nomux 0.4.0
$ nomux version --quiet
0.4.0
```

## Sessiz çıktı

`--quiet` ile komut yalnızca bir script'in ihtiyaç duyduğu kısmı yazdırır.

| Komut | Standart çıktı |
|---|---|
| `new` | Session kimliği |
| `ls` | Her satırda bir session kimliği |
| `capture` | Çıktı satırları; `--quiet` olmadan olduğu gibi |
| `host ls` | Her satırda bir Host adı |
| `ext ls` | Her satırda bir extension kimliği |
| `status` | Sizi bekleyen her Session için bir session kimliği, her satırda bir tane |
| `events --follow` | Metin çıktısının satırları |
| `ext call` | Sonucun payload'ı; `--quiet` olmadan olduğu gibi |
| `version` | Sürüm numarası |
| Diğer bütün komutlar | Hiçbir şey. Sonuç, çıkış kodudur |

```console
$ nomux ls --quiet
4irabyqw
6sxcisjq
kitzeuit
r67mfnfw
xrysxwhn
$ nomux ls --all --quiet
4irabyqw
6sxcisjq
fiktbeos
iizairlj
kitzeuit
r67mfnfw
xrysxwhn
```

## Hatalar

Hata, `nomux: <mesaj>` biçiminde standart hataya yazılır; standart çıktı boş kalır.
Mesajın metni sabit değildir. Script'lerde çıkış kodunu kullanın.

Hatalı bir komut satırında argüman ayrıştırıcının kullanım mesajı yazdırılır ve çıkış kodu 1 olur:

```console
$ nomux --json --quiet ls
error: the argument '--json' cannot be used with '--quiet'

Usage: nomux --json

For more information, try '--help'.
```

## Çıkış kodları

| Kod | JSON'daki adı | Anlamı |
|---:|---|---|
| 0 | | Başarılı |
| 1 | `error` | Başka bir koda girmeyen hata. Hatalı komut satırı, kurulamayan SSH bağlantısı, güvenilmeyen host anahtarı, başarısız bir `host doctor` kontrolü, başlatılamayan uykudaki Session, geçersiz manifest, çöken extension, geçersiz bir `status set` mesajı ve `hooks install`'ın değiştiremediği bir ayar dosyası da buna dahildir |
| 2 | `not_found` | Aranan şey yok: verilen kimlikte bir Session yok, Session'ın komutu bitmiş, biten bir Session'ın saklanan çalışması yok (`agent explain`), verilen adda bir Host yok, verilen kimlikte bir extension yok, nomux bir aracın hook'larını kurmamış (`hooks uninstall`), bir aracın adapter'ı olan extension yok (`hooks install`) ya da daemon çalışmıyor (`daemon status`) |
| 3 | `timeout` | İşlem izin verilen sürede tamamlanmadı: daemon başladıktan sonra cevap vermedi, Session hazır olmadı, komut sonlanmadı ya da extension cevap vermedi |
| 4 | `no_permission` | Kullanıcının yetkisi yok; örneğin daemon'un socket'i için, ya da uzak Host hiçbir anahtarı kabul etmedi. İzinleri onaylanmadan çalıştırılan `ext install`, gereken izni olmayan bir extension ve Session'ını kanıtlayamayan bir `status set` da bu kodu verir |
| 5 | `version_mismatch` | CLI ile daemon'un ortak bir protokol sürümü yok. Hangisi eskiyse onu güncelleyin |

`hook`'un çıkış kodu, olayı gönderemediğinde de her olay için 0'dır: bir hook aracını bozmamalıdır. Yalnızca hatalı bir komut satırı 1 çıkış kodunu verir. `attach` ve `new --attach` için çıkış kodunun bir kaynağı daha vardır: Session attach sırasında sonlanırsa çıkış kodu, komutunun çıkış durumudur. Bkz. [attach nasıl biter](#attach-nasıl-biter).

## JSON çıktısı

`--json` ile komut tek satırlık tek bir JSON dokümanı yazdırır.

- Başarılı sonuçta doküman standart çıktıya gider.
- Hatada standart çıktı boş kalır, doküman standart hataya gider ve `error` alanını taşır.
- Her dokümanda `schema_version` alanı bulunur. Şu anki değeri `1`'dir.

**Şema sürümü kuralı.** Bu değer; bir alan kaldırıldığında, adı değiştiğinde ya da anlamı değiştiğinde artar.
Yeni bir alan eklenmesi değeri artırmaz. Bu yüzden dokümanı okuyan kod, tanımadığı alanları yok saymalıdır.

### `new` ve `start`

```json
{"schema_version":1,"session":{"id":"c7d77b72","state":"running","pid":967789,"command":["sleep","300"],"cwd":"/tmp/nomux-demo","rows":24,"columns":80,"started_at":1795691400,"epoch":1,"restore_policy":"on-focus"}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `session.id` | string | Session kimliği |
| `session.state` | string | `running`, `unreachable`, `dormant`, `ended`, `damaged` ya da `unknown` |
| `session.pid` | number ya da `null` | Komutun process ID'si. Session'ın process'i yoksa ya da daemon bilmiyorsa `null` |
| `session.command` | string dizisi | Komutun programı ve argümanları. Daemon bunları bilmiyorsa boş |
| `session.cwd` | string ya da `null` | Komutun çalışma dizini |
| `session.rows`, `session.columns` | number ya da `null` | Session'ın pencere boyutu |
| `session.started_at` | number ya da `null` | Komutun o anki epoch'ta başladığı an: Unix epoch'undan bu yana geçen saniye |
| `session.epoch` | number ya da `null` | Session'ın epoch'u: yeni bir Session'da 1, her geri yüklemede bir fazlası |
| `session.restore_policy` | string ya da `null` | `auto`, `on-focus` ya da `manual`. CLI'ın tanımadığı bir politika için `null` |
| `session.exit` | object | Yalnızca `state` değeri `ended` ise: `ended_at` (Unix epoch'undan bu yana geçen saniye) ile `exit_code` ya da `signal` |
| `session.damage` | string | Yalnızca Session'ın tanımı bozuksa: nedeni, insanın okuması için İngilizce. Metni sabit değildir |

Dokümanda komutun ortam değişkenleri hiçbir zaman bulunmaz.

### `ls`

```json
{"schema_version":1,"sessions":[{"id":"7foof65g","state":"dormant","pid":null,"command":["sh"],"cwd":"/tmp/nomux-demo/project","rows":24,"columns":80,"started_at":1795690771,"epoch":1,"restore_policy":"on-focus"},{"id":"atgrw65j","state":"running","pid":869838,"command":["sh","-c","echo server started; exec sleep 600"],"cwd":"/tmp/nomux-demo","rows":24,"columns":80,"started_at":1795690775,"epoch":2,"restore_policy":"auto"},{"id":"qqdrvzzv","state":"running","pid":861740,"command":["sleep","600"],"cwd":"/tmp/nomux-demo/project","rows":24,"columns":80,"started_at":1795690729,"epoch":1,"restore_policy":"on-focus"}]}
```

`sessions`, `new`'un verdiği nesnelerden oluşan ve kimliğe göre sıralı bir dizidir. Hiç Session yoksa boştur. Biten bir Session diziye yalnızca `--all` ile girer:

```json
{"schema_version":1,"sessions":[{"id":"fiktbeos","state":"ended","pid":null,"command":["sh"],"cwd":"/tmp/nomux-demo","rows":24,"columns":80,"started_at":1795691292,"epoch":1,"restore_policy":"on-focus","exit":{"ended_at":1795691295,"exit_code":3}}]}
```

İkinci örnek, daha uzun bir dokümandan alınmış bir parçadır.

### `ls --memory`

```json
{"schema_version":1,"sessions":[{"id":"7foof65g","state":"dormant","pid":null,"command":["sh"],"cwd":"/tmp/nomux-demo/project","rows":24,"columns":80,"started_at":1795690771,"epoch":1,"restore_policy":"on-focus","memory":null},{"id":"atgrw65j","state":"running","pid":869838,"command":["sh","-c","echo server started; exec sleep 600"],"cwd":"/tmp/nomux-demo","rows":24,"columns":80,"started_at":1795690775,"epoch":2,"restore_policy":"auto","memory":{"command_bytes":152576,"command_processes":1,"holder_bytes":291840,"measure":"pss"}},{"id":"qqdrvzzv","state":"running","pid":861740,"command":["sleep","600"],"cwd":"/tmp/nomux-demo/project","rows":24,"columns":80,"started_at":1795690729,"epoch":1,"restore_policy":"on-focus","memory":{"command_bytes":146432,"command_processes":1,"holder_bytes":270336,"measure":"pss"}}],"memory_total":{"command_bytes":299008,"command_processes":2,"holder_bytes":562176,"sessions":2,"measure":"pss"}}
```

Doküman, `ls` dokümanıdır; her Session'da bir alan ve en üstte bir alan fazladır. `--memory` olmadan dokümanda bu iki alan da bulunmaz.

| Alan | Tür | Anlamı |
|---|---|---|
| `sessions[].memory` | object ya da `null` | Session'ın process'lerinin belleği. Session'ın process'i yoksa `null` |
| `sessions[].memory.command_bytes` | number | Komutun process ağacının byte cinsinden belleği; holder hariç |
| `sessions[].memory.command_processes` | number | Bu ağaçtaki process sayısı |
| `sessions[].memory.holder_bytes` | number | Session'ın holder'ının byte cinsinden belleği |
| `sessions[].memory.measure` | string | `pss`, `rss` ya da CLI'ın tanımadığı bir ölçü için `unknown` |
| `memory_total.command_bytes`, `memory_total.command_processes`, `memory_total.holder_bytes` | number | Process'i olan Session'ların üç değerinin toplamları |
| `memory_total.sessions` | number | Toplamlara giren Session sayısı |
| `memory_total.measure` | string ya da `null` | Toplamların ölçüsü. Session'ların ölçüsü aynı değilse ya da hiçbir Session'ın process'i yoksa `null` |

### `capture`

```json
{"schema_version":1,"capture":{"id":"wg6h27bl","output":"198\r\n199\r\n200\r\n"}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `capture.id` | string | Session kimliği |
| `capture.output` | string | Escape dizileriyle birlikte çıktı satırları. UTF-8 olmayan bir byte dizisinin yerinde U+FFFD durur. Metin çıktısında byte'lar değişmeden gelir |

### `restore-policy`

```json
{"schema_version":1,"restore_policy":{"id":"4irabyqw","policy":"manual"}}
```

### `attach` ve `new --attach`

```json
{"schema_version":1,"attach":{"id":"a4xd7tz6","end":"detached"}}
{"schema_version":1,"attach":{"id":"a4xd7tz6","end":"exited","exit_code":0}}
{"schema_version":1,"attach":{"id":"x3jerlzh","end":"signaled","signal":9}}
```

Komut dokümanı attach bittikten sonra yazdırır. Sonlanan bir Session'ın dokümanı standart çıktıya gider; çıkış kodu [attach nasıl biter](#attach-nasıl-biter) tablosundaki değerdir.

| Alan | Tür | Anlamı |
|---|---|---|
| `attach.id` | string | Session kimliği |
| `attach.end` | string | `detached`: istemci detach oldu, Session yaşıyor. `exited`: komut bir çıkış koduyla bitti. `signaled`: komutu bir sinyal sonlandırdı. `lost`: Session sonlandı ama çıkış durumu bilinmiyor. `unknown`: daemon CLI'dan daha yeni ve CLI'ın tanımadığı bir neden gönderdi |
| `attach.exit_code` | number | Komutun çıkış kodu. Yalnızca `end` değeri `exited` ise bulunur |
| `attach.signal` | number | Sinyal numarası. Yalnızca `end` değeri `signaled` ise bulunur |

### `detach`

```json
{"schema_version":1,"detached":{"id":"7uk6xzoz","clients":0}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `detached.id` | string | Session kimliği |
| `detached.clients` | number | Session'a attach olmuş istemcilerin sayısı |

### `kill`

```json
{"schema_version":1,"killed":"v6srainn"}
```

`killed`, sonlanan Session'ın kimliğidir.

### `daemon status`

```json
{"schema_version":1,"daemon":{"running":true,"version":"0.4.0","pid":1017163,"sessions":1}}
{"schema_version":1,"daemon":{"running":false}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `daemon.running` | boolean | Daemon çalışıyorsa `true`. `false` ise dokümanda `daemon`'un başka alanı bulunmaz ve çıkış kodu 2'dir |
| `daemon.version` | string | Daemon'un ürün sürümü |
| `daemon.pid` | number | Daemon'un process ID'si |
| `daemon.sessions` | number | Session sayısı. Biten Session'lar sayılmaz |

### `daemon stop`

```json
{"schema_version":1,"stopped":true}
{"schema_version":1,"stopped":false}
```

Çalışan bir daemon vardıysa ve komut onu durdurduysa `stopped` değeri `true`'dur. Çalışan daemon yoktuysa `false`'tur.

### `daemon install-service` ve `daemon uninstall-service`

```json
{"schema_version":1,"service":{"action":"installed","path":"/tmp/nomux-demo/.config/systemd/user/nomuxd.service","content":"[Unit]\nDescription=nomux daemon\nDocumentation=https://nomux.sh\n\n[Service]\nExecStart=\"/tmp/nomux-demo/.local/bin/nomuxd\" --replace\nKillMode=process\nRestart=on-failure\n\n[Install]\nWantedBy=default.target\n"}}
{"schema_version":1,"service":{"action":"would_remove","path":"/tmp/nomux-demo/.config/systemd/user/nomuxd.service"}}
{"schema_version":1,"service":{"action":"not_installed","path":"/tmp/nomux-demo/.config/systemd/user/nomuxd.service"}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `service.action` | string | `installed`, `would_install` (dry run), `removed`, `would_remove` (dry run) ya da `not_installed`: dosya yok, bu yüzden hiçbir şey silinmedi |
| `service.path` | string | Servis dosyasının yolu |
| `service.content` | string | Dosyanın içeriği. Yalnızca `installed` ve `would_install` için |

### `host add`

Bu doküman `docs/cli.md` dosyasından alındı. Komut bu sayfa için çalıştırılmadı.

```json
{"schema_version":1,"host":{"name":"vps","ssh":"deploy@vps.example.com","system":"Linux","machine":"x86_64","target":"x86_64-unknown-linux-musl","directory":"~/.nomux/bin/0.1.0","installed":true,"daemon":{"running":true,"version":"0.1.0","pid":2210,"sessions":0}}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `host.name` | string | `--host` için Host'un adı |
| `host.ssh` | string | SSH hedefi |
| `host.system`, `host.machine` | string | Host'un sistemi ve işlemcisi; `uname -s` ve `uname -m`'in verdiği gibi |
| `host.target` | string | Host'taki binary'lerin release hedefi |
| `host.directory` | string | Host'taki binary'lerin dizini |
| `host.installed` | boolean | Binary'leri komut kurduysa `true`. Host'ta zaten varsa `false` |
| `host.daemon` | object | Host'un daemon'u: `daemon status`'un nesnesi |

### `host ls`

```json
{"schema_version":1,"hosts":[{"name":"vps","ssh":"deploy@vps.example.com"}]}
```

`hosts`, ada göre sıralıdır. Yapılandırma dosyasında Host yoksa boştur.

### `host rm`

```json
{"schema_version":1,"removed":"vps"}
```

### `host doctor`

Host içeren bu doküman `docs/cli.md` dosyasından alındı. Komut bu sayfa için bir Host ile çalıştırılmadı. Host yokken doküman `{"schema_version":1,"doctor":[]}` olur.

```json
{"schema_version":1,"doctor":[{"host":"vps","ok":false,"checks":[{"name":"connection","ok":true,"detail":"deploy@vps.example.com port 22, host key ssh-ed25519 SHA256:..."},{"name":"permissions","ok":false,"detail":"~/.nomux/run has the mode drwxr-xr-x: other users can use it. Run `chmod go-rwx ~/.nomux/run` on the host"}]}]}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `doctor` | array | Komutun kontrol ettiği her Host için bir nesne |
| `doctor[].host` | string | Host'un adı |
| `doctor[].ok` | boolean | Host'un bütün kontrolleri geçtiyse `true` |
| `doctor[].checks[].name` | string | `connection`, `platform`, `binaries`, `permissions`, `daemon` ya da `versions` |
| `doctor[].checks[].ok` | boolean | Host kontrolü geçtiyse `true` |
| `doctor[].checks[].detail` | string | İnsanın okuması için İngilizce bir metin: kontrolün bulduğu şey ya da neden ve ne yapılacağı. Metni sabit değildir |

Bir kontrol başarısız olsa da doküman standart çıktıya gider. Çıkış kodu bu durumda 1'dir.

### `ext ls`

```json
{"schema_version":1,"extensions":[{"id":"nomux.echo","name":"Echo","version":"0.1.0","state":"stopped","reason":null,"permissions":{"fs":[],"process":[],"network":false,"scopes":[]}},{"id":"nomux.git","name":"Git","version":"0.1.0","state":"stopped","reason":null,"permissions":{"fs":["/tmp/nomux-demo/project"],"process":["git"],"network":false,"scopes":[]}}]}
```

`extensions`, kimliğe göre sıralıdır. Kurulu extension yoksa boştur.

| Alan | Tür | Anlamı |
|---|---|---|
| `id` | string | Extension'ın kimliği |
| `name` | string | Extension'ın insanın okuması için adı |
| `version` | string | Extension'ın sürümü |
| `state` | string | `stopped`, `starting`, `running`, `failed`, `disabled` ya da `unknown` |
| `reason` | string ya da `null` | `disabled` için extension'ın neden devre dışı olduğu, `failed` için hata. Diğer durumlarda `null`. Metni sabit değildir |
| `permissions.fs` | string dizisi | Kullanıcının onayladığı dizinler |
| `permissions.process` | string dizisi | Kullanıcının onayladığı programlar |
| `permissions.network` | boolean | Kullanıcı ağ bağlantılarını onayladıysa `true` |
| `permissions.scopes` | string dizisi | Kullanıcının onayladığı host servisi kapsamları |

### `ext install`, `ext enable` ve `ext disable`

```json
{"schema_version":1,"extension":{"id":"nomux.echo","name":"Echo","version":"0.1.0","state":"disabled","reason":"the user disabled the extension","permissions":{"fs":[],"process":[],"network":false,"scopes":[]}}}
```

`extension`, komuttan sonraki hâliyle `ext ls`'in nesnesidir. Onay verilmeden çalıştırılan `ext install` bir hatadır: standart hatada, mesajında izinler yazan hata dokümanı bulunur.

### `ext rm`

```json
{"schema_version":1,"removed_extension":"nomux.git"}
```

### `ext call`

```json
{"schema_version":1,"call":{"extension":"nomux.echo","method":"echo","payload_base64":"CgJoaQ=="}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `call.extension` | string | Extension'ın kimliği |
| `call.method` | string | Metodun adı |
| `call.payload_base64` | string | Sonucun payload'ı, Base64 olarak (RFC 4648, padding ile) |

Extension bir hatayla cevap verdiyse standart hatada hata dokümanı bulunur.

### `ext validate`

```json
{"schema_version":1,"manifest":{"valid":true,"id":"nomux.git","name":"Git","version":"0.1.0","permissions":{"fs":["${worktree}"],"process":["git"],"network":false,"scopes":[]}}}
{"schema_version":1,"manifest":{"valid":false,"problems":[{"path":"extension.id","problem":"must have two or more parts with `.` between them, in 64 characters at most. A part starts with a lower-case letter and has only lower-case letters, digits and `-`"}]}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `manifest.valid` | boolean | Manifest geçerliyse `true`. `false` ise çıkış kodu 1'dir |
| `manifest.id`, `manifest.name`, `manifest.version` | string | Manifest'teki kimlik bilgileri. Yalnızca `valid` değeri `true` ise |
| `manifest.permissions` | object | Manifest'in istediği izinler; `ext ls`'in `permissions` alanlarıyla. Yalnızca `valid` değeri `true` ise |
| `manifest.problems[].path` | string ya da `null` | Geçersiz alanın yolu. Dosya TOML değilse `null` |
| `manifest.problems[].problem` | string | Alanın uymadığı kural, insanın okuması için İngilizce. Metni sabit değildir |

Manifest geçersiz olsa da doküman standart çıktıya gider.

### `status`

```json
{"schema_version":1,"status":{"attention":{"session":"duif5fve","status":{"state":"working","kind":null,"source":"adapter","guess":false,"since_ms":1795691439478,"seen":false,"message":null,"title":null,"progress":null,"tool":null}},"sessions":[{"id":"duif5fve","command":["sh","replay.sh","background-subagent","6"],"status":{"state":"working","kind":null,"source":"adapter","guess":false,"since_ms":1795691439478,"seen":false,"message":null,"title":null,"progress":null,"tool":null},"aggregate":{"state":"working","kind":null,"source":"adapter","guess":false,"since_ms":1795691439478,"seen":false,"message":null,"title":null,"progress":null,"tool":null},"details":{"model":null,"provider_session_id":"00000000-0000-4000-8000-000000000003","resume_command":"claude --resume 00000000-0000-4000-8000-000000000003"}}]}}
```

`--tree` ile `status.sessions` öğelerinin her birinde `details`'ten önce `children` alanı bulunur. Aynı Session'ın `--tree` ile dokümanı:

```json
{"schema_version":1,"status":{"attention":{"session":"duif5fve","status":{"state":"working","kind":null,"source":"adapter","guess":false,"since_ms":1795691439478,"seen":false,"message":null,"title":null,"progress":null,"tool":null}},"sessions":[{"id":"duif5fve","command":["sh","replay.sh","background-subagent","6"],"status":{"state":"working","kind":null,"source":"adapter","guess":false,"since_ms":1795691439478,"seen":false,"message":null,"title":null,"progress":null,"tool":null},"aggregate":{"state":"working","kind":null,"source":"adapter","guess":false,"since_ms":1795691439478,"seen":false,"message":null,"title":null,"progress":null,"tool":null},"children":[{"name":"a45f24c823c444cb5","status":{"state":"working","kind":null,"source":"adapter","guess":false,"since_ms":1795691440095,"seen":false,"message":null,"title":{"text":"general-purpose","source":"adapter"},"progress":null,"tool":null},"aggregate":{"state":"working","kind":null,"source":"adapter","guess":false,"since_ms":1795691440095,"seen":false,"message":null,"title":{"text":"general-purpose","source":"adapter"},"progress":null,"tool":null},"children":[]}],"details":{"model":null,"provider_session_id":"00000000-0000-4000-8000-000000000003","resume_command":"claude --resume 00000000-0000-4000-8000-000000000003"}}]}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `status.attention` | object ya da `null` | En acil duruma sahip Session ve o durum. Host'ta Session yoksa `null` |
| `status.sessions[]` | liste | Biten olmayan her Session için ve son Agent çalışmasını saklayan her biten Session için bir Agent çalışması; kimliğe göre sıralı |
| `.id`, `.command` | string, string dizisi | Session ve komutu |
| `.status` | durum | Agent çalışmasının durumu |
| `.aggregate` | durum | Agent çalışmasının ve Alt işlerinin en acil durumu |
| `.children[]` | liste | Yalnızca `--tree` ile. Her Alt iş: `name`, `status` (bir durum; hiçbir kaynak bildirmiyorsa `null`), `aggregate` ve `children` |
| `.details` | object | Yalnızca bir adapter verdiyse: `model`, `provider_session_id` ve `resume_command`; her biri string ya da `null` |

Host'ta Session yoksa doküman `{"schema_version":1,"status":{"attention":null,"sessions":[]}}` olur.

Bir durumun alanları şunlardır:

| Alan | Tür | Anlamı |
|---|---|---|
| `state` | string | `idle`, `working`, `done`, `needs_you`, `error` ya da CLI'ın tanımadığı bir durum için `unknown` |
| `kind` | string ya da `null` | `needs_you` için: `permission`, `question` ya da `auth`; hiçbir kaynak söylemiyorsa `null` |
| `source` | string | `adapter`, `program_status`, `self_report`, `session_restore`, `prompt_marks`, `foreground_program`, `none` (hiçbir kaynak işi bildirmiyor) ya da `unknown` |
| `guess` | boolean | Daemon durumu tahmin ettiyse `true`: kaynak `prompt_marks` ya da `foreground_program` |
| `since_ms` | number | Daemon'un durumu ilk gördüğü an: Unix epoch'undan bu yana geçen milisaniye |
| `seen` | boolean | `done` ve `error` için: kullanıcı sonucu gördüyse `true` |
| `message`, `title`, `tool` | object ya da `null` | `{"text": ..., "source": ...}`: metin ve kendi kaynağı |
| `progress` | object ya da `null` | `{"percent": ..., "source": ...}` |

### `status set`

```json
{"schema_version":1,"status_set":{"session":"ab5azvpo","state":"done"}}
```

### `agent explain`

```json
{"schema_version":1,"explain":{"session":"duif5fve","run":{"id":"duif5fve","status":{"state":"working","kind":null,"source":"adapter","guess":false,"since_ms":1795691439478,"seen":false,"message":null,"title":null,"progress":null,"tool":null},"aggregate":{"state":"working","kind":null,"source":"adapter","guess":false,"since_ms":1795691439478,"seen":false,"message":null,"title":null,"progress":null,"tool":null},"children":[{"name":"a45f24c823c444cb5","status":{"state":"working","kind":null,"source":"adapter","guess":false,"since_ms":1795691440095,"seen":false,"message":null,"title":{"text":"general-purpose","source":"adapter"},"progress":null,"tool":null},"aggregate":{"state":"working","kind":null,"source":"adapter","guess":false,"since_ms":1795691440095,"seen":false,"message":null,"title":{"text":"general-purpose","source":"adapter"},"progress":null,"tool":null},"children":[]}],"details":{"model":null,"provider_session_id":"00000000-0000-4000-8000-000000000003","resume_command":"claude --resume 00000000-0000-4000-8000-000000000003"}},"sources":[{"source":"adapter","guess":false,"reported":true,"state":"working","kind":null,"message":null,"note":"an adapter extension reported it from the events of the agent tool"},{"source":"program_status","guess":false,"reported":false,"state":null,"kind":null,"message":null,"note":"no program of the session reported a status"},{"source":"self_report","guess":false,"reported":false,"state":null,"kind":null,"message":null,"note":"no program of the session reported a status with `nomux status set`"},{"source":"session_restore","guess":false,"reported":false,"state":null,"kind":null,"message":null,"note":"the session did not lose a process with work that ran or waited"},{"source":"prompt_marks","guess":true,"reported":false,"state":null,"kind":null,"message":null,"note":"the shell of the session sent no prompt mark"},{"source":"foreground_program","guess":true,"reported":false,"state":null,"kind":null,"message":null,"note":"the command of the session is in the foreground of its terminal"}]}}
```

`explain.run`, `status.sessions` öğesinin alanlarını Alt işleriyle birlikte taşır; `command` yoktur. `explain.sources` her kaynağı karar verme sırasıyla içerir. Hiçbir şey söylemeyen kaynak için `reported` değeri `false`'tur: bu durumda `state`, `kind` ve `message` `null` olur ve `note` nedenini söyler. Bir notun metni sabit değildir.

### `events --follow`

Her satır bir dokümandır. Aşağıdakiler, gerçek çalıştırmalardan bir `agent_run_changed` ve bir `agent_run_removed` olayıdır:

```json
{"schema_version":1,"event":{"seq":1,"at_ms":1795691201577,"type":"agent_run_changed","session":"ebqcnmoo","run":{"id":"ebqcnmoo","status":{"state":"working","kind":null,"source":"self_report","guess":false,"since_ms":1795691201577,"seen":false,"message":{"text":"build the docs","source":"self_report"},"title":null,"progress":null,"tool":null},"aggregate":{"state":"working","kind":null,"source":"self_report","guess":false,"since_ms":1795691201577,"seen":false,"message":{"text":"build the docs","source":"self_report"},"title":null,"progress":null,"tool":null},"children":[]}}}
{"schema_version":1,"event":{"seq":16,"at_ms":1795691221747,"type":"agent_run_removed","session":"rado2qro"}}
```

Aşağıdaki, bir `snapshot` olayının biçimidir. Komut bu sayfa için snapshot'lı çalıştırılmadı; doküman `v0.4.0` etiketindeki `docs/cli.md` dosyasından alındı:

```json
{"schema_version":1,"event":{"seq":13,"at_ms":1795670005000,"type":"snapshot"}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `event.seq` | number | Olayın daemon'un olay günlüğündeki sırası. Daemon yeniden başlayınca numaralar yeniden başlar |
| `event.at_ms` | number | Olayın gerçekleştiği an: Unix epoch'undan bu yana geçen milisaniye |
| `event.type` | string | `agent_run_changed`, `agent_run_removed`, `extension_event`, `snapshot` ya da CLI'ın tanımadığı bir olay için `unknown` |
| `event.session` | string | Session. Yalnızca `agent_run_changed` ve `agent_run_removed` içinde |
| `event.run` | object | Yalnızca `agent_run_changed` içinde: değişiklikten sonraki Agent çalışması; alanları `explain.run` ile aynıdır |
| `event.extension` | object | Yalnızca `extension_event` içinde: `id` (extension), `name` (olayın adı) ve `payload_base64` (payload, Base64 olarak: kodlamasını extension seçer) |

Bir `snapshot` olayından sonra, her Session için gelen bir `agent_run_changed` olayı Host'un şimdiki durumunu verir. Dokümanı okuyan kod, elindeki durumu atar.

### `hook`

Komut, JSON dokümanı değil, araç için cevabı yazdırır; `--json` ile de. Bu sürümde cevap boştur; bu yüzden çıktı da boştur.

### `hooks install` ve `hooks uninstall`

Sayfa, `diff` değerini `@@` ile başlayan ilk satırdan sonra kısaltır. Gerçek değerde diff'in tamamı vardır.

```json
{"schema_version":1,"hooks_change":{"action":"install","tool":"claude","path":"/tmp/nomux-demo/.claude/settings.json","diff":"--- /tmp/nomux-demo/.claude/settings.json\n+++ /tmp/nomux-demo/.claude/settings.json\n@@ ...","changed":true,"applied":false,"restores_original":false}}
{"schema_version":1,"hooks_change":{"action":"uninstall","tool":"claude","path":"/tmp/nomux-demo/.claude/settings.json","diff":"--- /tmp/nomux-demo/.claude/settings.json\n+++ /tmp/nomux-demo/.claude/settings.json\n@@ ...","changed":true,"applied":true,"restores_original":true}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `hooks_change.action` | string | `install` ya da `uninstall` |
| `hooks_change.tool` | string | Araç |
| `hooks_change.path` | string | Ayar dosyası |
| `hooks_change.diff` | string | Değişiklik, unified diff olarak. Hiçbir şey değişmiyorsa boş |
| `hooks_change.changed` | boolean | Diff boş değilse `true` |
| `hooks_change.applied` | boolean | `--apply` ile `true`: komut değişikliği yazdı |
| `hooks_change.restores_original` | boolean | `uninstall` için: dosya kurulumdan önceki byte'larına dönüyorsa `true`; yalnızca nomux'un girdileri kaldırılıyorsa `false` |

Hook'lar zaten kuruluysa `nomux hooks install claude --json` dokümanında `"diff":""`, `"changed":false` ve `"applied":false` bulunur.

### `hooks status`

```json
{"schema_version":1,"hooks":[{"tool":"claude","adapter":"nomux.agent-claude","state":"installed","path":"/tmp/nomux-demo/.claude/settings.json","recorded":true,"problem":null}]}
{"schema_version":1,"hooks":[{"tool":"claude","adapter":"nomux.agent-claude","state":null,"path":null,"recorded":false,"problem":"the settings file /tmp/nomux-demo/.claude/settings.json cannot get the hooks: key must be a string at line 1 column 3; nothing changed"}]}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `hooks[].tool`, `.adapter` | string, string ya da `null` | Araç ve adapter extension'ı. `null`: aracın adapter'ı yok, yalnızca bir kurulum kaydı var |
| `.state` | string ya da `null` | `installed`, `missing` ya da `different`. Durum bilinmiyorsa `null`: nedenini `problem` söyler |
| `.path` | string ya da `null` | Ayar dosyası |
| `.recorded` | boolean | nomux'un bir kurulum kaydı varsa `true`: `hooks uninstall` hook'ları kaldırabilir |
| `.problem` | string ya da `null` | Durumun neden bilinmediği, insanın okuması için İngilizce. Metni sabit değildir. Durum biliniyorsa `null` |

Adapter'ı ya da kaydı olan bir araç yoksa doküman `{"schema_version":1,"hooks":[]}` olur.

### `version`

```json
{"schema_version":1,"version":"0.4.0"}
```

### Hata

```json
{"schema_version":1,"error":{"code":2,"kind":"not_found","message":"no session has the identifier aaaaaaaa"}}
{"schema_version":1,"error":{"code":4,"kind":"no_permission","message":"the extension nomux.git 0.1.0 asks for these permissions:\n  fs=${worktree}\n  process=git\nNothing was installed. To install the extension, approve its permissions: add --grant-all, or --grant <permission> for each permission that you approve. For a directory that starts with ${worktree}, give a directory: --grant fs=<directory>"}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `error.code` | number | Komutun çıkış kodu |
| `error.kind` | string | Çıkış kodunun [çıkış kodları](#çıkış-kodları) tablosundaki adı |
| `error.message` | string | İnsanın okuması için İngilizce bir mesaj. Metni sabit değildir |

Hatalı komut satırı JSON dokümanı üretmez. Argüman ayrıştırıcı kullanım mesajını düz metin olarak yazar.

## Diğer iki binary

`nomuxd` ve `nomux-holder` binary'lerini normalde kendiniz çalıştırmazsınız. Daemon'u CLI, her Session'ın holder'ını da daemon başlatır.
İki binary'nin de `--help` seçeneği yoktur. Tanımadıkları bir seçenek, `--help` de dahil, kullanım metnini standart hataya yazar ve 2 çıkış koduyla biter. Aşağıdaki, `nomuxd`'nin `nomuxd: unknown option --help` satırından sonraki metnidir:

```text
Usage: nomuxd [--detach] [--replace]
       nomuxd --version

Without an option, nomuxd runs in the foreground and writes its log to the
standard error.

Options:
  --detach   Start the daemon as a separate process and end. The log of that
             daemon goes to nomuxd.log in the runtime directory (~/.nomux/run).
  --replace  If a daemon already runs, stop it and take its place. No session
             ends.

Environment:
  NOMUX_LOG  The log level: error, warn (default), info, debug or trace
  NOMUX_EXTENSION_IDLE_SECONDS
             The time without a call after which the daemon stops the process
             of an extension (default: 60)
```

`nomux-holder` da kullanım metnini aynı şekilde yazdırır. Seçenekleri daemon içindir.

## Bu sayfanın anlattığı sürüm

Bu sayfa nomux 0.4.0'ı anlatır: `nomux-sh/nomux` reposunun [`v0.4.0`](https://github.com/nomux-sh/nomux/releases/tag/v0.4.0) etiketi, [`0a30b68`](https://github.com/nomux-sh/nomux/commit/0a30b68f5948e48f395f5ee2e6c6832acb123cb7) commit'i.
Yardım metinleri ve örnekler, o sürümün binary'lerinin Linux x86_64 üzerinde, geçici `/tmp/nomux-demo` home dizinindeki gerçek çıktısıdır. Session kimlikleri ve process ID'leri birden fazla çalıştırmadan gelir.
Örneklerde dört şey, yayımlanmış ürünün düz bir çalıştırması değildir:

- Claude Code'un adapter extension'ı (`nomux.agent-claude`) 0.4.0 ile yayımlanmadı. Durum komutlarının ve hook komutlarının örnekleri onun bir build'ini kullanır. `replay.sh` script'lerinin gönderdiği hook olayları, Claude Code'un kaydedilmiş olaylarıdır.
- Extension komutlarının örneklerindeki paketler, Echo extension'ı (extension API örneğinin bir build'i) ve daemon programı yerine geçen bir script olan bir Git extension'ıdır: `ext install` ve `ext ls` yalnızca manifest'i okur ve extension'ın hiçbir process'ini başlatmaz.
- `nomux hooks install`, çalıştırmanın home dizinindeki ayar dosyasını yazdı. Bu, gerçek bir Claude Code'un ayar dosyası değildir.
- Terminal örnekleri (`attach` ve 50 sütunluk bir terminaldeki `ls` tabloları) bir pseudoterminal içinde çalıştı.

Şu kısımlar bu sayfa için çalıştırılmadı; aynı etiketteki [`docs/cli.md`](https://github.com/nomux-sh/nomux/blob/v0.4.0/docs/cli.md) dosyasından alındı: uzak bir Host'a bağlanan her komut (`host add`, bir Host verilen `host doctor`, var olan bir Host için `--host` ile çalışan komutlar), 3 çıkış kodu, SSH için 4 çıkış kodu ve 5 çıkış kodu, `unreachable`, `damaged` ve `unknown` durumları, `attach.end` alanının `lost` ve `unknown` değerleri, CLI'ın aldığı bir sinyalle biten attach, attach sırasında pencere boyutunun değişmesi, `ls --memory` için `rss` ölçüsü ve toplam satırındaki `pss and rss`, eski bir daemon için `ls --memory` hatası, durumu `-` olan `status --tree` satırları, `events --follow` için `extension-event` ve `snapshot` satırları, sembolik bağlantı olan bir ayar dosyasının yazılması ve `hooks install`'ın yapıp yazdığı bir ayar dosyasının silinmesi.
