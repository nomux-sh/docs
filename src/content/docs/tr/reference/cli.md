---
title: CLI başvurusu
description: nomux CLI'ının bütün komutları; seçenekleri, çıktıları, JSON dokümanları ve çıkış kodlarıyla.
sidebar:
  label: CLI
---

`nomux`, CLI'dır. Daemon'a bağlanır, isteklerini gönderir ve sonucu yazdırır. Terminalinizi yalnızca `attach` kullanır.
Komutların kullanımını [hızlı başlangıç](/docs/tr/guides/quick-start/) sayfasında, adları ve hedefleri ise [Session'lar](/docs/tr/guides/sessions/) sayfasında görebilirsiniz.

CLI'ın yardım metinleri ve mesajları İngilizcedir; bu sayfada oldukları gibi verilmiştir.

## Bütün komutlar için geçerli kurallar

- Hiçbir komut soru sormaz. Komut yalnızca argümanlarını ve ortam değişkenlerini okur. İki istisna vardır. `attach`, klavyenizi ve ekranınızı bir Session'a verir. `kill --all` bir terminalde size sorar: çok sayıda Session'ı sonlandıran komut, sizin onayınız olmadan çalışmaz.
- Bütün komutlar aynı [çıkış kodlarını](#çıkış-kodları) kullanır. `attach` bunlara Session'ın komutunun çıkış durumunu da ekler.
- Her komut `--json`, `--quiet` ve `--host <ad>` seçeneklerini kabul eder. `--json` ile `--quiet` birlikte kullanılamaz.
- `--host` verilmezse komut local Host'un daemon'unu kullanır. `--host <ad>` ile SSH üzerinden uzak bir Host'un daemon'unu kullanır. Bkz. [`--host`](#--host).
- Daemon'a ihtiyaç duyan komut, cevap veren bir daemon yoksa onu başlatır ve en fazla 5 saniye bekler. `daemon` komutları, `ext validate`, `hook`, `status set` ve `hooks uninstall` daemon başlatmaz.
- `status set` ve `hook` yalnızca bir Session'ın içinde çalışır. Ortamlarından `NOMUX_SESSION_ID`, `NOMUX_SOCK` ve `NOMUX_TOKEN` değişkenlerini okurlar. Üç değişkeni [Session'ın ortamı](/docs/tr/guides/session-environment/) sayfası anlatır. Home dizini uzunsa `NOMUX_SOCK`, kısa bir bağlantının içindeki bir yoldur; nedeni [uzun home dizinleri](/docs/tr/guides/long-home-paths/) sayfasındadır.
- Metin çıktısında yalnızca Session'ın durumu ve Session'daki işin durumu renklidir; o da standart çıktı bir terminalse ve `NO_COLOR` değişkeni tanımlı değilse.
- Terminalde, metin çıktısındaki tablo terminalin genişliğine sığar. Önce komut sütunu kısaltılır, ardından not, mesaj ya da neden sütunu, sonra da bir yol ya da ad sütunu. Kesilen yeri bir üç nokta (`…`) gösterir; kısaltılan sütun başlığının genişliğini korur. Böylece durum ve mesaj görünür kalır.
- Kısaltılan sütunlar yetmezse tablo, sabit bir sırayla sütun atar. Sırayı ve örneklerini [Dar terminaller](#dar-terminaller) bölümünde görebilirsiniz.
- Standart çıktı bir terminal değilse ve JSON çıktısında hiçbir şey kısaltılmaz ya da atlanmaz.

## Genel kullanım

```text
Sessions that stay alive on the host when the client disconnects

Usage: nomux [OPTIONS] [COMMAND]

Commands:
  new             Start a new session and print its identifier
  ls              List the sessions
  attach          Show a session in this terminal. To detach, press Ctrl-a and then d. A dormant session starts again [alias: a]
  start           Start the command of a dormant session again
  capture         Print the last output lines of a session
  restore-policy  Set when a dormant session starts again
  detach          Detach the clients that are attached to a session. The session continues
  hibernate       Stop the idle agent of a session and keep the session until a wake
  wake            Start the agent of a hibernated session again with its resume command
  pin             Exclude a session from automatic hibernation
  unpin           Take the exclusion of `pin` back
  kill            End a session. A dormant session is removed with its output
  rename          Give a session a different name
  send            Type text or keys into a session, as if the user typed them
  status          Show the status of each session: what works, what is done, what needs you
  agent           Explain the status of the sessions
  events          Print the events of the host when they come, until a signal stops the command
  project         Add, list and remove the Projects of the workspace tree
  group           Make, rename, move, remove and list the Groups of the workspace tree
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

### Yalın `nomux`

Komutsuz `nomux`, standart girdiye ve standart çıktıya bağlı olarak çalışır:

- Bir terminalde, hedefsiz [`nomux attach`](#nomux-attach) gibi en son kullanılan Session'a attach olur. Host'ta bitmemiş Session yoksa kabuğunuzla bir Session açar ve ona attach olur.
- Terminal yoksa yardım metnini standart hataya yazdırır ve 1 çıkış koduyla biter. Metin, `nomux --help` metniyle aynıdır.

```console
$ nomux < /dev/null
Sessions that stay alive on the host when the client disconnects

Usage: nomux [OPTIONS] [COMMAND]
...
$ echo $?
1
```

Yardım metninin ilk satırları yukarıdaki genel kullanımla aynıdır; sayfa, onlardan sonraki çıktıyı kısaltır. Hiç Session olmayan bir Host'ta, pseudoterminal içinde çalışan komut `/bin/bash` ile bir Session açtı ve ona attach oldu. Detach tuşlarından sonra son satır `detached from session klfljrqx` idi.

### Takma adlar

`a`, `attach` komutunun takma adıdır: `nomux a api`. Yardım metni bunu `[alias: a]` olarak gösterir.

tmux alışkanlığı için beş ad daha takma addır. Yardım metni bunları göstermez: `attach-session`, `new-session`, `list-sessions`, `kill-session` ve `rename-session`. Bunlar nomux komutlarını, tmux'un değil nomux'un seçenekleriyle çalıştırır:

```console
$ nomux new-session -n al -- sleep 100
2jdytkif
$ nomux rename-session al al2
session 2jdytkif is now named al2
$ nomux kill-session al2
session al2 (2jdytkif) ended
```

Komutların karşılaştırması [tmux ve screen'den geçiş](/docs/tr/guides/coming-from-tmux-and-screen/) sayfasındadır.

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
nomux --host vps attach api
```

- Her komut önce Host'ta CLI'ın sürümündeki binary'lerin bulunduğundan emin olur. Yoksa `host add` gibi onları kurar ve bununla ilgili tek satırı standart hataya yazar.
- `--host` ile `new --cwd <dir>`, Host'ta mutlak bir yol ister. `--cwd` verilmezse komut Host'taki home dizininizde başlar. `project add <directory>` de Host'ta mutlak bir yol ister.
- `--host`, `host` komutlarıyla, `daemon install-service` ve `daemon uninstall-service` ile, `status set` ile ve `hooks` komutlarıyla kullanılamaz. Bu komutlar `--host` ile 1 çıkış koduyla biter. `version`, CLI'ın sürümünü yazdırır. `hook`, `--host`'u yok sayar.
- SSH hatasının çıkış kodu 1'dir. Host hiçbir anahtarı kabul etmezse çıkış kodu 4'tür.
- Bir attach'in prefix tuşları, CLI'ı çalıştıran bilgisayarın ayarıdır. Uzak Host bunları değiştirmez.

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

## Hedefler ve adlar

Bir Session'ın kimliği vardır; kimliği daemon verir ve kimlik hiç değişmez. Session'ın bir adı da olabilir; adı siz verirsiniz ve değiştirebilirsiniz. Session alan her komut bir **hedef** alır: kimlik, ad ya da ikisinden birinin başı. Kuralın kullanımı [Session'lar](/docs/tr/guides/sessions/) sayfasındadır.

| Adım | Hedef | Adımın aradığı Session'lar |
|---|---|---|
| 1 | Bir Session'ın kimliği | Her Session, biten de dahil |
| 2 | Bir Session'ın adı | Bitmemiş Session'lar |
| 3 | Tam olarak bir Session'ın kimliğinin ya da adının başı | Bitmemiş Session'lar |

Bir Session bulan ilk adım kazanır. Bu yüzden tam bir ad, başı aynı olan daha uzun bir adın önüne geçer. 3. adım birden fazla Session bulursa komut hiçbir şey yapmaz, adayları yazdırır ve 1 çıkış koduyla biter. `--json` ile hata dokümanında `candidates` alanı bulunur. Hiçbir adım Session bulamazsa çıkış kodu 2'dir.

```console
$ nomux new -n api -- sleep 600
wyv5slz3
$ nomux new -n api-v2 -- sh
5g2diwdl
$ nomux capture ap
nomux: ap can be more than one session. Give more of the identifier or of the name of one of them:
  5g2diwdl  api-v2  sh
  wyv5slz3  api     sleep 600
$ nomux capture api
$ nomux detach wyv
detached 0 clients from session api (wyv5slz3)
$ nomux detach nothing
nomux: no session has the identifier or the name nothing, and no session has a name or an identifier that starts with it
```

`nomux capture api` tam bir hedeftir (2. adım); bu yüzden `api` Session'ının çıktısını yazdırır. O Session'ın çıktısı yoktur. `nomux capture ap` iki adın başıdır (3. adım); bu yüzden başarısız olur.

Adın kuralları:

- Ad, `A-Z`, `a-z`, `0-9`, `.`, `_` ve `-` karakterlerinden oluşan 1 ile 64 karakterdir. İlk karakter harf ya da rakamdır. Adlarda büyük küçük harf ayrımı vardır.
- Ad, Host'ta bitmemiş Session'lar arasında benzersizdir. Uykudaki Session adını korur. Biten Session adını `ls --all` çıktısında korur ve yeni bir Session o adı hemen alabilir. Biten bir Session'ın hedefi yalnızca kimliğidir.
- Ad, başka bir Session'ın kimliği olamaz.
- `-t <hedef>`, tmux alışkanlığı için argümanla aynıdır: `nomux attach -t api`. Yardım metni bunu göstermez. `restore-policy` komutunda yoktur.
- Session alan her komut hedefi ister; yardım metni `[TARGET]` yazıp köşeli parantez gösterse de. Yalnızca `attach` komutunun varsayılanı vardır (bir istemcinin en son attach olduğu Session, yoksa en son açılan Session). `kill` komutunun yardım metni de bir varsayılan gösterir, ama hedefsiz ve `--all`'suz `nomux kill` 1 çıkış koduyla başarısız olur.
- Adlardan eski bir daemon, `new -n` ve `rename` komutlarını 1 çıkış koduyla reddeder. Hedef, böyle bir daemon'un Session'larını kimlikleriyle bulur.

```console
$ nomux new -n api -- sleep 1
nomux: the name api is in use by session wyv5slz3. Run `nomux new -A -n api` to attach to it, or give a different name
$ nomux new -n bad/name -- sleep 1
nomux: the session name "bad/name" is not valid: a name has 1 to 64 characters from A-Z, a-z, 0-9, '.', '_' and '-', and starts with a letter or a digit
$ nomux kill
nomux: kill needs a session, or --all: `nomux kill <target>`
```

CLI, bir hedefin Session'ını komutun isteğinden önce tek bir `Session.List` isteğiyle bulur; böylece her istemci bir Session'ı aynı şekilde bulur.

## Session komutları

### `nomux new`

Yeni bir Session açar ve session kimliğini yazdırır. `--attach` verilirse Session'a attach olur.

```text
Usage: nomux new [OPTIONS] [-- <COMMAND>...]

Arguments:
  [COMMAND]...  The same as --cmd: each argument after -- belongs to the command

Options:
      --json              Print the result as one JSON document
  -n, --name <NAME>       The name of the session: 1 to 64 characters from A-Z, a-z, 0-9, '.', '_' and '-', that start with a letter or a digit. No other session that runs has it
  -c, --cwd <DIR>         The working directory of the command [default: the current directory]
  -q, --quiet             Print only the necessary part of the result
  -a, --attach            Attach to the new session
      --host <NAME>       Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -A, --attach-or-create  Attach to the session that has the name of --name. If no session has it, start the session and attach to it
      --prefix <KEY>      A prefix key of this attach, for example C-a, C-b or C-\. Give the option two times for two keys. none: no key detaches [default: the variable `NOMUX_PREFIX`, then `prefix` in `[attach]` of the configuration file, then C-a and C-\]
      --cmd <COMMAND>...  The command of the session and its arguments [default: the shell of the user]. Each argument after --cmd belongs to the command, also an option of nomux
  -h, --help              Print help
```

| Seçenek | Varsayılan | Ne yapar |
|---|---|---|
| `-n`, `--name <NAME>` | Ad yok | Session'ın adı. Bkz. [Hedefler ve adlar](#hedefler-ve-adlar). Bitmemiş bir Session'ın taşıdığı bir ad 1 çıkış kodunu verir; mesaj o Session'ı ve `-A` seçeneğini anar. |
| `-c`, `--cwd <DIR>` | CLI'ın çalıştığı dizin | Komutun çalışma dizini. Göreli yol, CLI'ın çalıştığı dizine göre çözülür. Dizinin var olması gerekir. |
| `-a`, `--attach` | Kapalı | Terminali, [`nomux attach`](#nomux-attach) gibi yeni Session'a attach eder. Komut bu durumda session kimliğini değil, attach'in sonucunu yazdırır. Terminal yoksa komut başarısız olur ve Session açmaz. |
| `-A`, `--attach-or-create` | Kapalı | `-n` ister. Bitmemiş bir Session bu ada sahipse komut ona attach olur; değilse Session'ı açar ve ona attach olur. |
| `--prefix <KEY>` | Bkz. [Prefix tuşları](#prefix-tuşları) | `-a` ya da `-A` ile yapılan attach'in prefix tuşları. |
| `-- <COMMAND>...` | Kullanıcının shell'i: daemon'un `SHELL` değişkeni, yoksa `/bin/sh` | Session'ın komutu ve argümanları. |
| `--cmd <COMMAND>...` | Aynısı | `--`'nin ikinci yazılışı. İki yazılış birlikte kullanılamaz. |

`--cwd` ve `--attach`, `-c` ile `-a` seçeneklerinin uzun adlarıdır. nomux 0.4.0'ın uzun adları eskisi gibi çalışır.

Daemon `-A` kararını tek adımda verir; bu yüzden aynı anda çalışan iki `nomux new -A -n work` tek bir Session açar. Var olan bir Session için komut ve `--cwd` kullanılmaz; standart hatadaki tek bir satır bunu söyler. Uykudaki bir Session, `attach` gibi yeniden başlar.

```console
$ nomux new -n api -c src/acme-web -- sleep 600
wsqtewka
$ nomux new --cwd project -- sleep 600
aghldjzc
$ nomux new -A -n web -c project -- sleep 5
nomux: session web exists: the command and --cwd are not used
```

Son komut `web` Session'ına attach oldu. Detach tuşlarından sonra `detached from session web (kx7edkz2)` yazdırdı.

**`--` ya da `--cmd`'den sonraki her argüman Session'ın komutuna aittir; `nomux`'un bir seçeneği olan argüman da öyle.** Bu yüzden `nomux`'un seçenekleri komuttan önce gelir:

```sh
nomux new --json -- sleep 300      # --json is an option of nomux
nomux new -- sleep 300 --json      # --json is an argument of sleep
```

```console
$ nomux new --json -- sleep 300
{"schema_version":1,"session":{"id":"b3xrwvkk","name":null,"state":"running","pid":4041029,"command":["sleep","300"],"cwd":"/home/user","rows":24,"columns":80,"started_at":1795706330,"epoch":1,"restore_policy":"on-focus"}}
$ nomux new --json -- sleep 300 --json
{"schema_version":1,"session":{"id":"7f2zzrba","name":null,"state":"running","pid":4041032,"command":["sleep","300","--json"],"cwd":"/home/user","rows":24,"columns":80,"started_at":1795706331,"epoch":1,"restore_policy":"on-focus"}}
```

**İki yazılış birlikte kullanılamaz.** Önce `--cmd`, sonra `--` içeren bir komut satırı bir kullanım hatasıdır; 1 çıkış koduyla biter ve hiçbir Session açılmaz: `nomux`, `--`'nin komutun argümanı mı yoksa ikinci yazılışın başlangıcı mı olduğunu bilemez.

```console
$ nomux new --cmd sh -- -c true
error: the argument '--cmd <COMMAND>...' cannot be used with '--': nomux cannot know where the command of the session starts. Give the command in one form: `nomux new --cmd <command> [argument...]` or `nomux new -- <command> [argument...]`. For a command that has `--` as an argument, use the second form

Usage: nomux new [OPTIONS] [-- <COMMAND>...]

For more information, try '--help'.
```

Yani argümanlarından biri `--` olan bir komut ikinci yazılışı gerektirir. İlk `--`'den sonra her `--` komuta aittir:

```sh
nomux new -- git log -- notes.txt        # the second -- is an argument of git
```

Komut, daemon'un ortamını alır; [Session'ın ortamı](/docs/tr/guides/session-environment/) sayfasındaki değişikliklerle birlikte: `TERM=xterm-256color`, `COLORTERM=truecolor`, daemon'da locale yoksa UTF-8 karakter kümesi ve `NOMUX_SESSION_ID`, `NOMUX_SOCK` ve `NOMUX_TOKEN` değişkenleri. Bir istemci attach olana kadar terminali 24 satır ve 80 sütundur: attach, Session'a istemcinin terminalinin pencere boyutunu verir. Session bundan sonra CLI'a da daemon'a da ihtiyaç duymaz.

Dizin yoksa çıkış kodu 1'dir ve Session açılmaz. Komutun programı yoksa sonuç, Host'un bellek limitine bağlıdır:

```console
$ nomux new -c /nonexistent-directory
nomux: the working directory /nonexistent-directory is not an absolute path of a directory
$ nomux new -- /nonexistent-binary
nomux: the session did not start: nomux-holder: cannot start the command: No such file or directory (os error 2)
```

İkinci komut, [bellek limiti](/docs/tr/guides/session-memory/) olmayan bir Host'ta çalıştı. Yapılandırma dosyasında `memory_limit` olan bir Host'ta aynı komut bir session kimliği yazdırdı ve 0 çıkış koduyla bitti. Session hemen 1 çıkış durumuyla bitti ve `capture`, `Failed to find executable /nonexistent-binary: No such file or directory` satırını gösterdi: limit varsa holder komutu `systemd-run` üzerinden başlatır ve hatayı o bildirir. Bu fark [Session belleği](/docs/tr/guides/session-memory/) sayfasında anlatılmıyor.

`--attach` bir terminal ister. Terminal yoksa çıkış kodu 1'dir ve Session açılmaz:

```console
$ nomux new --attach -- sh < /dev/null
nomux: attach needs a terminal: the standard input is not a terminal
$ nomux new -A < /dev/null
error: the following required arguments were not provided:
  --name <NAME>

Usage: nomux new --name <NAME> --attach-or-create -- <COMMAND>...

For more information, try '--help'.
```

### `nomux ls`

Çalışabilecek Session'ları listeler: komutu çalışan Session'lar, uykudaki Session'lar, hazırda bekleyen Session'lar ve bozuk Session'lar. `--all` ile biten Session'ları da listeler.

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
ID        NAME     STATE       PID      PROJECT                    COMMAND                NOTE
7vyxpmt3  api      running     4056358  Client work/Acme/acme-web  sleep 600
plhommva  -        dormant     -        -                          sleep 300
qghxx5rq  web      running     4056361  Client work/Acme/acme-web  sh
tvomf5br  editor   running     4056367  Client work/Acme/notes     vim -u NONE notes.txt
uistajr3  scratch  running     4056382  -                          sleep 900
wzr5kzyq  agent    hibernated  -        Client work/Acme/acme-web  claude                 request
```

Hiç Session yoksa komut `no sessions` yazdırır.

- `ID`, session kimliğidir.
- `NAME`, Session'ın adıdır ya da `-`. Tabloda bu sütun yalnızca bir Session'ın adı varsa bulunur.
- `PID`, Session'ın komutunun process ID'sidir. Session'ın process'i yoksa ya da daemon bunu bilmiyorsa `-` görünür.
- `PROJECT`, Session'ın workspace ağacındaki [Projesinin](/docs/tr/guides/projects-and-groups/) yoludur ya da `-`. Tabloda bu sütun yalnızca bir Session'ın Projesi varsa bulunur. Proje, dizini Session'ın çalışma dizini olan ya da onun üstünde kalan Projedir. Birden fazla Proje uyarsa en uzun dizin kazanır. `new -c src/acme-web/` ve `new -c src/acme-web` aynı Projeyi verir: daemon çalışma dizinini çözer; bu, sondaki eğik çizgiyi ve sembolik bağlantıları ortadan kaldırır.
- `COMMAND`, program ve argümanlarıdır; aralarında birer boşluk vardır.
- `NOTE` sütunu yalnızca bir Session'ın notu varsa görünür: biten bir Session'ın komutunun nasıl bittiği (`exit status <n>` ya da `signal <n>`), Session'ın tanımının neden bozuk olduğu, hazırda bekleyen bir Session'ın hazırda bekletme nedeni (`count`, `session-memory`, `total-memory`, `memory-pressure` ya da `request`), son uyandırmanın neden başarısız olduğu ve [`pin`](#nomux-pin-ve-nomux-unpin) komutunun otomatik hazırda bekletmenin dışında tuttuğu bir Session için `pinned`.

```console
$ nomux ls --all
ID        NAME  STATE    PID      PROJECT                    COMMAND       NOTE
2eeuodaj  old   ended    -        -                          sleep 600     signal 1
mxn3d5r6  api   running  4128216  Client work/Acme/acme-web  sleep 600     pinned
rqtf4yp4  job   ended    -        -                          sh -c exit 3  exit status 3
```

`old`, `nomux kill old` onu sonlandırdığı için bitti (`signal 1`, `kill` komutunun gönderdiği `SIGHUP`'tır). `job`, komutunun 3 çıkış durumuyla bitti.

| Durum | Anlamı |
|---|---|
| `running` | Session'ın komutu çalışıyor. |
| `unreachable` | Session'ın holder'ı çalışıyor ama daemon'un ona bağlantısı yok. Daemon yeniden bağlanmayı dener. |
| `dormant` | Session'ın process'i yok: holder'ı gitmiş, komutu bitmemiş. `attach` ya da `start` komutu yeniden başlatır. Bkz. [Yeniden başlatmadan sonra](/docs/tr/guides/after-a-restart/). |
| `hibernated` | Daemon, Session'ın agent'ını durdurdu; Session çıktısını ve devam komutunu saklıyor. `wake` ya da `attach` agent'ı yeniden başlatır. Bkz. [Hazırda bekletme](/docs/tr/guides/hibernation/). |
| `ended` | Session'ın komutu bitti. Daemon Session'ı ve çıktısını saklama süresi boyunca, varsayılan olarak 24 saat tutar. Yalnızca `ls --all` gösterir. |
| `damaged` | Daemon Session'ın tanımını okuyamıyor. Not nedeni söyler. `kill` Session'ı siler. |
| `unknown` | Daemon CLI'dan yeni ve CLI'ın tanımadığı bir durum gönderdi. |

JSON çıktısı, hazırda bekleyen bir Session için `dormant` durumunu ve bir `hibernation` nesnesini verir. Bu nesneyi tanımayan bir istemci uykudaki bir Session görür; bu da doğrudur.

#### Dar terminaller

Terminalde tablo, terminalin genişliğine sığar. Önce kısaltılan sütunlar daralır. Bu yetmezse tablo sütunları sabit bir sırayla atar; terminal yeterince genişleyince atılan sütun geri gelir. `ls` önce `PID`'i, sonra `PROJECT`'i atar ve `NAME`'i hiçbir zaman atmaz. Aşağıdakiler, yukarıdaki Session'lar için `nomux ls` komutunun 60, 50 ve 40 sütunluk terminallerdeki çıktısıdır:

```text
ID        NAME   STATE       PID      PROJECT  COMMAND  NOTE
7vyxpmt3  api    running     4056358  Client…  sleep …
plhommva  -      dormant     -        -        sleep …
qghxx5rq  web    running     4056361  Client…  sh
tvomf5br  edit…  running     4056367  Client…  vim -u…
uistajr3  scra…  running     4056382  -        sleep …
wzr5kzyq  agent  hibernated  -        Client…  claude   req…
```

```text
ID        NAME  STATE       PROJECT  COMMAND  NOTE
7vyxpmt3  api   running     Client…  sleep …
plhommva  -     dormant     -        sleep …
qghxx5rq  web   running     Client…  sh
tvomf5br  edi…  running     Client…  vim -u…
uistajr3  scr…  running     -        sleep …
wzr5kzyq  age…  hibernated  Client…  claude   req…
```

```text
ID        NAME  STATE       COMMAND  NOTE
7vyxpmt3  api   running     sleep …
plhommva  -     dormant     sleep …
qghxx5rq  web   running     sh
tvomf5br  edi…  running     vim -u…
uistajr3  scr…  running     sleep …
wzr5kzyq  age…  hibernated  claude   req…
```

Diğer tablolar sütunları şu sırayla atar. Aşağıdaki sıra, bu sayfanın genişlik taramasında ölçülen sıradır:

| Komut | İlk atılan sütunlar |
|---|---|
| `ls` | `PID`, sonra `PROJECT` |
| `ls --memory` | `MEASURE`, sonra `LIMIT`, `FREED`, `PROCESSES` ve `HOLDER` |
| `status` | `FOR`, sonra `COMMAND` |
| `ext ls` | `VERSION`, sonra `NAME` |

`ext ls` bu sayfa için dar bir terminalde çalıştırılmadı. `ext ls` sırası ürün başvurusundan alınmıştır.

Olağan değerlere sahip bir tablo, attığı sütunlarla birlikte 60 sütunluk bir terminale sığar. Tablo olmayan bir satır, örneğin `ls --memory` komutunun toplam satırı, bir boşlukta bölünür. 60 sütunun altında bir tablo bir adı birkaç karaktere kadar kesebilir: 50 sütunluk bir terminalde `status --tree`, ilk sütununda `Cli…` ve `A…` gösterir. Komutlar bir pseudoterminal içinde çalıştırıldı. Renk kapalıydı (`NO_COLOR`).

#### `nomux ls --memory`

`--memory` ile komut, her Session'ın process'lerinin komutun çalıştığı anda kullandığı belleği de gösterir. Daemon belleği yalnızca bu komut için ölçer: `--memory` olmadan `ls` hiçbir şey ölçmez.

```console
$ nomux ls --memory
ID        STATE       MEMORY     PROCESSES  HOLDER     MEASURE  LIMIT    FREED      COMMAND
7vyxpmt3  running     147.0 KiB  1          262.0 KiB  pss      4.0 GiB  -          sleep 600
plhommva  dormant     -          -          -          -        -        -          sleep 300
qghxx5rq  running     731.0 KiB  1          270.0 KiB  pss      4.0 GiB  -          sh
tvomf5br  running     4.8 MiB    1          271.0 KiB  pss      4.0 GiB  -          vim -u NONE notes.txt
uistajr3  running     147.0 KiB  1          258.0 KiB  pss      4.0 GiB  -          sleep 900
wzr5kzyq  hibernated  -          -          -          -        -        141.0 KiB  claude
total: 5.8 MiB in 4 processes of 4 sessions, and 1.0 MiB in the holders (pss)
hibernated: 141.0 KiB given back by 1 session
```

Bu örnekteki Host'un yapılandırma dosyasında `[sessions]` altında `memory_limit = "4G"` vardır.

| Sütun | Anlamı |
|---|---|
| `MEMORY` | Komutun process ağacının belleği: komut ve ondan türeyen her process. |
| `PROCESSES` | O ağaçtaki process sayısı. |
| `HOLDER` | Session'ın holder'ının belleği. `MEMORY`'nin parçası değildir. |
| `MEASURE` | `pss`: proportional set size; birden fazla process'in kullandığı bir sayfayı bir kez sayar. `rss`: resident set size; böyle bir sayfayı her process için sayar. Linux `pss`, macOS `rss` verir. |
| `LIMIT` | İşletim sisteminin komutun process'lerine uyguladığı bellek limiti. Hiçbiri uygulanmıyorsa `-`. |
| `FREED` | Hazırda bekleyen bir Session için: hazırda bekletmenin geri verdiği bellek. Bir Session hazırda bekliyorsa son satır toplamı gösterir. |

- Process'i olmayan bir Session'ın ölçülen beş değerin sütunlarında `-` vardır ve toplam satırında yer almaz. Hazırda bekleyen bir Session'ın değeri yalnızca `FREED` sütunundadır.
- Tabloda `NAME`, `PROJECT`, `PID` ve `NOTE` sütunu yoktur. `--memory` olmadan `ls` bunlara sahiptir. JSON dokümanında ad vardır.
- Bir boyutun birimi `KiB`, `MiB` ya da `GiB`'dir (1024 bayt, 1024 KiB, 1024 MiB) ve bir ondalık basamağı vardır. JSON çıktısı baytı verir.
- Session'ların ölçüsü aynı değilse toplam satırı `pss and rss` der: toplam bu durumda iki türden değer içerir.
- `--memory`, `--all` ile birlikte çalışır. Biten bir Session'ın her sütunda `-` değeri vardır.
- Bu seçenekten eski bir daemon hatayla cevap verir ve çıkış kodu 1'dir.
- `--host` ile uzak Host'un daemon'u o Host'taki process'leri ölçer.
- Limit yapılandırmaya girmeden önce başlamış bir Session, `LIMIT` sütununda `-` gösterir.

Daemon'un nasıl ölçtüğünü, değerlerin neyi saymadığını ve komutun ne kadar sürdüğünü [Session belleği](/docs/tr/guides/session-memory/) sayfası anlatır.

### `nomux attach`

Terminalinizi bir Session'ın terminali yapar; siz detach olana ya da Session sonlanana kadar. Uykudaki bir Session yeniden başlar, hazırda bekleyen bir Session uyanır. Takma adı `a`'dır.

```text
Usage: nomux attach [OPTIONS] [TARGET]

Arguments:
  [TARGET]  The session: its identifier, its name, or the start of one of them [default: the session that a client attached to last, else the session that started last]

Options:
      --json           Print the result as one JSON document
  -d, --detach-others  Detach the other clients of the session first
  -q, --quiet          Print only the necessary part of the result
      --host <NAME>    Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -r, --read-only      Show the session and send no key and no window size to it. The prefix keys work
      --prefix <KEY>   A prefix key of this attach, for example C-a, C-b or C-\. Give the option two times for two keys. none: no key detaches [default: the variable `NOMUX_PREFIX`, then `prefix` in `[attach]` of the configuration file, then C-a and C-\]
  -h, --help           Print help

Keys during an attach, with the default prefix keys Ctrl-a and Ctrl-\:
  Ctrl-a d         Detach. The session continues. Ctrl-a Ctrl-d also detaches
  Ctrl-a Ctrl-a    Send one Ctrl-a to the session. Ctrl-a a does the same
  Ctrl-a ?         Show the keys in the title of the window until the next key
  Ctrl-\ d         Detach
  Ctrl-\ Ctrl-\    Send one Ctrl-\ to the session

A prefix and a different key go to the session together. --prefix, the
variable NOMUX_PREFIX and `prefix` in [attach] of the configuration file
choose other prefix keys: for example C-b, or none.

Each other key goes to the session. The exit code is the exit status of the
command if the session ends during the attach, and 0 after a detach.
```

Hedef verilmezse `attach`, bitmemiş Session'lar arasından bir istemcinin en son attach olduğu Session'ı, o yoksa en son açılan Session'ı alır. Daemon son attach'in zamanını belleğinde tutar: daemon yeniden başlayınca en son açılan Session alınır. Host'ta böyle bir Session yoksa çıkış kodu 2'dir.

- `-d`, `--detach-others`, önce Session'ın diğer istemcilerini [`detach`](#nomux-detach) gibi detach eder. Başka bir istemci iki istek arasında attach olabilir.
- `-r`, `--read-only`, Session'ı gösterir ve ona hiçbir tuş ve pencere boyutu göndermez: Session boyutunu korur. Detach tuşları çalışır. Bu kuralı istemci kendisi uygular, daemon uygulatmaz.
- `--prefix <tuş>`, bu attach'in prefix tuşlarını belirler. Bkz. [Prefix tuşları](#prefix-tuşları).

Attach sırasında şunlar olur:

1. Session, terminalinizin pencere boyutunu alır.
2. Terminal Session'ın o anki ekranını gösterir. Ekranını daha önce çizmiş bir program, örneğin bir editör, hemen görünür.
3. Bastığınız her tuş Session'a gider; Session'ın yazdığı her byte terminalinizde görünür. Terminal raw moddadır: `Ctrl-C` ve `Ctrl-Z` Session'daki programlara ulaşır.
4. Pencerenin boyutu değişirse Session yeni boyutu alır.

Uykudaki bir Session'da attach önce komutu, Session'ın çalışma dizininde ve terminalinizin pencere boyutuyla yeniden başlatır. Terminal önce eski çıktının sonunu, ardından `--- nomux: the session started again. The output before this line is from the command that stopped ---` satırını, sonra da yeni komutun ekranını gösterir. Session'ın önceki process'leri geri gelmez. Hazırda bekleyen bir Session'da attach, [`nomux wake`](#nomux-wake) gibi bir uyandırma yapar ve aynı satırı eski ekranla devam eden agent'ın ekranı arasında gösterir. Bundan sonra eski çıktı ve satır, terminalin scrollback'indedir.

Komut, standart girdide bir terminal bekler.
Aynı Session'a aynı anda birden fazla terminal attach olabilir. Hepsi aynı çıktıyı görür, hepsinden yazılabilir.
Session'ın tek bir pencere boyutu vardır: en son attach olan ya da boyutu en son değişen terminalinki. Boyutu farklı olan terminal, çıktıyı programların o boyut için ürettiği hâliyle görür.

Attach, Session'ın ekranını gösterir; ekrandan çıkmış satırları göstermez. Onları [`nomux capture`](#nomux-capture) yazdırır.

Bir mesajdaki `<session>`, Session'ın kimliğiyle birlikte adıdır, örneğin `api (m4ab5ghi)`; adı olmayan bir Session için yalnızca kimliktir.

#### Prefix tuşları

Prefix tuşu, nomux'un her tuşundan önce gelir. Varsayılan prefix tuşları, screen'in tuşu olan `Ctrl-a` ve nomux 0.4'ün tuşu olan `Ctrl-\`'dir. İkisi aynı anda etkindir. `Ctrl-\` hâlâ çalışır; bu yüzden 0.4'ten kalma bir alışkanlık bozulmaz.

| Tuşlar | Ne yapar |
|---|---|
| Bir prefix, ardından `d` ya da `Ctrl-d` | Detach. Session yaşamaya devam eder. `Ctrl-d`, `Ctrl` tuşunu hâlâ basılı tutan kullanıcı içindir. |
| İki kez prefix | Session'a tek bir prefix tuşu gönderir. |
| `Ctrl-a`, ardından `a` | Session'a, screen'deki gibi tek bir `Ctrl-a` gönderir. `Ctrl` ve bir harften oluşan başka bir prefix için o harf. |
| Bir prefix, ardından `?` | Tuşları, sonraki tuşa kadar terminal penceresinin başlığında gösterir. Session'ın ekranı değişmez. |
| Bir prefix, ardından başka bir tuş | İki tuşu da Session'a gönderir. |

- Prefix, bir tuşu sonraki tuşa kadar bekletir ve tablodaki tuşları alır. Bu yüzden tek başına bir `Ctrl-a` (shell'de satırın başı) etkisini sonraki tuştan sonra gösterir. `Ctrl-a` ve ardından başka bir tuş, örneğin `Ctrl-a Ctrl-k`, prefix olmadan olduğu gibi çalışır.
- `Ctrl-a ?` pencerenin başlığında şu metni gösterir: `nomux keys: C-a d: detach, C-a C-a or C-a a: send C-a; C-\ d: detach, C-\ C-\: send C-\`.

**Ayar.** Aşağıdakilerden ayarlanmış ilki prefix tuşlarını verir:

1. `attach` ve `new --attach` komutlarının `--prefix <tuş>` seçeneği. İki tuş için iki kez verin.
2. `NOMUX_PREFIX` değişkeni: tuşlar aralarında virgülle yazılır, örneğin `C-b` ya da `C-a,C-\`.
3. CLI'ı çalıştıran bilgisayarın yapılandırma dosyasındaki `[attach]` tablosunda `prefix`, örneğin `prefix = ["C-b"]`.
4. Varsayılan: `Ctrl-a` ve `Ctrl-\`.

```console
$ printf '[attach]\nprefix = ["C-b"]\n' > ~/.config/nomux/config.toml
$ nomux attach api
```

Bu dosyadan sonra `Ctrl-b d` detach eder ve `Ctrl-a d` Session'a gider. `NOMUX_PREFIX=C-x` dosyanın önüne geçer, `--prefix C-a` da değişkenin önüne geçer.

- Bir tuş `C-<x>` biçimindedir: `x` bir harf, `\`, `]`, `^`, `_`, `@` ya da `Space` olur.
- `C-c`, `C-d`, `C-z`, `C-s`, `C-q`, `C-h`, `C-i`, `C-j`, `C-m` ve `C-[` prefix olamaz; programlar onlara ihtiyaç duyar. Bir listede en fazla iki farklı tuş olabilir.
- Geçerli olmayan bir ayar 1 çıkış kodunu verir ve `new --attach` bu durumda Session açmaz:

```console
$ nomux attach --prefix C-c api
nomux: --prefix: the prefix key C-c cannot be used: programs need it (interrupt, end of input, backspace, tab, new line, Enter, flow control or suspend)
$ nomux attach --prefix C-a --prefix C-b --prefix C-x api
nomux: --prefix: an attach has 2 prefix keys at most
$ nomux attach --prefix foo api
nomux: --prefix: the prefix key "foo" is not valid: give C-<x>, where x is a letter, \, ], ^, _, @ or Space, or give none
$ NOMUX_PREFIX=C-a,C-a nomux attach api
nomux: NOMUX_PREFIX: the prefix key C-a is two times in the list
$ nomux attach api
nomux: the configuration file /home/user/.config/nomux/config.toml is not valid: the key `attach.prefix` the prefix key C-c cannot be used: programs need it (interrupt, end of input, backspace, tab, new line, Enter, flow control or suspend)
```

Son komut, yapılandırma dosyasında `prefix = ["C-c"]` varken çalıştı.

- `none` (`--prefix none`, `NOMUX_PREFIX=none`, `prefix = "none"` ya da `prefix = []`) prefix'i kapatır. Her tuş Session'a gider, `Ctrl-a d` de. O zaman başka bir terminalden `nomux detach <hedef>` ile detach edin ya da terminali kapatın.
- **İç içe Session'lar.** `nomux attach` çalıştıran bir Session'a attach olursanız prefix'i önce dıştaki istemci alır. `Ctrl-a a d`, içteki istemciye tek bir `Ctrl-a` ve ardından `d` gönderir; yani içteki istemciyi detach eder. Ya da içteki istemciyi başka bir prefix'le başlatın: `nomux attach --prefix C-b <hedef>`.
- **Tuş biçimleri.** Session'daki bir program, terminalin tuşları kitty klavye protokolü (`Ctrl-a` için `CSI 97 ; 5 u`) ya da `modifyOtherKeys` (`CSI 27 ; 5 ; 97 ~`) biçiminde göndermesini sağlayabilir. CLI prefix'i ve ondan sonraki tuşları bu iki biçimde ve eski biçimde bulur. Bu sayfa `Ctrl-a d` ve `Ctrl-\ d` tuşlarını üç biçimde çalıştırdı; ayrıca terminalin bir okumasının `ESC [ 97 ;` ve `ESC [ 97 ; 5`'ten sonra böldüğü bir kitty dizisini de. İlk okumanın doğrudan `ESC`'ten sonra bittiği bölünmüş bir dizi bulunmaz: CLI o `ESC`'i Escape tuşu sayar. CLI'ın aldığı bir tuşun bırakılma olayı Session'a gitmez. Her diğer byte olduğu gibi Session'a gider.
- Bracketed paste'in metninde nomux tuşu yoktur: yapıştırılan bir `Ctrl-a d` Session'a gider.

#### Attach nasıl biter

Her durumda terminal eski moduna döner. CLI terminalin alternate screen'ini kullanmaz: attach bittiğinde terminalde Session'ın son ekranı durur, mesaj da bir sonraki satıra yazılır.

| Olay | Mesaj | Çıkış kodu |
|---|---|---|
| Siz detach olursunuz, `nomux detach` istemciyi detach eder ya da terminal kapanır | `detached from session <session>` | 0 |
| Session'ın komutu biter | `session <session> ended with exit status <n>` | `<n>`: komutun çıkış durumu |
| Session'ın komutunu bir sinyal sonlandırır | `session <session> ended by signal <n>` | 128 + `<n>`; shell'in verdiği değerle aynı |
| Session sonlanır ama daemon çıkış durumunu alamaz | `session <session> ended; its exit status is not known` | 1 |
| Daemon durur ya da çöker | Session'ın yaşadığını ve nasıl yeniden attach olunacağını söyleyen bir hata | 1 |
| Uzak Host'a bağlantı kopar | Attach yeniden bağlanır ve eksik çıktıyla devam eder. O zamana kadar terminal penceresinin başlığı `nomux: connection lost, connecting again` der ve bu sürede basılan tuşlar atılır. Yaklaşık 48 saniye bağlantı olmazsa nasıl yeniden attach olunacağını söyleyen bir hata | Hatadan sonra 1 |
| CLI `SIGTERM`, `SIGHUP`, `SIGINT` ya da `SIGQUIT` alır | Bir hata | 1 |
| Hedefe uyan bir Session yok ya da Session'ın komutu attach'ten önce bitmiş | Bir hata | 2 |
| Session uykuda ve geri yükleme politikası `manual`, ya da komutu başlatılamıyor | Bir hata | 1 |

Yani `attach`'in çıkış kodu [çıkış kodları](#çıkış-kodları) tablosunda olmayan bir değer olabilir; 1 ile 5 arasındaki değerler de Session'ın komutundan gelebilir. `--json` ile biten bir Session'ın dokümanı standart çıktıya, hata ise standart hataya gider. `--quiet` ile mesaj yazdırılmaz.

Aşağıda, bu sayfanın bir pseudoterminalde çalıştırdığı üç attach bitişi var: detach, 3 çıkış durumuyla biten komut ve sinyalle sonlanan komut. Son ikisinin çıkış kodu 3 ve 137'dir.

```console
$ nomux attach api-v2
detached from session api-v2 (5g2diwdl)
$ nomux new -n quick -a -- sh
session quick (3f3yt5ok) ended with exit status 3
$ nomux new -a -- sh
session t55qu4h6 ended by signal 9
```

Terminal, her mesajın üstünde Session'ın son ekranını gösterir. İkinci komutta `exit 3`, üçüncü komutta `kill -9 $$` yazdınız.

Hiçbir Session hedefe uymuyorsa ya da Session bitmişse:

```console
$ nomux attach aaaaaaaa
nomux: no session has the identifier or the name aaaaaaaa, and no session has a name or an identifier that starts with it
$ nomux attach rmmcedtb
nomux: session rmmcedtb ended: its command does not run
```

Terminali olmayan bir `attach`, Session'ı aramadan önce başarısız olur: çıkış kodu 1'dir ve mesaj `nomux: attach needs a terminal: the standard input is not a terminal` olur.

`--json` ile attach, `attach` dokümanını ([JSON çıktısı](#json-çıktısı)) yazdırır:

```console
$ nomux --json attach web
{"schema_version":1,"attach":{"id":"kx7edkz2","name":"web","end":"detached"}}
$ nomux --json new -A -n web
{"schema_version":1,"attach":{"id":"kx7edkz2","name":"web","created":false,"end":"detached"}}
```

### `nomux start`

Uykudaki bir Session'ın komutunu attach olmadan yeniden başlatır.

```text
Usage: nomux start [OPTIONS] [TARGET]

Arguments:
  [TARGET]  The session: its identifier, its name, or the start of one of them

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

Komut, Session'ın çalışma dizininde ve Session'ın sahip olduğu pencere boyutuyla başlar. `manual` geri yükleme politikasında da başlar.

```console
$ nomux start d1
session d1 (hcdtllok) runs
```

- Komutu çalışan bir Session için komut başarılı olur ve hiçbir şeyi değiştirmez.
- Biten bir Session için çıkış kodu 2'dir: `nomux: session rmmcedtb ended: its command does not run`.
- Komut başlatılamazsa, örneğin çalışma dizini kaybolmuşsa, çıkış kodu 1'dir ve Session uykuda kalır.
- Hazırda bekleyen bir Session'da `start`, [`wake`](#nomux-wake) gibi devam komutunu başlatır ve uykudaki bir Session'la aynı çıktıyı verir. Sayfa bunu bir kez çalıştırdı. Hazırda bekleyen bir Session için `wake` kullanın: Session hazırda beklemiyorsa bir mesajla başarısız olur.

### `nomux capture`

Bir Session'ın son çıktı satırlarını, attach olmadan yazdırır.

```text
Usage: nomux capture [OPTIONS] [TARGET]

Arguments:
  [TARGET]  The session: its identifier, its name, or the start of one of them

Options:
      --json         Print the result as one JSON document
      --lines <N>    The number of lines [default: 100]
  -q, --quiet        Print only the necessary part of the result
  -f, --follow       After the lines, print each byte that the command writes, until the session ends or a signal stops the command. Not with --json
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux new -n log -- sh -c 'seq 1 200; exec sleep 600'
bxebg7jh
$ nomux capture log --lines 3
198
199
200
```

- Satırlar, Session'ın diskteki journal'ından gelir. Bu yüzden komut, ekrandan çıkmış satırları, bir geri yüklemeden önceki satırları ve uykudaki, hazırda bekleyen ya da biten bir Session'ın satırlarını da yazdırır.
- Çıktı, komutun yazdığı byte'lardır; escape dizileriyle birlikte. Satır, terminalin aldığı gibi bir carriage return ve bir line feed ile biter.
- Session'ın daha az satırı varsa komut bütün çıktısını yazdırır.
- `--quiet` ile çıktı aynıdır. `--json` ile çıktı bir string'dir: bkz. [`capture`](#capture).
- `-f`, `--follow`, satırları ve sonra komutun yazdığı her byte'ı yazdırır; Session bitene, bir sinyal komutu durdurana (`SIGINT` ya da `SIGTERM`) ya da çıktıyı okuyan taraf onu kapatana kadar. Her durumda çıkış kodu 0'dır. Komut, pencere boyutu ve girdi olmadan, salt okunur bir istemci olarak satırların sonundan attach olur: her byte'ı bir kez alır, ekran almaz. JSON biçimi yoktur.

```console
$ nomux new -n build -- sh -c 'for i in 1 2 3; do echo "step $i"; sleep 1; done'
mwzd7qbl
$ nomux capture -f build
step 1
step 2
step 3
$ echo $?
0
$ nomux --json capture -f api
{"schema_version":1,"error":{"code":1,"kind":"error","message":"capture --follow has no JSON form: its output is the bytes of the command"}}
```

`nomux capture -f build >> build.log`, bir Session'ın çıktısını Session bitene kadar bir dosyaya yazar.

### `nomux restore-policy`

Uykudaki bir Session'ın ne zaman yeniden başlayacağını belirler.

```text
Usage: nomux restore-policy [OPTIONS] <TARGET> <POLICY>

Arguments:
  <TARGET>  The session: its identifier, its name, or the start of one of them
  <POLICY>  auto: when the daemon starts. on-focus: at the first attach. manual: only with `nomux start`

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

| Politika | Komut ne zaman yeniden başlar |
|---|---|
| `auto` | Daemon başladığında, örneğin oturum açıldığında. Geliştirme sunucusu ya da watcher için |
| `on-focus` | İlk `attach` ya da `start` sırasında. Varsayılan budur |
| `manual` | Yalnızca `start` ile. `attach` 1 çıkış koduyla başarısız olur |

```console
$ nomux restore-policy web manual
session web (kx7edkz2) has the restore policy manual
$ nomux restore-policy web sometimes
error: invalid value 'sometimes' for '<POLICY>': a restore policy is `auto`, `on-focus` or `manual`

For more information, try '--help'.
```

Varsayılan politika, Host'un yapılandırma dosyasındaki `[restore]` tablosunun `default_policy` değeridir. Dosya [Yeniden başlatmadan sonra](/docs/tr/guides/after-a-restart/#geri-yükleme-politikaları) sayfasındadır. `ls --json` her Session'ın politikasını gösterir. Biten bir Session'ın komutu yeniden başlamaz: `start` ve `attach` onun için 2 çıkış koduyla biter. `restore-policy`, `-t` almaz.

### `nomux detach`

Bir Session'a attach olmuş her istemciyi, başka bir terminalden ya da bir script'ten detach eder. Session yaşamaya devam eder.

```text
Usage: nomux detach [OPTIONS] [TARGET]

Arguments:
  [TARGET]  The session: its identifier, its name, or the start of one of them

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

Bu istemcilerin her biri, detach tuşlarından sonraki gibi biter. Hiçbir istemci attach olmamışsa da komut başarılı olur:

```console
$ nomux detach api
detached 1 client from session api (7uk6xzoz)
$ nomux detach api
detached 0 clients from session api (7uk6xzoz)
```

Hedefe uyan bir Session yoksa çıkış kodu 2'dir. Hedef zorunludur. Kendi terminalinizi detach etmek için detach tuşlarını kullanın.

### `nomux hibernate`

Boşta duran bir agent Session'ının agent'ını durdurur ve Session'ı çıktısıyla ve devam komutuyla birlikte hazırda bekleyen olarak saklar. Daemon'un bunu ne zaman kendiliğinden yaptığını ve neye ihtiyaç duyduğunu [Hazırda bekletme](/docs/tr/guides/hibernation/) sayfası anlatır. Bu komut, bunu hemen ister.

```text
Usage: nomux hibernate [OPTIONS] [TARGET]

Arguments:
  [TARGET]  The session: its identifier, its name, or the start of one of them

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

Komut Session'ı hemen hazırda bekletir ve hazırda bekletmenin geri verdiği belleği yazdırır:

```console
$ nomux hibernate agent
session y6k4truk hibernated: 189.0 KiB given back (pss)
```

Session'ın boşta kalma süresi ve sabitlemesi bu komut için geçerli değildir. Diğer her koşul geçerlidir. Session hazırda bekleyemiyorsa komut 1 çıkış koduyla ve nedeniyle başarısız olur: hiçbir adapter onu agent Session olarak bildirmiyor, adapter'ı devam komutu vermemiş, agent'ı çalışıyor ya da sizi bekliyor, bir istemci onu gösteriyor ya da durumunun son değişikliğinden sonra girdi gelmiş.

```console
$ nomux hibernate web
nomux: session cmuivewj cannot hibernate: no adapter reports it as an agent session
$ nomux hibernate d1
nomux: session hcdtllok cannot hibernate: its command does not run
```

İki Session de sıradan shell'di. `hibernate` komutunu gerçek bir agent üzerinde çalıştırmak bu sayfa için mümkün olmadı. `agent` ile verilen örnek, komutu Claude Code'un kaydedilmiş hook olaylarını daemon'a gönderen küçük bir script olan bir Session'dan gelir. Claude Code'un gerçek adapter'ı (`nomux.agent-claude`) bunları devam komutu olan bir Agent çalışmasına çevirdi ve daemon Session'ı hazırda bekletti. Script, agent'ın yerini tutar.

### `nomux wake`

Hazırda bekleyen bir Session'ın agent'ını, devam komutuyla ve Session'ın çalışma dizininde yeniden başlatır ve komutu yazdırır. `nomux attach` aynısını yapar ve önce eski ekranı gösterir.

```text
Usage: nomux wake [OPTIONS] [TARGET]

Arguments:
  [TARGET]  The session: its identifier, its name, or the start of one of them

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux wake agent
session agent (ajaeom6u) woke: claude --resume 0b1c0000-0000-4000-8000-000000000001
$ nomux ls
ID        NAME   STATE    PID      PROJECT                    COMMAND
ajaeom6u  agent  running  3964403  Client work/Acme/acme-web  claude --resume 0b1c0000-0000-4000-8000-000000000001
```

Yukarıdaki `ls` çıktısında yalnızca Session'ın satırı vardır. Session'ın komutu artık devam komutudur.

Hazırda beklemeyen bir Session 1 çıkış koduyla başarısız olur: `start`, uykudaki bir Session'ı başlatır.

```console
$ nomux wake web
nomux: session web is not hibernated: `nomux start web` starts a dormant Session
```

Daemon, devam komutunun programını `PATH` içinde arar. Başarısız olan bir uyandırmanın çıkış kodu 1'dir; mesaj nedeni ve sizin elle çalıştıracağınız devam komutunu verir. Session hazırda bekleyen olarak kalır ve `ls` nedeni notta gösterir:

```console
$ nomux wake agent
nomux: session jv4ncja3 did not wake: the program claude is not in PATH. To continue its agent by hand, run this command in /home/user/src/acme-web: claude --resume 0b1c0000-0000-4000-8000-000000000001
$ nomux ls
ID        NAME   STATE       PID  PROJECT                    COMMAND                 NOTE
jv4ncja3  agent  hibernated  -    Client work/Acme/acme-web  /home/user/stub/claude  request; wake failed: the program claude is not in PATH
```

Başarısız olan uyandırma, `PATH`'inde `claude` olmayan bir daemon'da çalıştı. Bu örnekteki Session, aynı adlı bir script'le, başka bir dizinden başlamıştı; bu yüzden komutu o script'tir.

### `nomux pin` ve `nomux unpin`

`pin`, bir Session'ı her otomatik hazırda bekletmenin dışında tutar. `unpin` bu dışlamayı geri alır. `ls` `pinned` notunu gösterir. Sabitlemenin, sizin çalıştırdığınız `hibernate` komutuna etkisi yoktur: sayfa, sabitlenmiş bir Session'ı bu komutla hazırda bekletti.

```text
Usage: nomux pin [OPTIONS] [TARGET]
Usage: nomux unpin [OPTIONS] [TARGET]
```

Seçenekler `hibernate` seçenekleriyle aynıdır.

```console
$ nomux pin api
session api (wsqtewka) is pinned
$ nomux unpin api
session api (wsqtewka) is not pinned
```

### `nomux kill`

Bir Session'ı sonlandırır ve komutu bitene kadar bekler. Uykudaki bir Session'ı çıktısıyla birlikte siler. `--all` ile komutu çalışan her Session'ı sonlandırır.

```text
Usage: nomux kill [OPTIONS] [TARGET]

Arguments:
  [TARGET]  The session: its identifier, its name, or the start of one of them [default: the session that a client attached to last, else the session that started last]

Options:
      --json             Print the result as one JSON document
      --all              End each session whose command runs. On a terminal, the command asks first
  -q, --quiet            Print only the necessary part of the result
      --host <NAME>      Use the daemon of a remote host of `nomux host ls` [default: the local host]
      --include-dormant  With --all, also remove the dormant and the damaged sessions with their output
      --dry-run          With --all, print the sessions and end none
      --yes              With --all, do not ask. Without a terminal, --all needs it
  -h, --help             Print help
```

Yardım metni bir varsayılan hedef gösterir. Komut onu kullanmaz: hedefsiz ve `--all`'suz `nomux kill`, 1 çıkış koduyla ve `nomux: kill needs a session, or --all` ile başlayan bir mesajla başarısız olur. Bu, yardım metni ile nomux 0.5.0'ın davranışı arasında bir farktır.

Session'ın komutu `SIGHUP` alır. 2 saniye sonra hâlâ çalışıyorsa `SIGKILL` alır. Session o zaman biten bir Session olur: `ls --all` onu saklama süresi boyunca gösterir.

```console
$ nomux kill old
session old (2eeuodaj) ended
```

Hedefe uyan bir Session yoksa ya da Session'ın komutu zaten bitmişse çıkış kodu 2'dir. Biten bir Session'ın hedefi yalnızca kimliğidir; bu yüzden aynı Session'a ikinci `kill`, adıyla hiçbir Session bulmaz, kimliğiyle biten bir Session bulur:

```console
$ nomux kill old
nomux: no session has the identifier or the name old, and no session has a name or an identifier that starts with it
$ nomux kill 2eeuodaj
nomux: session 2eeuodaj ended: its command does not run
```

İki komutun da çıkış kodu 2'dir.

Uykudaki ve bozuk bir Session'ın sonlandırılacak komutu yoktur. `kill` böyle bir Session'ı ve state dizinini siler: çıktısı da bundan sonra yoktur.

#### `nomux kill --all`

`kill --all`, komutu çalışan her Session'ı (`running` ve `unreachable` durumları) birer birer sonlandırır ve her biri için bir satır yazdırır. Uykudaki, hazırda bekleyen ya da bozuk Session'a dokunmaz: Host yeniden başladıktan sonra her Session uykudadır ve `kill --all` onların çıktısını silmemelidir. `--include-dormant` bu Session'ları da siler.

- Terminalde komut önce standart hatada `end <n> session? [y/N]` diye sorar. Yalnızca `y` ya da `yes` Session'ları sonlandırır. Her diğer cevap hiçbirini sonlandırmaz ve çıkış kodu 1 olur.
- `--yes` sormaz. Terminal yoksa `--all`, `--yes` ister: yoksa çıkış kodu 1'dir ve hiçbir Session sonlanmaz.
- `--dry-run` Session'ları yazdırır ve hiçbirini sonlandırmaz.
- Hiçbir Session çalışmıyorsa komut `no session runs` yazdırır, hiçbir şey sormaz ve çıkış kodu 0 olur.
- Bir Session sonlanmazsa hatası standart hataya gider, diğer Session'lar yine sonlanır ve çıkış kodu hataların en yüksek koddur.
- `kill`'in `-a` seçeneği yoktur: tmux'ta `kill-session -a`, diğer her Session'ı sonlandırır.

```console
$ nomux kill --all --dry-run
session api (lys4a4lv) would end
session web (potjlxdz) would end
$ nomux kill --all --include-dormant --dry-run
session agent (lkxpxrp4) would end
session api (lys4a4lv) would end
session web (potjlxdz) would end
session tfbjezgs would end
```

Bu iki komutun çalıştığı Host'ta iki çalışan Session, hazırda bekleyen bir Session (`agent`) ve uykudaki bir Session (`tfbjezgs`) vardı. Terminal yoksa komut `--yes` ister. Terminalde sorar. Sonraki iki komut, bir çalışan Session'ı olan bir Host'ta çalıştı. İkinci komut bir pseudoterminal içinde çalıştı ve cevap `n` idi:

```console
$ nomux kill --all < /dev/null
nomux: kill --all ends 1 sessions: without a terminal, give --yes
$ nomux kill --all
nomux: end 1 session? [y/N] n
nomux: no session ended
```

İlk mesaj `1 sessions`, soru ise `1 session` der: bu, nomux 0.5.0'ın metnidir. İki komutun da çıkış kodu 1'dir. Cevap `y` olursa komut Session'ı sonlandırır ve onun için bir satır yazdırır, örneğin `session api-v2 (5g2diwdl) ended`. Aşağıdakiler `--yes` ve çalışan Session olmayan durumdur:

```console
$ nomux kill --all --yes
session web (f24elby6) ended
session api (oaldogrr) ended
$ nomux kill --all --yes
no session runs
```

### `nomux rename`

Bir Session'a, [Hedefler ve adlar](#hedefler-ve-adlar) kurallarıyla başka bir ad verir.

```text
Usage: nomux rename [OPTIONS] <TARGET NEW-NAME>...

Arguments:
  <TARGET NEW-NAME>...  The session, and then its new name. With -t, only the new name

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```console
$ nomux rename scratch sandbox
session z3jqohga is now named sandbox
$ nomux rename scratch api
nomux: the name api is in use by session wsqtewka
$ nomux rename -t sandbox scratch
session z3jqohga is now named scratch
$ nomux rename scratch
nomux: rename needs the session and its new name: `nomux rename <target> <new-name>`
```

Şimdiki adın aynısı başarılı olur ve hiçbir şeyi değiştirmez. Başka bir Session'ın taşıdığı bir ad 1 çıkış kodunu verir. Biten bir Session yeni ad alamaz: çıkış kodu 2'dir.

### `nomux send`

Bir Session'a, siz yazmış gibi metin ya da tuş yazar. Bir script, bir shell'e komut ya da bir agent'a prompt vermek için kullanır.

```text
Usage: nomux send [OPTIONS] <TARGET TEXT>...

Arguments:
  <TARGET TEXT>...  The session, and then the text: its words with one space between them. With -t, only the text

Options:
      --json         Print the result as one JSON document
      --no-enter     Do not press Enter after the text
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -k, --keys         The words are key names, for example C-c, Enter, Up or F5. No Enter follows
  -h, --help         Print help
```

`send <hedef> <metin>...`, metnin kelimelerini aralarında birer boşlukla Session'ın terminaline yazar ve ardından Enter (bir carriage return) yazar. Byte'lar tek bir istekte gider; bu yüzden birlikte kalırlar.

```sh
nomux send api 'cargo test'               # types it and presses Enter
nomux send -k api C-c                     # interrupt
nomux send --no-enter api 'draft' && nomux send -k api Enter
```

- `--no-enter` metni Enter olmadan gönderir.
- `-k`, `--keys`: kelimeler tuş adlarıdır, arkalarından Enter gelmez: `Enter`, `Escape`, `Tab`, `S-Tab`, `Space`, `BSpace`, `Up`, `Down`, `Left`, `Right`, `Home`, `End`, `PgUp`, `PgDn`, `F1` ile `F12`, `C-<harf>` ve `M-<karakter>`. Bunlar tmux'un adlarıdır. İmleç tuşu, normal imleç kipinin dizisini taşır. Komutun tanımadığı bir ad 1 çıkış koduyla biter ve hiçbir şey göndermez.
- Satır sonu içeren bir metin 1 çıkış koduyla biter ve hiçbir şey göndermez: bir seferde bir satır gönderin.
- `send` hemen yazar: programın hazır olmasını beklemez. Uykudaki bir Session 1 çıkış kodunu verir (`send` Session başlatmaz), biten bir Session 2 çıkış kodunu.
- Çıktı boş olur. `--json` ile doküman, Session'ın aldığı byte sayısını verir.

```console
$ nomux send shell 'echo hello from api'
$ nomux --json send shell 'echo json'
{"schema_version":1,"sent":{"id":"tznoru4a","bytes":10}}
$ nomux send -k shell Foo
nomux: "Foo" is not a key name: give Enter, Escape, Tab, S-Tab, Space, BSpace, Up, Down, Left, Right, Home, End, PgUp, PgDn, F1 to F12, C-<letter> or M-<character>
$ nomux send shell 'a
b'
nomux: the text has a line break: send one line at a time, or each key with -k
$ nomux send d1 x
nomux: session hcdtllok is dormant: its command does not run. Run `nomux start hcdtllok`
```

`bytes`, `echo json` için Enter ile birlikte 10'dur: 9 karakter ve bir carriage return.

## Workspace komutları

Bu komutlar Host'un workspace ağacını, yani Grupları ve Projeleri değiştirir ve listeler. Proje, Host'ta adı olan bir dizindir. Grup, Projeleri ve başka Grupları içerir. Kullanımı [Projeler ve Gruplar](/docs/tr/guides/projects-and-groups/) sayfasında, terimleri [sözlükte](/docs/tr/reference/glossary/) görebilirsiniz.

Bir `<node>`, bir düğümün kimliği ya da yoludur: en üst düzeyden düğüme kadar olan adlar, aralarında `/` ile, örneğin `Client work/Acme/acme-web`. Tek bir düğümde varsa yalnızca ad da kabul edilir. Ad ya da yol birden fazla düğümde varsa komut 1 çıkış koduyla başarısız olur ve her birinin kimliğini ve yolunu listeler. Var olmayan bir düğüm 2 çıkış kodunu verir.

```console
$ nomux project rm x
nomux: "x" names 2 nodes: give the identifier of one
  volerxuenal5  x
  uqzcby6awmib  x
$ nomux project rm nothing
nomux: no node of the workspace tree has the identifier, the path or the name "nothing"
```

Bir değişiklik tek satır yazdırır: ne değişti, kimlik, değişiklikten sonraki yol ve ağacın revizyonu. Ağacın bir revizyonu vardır; her değişiklik onu 1 artırır. `--quiet` kimliği yazdırır. Bu komutlardan eski bir daemon hatayla cevap verir ve çıkış kodu 1'dir.

### `nomux project`

```text
Usage: nomux project [OPTIONS] <COMMAND>

Commands:
  add  Add a directory of the host as a Project. In a git repository on the local host, the Project is the root of the repository
  rm   Remove a Project from the workspace tree. No file and no session changes
  ls   List the Projects

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```text
Usage: nomux project add [OPTIONS] [DIRECTORY]

Arguments:
  [DIRECTORY]  The directory [default: the current directory; with --host, it is necessary and absolute]

Options:
      --json          Print the result as one JSON document
      --name <NAME>   The name of the Project [default: the last part of the directory]
      --group <NODE>  The Group of the Project [default: the top level]
  -q, --quiet         Print only the necessary part of the result
      --host <NAME>   Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help          Print help
```

`project rm <node>` bir argüman alır, `project ls` hiç almaz. Seçenekler üç ortak seçenektir.

- Dizinsiz `project add`, geçerli dizini ekler. Local Host'ta, bir git deposundaki dizin, deponun kökünü ekler. `--host` ile dizini uzak Host'ta mutlak bir yol olarak verin.
- Daemon dizinin sembolik bağlantılarını çözer ve bir Projenin zaten sahip olduğu dizini reddeder. Varsayılan ad, dizinin son parçasıdır.
- `project rm` yalnızca Projeyi ağaçtan çıkarır. Hiçbir dosya ve hiçbir Session değişmez.

```console
$ nomux project add src/acme-web --group "Client work/Acme"
added project 55pjgf4rwq2c: Client work/Acme/acme-web (revision 3)
$ nomux project add src/repo/sub
added project jirgzmcfrf46: repo (revision 19)
$ nomux project add src/acme-web
nomux: the Project 55pjgf4rwq2c has the directory /home/user/src/acme-web already
$ nomux project add /nonexistent
nomux: the directory /nonexistent cannot be used: No such file or directory (os error 2)
$ nomux project ls
ID            PROJECT                    DIRECTORY
2cxs4kkr6ei4  Client work/Acme/notes     /home/user/src/notes
55pjgf4rwq2c  Client work/Acme/acme-web  /home/user/src/acme-web
e5k6uikywno6  Client work/Acme/acme-api  /home/user/src/acme-api
$ nomux project rm "Client work/Acme/acme-api"
removed project e5k6uikywno6: Client work/Acme/acme-api (revision 22)
```

`src/repo/sub`, bir git deposundaki dizindir. Proje, deponun kökü olan `src/repo` olur. Çıktılar aynı Host'un birden fazla çalıştırmasından gelir.

### `nomux group`

```text
Usage: nomux group [OPTIONS] <COMMAND>

Commands:
  new     Make an empty Group
  rename  Give a Group or a Project a new name
  move    Put a Group or a Project in a different Group, at the top level, or at a different position
  rm      Remove a Group. Its content takes its place: no Project and no Group in it goes away
  ls      List the Groups

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```text
Usage: nomux group new [OPTIONS] <NAME>

Arguments:
  <NAME>  The name of the Group

Options:
      --in <NODE>    The Group of the new Group [default: the top level]
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

```text
Usage: nomux group move [OPTIONS] <--to <NODE>|--top|--before <NODE>|--after <NODE>> <NODE>

Arguments:
  <NODE>  The Group or the Project: its identifier or its path

Options:
      --json           Print the result as one JSON document
      --to <NODE>      The new Group
  -q, --quiet          Print only the necessary part of the result
      --top            Put the node at the top level
      --before <NODE>  Put the node before this sibling
      --host <NAME>    Use the daemon of a remote host of `nomux host ls` [default: the local host]
      --after <NODE>   Put the node after this sibling
  -h, --help           Print help
```

`group rename <node> <name>` ve `group rm <node>`, adlarının söylediği argümanları alır; `group ls`'in `--tree` seçeneği vardır: `Show the full tree: each Group with its Groups and Projects`.

- `group rename` ve `group move`, bir Grubu ya da bir Projeyi alır.
- `group move`, `--to`, `--top`, `--before` ya da `--after` ister. `--before <node>` ve `--after <node>` düğümü bir kardeşinin yanına koyar. `--to` ve `--top` olmadan düğüm, o kardeşin Grubuna gider. Bir Grubu kendi içine ya da altındaki bir Gruba taşımak 1 çıkış koduyla başarısız olur.
- `group rm` yalnızca Grubu siler: Grupları ve Projeleri üst Grubunda onun yerini alır. Proje bir Grup değildir: bir Proje için `group rm` 1 çıkış koduyla başarısız olur.
- `group ls` her Grubun kimliğini ve yolunu yazdırır. `--tree` ile her düğümü kendi Grubunun altında, her düzey için iki boşluk girintiyle; türü, kimliği ve bir Projenin dizini ile birlikte yazdırır. `--quiet` kimlikleri yazdırır.

```console
$ nomux group new "Client work"
made group hehffp4j3m7w: Client work (revision 1)
$ nomux group new Acme --in "Client work"
made group teeb7aeyjpg3: Client work/Acme (revision 2)
$ nomux project add src/notes
added project 2cxs4kkr6ei4: notes (revision 5)
$ nomux group move notes --to Acme --before acme-web
moved 2cxs4kkr6ei4: Client work/Acme/notes (revision 6)
$ nomux group move Acme --to Acme
nomux: a Group cannot move into itself or into a Group below it
$ nomux group rename acme-api acme-backend
renamed e5k6uikywno6: Client work/Acme/acme-backend (revision 7)
$ nomux group rm acme-web
nomux: 55pjgf4rwq2c is a Project, not a Group
$ nomux group ls
ID            GROUP
hehffp4j3m7w  Client work
teeb7aeyjpg3  Client work/Acme
$ nomux group ls --tree
NAME          KIND     ID            DIRECTORY
Client work   group    hehffp4j3m7w  -
  Acme        group    teeb7aeyjpg3  -
    notes     project  2cxs4kkr6ei4  /home/user/src/notes
    acme-web  project  55pjgf4rwq2c  /home/user/src/acme-web
    acme-api  project  e5k6uikywno6  /home/user/src/acme-api
```

`nomux status --tree`, aynı ağacı Session'larının durumuyla gösterir: bkz. [`nomux status`](#nomux-status). `nomux events --follow --filter workspace-changed`, ağacın her değişikliğini yazdırır.

## Daemon komutları

### `nomux daemon status`

Daemon'un çalışıp çalışmadığını, işletim sisteminin bir Session'a bellek limiti uygulayıp uygulamadığını ve yapılandırma dosyasının yolunu gösterir. Daemon çalışıyorsa çıkış kodu 0, çalışmıyorsa 2'dir. Komut daemon başlatmaz.

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
nomuxd 0.5.0 runs: process ID 4128206, 1 session
memory limit: the kernel ends the processes of a session at its limit: a systemd user scope with MemoryMax
configuration file: /home/user/.config/nomux/config.toml
$ nomux daemon stop
nomuxd stopped
$ nomux daemon status
nomuxd does not run
configuration file: /home/user/.config/nomux/config.toml
```

- `memory limit:` satırı, Host'un işletim sisteminin `sessions.memory_limit` değerini nasıl uyguladığını ya da hiç uygulamadığını söyler. Bu örnekteki Host, systemd kullanıcı yöneticisi olan bir Linux'tur. Durumlar [Session belleği](/docs/tr/guides/session-memory/) sayfasındadır.
- `configuration file:` satırı, daemon'un başlarken okuduğu global yapılandırma dosyasının yolunu verir. Satır daemon çalışmıyorken de bulunur ve yalnızca local Host'ta: `--host` ile komut yolu göstermez. CLI yolu kendi ortamından hesaplar. Farklı bir `HOME` ya da `XDG_CONFIG_HOME` ile başlamış bir daemon, örneğin bir servis dosyasından, farklı bir dosyayı okuyabilir.
- `--quiet` hiçbir şey yazdırmaz. Çıkış kodu sonuçtur.

### `nomux daemon stop`

Daemon'u durdurur. Session'lar yaşamaya devam eder. Komut daemon başlatmaz.
O anda bir Session'a attach olmuş istemci, bir hatayla ve 1 çıkış koduyla biter. Bkz. [attach nasıl biter](#attach-nasıl-biter).

```text
Usage: nomux daemon stop [OPTIONS]

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

Daemon çalışmıyorsa da çıkış kodu 0'dır; çünkü sonuç aynıdır. Komut o zaman `nomuxd does not run` yazdırır.

### `nomux daemon install-service`

Daemon'u oturum açılırken başlatan servis dosyasını yazar: Linux'ta bir systemd kullanıcı unit'i, macOS'ta bir launchd agent'ı.

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
$ nomux daemon install-service --dry-run
# /home/user/.config/systemd/user/nomuxd.service
[Unit]
Description=nomux daemon
Documentation=https://nomux-sh.github.io/docs/

[Service]
ExecStart="/home/user/.local/bin/nomuxd" --replace
KillMode=process
Restart=on-failure

[Install]
WantedBy=default.target
$ nomux daemon install-service
wrote /home/user/.config/systemd/user/nomuxd.service
To start the daemon at each login, run: systemctl --user daemon-reload && systemctl --user enable --now nomuxd.service
```

Sayfa, çalıştırmadaki `nomuxd` binary'sinin dizinini `/home/user/.local/bin` ile değiştirdi.

- Komut yalnızca kullanıcının yapılandırma dizinlerine yazar: Linux'ta `$XDG_CONFIG_HOME/systemd/user` ya da `~/.config/systemd/user`, macOS'ta `~/Library/LaunchAgents`. `sudo` gerektirmez.
- Hiçbir program başlatmaz. Çıktısında dosyayı servis yöneticisine veren komut vardır.
- `nomuxd`, `nomux`'un dizininde olmalıdır: dosya onun yolunu taşır.

Dosyanın satırlarını [Yeniden başlatmadan sonra](/docs/tr/guides/after-a-restart/#daemonu-oturum-açılışında-başlatmak) sayfası açıklar.

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
would remove /home/user/.config/systemd/user/nomuxd.service
$ nomux daemon uninstall-service
removed /home/user/.config/systemd/user/nomuxd.service
The daemon that runs continues. To make the service manager forget the file, run: systemctl --user daemon-reload
$ nomux daemon uninstall-service
no service file: /home/user/.config/systemd/user/nomuxd.service does not exist
```

Dosya yoksa da çıkış kodu 0'dır. Çalışan daemon çalışmaya devam eder.

## Host komutları

Bu komutlar, bilgisayarınızdaki yapılandırma dosyasının uzak Host'larını yönetir. Bağlantıyı, güven kurallarını ve nomux'un bir Host'a ne yazdığını [Uzak Host'lar](/docs/tr/guides/remote-hosts/) sayfası anlatır.
Bir Host'a bağlanan komutlar (`host add` ve bir Host verilen `host doctor`) bu sayfa için çalıştırılmadı. Uzak bir Host yoktu ve bu bilgisayara SSH, çalıştırmanın anahtarını reddediyor. Açıklamaları nomux 0.5.0'ın [`docs/cli.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/cli.md) dosyasından alınmıştır.

### `nomux host add`

SSH ile bir Host'a bağlanır, nomux'u oraya kurar ve Host'u kaydeder.

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

Komut bağlanır, Host'un sistemini ve işlemcisini bulur, Host'ta yoksa CLI'ın sürümündeki üç binary'yi `~/.nomux/bin/<version>` altına kurar, daemon çalışmıyorsa onu başlatır ve yapılandırma dosyasına `[hosts.<name>]` yazar. Host'u yalnızca bu adımların hepsi başarılı olursa kaydeder.

- Ad yalnızca `a` - `z`, `A` - `Z`, `0` - `9`, `.`, `_` ve `-` karakterlerini içerir.
- Komutu aynı ad ve aynı hedefle yeniden çalıştırabilirsiniz. Var olan bir ad farklı bir hedefle verilirse komut başarısız olur.
- Bilinmeyen bir host key, parmak izini ve key'i ekleyen `ssh` komutunu içeren bir hatadır.

### `nomux host ls`

Yapılandırma dosyasındaki Host'ları listeler. Komut hiçbir Host'a bağlanmaz.

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
no hosts
```

Bir Host olduğunda çıktı, `NAME` ve `SSH` sütunlu bir tablodur.

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
nomux: no host has the name vps
```

Dosyada ad yoksa çıkış kodu 2'dir. Bir Host'un adıyla komut `host vps removed` yazdırır.

### `nomux host doctor`

Bir Host'un bağlantısını, platformunu, binary'lerini, izinlerini ve daemon'unu denetler; işletim sisteminin bir bellek limiti uygulayıp uygulamadığını da gösterir. Komut bir Host'ta hiçbir şeyi değiştirmez.

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

Denetimler `connection`, `platform`, `binaries`, `permissions`, `daemon` ve `versions`'dır. Her birinin ne zaman geçtiğini [Host'u kontrol etmek](/docs/tr/guides/remote-hosts/#hostu-kontrol-etmek) bölümü söyler. `host doctor`'ın bir denetimi daha vardır: `memory-limit`. Bu denetim, `daemon status` gibi, Host'un işletim sisteminin `sessions.memory_limit` değerini nasıl uyguladığını gösterir. CLI'ın binary'sinde bu denetimin adı vardır. Denetim bu sayfa için çalıştırılmadı ve ürün başvurusu onu denetimler tablosunda listelemiyor. Her Host'un her denetimi geçtiyse çıkış kodu 0, bir denetim başarısız olduysa 1'dir.

```console
$ nomux host doctor
no hosts
$ nomux host doctor vps
nomux: no host has the name vps. `nomux host ls` shows the hosts, and `nomux host add` adds one
```

İkinci komutun çıkış kodu 2'dir.

## Extension komutları

Bu komutlar daemon'un extension host'unu kullanır. Kullanımlarını [Extension'lar](/docs/tr/guides/extensions/) sayfası gösterir. Örnekler nomux 0.5.0'ın iki resmi extension'ını, release paketleriyle kullanır: `nomux.agent-claude` (Claude Code'un adapter'ı) ve `nomux.git`.

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
ID                  NAME                 VERSION  STATE    PERMISSIONS                             REASON
nomux.agent-claude  Claude Code adapter  0.1.0    running  scope=hooks:read,scope=agent:report
nomux.git           Git                  0.1.0    stopped  fs=/home/user/src/acme-web,process=git
```

Extension yoksa komut `no extensions` yazdırır. `nomux.agent-claude`'un `running` durumu, bir Session ona bir an önce hook olayları gönderdiği için vardır: process 60 saniye çağrısız kalınca durur.

| Durum | Anlamı |
|---|---|
| `stopped` | Extension etkin ve process'i çalışmıyor. Sonraki çağrı onu başlatır |
| `starting` | Process başladı ve hazır değil |
| `running` | Process çalışıyor. 60 saniye çağrısız kalınca durur |
| `failed` | Process başarısız oldu. Bir aradan sonra sonraki çağrı onu yeniden başlatır. `REASON` hatayı verir |
| `disabled` | Daemon extension'ı başlatmaz. `REASON` nedenini söyler: kullanıcı devre dışı bıraktı ya da üst üste 5 kez başarısız oldu |
| `unknown` | Daemon CLI'dan yeni ve CLI'ın tanımadığı bir durum gönderdi |

### `nomux ext install`

Host'taki bir dizinden extension kurar; seçeneklerin onayladığı izinlerle.

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
| `--grant` ve `--grant-all` yok ve manifest bir izin istiyor | Komut izinleri yazdırır, hiçbir şey kurmaz ve 4 çıkış koduyla biter |
| Bir ya da daha fazla `--grant <permission>` | Extension bu izinleri alır, diğerlerini almaz |
| `--grant-all` | Extension istediği her izni alır; ancak `${worktree}` ile başlayan bir dizini almaz: onu `--grant fs=<directory>` ile verin |
| Manifest hiçbir izin istemiyor | Komut extension'ı kurar |

| Biçim | Manifest'teki izin |
|---|---|
| `fs=<directory>` | `fs`'nin bir öğesi. `${worktree}` ile başlayan öğe için, öğenin kalanıyla biten mutlak bir yol |
| `process=<program>` | `process`'in bir öğesi |
| `network` | `network = true` |
| `scope=<scope>` | `scopes`'un bir öğesi, örneğin `scope=sessions:read` |

```console
$ nomux ext install ./nomux-git
nomux: the extension nomux.git 0.1.0 asks for these permissions:
  fs=${worktree}
  process=git
Nothing was installed. To install the extension, approve its permissions: add --grant-all, or --grant <permission> for each permission that you approve. For a directory that starts with ${worktree}, give a directory: --grant fs=<directory>
$ nomux ext install ./nomux-git --grant-all --grant fs=/home/user/src/acme-web
extension nomux.git 0.1.0 installed with the permissions: fs=/home/user/src/acme-web process=git
$ nomux ext install ./nomux-git --grant-all
nomux: the extension `nomux.git` is already installed
```

İlk komutun çıkış kodu 4, üçüncünün 1'dir. Manifest'in istemediği bir `--grant`, geçerli olmayan bir manifest ve zaten kurulu bir extension için çıkış kodu 1'dir. Bu durumlarda hiçbir şey kurulmaz.
`--host` ile `<DIRECTORY>`, uzak Host'ta mutlak bir yoldur. Komut extension'ın hiçbir process'ini başlatmaz.

### `nomux ext rm`

Bir extension'ı durdurur ve paketini, state'ini ve verisini siler.

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
$ nomux ext rm nomux.git
extension nomux.git removed
$ nomux ext rm nomux.git
nomux: no extension has the identifier nomux.git
```

### `nomux ext enable` ve `nomux ext disable`

`enable`, daemon başarısızlıklar yüzünden devre dışı bıraktığında bile bir extension'ı etkinleştirir. `disable` bir extension'ı devre dışı bırakır ve process'ini durdurur.

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
$ nomux ext disable nomux.git
extension nomux.git disabled
$ nomux ext enable nomux.git
extension nomux.git enabled
$ nomux ext enable nomux.none
nomux: no extension has the identifier nomux.none
```

Verilen kimlikte extension yoksa `enable`, `disable` ve `rm` 2 çıkış koduyla biter.

### `nomux ext call`

Bir extension'ın metodunu çağırır ve sonucunun payload'unu, başka hiçbir byte eklemeden standart çıktıya yazar. Extension'ın process'i çalışmıyorsa daemon onu başlatır. Komut script'ler ve testler içindir.

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

Çağrının payload'u ve sonucun payload'u byte'lardır. Extension'ın metodu kodlamalarını belirler: nomux onları değiştirmez. `--payload <text>` metnin byte'larını gönderir. `--payload @<file>` bir dosyanın içeriğini gönderir. Seçenek yoksa payload boştur. `@` ile başlayan bir metin bir dosyada olmalıdır.

```sh
nomux ext call nomux.echo echo --payload @request.bin > response.bin
```

Yukarıdaki satır bir çağrının biçimini gösterir. Çalıştırılmadı: çalıştırmadaki hiçbir extension'ın payload'la cevap veren bir metodu yok. Şu komut çalıştırıldı:

```console
$ nomux ext call nomux.git nothing
nomux: the extension answered with an error: the extension has no method `nothing`
```

| Sonuç | Çıkış kodu |
|---|---|
| Metot bir sonuç verdi | 0 |
| Verilen kimlikte extension yok ya da extension, metodu ya da öğeyi olmadığını söyledi | 2 |
| Extension 30 saniyede cevap vermedi ya da kendi timeout hatasıyla cevap verdi | 3 |
| Extension izni olmadığını söyledi, örneğin kullanıcının kapsamını onaylamadığı bir host servisi için | 4 |
| Extension devre dışı, process'i başlatılamıyor ya da başarısız oldu ya da farklı bir hatayla cevap verdi | 1 |

Yukarıdaki komutun çıkış kodu 2'dir. Tablodaki diğer kodlar çalıştırılmadı.

### `nomux ext validate`

Bu bilgisayardaki bir dizinin `extension.toml` dosyasını denetler. Komut daemon gerektirmez ve `--host`'u yok sayar.

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
$ nomux ext validate ./bad
extension.toml is not valid:
  `extension.id` must have two or more parts with `.` between them, in 64 characters at most. A part starts with a lower-case letter and has only lower-case letters, digits and `-`
$ nomux ext validate ./nothing
nomux: the file ./nothing/extension.toml does not exist
```

Geçerli bir manifest için çıkış kodu 0, geçerli olmayan bir manifest için 1, dosyası olmayan bir dizin için 2'dir. Geçerli olmayan bir manifest için çıktının her geçersiz alan için bir satırı vardır; satır alanın yolunu taşır ve standart çıktıya gider. `./bad`, `nomux.git` manifest'inin `git` kimliğiyle olan halidir. Komut paketin diğer dosyalarını denetlemez: `ext install` ayrıca paketin daemon kısmının programını içerdiğinden emin olur.

## Durum komutları

Bu komutlar, her Session'daki işin ne yaptığını, neyi beklediğini ya da neyi tamamladığını gösterir. Modeli, durumun kaynaklarını ve onları birleştiren kuralları [Agent durumu](/docs/tr/guides/agent-status/) sayfası anlatır. Terimler sözlüktedir: [agent durumu](/docs/tr/reference/glossary/#agent-durumu).

Bu bölümdeki örnekler, şu Session'ları olan tek bir daemon'dan gelir:

| Ad | Session'ın komutu | Durumu nereden geliyor |
|---|---|---|
| `build` | `sh -c 'nomux status set working "build the docs"; exec sleep 600'` | Script'in bir self-report'u. |
| `deploy` | `sh -c 'nomux status set blocked "deploy to production?"; exec sleep 600'` | Script'in `blocked` durumlu bir self-report'u. |
| `agent` | `claude`, `acme-api` Projesinin dizininde | Adapter. Komut, Claude Code'un kaydedilmiş `SessionStart` ve `Stop` hook olaylarını `nomux hook claude <event>` ile gönderen küçük bir script'tir. Adapter, yayımlanmış `nomux.agent-claude`'dur. |
| `shell` | `sh` | Hiçbir şey bildirmeyen bir shell. |

`build` ve `deploy`, `acme-web` Projesindedir; `agent`, `acme-api`'dedir. `shell`'in Projesi yoktur.

### `nomux status`

Her Session'ın durumunu gösterir: neyin çalıştığını, neyin bittiğini ve neyin sizi beklediğini.

```text
Usage: nomux status [OPTIONS]
       nomux status <COMMAND>

Commands:
  set  Report the status of the session of this process. The command works only inside a nomux session

Options:
      --json         Print the result as one JSON document
      --tree         Also show the Child work of each session, and the sessions below their Groups and Projects
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

| Seçenek | Ne yapar |
|---|---|
| `--tree` | Her Alt işi, Session'ının altında, her düzey için iki boşluk girintili bir satır olarak gösterir. Hiçbir kaynağın bildirmediği bir Alt işin durumu `-` olur. Workspace ağacını da gösterir: aşağıdaki listeye bakın. |

```console
$ nomux status
  SESSION  COMMAND                                                                 STATE      FOR  MESSAGE
+ agent    claude                                                                  done       2s
! deploy   sh -c nomux status set blocked "deploy to production?"; exec sleep 600  needs you  2s   deploy to production?
  shell    sh                                                                      idle       2s
* build    sh -c nomux status set working "build the docs"; exec sleep 600         working    2s   build the docs
$ nomux status --tree
  NAME          COMMAND                                                                 STATE      FOR  MESSAGE
  shell         sh                                                                      idle       2s
! Client work/                                                                          needs you  2s   deploy to production?
!   Acme/                                                                               needs you  2s   deploy to production?
      notes                                                                             -          -
!     acme-web                                                                          needs you  2s   deploy to production?
!       deploy  sh -c nomux status set blocked "deploy to production?"; exec sleep 600  needs you  2s   deploy to production?
*       build   sh -c nomux status set working "build the docs"; exec sleep 600         working    2s   build the docs
+     acme-api                                                                          done       2s
+       agent   claude                                                                  done       2s
$ nomux --quiet status
pkle3gpq
```

Her satırda durumun işareti, session kimliği ya da adı, komut, durum, durumda geçen süre (`FOR`) ve mesaj vardır.

- Satırlar session kimliklerinin sırasındadır. Komut, biten her Session için ve son Agent çalışmasını saklayan (aşağıya bakın) her biten Session için bir satır yazdırır. Hiç Session yoksa `no sessions` yazdırır.
- Adı olan bir Session, kimliği yerine adını gösterir. `--quiet`'in yazdırdığı `pkle3gpq` kimliği `deploy` Session'ının kimliğidir.
- Satırın durumu, Session'ın ve Alt işlerinin en acil durumudur. Bir kaynak söylüyorsa `needs you` beklemenin türünü taşır: `needs you: permission`, `needs you: question` ya da `needs you: auth`. Bir self-report'un türü yoktur.
- Hazırda bekleyen bir Session'ın durumu `hibernated: <reason>` olur, örneğin `hibernated: request`. Neden, `ls` notunun nedenlerinden biridir.
- İşaret: `!` sizi bekliyor, `x` hata, `+` bitti, `*` çalışıyor; boşta olanın işareti yoktur.
- Daemon'un tahmin ettiği bir durum `(guess)` taşır: örneğin ön planda `sleep 600` çalıştıran bir shell için `working (guess)`. Tahmin, shell'in prompt işaretlerinden ya da terminalin ön plandaki programından gelir; hiçbir zaman bir programın bildiriminden gelmez.
- Sizin gördüğünüz bir sonuç `(seen)` taşır, örneğin `done (seen)`. Bir Session'a attach olmak onun sonuçlarını görülmüş işaretler.
- `--quiet` ile komut, sizi bekleyen her Session'ın kimliğini, her satıra bir tane olacak şekilde yazdırır. Her durumda çıkış kodu 0'dır.
- `--json` ile doküman aynı Session'ları içerir. Alanları [JSON bölümündeki `status`](#status) başlığındadır.
- `--tree` ile Projesi olmayan Session'lar önce gelir. Sonra workspace ağacının her Grubu (adı `/` ile biter) ve her Projesi ağacın sırasıyla, her düzey için girintili bir satırdır; altındaki Session'ların en acil durumuyla. Bir Projenin Session'ları onun altındaki satırlardır. Session'ı olmayan bir Grubun ya da Projenin durumu `-` olur. İlk sütunun başlığı `NAME`'dir. Projesi olan bir Session, ağaçta en üstte değil, Projesinin altındadır.
- Bu sayfa `status` ve `status --tree` komutlarını 40 ile 60 sütunluk terminallerde çalıştırdı: bkz. [dar terminaller](#dar-terminaller).

Biten bir Session, son Agent çalışmasını saklar: saklanan çalışma. Yukarıdaki örnekteki `agent` Session'ına uygulanan `nomux kill` onu sonlandırır; ancak satırı, daemon Session'ı silene kadar kalır:

```console
$ nomux kill agent
session agent (c7lsrd6u) ended
$ nomux status
  SESSION  COMMAND                                                                 STATE      FOR  MESSAGE
+ agent    claude                                                                  done       2s
! deploy   sh -c nomux status set blocked "deploy to production?"; exec sleep 600  needs you  2s   deploy to production?
  shell    sh                                                                      idle       2s
* build    sh -c nomux status set working "build the docs"; exec sleep 600         working    2s   build the docs
```

Biten bir Session'ın adı hedef değildir. Saklanan çalışmasını görmek için kimliğini verin: `nomux agent explain c7lsrd6u`.

### `nomux status set`

Komutun çalıştığı Session'ın durumunu bildirir. OSC 7501 yazmayan bir script ya da araç bunu kullanır: durum bir self-report'tur.

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

| Durum | Status |
|---|---|
| `working` | `working` |
| `done` | `done` |
| `blocked` | `needs you` |
| `error` | `error` |
| `idle` | Komut bildirimini geri alır. |

- Komut, holder'ın bir Session'ın her process'ine verdiği `NOMUX_SESSION_ID`, `NOMUX_SOCK` ve `NOMUX_TOKEN` değişkenlerini okur. `NOMUX_SOCK`'taki socket'e bağlanır. Daemon başlatmaz ve `--host` kabul etmez.
- Bildirim bir sonrakine kadar kalır.
- Mesaj en fazla 512 byte'lık, kontrol karakteri içermeyen tek bir satırdır. Çok uzun olan ya da satır sonu içeren bir mesaj 1 çıkış kodunu verir.
- 4 çıkış kodu, komutun Session'ını kanıtlayamadığı anlamına gelir: bir değişken tanımlı değil (komut bir Session'da çalışmıyor), token yanlış, Session'ın process'i yok ya da holder'ı token üretemeyecek kadar eski.

Aşağıdaki, beş durumun bir Session'da çalıştırılan çıktısıdır. Komutlar Session'ın bir script'inde çalıştı; bu yüzden satırlar o Session'ın `nomux capture` çıktısıdır:

```console
$ nomux status set working "tests run"
session jys673ho: working
$ nomux status set blocked "run the tests?"
session jys673ho: needs you
$ nomux status set error "2 tests failed"
session jys673ho: error
$ nomux status set idle
session jys673ho: the report is taken back
$ nomux --json status set done "docs built"
{"schema_version":1,"status_set":{"session":"jys673ho","state":"done"}}
```

Bunlar, geçerli olmayan bir mesajın ve 4 çıkış kodunun mesajlarıdır:

```console
$ nomux status set done "$(printf 'a\nb')"
nomux: the message must be one line of text without a control character
$ nomux status set done "$(head -c 600 /dev/zero | tr '\0' a)"
nomux: the message has 600 bytes: 512 at most
$ nomux status set working
nomux: NOMUX_SESSION_ID is not set: `nomux status set` works only inside a nomux session
$ NOMUX_TOKEN=0000 nomux status set done
nomux: the status of session jys673ho did not change: the token of the request is not the token of the session
```

Üçüncü komut bir Session'ın dışında çalıştı. Diğer üçü bir Session'ın içinde çalıştı. `--quiet` ile komut hiçbir şey yazdırmaz.

### `nomux agent explain`

Bir Session'ın durumu hakkında her kaynağın ne söylediğini gösterir. Bir durum beklediğiniz gibi değilse kullanın.

```text
Usage: nomux agent explain [OPTIONS] [TARGET]

Arguments:
  [TARGET]  The session: its identifier, its name, or the start of one of them

Options:
      --json         Print the result as one JSON document
  -q, --quiet        Print only the necessary part of the result
      --host <NAME>  Use the daemon of a remote host of `nomux host ls` [default: the local host]
  -h, --help         Print help
```

İlk satır, Session'ın durumu ve kaynağıdır. Altındaki liste, kararı verdikleri sırayla her kaynağı verir: ne söylediğini ve nedenini, yani kaynağın notunu. Hiçbir şey bildirmeyen kaynak da listededir.

```console
$ nomux agent explain build
session w6cnfhab: working for 2s, from self-report; message from self-report: build the docs

sources, in the sequence in which they decide:
  adapter             nothing: no adapter extension reported a status
  program status      nothing: no program of the session reported a status
  self-report         working: build the docs (a program of the session reported it with `nomux status set`)
  session restore     nothing: the session did not lose a process with work that ran or waited
  prompt marks        nothing: the shell of the session sent no prompt mark
  foreground program  nothing: the command of the session is in the foreground of its terminal
```

Session'ın Alt işi varsa çıktı onu listeler. Bir adapter ayrıntı verdiyse çıktı onlarla biter: aracın session kimliği ve devam komutu.

Biten bir Session için komut, daemon Session'ı silene kadar saklanan çalışmasını, aracın devam komutuyla birlikte yazdırır. Durum `session restore` kaynağından gelir. Burada kimlik zorunludur:

```console
$ nomux agent explain c7lsrd6u
session c7lsrd6u: done for 2s, from session restore

sources, in the sequence in which they decide:
  adapter             nothing: no adapter extension reported a status
  program status      nothing: the session has no process
  self-report         nothing: no program of the session reported a status with `nomux status set`
  session restore     done (the session lost its process: the status is what the session had then, and work that ran or waited is shown as complete)
  prompt marks        nothing: the session has no process
  foreground program  nothing: the session has no process

from the adapter:
  tool session: 0b1c0000-0000-4000-8000-000000000001
  resume: claude --resume 0b1c0000-0000-4000-8000-000000000001
```

Hiçbir Session hedefe uymuyorsa ya da biten bir Session'ın saklanan çalışması yoksa çıkış kodu 2'dir. `--quiet` ile komut hiçbir şey yazdırmaz. `--json` ile doküman [`agent explain`](#agent-explain) dokümanıdır.

### `nomux events`

Host'un olaylarını geldikçe yazdırır; bir sinyal komutu durdurana kadar. Tek kip `--follow`'dur; `-f` onun kısa adıdır.

```text
Usage: nomux events [OPTIONS] --follow

Options:
  -f, --follow
          Wait for the events. This is the only mode now

      --json
          Print the result as one JSON document

      --filter <TYPE>
          Print only the events of this type. Give the option more than one time for more types

          Possible values:
          - agent-run-changed:            The status of a session or of its Child work changed
          - agent-run-removed:            A session ended or was removed
          - extension-event:              The daemon part of an extension sent an event
          - workspace-changed:            The workspace tree of the Groups and the Projects changed
          - session-hibernated:           The daemon hibernated a session
          - session-woken:                A wake started the resume command of a session
          - session-wake-failed:          A wake of a session failed
          - session-memory-limit-reached: The operating system ended a session at its memory limit

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
| `-f`, `--follow` | Olaylara abone olur ve her olayı geldiğinde yazdırır. |
| `--filter <type>` | Yalnızca bir türün olaylarını yazdırır. Sekiz tür yukarıdaki yardım metnindedir. Daha fazla tür için seçeneği birden çok kez verin. Snapshot her zaman yazdırılır. |

Aşağıdaki, bir Session `nomux status set` ile `working`, `blocked` ve `done` bildiren bir script çalıştırırken ve bir grup eklenirken alınan metin çıktısıdır:

```console
$ nomux events -f
6 workspace revision 27: added 3o24pfzsm2wm "Reviews" at position 1
7 himtzv3l working build the docs
8 himtzv3l needs you deploy to production?
9 himtzv3l done docs built
10 himtzv3l done docs built
```

Bunlar bir hazırda bekletmenin, başarısız bir uyandırmanın, bir uyandırmanın ve durumsuz biten bir Session'ın satırlarıdır:

```console
$ nomux events -f
9 c2m2rip4 done
10 c2m2rip4 hibernated (request): 143.0 KiB given back
11 c2m2rip4 did not wake: the session did not start: nomux-holder: cannot start the command: Permission denied (os error 13); resume command: claude --resume 0b1c0000-0000-4000-8000-000000000001
12 c2m2rip4 woke: claude --resume 0b1c0000-0000-4000-8000-000000000001
13 c2m2rip4 idle
14 c2m2rip4 done
15 workspace revision 12: added 56tn4m4hd2fh "Temp" at position 1
16 ugoxmnxj removed
```

Bu örnekte uyandırma, devam komutunun programının çalıştırma izni olmadığı için başarısız oldu. Bellek limitine ulaşan bir Session şu satırı verir:

```console
$ nomux events -f --filter session-memory-limit-reached
2 twobx2hm ended at its memory limit of 64.0 MiB
```

- Komut, başladıktan sonraki olayları yazdırır. Daemon'da komutun ihtiyaç duyduğu olaylar yoksa bir snapshot gelir.
- Bir satır, değişiklik için `<seq> <session> <state> <message>`; biten ya da silinen bir Session için `<seq> <session> removed`; bir extension olayı için `<seq> extension <id>: <name> (<n> bytes)`; workspace ağacının bir değişikliği için `<seq> workspace revision <revision>: <change>`; snapshot için `<seq> snapshot: ...` biçimindedir. Dört Session olayının metinleri şunlardır: `hibernated (<reason>): <memory> given back`, `woke: <resume command>`, `did not wake: <reason>; resume command: <command>` ve `ended at its memory limit of <limit>`.
- Metinde kaynak yoktur: ikinci `done` satırı, Session'ın komutu bittiğinde ve kaynak `self-report`'tan `session restore`'a geçtiğinde gelir. Olayın JSON dokümanı kaynağı gösterir.
- `<seq>`, olayın daemon'un olay günlüğündeki sırasıdır. Daemon yeniden başlayınca numaralar yeniden başlar.
- `--quiet` ile çıktı aynı satırlardır.
- Çıkış kodu şu durumlarda 0'dır: `SIGINT` (Ctrl-C) ya da `SIGTERM` komutu durdurduğunda, daemon bağlantıyı kapattığında (örneğin `nomux daemon stop` sonrası) ve standart çıktıyı okuyan taraf onu kapattığında.

`--json` ile her satır bir JSON dokümanıdır (NDJSON). Filtre verilirse komut yalnızca filtrenin adını verdiği türlerin olaylarını yazdırır. Aşağıdakiler, yukarıdaki hazırda bekletme örneğinin `nomux events -f --json` satırları ve filtreli komutlardır:

```console
$ nomux events -f --json
{"schema_version":1,"event":{"seq":10,"at_ms":1795705965272,"type":"session_hibernated","session":"c2m2rip4","hibernation":{"reason":"request","freed_bytes":146432,"measure":"pss"}}}
{"schema_version":1,"event":{"seq":11,"at_ms":1795705965578,"type":"session_wake_failed","session":"c2m2rip4","hibernation":{"resume_command":"claude --resume 0b1c0000-0000-4000-8000-000000000001","error":"the session did not start: nomux-holder: cannot start the command: Permission denied (os error 13)"}}}
{"schema_version":1,"event":{"seq":12,"at_ms":1795705965884,"type":"session_woken","session":"c2m2rip4","hibernation":{"resume_command":"claude --resume 0b1c0000-0000-4000-8000-000000000001"}}}
$ nomux events -f --json --filter workspace-changed
{"schema_version":1,"event":{"seq":15,"at_ms":1795705968429,"type":"workspace_changed","workspace":{"revision":12,"change":"added","node":{"id":"56tn4m4hd2fh","parent_id":null,"name":"Temp","kind":"group"},"index":1}}}
$ nomux events -f --json --filter session-memory-limit-reached
{"schema_version":1,"event":{"seq":2,"at_ms":1795705996506,"type":"session_memory_limit_reached","session":"twobx2hm","hibernation":{"limit_bytes":67108864}}}
```

İlk komut, yazdırdığı satırlardan üçünü gösterir. Bu bölümde bu sayfa için çalıştırılmayanlar: bir `extension-event` ve bir `snapshot` satırı ile diğer tetikleyicilerin (`count`, `session-memory`, `total-memory` ve `memory-pressure`) `session-hibernated` olayları. Claude Code adapter'ı hiçbir extension olayı göndermez; daemon da snapshot'ı yalnızca fazla geride kalmış bir istemciye gönderir.

## Hook komutları

Claude Code gibi bir agent aracı, işinin her olayında bir komut çalıştırır. nomux için bu komut `nomux hook <tool> <event>`'tir. Aracın adapter extension'ı olayları bir duruma çevirir. Bir olayın yolunu [Agent adapter'ları](/docs/tr/guides/agent-adapters/) anlatır; Claude Code'un hook'larının kullanımını [Claude Code](/docs/tr/guides/claude-code/) gösterir.

Bu bölümdeki örnekler, nomux 0.5.0'ın Claude Code adapter'ını kullanır (`nomux.agent-claude` 0.1.0; `nomux ext install ./claude-adapter --grant-all` ile kuruldu). Ayar dosyası, çalıştırmanın home dizinindeki `~/.claude/settings.json`'dur. Dosyada, ilk örnekten önce kullanıcıya ait bir hook vardı:

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

Bir agent aracının tek bir olayını Session'ın daemon'una gönderir. Bir araç bu komutu hook'larından çağırır: olayın verisini standart girdiden okur.

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

`hooks install`, çağrıyı aracın ayar dosyasına yazar. Bu komutu kendiniz yazmazsınız. Bir Session'ın içinde, olayın verisi standart girdide olan tek bir olay için çağrı şöyledir:

```console
$ echo '{}' | nomux hook claude Stop
$ echo $?
0
```

Komut hiçbir şey yazdırmaz: bu sürümde araç için cevap boştur.

- Komut olayın verisini standart girdiden okur: en fazla 256 KiB; girdi bitene kadar ya da en fazla 40 ms. Daha büyük girdi verisi olmadan gider. Terminal girdi sayılmaz.
- `NOMUX_SESSION_ID`, `NOMUX_SOCK` ve `NOMUX_TOKEN` değişkenlerini okur, `NOMUX_SOCK`'taki socket'e bağlanır ve tek bir istek gönderir. Daemon, shell ve başka bir process başlatmaz. `--host` etkisizdir.
- Bir hook aracını bloke etmemeli ve bozmamalıdır: **çıkış kodu her zaman 0'dır**. Session dışında, daemon yokken ve daemon komutun başlamasından sonra 80 ms içinde cevap vermediğinde komut çıktısız biter. Daemon, adapter olayı almadan önce hook'a cevap verir.
- Daemon olayı reddederse, örneğin yanlış token yüzünden, komut standart hataya tek satır yazar. Çıkış kodu 0 kalır. Bu satır, `echo '{}' | NOMUX_TOKEN=wrong nomux hook claude Stop` çalıştıran bir Session'ın çıktısıdır:

```console
$ nomux capture hooktest
nomux hook: the hook event of session pfcf3iui was refused: the token of the request is not the token of the session
```

- Adapter'ı olmayan bir araç çıktı vermez ve hiçbir durum değişmez.
- `--json` ve `--quiet` ile komut, araç için cevabı onlarsız olduğu gibi yazdırır: hiçbir şey.

### `nomux hooks`

`hooks` komutları, bir agent aracının hook'larını, aracın bu bilgisayardaki ayar dosyasında değiştirir ve gösterir. Aracın adapter extension'ı, hook'larının ihtiyaç duyduğu girdileri tanımlar. `--host` kullanılamaz: bir aracın ayar dosyası aracın bilgisayarındadır.

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

nomux `--apply` olmadan hiçbir ayar dosyası yazmaz, bir aracın komutunu hiçbir zaman sarmaz ya da değiştirmez ve bir aracın izin denetimlerini atlayan bir seçeneği hiçbir zaman eklemez.

### `nomux hooks install`

Bir aracın hook'larının ayar dosyasında ihtiyaç duyduğu değişikliği gösterir ve yalnızca `--apply` ile yazar.

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

Komut adapter'dan kurulum planını ister, ayar dosyasının yeni içeriğini hesaplar ve onu unified diff olarak yazdırır. Claude Code adapter'ının diff'inde, Claude Code'un her olayı için bir hook vardır. Çıktı 263 satırdır. Aşağıdaki ilk komut, `| head -24` ile ilk 24 satırı, ikincisi çıktının son satırını gösterir:

```console
$ nomux hooks install claude | head -24
--- /home/user/.claude/settings.json
+++ /home/user/.claude/settings.json
@@ -10,6 +10,259 @@
             "args": ["done"]
           }
         ]
+      },
+      {
+        "hooks": [
+          {
+            "type": "command",
+            "command": "nomux",
+            "args": [
+              "hook",
+              "claude",
+              "Stop"
+            ]
+          }
+        ]
+      }
+    ],
+    "SessionStart": [
+      {
+        "hooks": [
$ nomux hooks install claude | tail -1
dry run: nothing is written. Add --apply to write the change
```

Komut yalnızca eklediği metni değiştirir; dosyadaki değerlerin konumlarında. Diğer her byte kalır: anahtarların sırası, girinti, boşluklar ve dosyanın sonu. Kullanıcının hook'undaki `"args": ["done"]` satırı diff'te aynı satırdır ve `Stop` için yeni hook onun arkasından gelir. Yeni bir girdi dosyanın girintisini (sekme ya da boşluk) alır; tek satırdaki bir nesnede ya da listede tek satırda kalır. Bu sayfa komutu yukarıdaki dosyada (iki boşluk), tek satırlık bir dosyada (`{"model":"sonnet","hooks":{"Stop":[]}}`) ve sekme kullanan bir dosyada çalıştırdı. Her birinde sonuç, dosyayla aynı biçimdedir.

`--apply` ile komut aynı diff'i yazdırır ve dosyayı yazar. Son satır bunu söyler:

```console
$ nomux hooks install claude --apply | tail -1
the hooks of claude are installed in /home/user/.claude/settings.json
$ nomux hooks install claude --apply
the hooks of claude are installed in /home/user/.claude/settings.json: nothing to change
```

- `--dry-run` varsayılandır ve onu yineler. `--dry-run` ile `--apply` birlikte kullanılamaz: çıkış kodu 1'dir.
- Aynı dizindeki geçici bir dosya ayar dosyasının yerini alır; sembolik bağlantı bağlantı olarak kalır. Dosyada zaten bulunan bir değer yeniden eklenmez: yukarıdaki ikinci komut hiçbir şeyi değiştirmez ve çıkış kodu 0'dır.
- Var olmayan bir dosya oluşturulur: diff o zaman `--- /dev/null` ile başlar.
- `--apply` ayrıca nomux'un veri dizinindeki `hooks/<tool>/` altına bir kayıt yazar (Linux'ta `~/.local/share/nomux`, macOS'ta `~/Library/Application Support/nomux`): kurulumdan önceki dosyanın byte'ları, yazılan dosyanın sağlama toplamı ve girdiler.
- Araç için adapter yoksa çıkış kodu 2'dir: `nomux: no extension is the adapter of the tool nosuchtool`. JSON olmayan bir ayar dosyası 1 çıkış kodunu ve `nomux: the settings file /home/user/.claude/settings.json cannot get the hooks: key must be a string at line 1 column 3; nothing changed` mesajını verir. Bu durumlarda hiçbir şey yazılmaz.

### `nomux hooks uninstall`

Bir aracın hook'larının kaldırılmasının ayar dosyasını nasıl değiştireceğini gösterir ve yalnızca `--apply` ile yazar.

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

Komut yalnızca `hooks install --apply`'ın yazdığı kayda ihtiyaç duyar; daemon'a gerek yoktur.

- Ayar dosyası kurulumdan sonra değişmediyse dosya, kurulumdan önceki byte'larına geri döner. Dosya yoksa silinir.
- Dosya değiştiyse yalnızca nomux'un girdileri kaybolur; kurulumun oluşturduğu ve o zaman başka değeri olmayan her liste ve nesneyle birlikte. Kurulumdan önce dosyada bulunan bir liste ya da nesne kalır. Dosyadaki diğer değişiklikler de kalır.

```console
$ nomux hooks uninstall claude | tail -1
dry run: nothing is written. Add --apply to write the change
$ nomux hooks uninstall claude --apply | tail -1
/home/user/.claude/settings.json has its content from before the install again
$ nomux hooks uninstall claude --apply
nomux: nomux did not install the hooks of claude
```

Son komutun çıkış kodu 2'dir: nomux aracın hook'larını kurmadı; bu yüzden kaydı yok.

Dosyayı kurulumdan sonra değiştirdiyseniz ikinci komutun mesajı farklıdır. Bu çalıştırmada kurulumdan sonra dosyaya `"theme": "dark"` satırı eklendi:

```console
$ nomux hooks uninstall claude --apply | tail -1
/home/user/.claude/settings.json changed after the install: only the entries of nomux are removed
```

Dosyada o zaman `"theme": "dark"` satırı ve kullanıcının hook'u vardı; nomux'un hook'u yoktu.

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
claude  nomux.agent-claude  missing in /home/user/.claude/settings.json
$ nomux hooks install claude --apply | tail -1
the hooks of claude are installed in /home/user/.claude/settings.json
$ nomux hooks status
TOOL    ADAPTER             HOOKS
claude  nomux.agent-claude  installed in /home/user/.claude/settings.json
```

| Durum | Anlamı |
|---|---|
| `installed` | Ayar dosyasında kurulum planının her girdisi var. |
| `missing` | Ayar dosyasında girdilerin hiçbiri yok ya da dosya yok. |
| `different` | Ayar dosyasında kurulum planının bazı girdileri var ve kurulum diğerlerini ekler. |
| `not known` | nomux ayar dosyasını okuyamıyor. Metin nedenini söyler, örneğin JSON olmayan bir dosya için. |

Bu sayfa `different` durumunu çalıştırmadı. `{ bad` metinli bir ayar dosyası şu satırı verdi:

```console
$ nomux hooks status
TOOL    ADAPTER             HOOKS
claude  nomux.agent-claude  not known: the settings file /home/user/.claude/settings.json cannot get the hooks: key must be a string at line 1 column 3; nothing changed
```

Hiçbir aracın adapter'ı ya da kaydı yoksa komut `no tool has an adapter or installed hooks` yazdırır. Her durumda çıkış kodu 0'dır. `--quiet` ile komut hiçbir şey yazdırmaz.

## Diğer komutlar

### `nomux version`

Sürümü yazdırır. `nomux --version` ve `nomux -V` aynısını yapar.

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
nomux 0.5.0
$ nomux version --quiet
0.5.0
```

## Sessiz çıktı

`--quiet` ile komut yalnızca bir script'in ihtiyaç duyduğunu yazdırır.

| Komut | Standart çıktı |
|---|---|
| `new` | Session kimliği |
| `ls` | Her satırda bir session kimliği |
| `capture` | Çıktı satırları; `--quiet` olmadan olduğu gibi |
| `capture -f` | Çıktı; `--quiet` olmadan olduğu gibi |
| `host ls` | Her satırda bir Host adı |
| `ext ls` | Her satırda bir extension kimliği |
| `status` | Sizi bekleyen her Session için, her satırda bir session kimliği |
| `events --follow` | Metin çıktısının satırları |
| `ext call` | Sonucun payload'u; `--quiet` olmadan olduğu gibi |
| `version` | Sürüm numarası |
| `project add`, `project rm`, `group new`, `group rename`, `group move` ve `group rm` | Düğümün kimliği |
| `project ls`, `group ls` ve `group ls --tree` | Her satırda bir düğüm kimliği |
| `new --attach`, `attach`, `start`, `restore-policy`, `detach`, `hibernate`, `wake`, `pin`, `unpin`, `kill`, `rename`, `send`, `daemon status`, `daemon stop`, `daemon install-service`, `daemon uninstall-service`, `host add`, `host rm`, `host doctor`, `ext install`, `ext rm`, `ext enable`, `ext disable`, `ext validate`, `status set`, `agent explain` | Hiçbir şey. Sonuç, çıkış koduyla verilir |

```console
$ nomux ls --quiet
7vyxpmt3
plhommva
qghxx5rq
tvomf5br
uistajr3
wzr5kzyq
$ nomux --quiet group ls --tree
hehffp4j3m7w
teeb7aeyjpg3
2cxs4kkr6ei4
55pjgf4rwq2c
e5k6uikywno6
```

## Hatalar

Hata, standart hataya `nomux: <message>` biçiminde yazılır; standart çıktı boş kalır.
Mesajın metni sabit değildir. Bir script çıkış kodunu kullanmalıdır.

Hatalı bir komut satırı, argüman ayrıştırıcının kullanım mesajını yazdırır ve 1 çıkış koduyla biter:

```console
$ nomux --json --quiet ls
error: the argument '--json' cannot be used with '--quiet'

Usage: nomux --json
...
```

Sayfa, çıktıyı kullanım mesajının ilk satırından sonra kısaltır.

## Çıkış kodları

| Kod | JSON'daki ad | Anlamı |
|---:|---|---|
| 0 | | Başarı |
| 1 | `error` | Başka bir kodu olmayan hata; ayrıca hatalı komut satırı, birden fazla Session olabilecek bir hedef, geçerli olmayan ya da kullanımda olan bir session adı, hedef isteyen bir komuta ne hedef ne de `--all` verilmesi (hedefsiz `kill`), hazırda bekleyemeyen bir Session, başarısız bir uyandırma, hazırda beklemeyen bir Session, `send`'in reddettiği bir metin ya da tuş adı, `kill --all` sorusuna `y` dışında bir cevap (ya da terminalsiz `--yes` eksikliği), geçerli olmayan bir prefix tuşu, workspace ağacında birden fazla düğümün taşıdığı bir ad, kurulamayan bir SSH bağlantısı, güvenilmeyen bir host key, başarısız bir `host doctor` denetimi, başlatılamayan uykudaki bir Session, geçerli olmayan bir manifest, başarısız bir extension, geçerli olmayan bir `status set` mesajı ve `hooks install`'ın değiştiremediği bir ayar dosyası |
| 2 | `not_found` | Aranan şey yok: hedefe uyan bir Session yok, Session'ın komutu bitmiş (biten bir Session'a `start`, `send`, `rename`, `kill` ya da `detach` uygulanamaz), biten bir Session'ın saklanan çalışması yok (`agent explain`), workspace ağacında uyan bir düğüm yok, verilen adda bir Host yok, verilen kimlikte bir extension yok, nomux bir aracın hook'larını kurmamış (`hooks uninstall`), bir aracın adapter'ı olan extension yok (`hooks install`) ya da daemon çalışmıyor (`daemon status`) |
| 3 | `timeout` | Bir işlem izin verilen sürede tamamlanmadı: daemon başladıktan sonra cevap vermedi, bir Session hazır olmadı, bir komut bitmedi ya da bir extension cevap vermedi |
| 4 | `no_permission` | Kullanıcının izni yok, örneğin daemon'un socket'i için ya da uzak Host hiçbir anahtarı kabul etmedi. Ayrıca izinler onaylanmadan `ext install`, izni olmayan bir extension ve Session'ını kanıtlayamayan bir `status set` |
| 5 | `version_mismatch` | CLI ile daemon'un ortak bir protokol sürümü yok. İkisinden eski olanı güncelleyin |

`hook` komutunun çıkış kodu, olayı gönderemediğinde de her olay için 0'dır: bir hook aracını bozmamalıdır. Yalnızca hatalı bir komut satırı 1 çıkış koduyla biter. `attach`, `new --attach` ve bir terminaldeki yalın `nomux` komutunun çıkış kodunun bir kaynağı daha vardır: Session attach sırasında biterse çıkış kodu, komutunun çıkış durumudur. Bkz. [attach nasıl biter](#attach-nasıl-biter). Terminalsiz yalın `nomux` 1 çıkış koduyla biter.

## JSON çıktısı

`--json` ile komut, tek satırlık tek bir JSON dokümanı yazdırır.

- Başarıda doküman standart çıktıya gider.
- Hatada standart çıktı boş kalır ve doküman standart hataya gider. Dokümanda `error` alanı bulunur.
- Her dokümanda `schema_version` alanı vardır. Güncel değer `1`'dir.

**Şema sürümü kuralı.** Bir alan kaldırıldığında, adı değiştiğinde ya da anlamı değiştiğinde değer artar.
Yeni bir alan değeri artırmaz. Bu yüzden bir okuyucu tanımadığı alanları yok saymalıdır.

### `new`, `start`, `hibernate` ve `wake`

```json
{"schema_version":1,"session":{"id":"lkxpxrp4","name":"agent","state":"dormant","pid":null,"command":["claude"],"cwd":"/home/user/src/acme-web","rows":24,"columns":80,"started_at":1795706408,"epoch":1,"restore_policy":"on-focus","hibernation":{"hibernated_at":1795706411,"reason":"request","freed_bytes":147456,"measure":"pss","resume_command":"claude --resume 0b1c0000-0000-4000-8000-000000000001","woken_at":null,"wake_error":null}}}
```

Bu doküman, `nomux --json hibernate agent` çıktısıdır. `nomux --json new -n api -- sleep 600` aynı alanlara sahiptir; `hibernation` yoktur.

| Alan | Tür | Anlamı |
|---|---|---|
| `session.id` | string | Session kimliği |
| `session.name` | string ya da `null` | Session adı. Session'ın adı yoksa ve eski bir daemon'dan `null` |
| `session.state` | string | `running`, `unreachable`, `dormant`, `ended`, `damaged` ya da `unknown` |
| `session.pid` | sayı ya da `null` | Komutun process ID'si. Session'ın process'i yoksa ya da daemon bunu bilmiyorsa `null` |
| `session.command` | string dizisi | Komutun programı ve argümanları. Daemon bilmiyorsa boş. UTF-8 olmayan bir byte dizisinin yerinde U+FFFD olur |
| `session.cwd` | string ya da `null` | Komutun çalışma dizini |
| `session.rows`, `session.columns` | sayı ya da `null` | Session'ın pencere boyutu |
| `session.started_at` | sayı ya da `null` | Komutun geçerli epoch'ta ne zaman başladığı: Unix epoch'tan sonraki saniye |
| `session.epoch` | sayı ya da `null` | Session'ın epoch'u: yeni bir Session için 1, her geri yüklemeden sonra 1 fazla |
| `session.restore_policy` | string ya da `null` | `auto`, `on-focus` ya da `manual`. CLI'ın tanımadığı bir politika için `null` |
| `session.exit` | nesne | Yalnızca `state` `ended` ise: `ended_at` (Unix epoch'tan sonraki saniye) ve `exit_code` ya da `signal`. Daemon komutun nasıl bittiğini bilmiyorsa nesnede ikisi de yoktur |
| `session.damage` | string | Yalnızca Session'ın tanımı bozuksa: neden, insan için İngilizce. Metin sabit değildir |
| `session.hibernation` | nesne | Yalnızca Session hazırda beklediyse: `hibernated_at` (Unix epoch'tan sonraki saniye), `reason` (`count`, `session-memory`, `total-memory`, `memory-pressure`, `request` ya da `unknown`), `freed_bytes` ve `measure` (daemon ölçmediyse `null`), `resume_command`, `woken_at` (Session hazırda beklerken `null`; yoksa geçerli çalışmanın uyandırma zamanı) ve `wake_error` (`null` ya da son uyandırmanın neden başarısız olduğu). Hazırda bekleyen bir Session'ın `state` değeri `dormant`'tır |
| `session.pinned` | boolean | Yalnızca `true` ise: Session otomatik hazırda bekletmenin dışında tutuluyor |

Daemon değeri bilmiyorsa bir alan `null` olur ya da `command` boş olur: bozuk bir Session için ve tanımı yazamayacak kadar eski bir holder'ın Session'ı için. Doküman komutun ortamını hiçbir zaman içermez. Sabitlenmiş bir Session'da `"pinned":true` alanı vardır. Bu sayfa `damaged` durumunu çalıştırmadı.

### `ls`

```json
{"schema_version":1,"sessions":[{"id":"5zlqlabj","name":"api","state":"running","pid":4058606,"command":["sleep","600"],"cwd":"/home/user/src/acme-web","rows":24,"columns":80,"started_at":1795706408,"epoch":1,"restore_policy":"on-focus","project":{"id":"55pjgf4rwq2c","path":"Client work/Acme/acme-web"}},{"id":"tfbjezgs","name":null,"state":"dormant","pid":null,"command":["sleep","300"],"cwd":"/home/user","rows":24,"columns":80,"started_at":1795706408,"epoch":1,"restore_policy":"on-focus","project":null}]}
```

`sessions`, `new` komutunun verdiği nesnelerin, kimlik sırasındaki dizisidir; bir alan daha içerir: `project`, Session'ın Projesi (`id` ve `path`) ya da Session'ın Projesi yoksa `null`. Hiç Session yoksa dizi boştur. Biten bir Session dizide yalnızca `--all` ile bulunur: `exit` alanı vardır. Örnek, daha uzun bir dokümanın parçasıdır: sayfa hazırda bekleyen `agent` Session'ını çıkardı (girdisinde yukarıdaki `hibernation` nesnesi vardır).

### `ls --memory`

```json
{"schema_version":1,"sessions":[{"id":"5zlqlabj","name":"api","state":"running","pid":4058606,"command":["sleep","600"],"cwd":"/home/user/src/acme-web","rows":24,"columns":80,"started_at":1795706408,"epoch":1,"restore_policy":"on-focus","memory":{"command_bytes":147456,"command_processes":1,"holder_bytes":285696,"measure":"pss","limit_bytes":4294967296}},{"id":"lkxpxrp4","name":"agent","state":"dormant","pid":null,"command":["claude"],"cwd":"/home/user/src/acme-web","rows":24,"columns":80,"started_at":1795706408,"epoch":1,"restore_policy":"on-focus","hibernation":{"hibernated_at":1795706411,"reason":"request","freed_bytes":147456,"measure":"pss","resume_command":"claude --resume 0b1c0000-0000-4000-8000-000000000001","woken_at":null,"wake_error":null},"memory":null},{"id":"tfbjezgs","name":null,"state":"dormant","pid":null,"command":["sleep","300"],"cwd":"/home/user","rows":24,"columns":80,"started_at":1795706408,"epoch":1,"restore_policy":"on-focus","memory":null}],"memory_total":{"command_bytes":147456,"command_processes":1,"holder_bytes":285696,"sessions":1,"measure":"pss","freed_bytes":147456,"hibernated_sessions":1}}
```

Doküman, `ls` dokümanına her Session'da bir alan ve en üstte bir alan eklenmiş halidir. `--memory` olmadan dokümanda ikisi de yoktur. Bu dokümandaki Session'larda `project` alanı yoktur; oysa `ls` dokümanında vardır: bu, `ls --memory --json` ile ürün başvurusu arasında bir farktır; ürün başvurusu `ls --memory` dokümanının, yukarıdaki alanlarla birlikte `ls` dokümanı olduğunu söyler.

| Alan | Tür | Anlamı |
|---|---|---|
| `sessions[].memory` | nesne ya da `null` | Session'ın process'lerinin belleği. Session'ın process'i yoksa `null` |
| `sessions[].memory.command_bytes` | sayı | Komutun process ağacının belleği, byte olarak; holder hariç |
| `sessions[].memory.command_processes` | sayı | O ağaçtaki process sayısı |
| `sessions[].memory.holder_bytes` | sayı | Session'ın holder'ının belleği, byte olarak |
| `sessions[].memory.measure` | string | `pss`, `rss` ya da CLI'ın tanımadığı bir ölçü için `unknown` |
| `sessions[].memory.limit_bytes` | sayı ya da `null` | İşletim sisteminin komuta uyguladığı bellek limiti. Hiçbiri uygulanmıyorsa `null` |
| `memory_total.command_bytes`, `memory_total.command_processes`, `memory_total.holder_bytes` | sayı | Process'i olan Session'ların üç değerinin toplamları |
| `memory_total.sessions` | sayı | Toplamlardaki Session sayısı |
| `memory_total.measure` | string ya da `null` | Toplamların ölçüsü. Session'ların ölçüsü aynı değilse ya da hiçbir Session'ın process'i yoksa `null` |
| `memory_total.freed_bytes`, `memory_total.hibernated_sessions` | sayı | Hazırda bekleyen Session'ların geri verdiği bellek ve sayıları |

### `capture`

```json
{"schema_version":1,"capture":{"id":"tznoru4a","output":"\u001b[?2004l\rq\r\n\u001b[?2004hsh-5.3$ "}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `capture.id` | string | Session kimliği |
| `capture.output` | string | Çıktı satırları, escape dizileriyle birlikte. UTF-8 olmayan bir byte dizisinin yerinde U+FFFD olur. Metin çıktısında byte'lar değişmeden bulunur |

`capture --follow`'un JSON biçimi yoktur: hatasının çıkış kodu 1'dir.

### `restore-policy`

```json
{"schema_version":1,"restore_policy":{"id":"kx7edkz2","policy":"on-focus"}}
```

### `attach`, `new --attach` ve `new -A`

```json
{"schema_version":1,"attach":{"id":"kx7edkz2","name":"web","end":"detached"}}
{"schema_version":1,"attach":{"id":"kx7edkz2","name":"web","created":false,"end":"detached"}}
{"schema_version":1,"attach":{"id":"3axs7avk","name":null,"end":"exited","exit_code":3}}
```

Komut, dokümanı attach bittikten sonra yazdırır. Biten bir Session'ın dokümanı standart çıktıya gider ve çıkış kodu, [attach nasıl biter](#attach-nasıl-biter) bölümündeki tablodaki koddur.

| Alan | Tür | Anlamı |
|---|---|---|
| `attach.id` | string | Session kimliği |
| `attach.name` | string ya da `null` | Session adı |
| `attach.created` | boolean | Yalnızca `new -A` için: Session vardıysa `false` |
| `attach.end` | string | `detached`: istemci detach oldu ve Session yaşıyor. `exited`: komut bir çıkış koduyla bitti. `signaled`: bir sinyal komutu sonlandırdı. `lost`: Session bitti ve çıkış durumu bilinmiyor. `unknown`: daemon CLI'dan yeni ve CLI'ın tanımadığı bir neden gönderdi |
| `attach.exit_code` | sayı | Komutun çıkış kodu. Yalnızca `end` `exited` ise |
| `attach.signal` | sayı | Sinyal numarası. Yalnızca `end` `signaled` ise |

### `detach`

```json
{"schema_version":1,"detached":{"id":"wyv5slz3","clients":0}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `detached.id` | string | Session kimliği |
| `detached.clients` | sayı | Session'a attach olmuş istemcilerin sayısı |

### `rename`

```json
{"schema_version":1,"renamed":{"id":"z3jqohga","name":"scratch","previous_name":"sandbox"}}
```

`renamed.name` yeni addır. `renamed.previous_name`, komuttan önceki addır ya da `null`.

### `pin` ve `unpin`

```json
{"schema_version":1,"pinned":{"id":"wsqtewka","pinned":true}}
{"schema_version":1,"pinned":{"id":"wsqtewka","pinned":false}}
```

`pinned.pinned`, `pin` sonrası `true`, `unpin` sonrası `false` olur.

### `kill`

```json
{"schema_version":1,"killed":"5zlqlabj"}
{"schema_version":1,"killed_sessions":["lys4a4lv","potjlxdz"]}
{"schema_version":1,"would_kill":["lys4a4lv","potjlxdz"]}
```

`killed`, sonlanan Session'ın kimliğidir. `kill --all` `killed_sessions` verir: sonlanan Session'ların kimlikleri. `--dry-run` ile `would_kill` verir: sonlanacak Session'ların kimlikleri. Hiçbir Session çalışmıyorsa her dizi boştur.

### `send`

```json
{"schema_version":1,"sent":{"id":"tznoru4a","bytes":10}}
```

`sent.bytes`, Session'ın Enter dahil aldığı byte sayısıdır.

### `daemon status`

```json
{"schema_version":1,"daemon":{"running":true,"version":"0.5.0","pid":4128206,"sessions":1,"configuration":"/home/user/.config/nomux/config.toml","memory_limit":{"applied":true,"detail":"the kernel ends the processes of a session at its limit: a systemd user scope with MemoryMax"}}}
{"schema_version":1,"daemon":{"running":false,"configuration":"/home/user/.config/nomux/config.toml"}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `daemon.running` | boolean | Daemon çalışıyorsa `true`. `false` ise `daemon` yalnızca `configuration` içerir ve çıkış kodu 2'dir |
| `daemon.version` | string | Daemon'un ürün sürümü |
| `daemon.pid` | sayı | Daemon'un process ID'si |
| `daemon.sessions` | sayı | Session sayısı. Biten Session sayılmaz |
| `daemon.memory_limit` | nesne | `applied` (işletim sistemi bir Session'ın process'lerini limitinde sonlandırıyorsa `true`) ve `detail` (nasıl ya da neden değil; insan için İngilizce). Eski bir daemon'un dokümanında yoktur |
| `daemon.configuration` | string | Local Host'un global yapılandırma dosyasının yolu; daemon çalışmıyorsa da. `--host` ile olan dokümanda, `host add`'in `daemon` nesnesinde ve `HOME` tanımlı değilse yoktur |

### `daemon stop`

```json
{"schema_version":1,"stopped":false}
```

`stopped`, bir daemon çalışıyorsa ve komut onu durdurduysa `true`'dur. Daemon çalışmıyorsa `false`'tur.

### `daemon install-service` ve `daemon uninstall-service`

```json
{"schema_version":1,"service":{"action":"installed","path":"/home/user/.config/systemd/user/nomuxd.service","content":"[Unit]\nDescription=nomux daemon\nDocumentation=https://nomux-sh.github.io/docs/\n\n[Service]\nExecStart=\"/home/user/.local/bin/nomuxd\" --replace\nKillMode=process\nRestart=on-failure\n\n[Install]\nWantedBy=default.target\n"}}
{"schema_version":1,"service":{"action":"would_remove","path":"/home/user/.config/systemd/user/nomuxd.service"}}
{"schema_version":1,"service":{"action":"not_installed","path":"/home/user/.config/systemd/user/nomuxd.service"}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `service.action` | string | `installed`, `would_install` (dry run), `removed`, `would_remove` (dry run) ya da `not_installed`: dosya yok, bu yüzden hiçbir şey silinmedi |
| `service.path` | string | Servis dosyasının yolu |
| `service.content` | string | Dosyanın içeriği. Yalnızca `installed` ve `would_install` için |

### `host add`

Bu doküman nomux 0.5.0'ın [`docs/cli.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/cli.md) dosyasından alınmıştır. Komut bu sayfa için çalıştırılmadı.

```json
{"schema_version":1,"host":{"name":"vps","ssh":"deploy@vps.example.com","system":"Linux","machine":"x86_64","target":"x86_64-unknown-linux-musl","directory":"~/.nomux/bin/0.1.0","installed":true,"daemon":{"running":true,"version":"0.1.0","pid":2210,"sessions":0}}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `host.name` | string | `--host` için Host'un adı |
| `host.ssh` | string | SSH hedefi |
| `host.system`, `host.machine` | string | Host'un sistemi ve işlemcisi; `uname -s` ve `uname -m`'in verdiği gibi |
| `host.target` | string | Host'un binary'lerinin release hedefi |
| `host.directory` | string | Binary'lerin Host'taki dizini |
| `host.installed` | boolean | Komut binary'leri kurduysa `true`. Host'ta zaten varsa `false` |
| `host.daemon` | nesne | Host'un daemon'u: `daemon status` nesnesi |

### `host ls`

```json
{"schema_version":1,"hosts":[]}
```

`hosts` adların sırasındadır. Yapılandırma dosyasında Host yoksa boştur. Bir Host `{"name":"vps","ssh":"deploy@vps.example.com"}` biçimindedir.

### `host rm`

```json
{"schema_version":1,"removed":"vps"}
```

### `host doctor`

Bir Host'lu bu doküman nomux 0.5.0'ın [`docs/cli.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/cli.md) dosyasından alınmıştır. Komut bu sayfa için bir Host'la çalıştırılmadı. Host olmadığında doküman `{"schema_version":1,"doctor":[]}` olur.

```json
{"schema_version":1,"doctor":[{"host":"vps","ok":false,"checks":[{"name":"connection","ok":true,"detail":"deploy@vps.example.com port 22, host key ssh-ed25519 SHA256:..."},{"name":"permissions","ok":false,"detail":"~/.nomux/run has the mode drwxr-xr-x: other users can use it. Run `chmod go-rwx ~/.nomux/run` on the host"}]}]}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `doctor` | dizi | Komutun denetlediği her Host için bir nesne |
| `doctor[].host` | string | Host'un adı |
| `doctor[].ok` | boolean | Host'un her denetimi geçtiyse `true` |
| `doctor[].checks[].name` | string | `connection`, `platform`, `binaries`, `permissions`, `daemon`, `versions` ya da `memory-limit` |
| `doctor[].checks[].ok` | boolean | Host denetimi geçtiyse `true` |
| `doctor[].checks[].detail` | string | İnsan için İngilizce bir metin: denetimin bulduğu şey ya da neden ve ne yapılacağı. Metin sabit değildir |

Bir denetim başarısız olsa da doküman standart çıktıya gider. Çıkış kodu o zaman 1'dir.

### `ext ls`

```json
{"schema_version":1,"extensions":[{"id":"nomux.agent-claude","name":"Claude Code adapter","version":"0.1.0","state":"running","reason":null,"permissions":{"fs":[],"process":[],"network":false,"scopes":["hooks:read","agent:report"]}},{"id":"nomux.git","name":"Git","version":"0.1.0","state":"stopped","reason":null,"permissions":{"fs":["/home/user/src/acme-web"],"process":["git"],"network":false,"scopes":[]}}]}
```

`extensions` kimliklerin sırasındadır. Kurulu extension yoksa boştur.

| Alan | Tür | Anlamı |
|---|---|---|
| `id` | string | Extension'ın kimliği |
| `name` | string | Extension'ın insan için adı |
| `version` | string | Extension'ın sürümü |
| `state` | string | `stopped`, `starting`, `running`, `failed`, `disabled` ya da `unknown` |
| `reason` | string ya da `null` | `disabled` için: extension'ın neden devre dışı olduğu. `failed` için: hata. Diğer durumlarda `null`. Metin sabit değildir |
| `permissions.fs` | string dizisi | Kullanıcının onayladığı dizinler |
| `permissions.process` | string dizisi | Kullanıcının onayladığı programlar |
| `permissions.network` | boolean | Kullanıcı ağ bağlantılarını onayladıysa `true` |
| `permissions.scopes` | string dizisi | Kullanıcının onayladığı host servis kapsamları |

### `ext install`, `ext enable` ve `ext disable`

```json
{"schema_version":1,"extension":{"id":"nomux.git","name":"Git","version":"0.1.0","state":"stopped","reason":null,"permissions":{"fs":["/home/user/src/acme-web"],"process":["git"],"network":false,"scopes":[]}}}
```

`extension`, komuttan sonraki `ext ls` nesnesidir. İzinleri onaylanmadan yapılan bir `ext install` bir hatadır: standart hatada, mesajında izinler olan hata dokümanı bulunur.

### `ext rm`

```json
{"schema_version":1,"removed_extension":"nomux.git"}
```

### `ext call`

```json
{"schema_version":1,"call":{"extension":"nomux.echo","method":"echo","payload_base64":"CgJoaQ=="}}
```

Bu doküman ürün başvurusundan alınmıştır ve bu sayfa için çalıştırılmadı: çalıştırmadaki hiçbir extension bir metoda payload'la cevap vermedi.

| Alan | Tür | Anlamı |
|---|---|---|
| `call.extension` | string | Extension'ın kimliği |
| `call.method` | string | Metodun adı |
| `call.payload_base64` | string | Sonucun payload'u, Base64 (RFC 4648, dolgulu). Payload, metodun kodlamasında byte'lardır |

Extension bir hatayla cevap verdiyse standart hatada hata dokümanı bulunur.

### `ext validate`

```json
{"schema_version":1,"manifest":{"valid":true,"id":"nomux.git","name":"Git","version":"0.1.0","permissions":{"fs":["${worktree}"],"process":["git"],"network":false,"scopes":[]}}}
{"schema_version":1,"manifest":{"valid":false,"problems":[{"path":"extension.id","problem":"must have two or more parts with `.` between them, in 64 characters at most. A part starts with a lower-case letter and has only lower-case letters, digits and `-`"}]}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `manifest.valid` | boolean | Manifest geçerliyse `true`. `false` ise çıkış kodu 1'dir |
| `manifest.id`, `manifest.name`, `manifest.version` | string | Manifest'teki kimlik. Yalnızca `valid` `true` ise |
| `manifest.permissions` | nesne | Manifest'in istediği izinler; `ext ls` içindeki `permissions` alanlarıyla. Yalnızca `valid` `true` ise |
| `manifest.problems[].path` | string ya da `null` | Geçerli olmayan bir alanın yolu. Dosya TOML değilse `null` |
| `manifest.problems[].problem` | string | Alanın uymadığı kural; insan için İngilizce. Metin sabit değildir |

Manifest geçerli olmasa da doküman standart çıktıya gider.

### `project` ve `group`

Bir değişiklik:

```json
{"schema_version":1,"change":{"type":"renamed","revision":8,"node":{"id":"e5k6uikywno6","parent_id":"teeb7aeyjpg3","name":"acme-api","kind":"project","path":"Client work/Acme/acme-api","directory":"/home/user/src/acme-api"}}}
```

Bir listeleme (`project ls`, `group ls`, `group ls --tree`):

```json
{"schema_version":1,"workspace":{"revision":6,"nodes":[{"id":"hehffp4j3m7w","parent_id":null,"name":"Client work","kind":"group","path":"Client work"},{"id":"teeb7aeyjpg3","parent_id":"hehffp4j3m7w","name":"Acme","kind":"group","path":"Client work/Acme"},{"id":"2cxs4kkr6ei4","parent_id":"teeb7aeyjpg3","name":"notes","kind":"project","path":"Client work/Acme/notes","directory":"/home/user/src/notes"}]}}
```

Listeleme, `nomux --json group ls --tree` çıktısıdır; beş düğümden üçüne kısaltılmıştır.

| Alan | Tür | Anlamı |
|---|---|---|
| `change.type` | string | `project_added`, `project_removed`, `group_created`, `group_removed`, `renamed` ya da `moved` |
| `change.revision`, `workspace.revision` | sayı | Değişiklikten sonraki ya da listelenen ağacın revizyonu |
| `change.node` | düğüm | Değişiklikten sonraki düğüm. Silinen düğümün son adı ve yolu vardır |
| `workspace.nodes[]` | düğüm listesi | Projeler (`project ls`), Gruplar (`group ls`) ya da her düğüm (`group ls --tree`); derinlik öncelikli bir gezintinin sırasıyla |

Bir düğümün alanları şunlardır:

| Alan | Tür | Anlamı |
|---|---|---|
| `id` | string | Kimlik |
| `parent_id` | string ya da `null` | Düğümün Grubu. En üst düzeyde `null` |
| `name` | string | Ad |
| `kind` | string | `group` ya da `project` |
| `path` | string | En üst düzeyden düğüme kadar olan adlar, aralarında `/` ile. Bir olayda yoktur |
| `directory` | string | Yalnızca Proje için: Host'taki dizini |

Bu sayfa `change.type` için `renamed` değerini çalıştırdı. `project_added`, `project_removed`, `group_created`, `group_removed` ve `moved` değerleri ürün başvurusundan alınmıştır.

### `status`

```json
{"schema_version":1,"status":{"attention":{"session":"lkxpxrp4","status":{"state":"done","kind":null,"source":"session_restore","guess":false,"since_ms":1795706408725,"seen":false,"message":null,"title":null,"progress":null,"tool":null}},"sessions":[{"id":"5zlqlabj","name":"api","command":["sleep","600"],"status":{"state":"idle","kind":null,"source":"none","guess":false,"since_ms":1795706408708,"seen":false,"message":null,"title":null,"progress":null,"tool":null},"aggregate":{"state":"idle","kind":null,"source":"none","guess":false,"since_ms":1795706408708,"seen":false,"message":null,"title":null,"progress":null,"tool":null}},{"id":"lkxpxrp4","name":"agent","command":["claude"],"status":{"state":"done","kind":null,"source":"session_restore","guess":false,"since_ms":1795706408725,"seen":false,"message":null,"title":null,"progress":null,"tool":null},"aggregate":{"state":"done","kind":null,"source":"session_restore","guess":false,"since_ms":1795706408725,"seen":false,"message":null,"title":null,"progress":null,"tool":null},"details":{"model":null,"provider_session_id":"0b1c0000-0000-4000-8000-000000000001","resume_command":"claude --resume 0b1c0000-0000-4000-8000-000000000001"},"hibernated":"request"}]}}
```

Örnek, daha uzun bir dokümanın parçasıdır: sayfa üçüncü Session'ı çıkardı. `--tree` ile `status.sessions`'ın her girdisinde `details`'ten önce `children` alanı bulunur ve dokümanda `status.workspace` alanı vardır.

| Alan | Tür | Anlamı |
|---|---|---|
| `status.attention` | nesne ya da `null` | Durumu en acil olan Session ve o durum. Host'ta Session yoksa `null` |
| `status.sessions[]` | liste | Biten her Session için ve son Agent çalışmasını saklayan her biten Session için bir Agent çalışması; kimlik sırasıyla |
| `.id`, `.name`, `.command` | string, string ya da `null`, string listesi | Session, adı ve komutu |
| `.status` | durum | Agent çalışmasının durumu |
| `.aggregate` | durum | Agent çalışmasının ve Alt işlerinin en acil durumu |
| `.children[]` | liste | Yalnızca `--tree` ile. Her Alt iş: `name`, `status` (bir durum ya da hiçbir kaynak bildirmiyorsa `null`), `aggregate` ve `children` |
| `.details` | nesne | Yalnızca bir adapter verdiyse: `model`, `provider_session_id` ve `resume_command`; her biri string ya da `null` |
| `.hibernated` | string | Yalnızca hazırda bekleyen bir Session için: hazırda bekletmenin nedeni |
| `status.workspace[]` | liste | Yalnızca `--tree` ile. Workspace ağacının her düğümü; `project ls` düğümünün alanlarıyla birlikte ve `aggregate` (altındaki Session'ların en acil durumu ya da `null`) ve `sessions` (bir Projenin Session'larının kimlikleri; Grup için boş) alanlarıyla |

Host'ta Session yoksa doküman `{"schema_version":1,"status":{"attention":null,"sessions":[]}}` olur.

Bir durumun alanları şunlardır:

| Alan | Tür | Anlamı |
|---|---|---|
| `state` | string | `idle`, `working`, `done`, `needs_you`, `error` ya da CLI'ın tanımadığı bir durum için `unknown` |
| `kind` | string ya da `null` | `needs_you` için: `permission`, `question` ya da `auth`; hiçbir kaynak söylemiyorsa `null` |
| `source` | string | `adapter`, `program_status`, `self_report`, `session_restore`, `prompt_marks`, `foreground_program`, `none` (hiçbir kaynak işi bildirmiyor) ya da `unknown` |
| `guess` | boolean | Daemon durumu tahmin ettiyse `true`: kaynak `prompt_marks` ya da `foreground_program` |
| `since_ms` | sayı | Daemon durumu ilk ne zaman gördü: Unix epoch'tan sonraki milisaniye |
| `seen` | boolean | `done` ve `error` için: kullanıcı sonucu gördüyse `true` |
| `message`, `title`, `tool` | nesne ya da `null` | `{"text": ..., "source": ...}`: metin ve kendi kaynağı |
| `progress` | nesne ya da `null` | `{"percent": ..., "source": ...}` |

### `status set`

```json
{"schema_version":1,"status_set":{"session":"jys673ho","state":"done"}}
```

### `agent explain`

```json
{"schema_version":1,"explain":{"session":"w6cnfhab","run":{"id":"w6cnfhab","status":{"state":"working","kind":null,"source":"self_report","guess":false,"since_ms":1795706743545,"seen":false,"message":{"text":"build the docs","source":"self_report"},"title":null,"progress":null,"tool":null},"aggregate":{"state":"working","kind":null,"source":"self_report","guess":false,"since_ms":1795706743545,"seen":false,"message":{"text":"build the docs","source":"self_report"},"title":null,"progress":null,"tool":null},"children":[]},"sources":[{"source":"adapter","guess":false,"reported":false,"state":null,"kind":null,"message":null,"note":"no adapter extension reported a status"},"..."]}}
```

Sayfa, `sources` listesini ilk girdisinden sonra kısaltır. `explain.run`, `status.sessions` girdisinin Alt işiyle birlikte alanlarına sahiptir; `name` ve `command` yoktur. `explain.sources` her kaynağı karar verdikleri sırayla içerir. Hiçbir şey söylemeyen kaynak için `reported` `false`'tur: o zaman `state`, `kind` ve `message` `null` olur ve `note` nedenini söyler. Bir notun metni sabit değildir.

### `events --follow`

Her satır bir dokümandır:

```json
{"schema_version":1,"event":{"seq":16,"at_ms":1795705968438,"type":"agent_run_removed","session":"ugoxmnxj"}}
{"schema_version":1,"event":{"seq":10,"at_ms":1795705965272,"type":"session_hibernated","session":"c2m2rip4","hibernation":{"reason":"request","freed_bytes":146432,"measure":"pss"}}}
{"schema_version":1,"event":{"seq":15,"at_ms":1795705968429,"type":"workspace_changed","workspace":{"revision":12,"change":"added","node":{"id":"56tn4m4hd2fh","parent_id":null,"name":"Temp","kind":"group"},"index":1}}}
{"schema_version":1,"event":{"seq":13,"at_ms":1795670005000,"type":"snapshot"}}
```

İlk üç satır gerçek olaylardır. `snapshot` satırı ürün başvurusundaki biçimdir: bu sayfa onu çalıştırmadı.

| Alan | Tür | Anlamı |
|---|---|---|
| `event.seq` | sayı | Olayın daemon'un olay günlüğündeki sırası. Daemon yeniden başlayınca numaralar yeniden başlar |
| `event.at_ms` | sayı | Olayın gerçekleştiği an: Unix epoch'tan sonraki milisaniye |
| `event.type` | string | `agent_run_changed`, `agent_run_removed`, `extension_event`, `workspace_changed`, `session_hibernated`, `session_woken`, `session_wake_failed`, `session_memory_limit_reached`, `snapshot` ya da CLI'ın tanımadığı bir olay için `unknown` |
| `event.session` | string | Session. Yalnızca `agent_run_changed`, `agent_run_removed` ve dört Session olayında (`session_hibernated`, `session_woken`, `session_wake_failed` ve `session_memory_limit_reached`) |
| `event.run` | nesne | Yalnızca `agent_run_changed` içinde: değişiklikten sonraki Agent çalışması; `explain.run` alanlarıyla |
| `event.extension` | nesne | Yalnızca `extension_event` içinde: `id` (extension), `name` (olayın adı) ve `payload_base64` (payload, Base64: kodlamayı extension seçer) |
| `event.workspace` | nesne | Yalnızca `workspace_changed` içinde: `revision` ve `change`: `node` (`path`'siz bir düğüm) ve `index` ile `added`, `id` ve `name` ile `renamed`, `id`, `parent_id` ve `index` ile `moved`, `id` ile `removed` ya da `unknown` |
| `event.hibernation` | nesne | Yalnızca dört Session olayında: `session_hibernated` için `reason`, `freed_bytes` ve `measure`; `request` dışındaki tetikleyiciler için tetikleyicinin sayılarıyla birlikte (`live_agents` ve `max_live_agents`, `memory_bytes` ve `memory_limit_bytes` ya da `pressure_stall_ms` ve `pressure_window_ms`); `session_woken` için `resume_command`; `session_wake_failed` için `resume_command` ve `error`; `session_memory_limit_reached` için `limit_bytes` |

Bir `snapshot`'tan sonra, her Session için bir `agent_run_changed` olayı Host'un şimdiki durumunu verir. Okuyucu elindeki durumu atar.

### `hook`

Komut, araç için cevabı yazdırır; `--json` ile de bir JSON dokümanı yazdırmaz. Bu sürümde cevap boştur, bu yüzden çıktı boştur.

### `hooks install` ve `hooks uninstall`

Sayfa, `diff` değerini ilk `@@` satırından sonra kısaltır. Gerçek değerde bütün diff vardır.

```json
{"schema_version":1,"hooks_change":{"action":"install","tool":"claude","path":"/home/user/.claude/settings.json","diff":"--- /home/user/.claude/settings.json\n+++ /home/user/.claude/settings.json\n@@ ...","changed":true,"applied":false,"restores_original":false}}
{"schema_version":1,"hooks_change":{"action":"uninstall","tool":"claude","path":"/home/user/.claude/settings.json","diff":"--- /home/user/.claude/settings.json\n+++ /home/user/.claude/settings.json\n@@ ...","changed":true,"applied":true,"restores_original":true}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `hooks_change.action` | string | `install` ya da `uninstall` |
| `hooks_change.tool` | string | Araç |
| `hooks_change.path` | string | Ayar dosyası |
| `hooks_change.diff` | string | Değişiklik, unified diff olarak. Hiçbir şey değişmiyorsa boş |
| `hooks_change.changed` | boolean | Diff boş değilse `true` |
| `hooks_change.applied` | boolean | `--apply` ile `true`: komut değişikliği yazdı |
| `hooks_change.restores_original` | boolean | `uninstall` için: dosya kurulumdan önceki byte'larına dönüyorsa `true`; yalnızca nomux'un girdileri kayboluyorsa `false` |

Hook'lar zaten kuruluysa `nomux hooks install claude --json` çıktısında `"changed":false` ve `"applied":false` olur.

### `hooks status`

```json
{"schema_version":1,"hooks":[{"tool":"claude","adapter":"nomux.agent-claude","state":"installed","path":"/home/user/.claude/settings.json","recorded":true,"problem":null}]}
{"schema_version":1,"hooks":[{"tool":"claude","adapter":"nomux.agent-claude","state":null,"path":null,"recorded":false,"problem":"the settings file /home/user/.claude/settings.json cannot get the hooks: key must be a string at line 1 column 3; nothing changed"}]}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `hooks[].tool`, `.adapter` | string, string ya da `null` | Araç ve adapter extension'ı. `null`: aracın adapter'ı yok, yalnızca bir kurulum kaydı var |
| `.state` | string ya da `null` | `installed`, `missing` ya da `different`. Durum bilinmiyorsa `null`: `problem` nedenini söyler |
| `.path` | string ya da `null` | Ayar dosyası |
| `.recorded` | boolean | nomux'un bir kurulum kaydı varsa `true`: `hooks uninstall` hook'ları kaldırabilir |
| `.problem` | string ya da `null` | Durumun neden bilinmediği; insan için İngilizce. Metin sabit değildir. Durum biliniyorsa `null` |

Hiçbir aracın adapter'ı ya da kaydı yoksa doküman `{"schema_version":1,"hooks":[]}` olur.

### `version`

```json
{"schema_version":1,"version":"0.5.0"}
```

### Hata

```json
{"schema_version":1,"error":{"code":2,"kind":"not_found","message":"no session has the identifier or the name nothing, and no session has a name or an identifier that starts with it"}}
{"schema_version":1,"error":{"code":1,"kind":"error","message":"ap can be more than one session. Give more of the identifier or of the name of one of them:\n  5g2diwdl  api-v2  sh\n  wyv5slz3  api     sleep 600","candidates":[{"id":"5g2diwdl","name":"api-v2","state":"running"},{"id":"wyv5slz3","name":"api","state":"running"}]}}
{"schema_version":1,"error":{"code":4,"kind":"no_permission","message":"the extension nomux.git 0.1.0 asks for these permissions:\n  fs=${worktree}\n  process=git\nNothing was installed. To install the extension, approve its permissions: add --grant-all, or --grant <permission> for each permission that you approve. For a directory that starts with ${worktree}, give a directory: --grant fs=<directory>"}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `error.code` | sayı | Komutun çıkış kodu |
| `error.kind` | string | [çıkış kodları](#çıkış-kodları) tablosundaki çıkış kodunun adı |
| `error.message` | string | İnsanın okuması için İngilizce bir mesaj. Metni sabit değildir |
| `error.candidates` | liste | Yalnızca birden fazla Session olabilecek bir hedef için: her aday `id`, `name` (string ya da `null`) ve `state` olarak |

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

`nomux-holder` da kullanım metnini aynı şekilde yazdırır ve 2 çıkış koduyla biter. Seçenekleri daemon içindir.

## Bu sayfanın anlattığı sürüm

Bu sayfa nomux 0.5.0'ı anlatır: `nomux-sh/nomux` reposunun [`v0.5.0`](https://github.com/nomux-sh/nomux/releases/tag/v0.5.0) etiketi, [`fcdc83c`](https://github.com/nomux-sh/nomux/commit/fcdc83c7d992f5fa7a4810722b391acdf0243f43) commit'i.
Yardım metinleri ve örnekler, o sürümün binary'lerinin Linux x86_64 üzerinde, sayfada `/home/user` olarak gösterilen geçici bir home dizinindeki gerçek çıktısıdır. Session kimlikleri ve process ID'leri birden fazla çalıştırmadan gelir. Sayfa, geçici home dizininin yolunu ve binary'lerin dizinini `/home/user` ile değiştirdi.
Örneklerde beş şey, yayımlanmış ürünün düz bir çalıştırması değildir:

- Hazırda bekletme, durum ve hook örneklerindeki `agent` ve `claude` Session'ları Claude Code'u değil, küçük bir script'i çalıştırır. Script, kaydedilmiş `SessionStart` ve `Stop` hook olaylarını daemon'a gönderir ve sonra bekler. Claude Code'un adapter extension'ı (`nomux.agent-claude` 0.1.0) yayımlanmış pakettir. Bu yüzden `hibernate`, `wake` ve `hibernated` satırları daemon'un gerçek çıktısıdır; ama agent bir yedektir. Başarılı olan uyandırma `claude` adlı ikinci bir script başlattı; başarısız olan uyandırma, `PATH`'inde `claude` olmayan bir daemon'da çalıştı.
- Extension örneklerindeki paketler, yayımlanmış `nomux-git` 0.1.0 ve `nomux-agent-claude` 0.1.0'dır.
- `nomux hooks install`, çalıştırmanın home dizinindeki ayar dosyasını yazdı. Bu, gerçek bir Claude Code'un ayar dosyası değildir.
- Terminal örnekleri (`attach`, prefix tuşları, sorusuyla `kill --all` ve dar terminallerdeki tablolar), bir script'in sürdüğü pseudoterminal içinde çalıştı.
- Bellek örnekleri, yapılandırma dosyasının `[sessions]` tablosunda `memory_limit = "4G"` olan bir Host'ta çalıştı; bir Session'ın ulaştığı limit için `"64M"`.

Şu kısımlar bu sayfa için çalıştırılmadı; aynı etiketteki [`docs/cli.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/cli.md) dosyasından alındı: uzak bir Host'a bağlanan her komut (`host add`, bir Host verilen `host doctor` ve onun `memory-limit` denetimi, var olan bir Host için `--host` ile çalışan komutlar), 3 çıkış kodu, SSH için 4 çıkış kodu, 5 çıkış kodu, `unreachable`, `damaged` ve `unknown` durumları, `attach.end` alanının `lost` ve `unknown` değerleri, CLI'ın aldığı bir sinyalle biten attach, attach sırasında pencere boyutunun değişmesi, uzak bir Host'a attach'in yeniden bağlanması, `ls --memory` için `rss` ölçüsü ve toplam satırındaki `pss and rss`, `ls --memory`'nin hatası, eski bir daemon için `new -n` ve `rename`, `count`, `session-memory`, `total-memory` ve `memory-pressure` hazırda bekletme tetikleyicileri, `events --follow` için `extension-event` ve `snapshot` satırları, `hooks status` komutunun `different` durumu, sembolik bağlantı olan bir ayar dosyasının yazılması, macOS yolları, bir tabloda geniş bir karakterin görüntü genişliği, `ext ls`'in attığı sütunların sırası, `status` komutundaki `(guess)` ve `(seen)` işaretleri ile `needs you` türleri, `hibernate` komutunun gösterilen iki reddi dışındaki nedenleri ve bir Session'ın sonlanmadığı bir `kill --all`.
