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
- Her komut `--json` ve `--quiet` seçeneklerini kabul eder. İkisi birlikte kullanılamaz.
- Daemon'a ihtiyaç duyan komut, cevap veren bir daemon yoksa onu başlatır ve en fazla 5 saniye bekler. `daemon status` ve `daemon stop` daemon başlatmaz.
- Metin çıktısında yalnızca Session'ın state'i renklidir; o da standart çıktı bir terminalse ve `NO_COLOR` değişkeni tanımlı değilse.

## Genel kullanım

```text
Sessions that stay alive on the host when the client disconnects

Usage: nomux [OPTIONS] [COMMAND]

Commands:
  new      Start a new session and print its identifier
  ls       List the sessions
  attach   Show a session in this terminal. To detach, press Ctrl-\ and then d
  detach   Detach the clients that are attached to a session. The session continues
  kill     End a session
  daemon   Show or stop the daemon
  version  Print the version

Options:
      --json     Print the result as one JSON document
  -q, --quiet    Print only the necessary part of the result
  -V, --version  Print the version
  -h, --help     Print help
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
| `-V`, `--version` | `version` komutu gibi sürümü yazdırır. |
| `-h`, `--help` | CLI'ın ya da tek bir komutun yardım metnini yazdırır. |

## Komutlar

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
  -h, --help              Print help
```

| Seçenek | Varsayılan | Ne yapar |
|---|---|---|
| `--cwd <DIR>` | CLI'ın çalıştığı dizin | Komutun çalışma dizini. Göreli yol, CLI'ın çalıştığı dizine göre çözülür. Dizinin var olması gerekir. |
| `--attach` | Kapalı | Terminali, [`nomux attach`](#nomux-attach) gibi yeni Session'a attach eder. Komut bu durumda session kimliğini değil, attach'in sonucunu yazdırır. |
| `-- <COMMAND>...` | Kullanıcının shell'i: daemon'un `SHELL` değişkeni, yoksa `/bin/sh` | Session'ın komutu ve argümanları. |
| `--cmd <COMMAND>...` | Aynısı | `--`'nin ikinci yazılışı. |

**`--` ya da `--cmd`'den sonra gelen her argüman Session'ın komutuna gider; `nomux`'un kendi seçeneklerinden biri olsa bile.** Bu yüzden `nomux`'un seçenekleri komuttan önce yazılır:

```sh
nomux new --json -- sleep 300      # --json, nomux'un seçeneği
nomux new -- sleep 300 --json      # --json, sleep'in argümanı
```

```console
$ nomux new -- sh
v4nmov3a
$ nomux new --cwd project -- sleep 600
iyzzzkaz
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

Session'ları listeler.

```text
Usage: nomux ls [OPTIONS]

Options:
      --json   Print the result as one JSON document
  -q, --quiet  Print only the necessary part of the result
  -h, --help   Print help
```

```console
$ nomux ls
ID        STATE    PID
iyzzzkaz  running  1551539
qsscrcw4  running  1551536
v4nmov3a  running  1551533
```

Hiç Session yoksa komut `no sessions` yazdırır.

`PID`, Session'ın komutunun process ID'sidir. Daemon bunu bilmiyorsa `-` görünür.

| State | Anlamı |
|---|---|
| `running` | Session'ın komutu çalışıyor. |
| `unreachable` | Session'ın holder'ı çalışıyor ama daemon'un ona bağlantısı yok. Daemon yeniden bağlanmayı dener. |
| `unknown` | Daemon CLI'dan daha yeni ve CLI'ın tanımadığı bir state gönderdi. |

### `nomux attach`

Terminalinizi bir Session'ın terminali yapar; siz detach olana ya da Session sonlanana kadar.

```text
Usage: nomux attach [OPTIONS] <ID>

Arguments:
  <ID>  The session identifier

Options:
      --json   Print the result as one JSON document
  -q, --quiet  Print only the necessary part of the result
  -h, --help   Print help

Keys during an attach:
  Ctrl-\ d       Detach. The session continues
  Ctrl-\ Ctrl-\  Send one Ctrl-\ to the session

Each other key goes to the session. The exit code is the exit status of the
command if the session ends during the attach, and 0 after a detach.
```

Attach sırasında şunlar olur:

1. Session, terminalinizin pencere boyutunu alır.
2. CLI terminali temizler ve Session'ın o anki ekranını gösterir. Ekranını daha önce çizmiş bir program, örneğin bir editör, hemen görünür.
3. Bastığınız her tuş Session'a gider; Session'ın yazdığı her byte terminalinizde görünür. Terminal raw moddadır: `Ctrl-C` ve `Ctrl-Z` Session'daki programlara ulaşır.
4. Pencerenin boyutu değişirse Session yeni boyutu alır.

Komut, standart girdide bir terminal bekler.
Aynı Session'a aynı anda birden fazla terminal attach olabilir. Hepsi aynı çıktıyı görür, hepsinden yazılabilir.
Session'ın tek bir pencere boyutu vardır: en son attach olan ya da boyutu en son değişen terminalinki. Boyutu farklı olan terminal, çıktıyı programların o boyut için ürettiği hâliyle görür.

Attach, Session'ın ekranını gösterir; ekrandan çıkmış satırları göstermez. Bu sürümde scrollback yoktur.

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
| CLI `SIGTERM`, `SIGHUP`, `SIGINT` ya da `SIGQUIT` alır | Bir hata | 1 |
| Verilen kimlikte bir Session yok | Bir hata | 2 |

Yani `attach`'in çıkış kodu [çıkış kodları](#çıkış-kodları) tablosunda olmayan bir değer olabilir; 1 ile 5 arasındaki değerler de Session'ın komutundan gelebilir.

Aşağıda attach'in dört bitişi var: detach, 3 çıkış durumuyla biten komut, sinyalle sonlanan komut ve duran daemon.

```console
detached from session einqa7tl
```

```console
sh-5.3$ exit 3
exit

session einqa7tl ended with exit status 3
$ echo $?
3
```

```console
sh-5.3$ kill -9 $$

session bjzm6rkj ended by signal 9
$ echo $?
137
```

```console
nomux: the connection to the daemon failed: the daemon closed the connection. The session continues: run `nomux attach einqa7tl` to attach again
```

Verilen kimlikte bir Session yoksa:

```console
$ nomux attach aaaaaaaa
nomux: no session has the identifier aaaaaaaa
```

### `nomux detach`

Bir Session'a attach olmuş bütün istemcileri, başka bir terminalden ya da bir script'ten detach eder. Session yaşamaya devam eder.

```text
Usage: nomux detach [OPTIONS] <ID>

Arguments:
  <ID>  The session identifier

Options:
      --json   Print the result as one JSON document
  -q, --quiet  Print only the necessary part of the result
  -h, --help   Print help
```

Bu istemcilerin her biri, detach tuşlarına basılmış gibi biter. Attach olmuş istemci yoksa da komut başarılıdır:

```console
$ nomux detach einqa7tl
detached 1 client from session einqa7tl
$ nomux detach einqa7tl
detached 0 clients from session einqa7tl
```

Verilen kimlikte bir Session yoksa çıkış kodu 2'dir.
Kimlik vermek zorunludur. Kendi terminalinizi detach etmek için detach tuşlarını kullanın.

### `nomux kill`

Bir Session'ı sonlandırır ve komutu bitene kadar bekler.

```text
Usage: nomux kill [OPTIONS] <ID>

Arguments:
  <ID>  The session identifier

Options:
      --json   Print the result as one JSON document
  -q, --quiet  Print only the necessary part of the result
  -h, --help   Print help
```

Session'ın komutuna `SIGHUP` gönderilir. Komut 2 saniye sonra hâlâ çalışıyorsa `SIGKILL` gönderilir.

```console
$ nomux kill habxocyh
session habxocyh ended
```

Verilen kimlikte bir Session yoksa çıkış kodu 2'dir. Aynı Session için ikinci `kill` de bu yüzden 2 ile biter:

```console
$ nomux kill habxocyh
nomux: no session has the identifier habxocyh
```

### `nomux daemon status`

Daemon'un çalışıp çalışmadığını gösterir. Daemon çalışıyorsa çıkış kodu 0, çalışmıyorsa 2'dir. Bu komut daemon başlatmaz.

```text
Usage: nomux daemon status [OPTIONS]

Options:
      --json   Print the result as one JSON document
  -q, --quiet  Print only the necessary part of the result
  -h, --help   Print help
```

```console
$ nomux daemon status
nomuxd 0.1.0 runs: process ID 1552420, 1 session
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
      --json   Print the result as one JSON document
  -q, --quiet  Print only the necessary part of the result
  -h, --help   Print help
```

Çalışan bir daemon yoksa da çıkış kodu 0'dır, çünkü sonuç aynıdır. Komut bu durumda `nomuxd does not run` yazdırır.

### `nomux version`

Sürümü yazdırır. `nomux --version` ve `nomux -V` de aynı işi görür.

```text
Usage: nomux version [OPTIONS]

Options:
      --json   Print the result as one JSON document
  -q, --quiet  Print only the necessary part of the result
  -h, --help   Print help
```

```console
$ nomux version
nomux 0.1.0
```

## Sessiz çıktı

`--quiet` ile komut yalnızca bir script'in ihtiyaç duyduğu kısmı yazdırır.

| Komut | Standart çıktı |
|---|---|
| `new` | Session kimliği |
| `ls` | Her satırda bir session kimliği |
| `version` | Sürüm numarası |
| `new --attach`, `attach`, `detach`, `kill`, `daemon status`, `daemon stop` | Hiçbir şey. Sonuç, çıkış kodudur |

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
| 1 | `error` | Başka bir koda girmeyen hata; hatalı komut satırı da buna dahildir |
| 2 | `not_found` | Aranan şey yok: verilen kimlikte bir Session yok ya da daemon çalışmıyor (`daemon status`) |
| 3 | `timeout` | İşlem izin verilen sürede tamamlanmadı: daemon başladıktan sonra cevap vermedi, Session hazır olmadı ya da komut sonlanmadı |
| 4 | `no_permission` | Kullanıcının yetkisi yok; örneğin daemon'un socket'i için |
| 5 | `version_mismatch` | CLI ile daemon'un ortak bir protokol sürümü yok. Hangisi eskiyse onu güncelleyin |

`attach` ve `new --attach` için çıkış kodunun bir kaynağı daha vardır: Session attach sırasında sonlanırsa çıkış kodu, komutunun çıkış durumudur. Bkz. [attach nasıl biter](#attach-nasıl-biter).

## JSON çıktısı

`--json` ile komut tek satırlık tek bir JSON dokümanı yazdırır.

- Başarılı sonuçta doküman standart çıktıya gider.
- Hatada standart çıktı boş kalır, doküman standart hataya gider ve `error` alanını taşır.
- Her dokümanda `schema_version` alanı bulunur. Şu anki değeri `1`'dir.

**Şema sürümü kuralı.** Bu değer; bir alan kaldırıldığında, adı değiştiğinde ya da anlamı değiştiğinde artar.
Yeni bir alan eklenmesi değeri artırmaz. Bu yüzden dokümanı okuyan kod, tanımadığı alanları yok saymalıdır.

### `new`

```json
{"schema_version":1,"session":{"id":"qsscrcw4","state":"running","pid":1551536}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `session.id` | string | Session kimliği |
| `session.state` | string | `running`, `unreachable` ya da `unknown` |
| `session.pid` | number ya da `null` | Komutun process ID'si. Daemon bilmiyorsa `null` |

### `ls`

```json
{"schema_version":1,"sessions":[{"id":"iyzzzkaz","state":"running","pid":1551539},{"id":"qsscrcw4","state":"running","pid":1551536},{"id":"v4nmov3a","state":"running","pid":1551533}]}
```

`sessions`, `new`'un verdiği nesnelerden oluşan ve kimliğe göre sıralı bir dizidir. Hiç Session yoksa boştur:

```json
{"schema_version":1,"sessions":[]}
```

### `attach` ve `new --attach`

```json
{"schema_version":1,"attach":{"id":"v4nmov3a","end":"detached"}}
{"schema_version":1,"attach":{"id":"v4nmov3a","end":"exited","exit_code":0}}
{"schema_version":1,"attach":{"id":"vkgzyie7","end":"signaled","signal":9}}
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
{"schema_version":1,"detached":{"id":"v4nmov3a","clients":1}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `detached.id` | string | Session kimliği |
| `detached.clients` | number | Session'a attach olmuş istemcilerin sayısı |

### `kill`

```json
{"schema_version":1,"killed":"gqz3a4vb"}
```

`killed`, sonlanan Session'ın kimliğidir.

### `daemon status`

```json
{"schema_version":1,"daemon":{"running":true,"version":"0.1.0","pid":1551531,"sessions":3}}
{"schema_version":1,"daemon":{"running":false}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `daemon.running` | boolean | Daemon çalışıyorsa `true`. `false` ise dokümanda `daemon`'un başka alanı bulunmaz ve çıkış kodu 2'dir |
| `daemon.version` | string | Daemon'un ürün sürümü |
| `daemon.pid` | number | Daemon'un process ID'si |
| `daemon.sessions` | number | Session sayısı |

### `daemon stop`

```json
{"schema_version":1,"stopped":true}
```

Çalışan bir daemon vardıysa ve komut onu durdurduysa `stopped` değeri `true`'dur. Çalışan daemon yoktuysa `false`'tur.

### `version`

```json
{"schema_version":1,"version":"0.1.0"}
```

### Hata

```json
{"schema_version":1,"error":{"code":2,"kind":"not_found","message":"no session has the identifier aaaaaaaa"}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `error.code` | number | Komutun çıkış kodu |
| `error.kind` | string | Çıkış kodunun [çıkış kodları](#çıkış-kodları) tablosundaki adı |
| `error.message` | string | İnsanın okuması için İngilizce bir mesaj. Metni sabit değildir |

Hatalı komut satırı JSON dokümanı üretmez. Argüman ayrıştırıcı kullanım mesajını düz metin olarak yazar.

## Diğer iki binary

`nomuxd` ve `nomux-holder` binary'lerini normalde kendiniz çalıştırmazsınız. Daemon'u CLI, her Session'ın holder'ını da daemon başlatır.

```text
Usage: nomuxd [--detach]
       nomuxd --version

Without an option, nomuxd runs in the foreground and writes its log to the
standard error.

Options:
  --detach  Start the daemon as a separate process and end. The log of that
            daemon goes to nomuxd.log in the runtime directory (~/.nomux/run).

Environment:
  NOMUX_LOG  The log level: error, warn (default), info, debug or trace
```

## Bu sayfanın anlattığı sürüm

Bu sayfa nomux 0.1.0'ı anlatır: `nomux-sh/nomux` reposunun [`v0.1.0`](https://github.com/nomux-sh/nomux/releases/tag/v0.1.0) etiketi, [`f155516`](https://github.com/nomux-sh/nomux/commit/f15551674735407109d33cbd9924c1710b81eb2f) commit'i.
Yardım metinleri ve örnekler, o sürümün binary'lerinin Linux x86_64 üzerindeki gerçek çıktısıdır. Session kimlikleri ve process ID'leri birden fazla çalıştırmadan gelir.
Şu kısımlar bu sayfa için çalıştırılmadı; aynı etiketteki [`docs/cli.md`](https://github.com/nomux-sh/nomux/blob/v0.1.0/docs/cli.md) dosyasından alındı: 3, 4 ve 5 çıkış kodları, `unreachable` ve `unknown` state'leri, `attach.end` alanının `lost` ve `unknown` değerleri, CLI'ın aldığı bir sinyalle biten attach ve attach sırasında pencere boyutunun değişmesi.
