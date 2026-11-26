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
- Daemon'a ihtiyaç duyan komut, cevap veren bir daemon yoksa onu başlatır ve en fazla 5 saniye bekler. `daemon` komutları daemon başlatmaz.
- Metin çıktısında yalnızca Session'ın durumu renklidir; o da standart çıktı bir terminalse ve `NO_COLOR` değişkeni tanımlı değilse.

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
  daemon          Show or stop the daemon, and start it at login
  host            Add, list, remove and check the remote hosts
  ext             Install, list, remove and call the extensions of a host
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
- `--host`, `host` komutlarıyla ve `daemon install-service`, `daemon uninstall-service` ile kullanılamaz. Bu komutlar `--host` ile 1 çıkış koduyla biter. `version`, CLI'ın sürümünü yazdırır.
- SSH hatasının çıkış kodu 1'dir. Host hiçbir anahtarı kabul etmezse çıkış kodu 4'tür.

Yapılandırma dosyasında olmayan bir ad 2 çıkış kodunu verir:

```console
$ nomux --host vps ls
nomux: no host has the name vps. `nomux host ls` shows the hosts, and `nomux host add` adds one
$ nomux --host vps daemon install-service --dry-run
nomux: the --host option cannot be used with this command: run it on the host
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
| `--cmd <COMMAND>...` | Aynısı | `--`'nin ikinci yazılışı. İkisinden yalnızca birini kullanın. |

**`--` ya da `--cmd`'den sonra gelen her argüman Session'ın komutuna gider; `nomux`'un kendi seçeneklerinden biri olsa bile.** Bu yüzden `nomux`'un seçenekleri komuttan önce yazılır:

```sh
nomux new --json -- sleep 300      # --json is an option of nomux
nomux new -- sleep 300 --json      # --json is an argument of sleep
```

```console
$ nomux new --cwd project -- sleep 600
sl2ugpe7
```

Komut, daemon'un ortam değişkenlerini alır. Bir istemci attach olana kadar terminali 24 satır, 80 sütundur; attach olan istemci Session'a kendi terminalinin pencere boyutunu verir.

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
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux ls
ID        STATE    PID      COMMAND
sl2ugpe7  running  2616794  sleep 600
z3yjk54g  running  2616707  sh
$ nomux ls --all
ID        STATE    PID      COMMAND    NOTE
hqarpjgu  running  2616798  sleep 300
sl2ugpe7  running  2616794  sleep 600
z3yjk54g  ended    -        sh         exit status 3
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
detached from session z3yjk54g
```

```console
sh-5.3$ exit 3
exit

session z3yjk54g ended with exit status 3
```

```console
sh-5.3$ kill -9 $$

session 3lptmq6f ended by signal 9
```

Son ikisinin çıkış kodu 3 ve 137'dir.

```console
nomux: the daemon stopped. The session continues: run `nomux attach z3yjk54g` to attach again
```

Verilen kimlikte bir Session yoksa ya da Session bitmişse:

```console
$ nomux attach aaaaaaaa
nomux: no session has the identifier aaaaaaaa
$ nomux attach z3yjk54g
nomux: session z3yjk54g ended: its command does not run
```

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
$ nomux start ds3kchg4
session ds3kchg4 runs
```

- Komutu zaten çalışan bir Session'da komut başarılı olur ve hiçbir şeyi değiştirmez.
- Biten bir Session'da çıkış kodu 2'dir: `nomux: session z3yjk54g ended: its command does not run`.
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
ebxd36mw
$ nomux capture ebxd36mw --lines 3
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
$ nomux restore-policy zapitg2m auto
session zapitg2m has the restore policy auto
$ nomux restore-policy ds3kchg4 sometimes
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
$ nomux detach z3yjk54g
detached 1 client from session z3yjk54g
$ nomux detach z3yjk54g
detached 0 clients from session z3yjk54g
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
$ nomux kill sl2ugpe7
session sl2ugpe7 ended
```

Verilen kimlikte bir Session yoksa ya da komutu zaten bitmişse çıkış kodu 2'dir. Aynı Session için ikinci `kill` de bu yüzden 2 ile biter:

```console
$ nomux kill sl2ugpe7
nomux: session sl2ugpe7 ended: its command does not run
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
nomuxd 0.3.0 runs: process ID 2616705, 1 session
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
$ nomux daemon uninstall-service
removed /tmp/nomux-demo/.config/systemd/user/nomuxd.service
The daemon that runs continues. To make the service manager forget the file, run: systemctl --user daemon-reload
$ nomux daemon uninstall-service
no service file: /tmp/nomux-demo/.config/systemd/user/nomuxd.service does not exist
```

Dosya yoksa da çıkış kodu 0'dır. Çalışan daemon çalışmaya devam eder.

## Host komutları

Bu komutlar, bilgisayarınızdaki yapılandırma dosyasında duran uzak Host'ları yönetir. Bağlantı, güven kuralları ve nomux'un Host'a yazdıkları [Uzak Host'lar](/docs/tr/guides/remote-hosts/) sayfasındadır.
Bir Host'a bağlanan komutlar (`host add` ve bir Host verilen `host doctor`) bu sayfa için çalıştırılmadı. Anlatımları nomux 0.3.0'ın [`docs/cli.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/docs/cli.md) dosyasından alındı.

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
nomux 0.3.0
$ nomux version --quiet
0.3.0
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
| `ext call` | Sonucun payload'ı; `--quiet` olmadan olduğu gibi |
| `version` | Sürüm numarası |
| Diğer bütün komutlar | Hiçbir şey. Sonuç, çıkış kodudur |

```console
$ nomux ls --quiet
hqarpjgu
sl2ugpe7
z3yjk54g
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
| 1 | `error` | Başka bir koda girmeyen hata. Hatalı komut satırı, kurulamayan SSH bağlantısı, güvenilmeyen host anahtarı, başarısız bir `host doctor` kontrolü, başlatılamayan uykudaki Session, geçersiz manifest ve çöken extension da buna dahildir |
| 2 | `not_found` | Aranan şey yok: verilen kimlikte bir Session yok, Session'ın komutu bitmiş, verilen adda bir Host yok, verilen kimlikte bir extension yok ya da daemon çalışmıyor (`daemon status`) |
| 3 | `timeout` | İşlem izin verilen sürede tamamlanmadı: daemon başladıktan sonra cevap vermedi, Session hazır olmadı, komut sonlanmadı ya da extension cevap vermedi |
| 4 | `no_permission` | Kullanıcının yetkisi yok; örneğin daemon'un socket'i için, ya da uzak Host hiçbir anahtarı kabul etmedi. İzinleri onaylanmadan çalıştırılan `ext install` ve gereken izni olmayan bir extension da bu kodu verir |
| 5 | `version_mismatch` | CLI ile daemon'un ortak bir protokol sürümü yok. Hangisi eskiyse onu güncelleyin |

`attach` ve `new --attach` için çıkış kodunun bir kaynağı daha vardır: Session attach sırasında sonlanırsa çıkış kodu, komutunun çıkış durumudur. Bkz. [attach nasıl biter](#attach-nasıl-biter).

## JSON çıktısı

`--json` ile komut tek satırlık tek bir JSON dokümanı yazdırır.

- Başarılı sonuçta doküman standart çıktıya gider.
- Hatada standart çıktı boş kalır, doküman standart hataya gider ve `error` alanını taşır.
- Her dokümanda `schema_version` alanı bulunur. Şu anki değeri `1`'dir.

**Şema sürümü kuralı.** Bu değer; bir alan kaldırıldığında, adı değiştiğinde ya da anlamı değiştiğinde artar.
Yeni bir alan eklenmesi değeri artırmaz. Bu yüzden dokümanı okuyan kod, tanımadığı alanları yok saymalıdır.

### `new` ve `start`

```json
{"schema_version":1,"session":{"id":"hqarpjgu","state":"running","pid":2616798,"command":["sleep","300"],"cwd":"/tmp/nomux-demo","rows":24,"columns":80,"started_at":1795655156,"epoch":1,"restore_policy":"on-focus"}}
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
{"schema_version":1,"sessions":[{"id":"47eqwqyr","state":"dormant","pid":null,"command":["sh"],"cwd":"/tmp/nomux-demo/project","rows":24,"columns":80,"started_at":1795655221,"epoch":1,"restore_policy":"on-focus"},{"id":"zapitg2m","state":"running","pid":2618368,"command":["sh","-c","echo server started; exec sleep 600"],"cwd":"/tmp/nomux-demo","rows":24,"columns":80,"started_at":1795655226,"epoch":2,"restore_policy":"auto"}]}
```

`sessions`, `new`'un verdiği nesnelerden oluşan ve kimliğe göre sıralı bir dizidir. Hiç Session yoksa boştur. Biten bir Session diziye yalnızca `--all` ile girer:

```json
{"schema_version":1,"sessions":[{"id":"z3yjk54g","state":"ended","pid":null,"command":["sh"],"cwd":"/tmp/nomux-demo","rows":24,"columns":80,"started_at":1795655146,"epoch":1,"restore_policy":"on-focus","exit":{"ended_at":1795655216,"exit_code":3}}]}
```

İki örnek de aynı çalıştırmadaki daha uzun dokümanlardan alınmış parçalardır.

### `capture`

```json
{"schema_version":1,"capture":{"id":"ebxd36mw","output":"198\r\n199\r\n200\r\n"}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `capture.id` | string | Session kimliği |
| `capture.output` | string | Escape dizileriyle birlikte çıktı satırları. UTF-8 olmayan bir byte dizisinin yerinde U+FFFD durur. Metin çıktısında byte'lar değişmeden gelir |

### `restore-policy`

```json
{"schema_version":1,"restore_policy":{"id":"ds3kchg4","policy":"manual"}}
```

### `attach` ve `new --attach`

```json
{"schema_version":1,"attach":{"id":"z3yjk54g","end":"detached"}}
{"schema_version":1,"attach":{"id":"5k3dkgvd","end":"exited","exit_code":0}}
{"schema_version":1,"attach":{"id":"sshjdp4m","end":"signaled","signal":9}}
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
{"schema_version":1,"detached":{"id":"z3yjk54g","clients":0}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `detached.id` | string | Session kimliği |
| `detached.clients` | number | Session'a attach olmuş istemcilerin sayısı |

### `kill`

```json
{"schema_version":1,"killed":"hqarpjgu"}
```

`killed`, sonlanan Session'ın kimliğidir.

### `daemon status`

```json
{"schema_version":1,"daemon":{"running":true,"version":"0.3.0","pid":2616705,"sessions":1}}
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

### `version`

```json
{"schema_version":1,"version":"0.3.0"}
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

Bu sayfa nomux 0.3.0'ı anlatır: `nomux-sh/nomux` reposunun [`v0.3.0`](https://github.com/nomux-sh/nomux/releases/tag/v0.3.0) etiketi, [`03ad9a8`](https://github.com/nomux-sh/nomux/commit/03ad9a82ea79e1cf5d37d78e30945cb1f8c22f23) commit'i.
Yardım metinleri ve örnekler, o sürümün binary'lerinin Linux x86_64 üzerinde, geçici `/tmp/nomux-demo` home dizinindeki gerçek çıktısıdır. Session kimlikleri ve process ID'leri birden fazla çalıştırmadan gelir.
Şu kısımlar bu sayfa için çalıştırılmadı; aynı etiketteki [`docs/cli.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/docs/cli.md) dosyasından alındı: uzak bir Host'a bağlanan her komut (`host add`, bir Host verilen `host doctor`, var olan bir Host için `--host` ile çalışan komutlar), 3 çıkış kodu, SSH için 4 çıkış kodu ve 5 çıkış kodu, `unreachable`, `damaged` ve `unknown` durumları, `attach.end` alanının `lost` ve `unknown` değerleri, CLI'ın aldığı bir sinyalle biten attach ve attach sırasında pencere boyutunun değişmesi.
