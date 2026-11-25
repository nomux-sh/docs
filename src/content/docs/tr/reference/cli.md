---
title: CLI başvurusu
description: nomux CLI'ının bütün komutları; seçenekleri, çıktıları, JSON dokümanları ve çıkış kodlarıyla.
sidebar:
  label: CLI
---

`nomux`, CLI'dır. Daemon'a tek bir istek gönderir ve sonucu yazdırır.
Komutların kullanımını [hızlı başlangıç](/docs/tr/guides/quick-start/) sayfasında görebilirsiniz.

CLI'ın yardım metinleri ve mesajları İngilizcedir; bu sayfada oldukları gibi verilmiştir.

## Bütün komutlar için geçerli kurallar

- Hiçbir komut soru sormaz. Komut yalnızca argümanlarını ve ortam değişkenlerini okur.
- Bütün komutlar aynı [çıkış kodlarını](#çıkış-kodları) kullanır.
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
  kill     End a session
  daemon   Show or stop the daemon
  version  Print the version

Options:
      --json     Print the result as one JSON document
  -q, --quiet    Print only the necessary part of the result
  -V, --version  Print the version
  -h, --help     Print help
```

Bir komut vermek zorunludur. Komutsuz `nomux` hata yazdırır ve 1 çıkış koduyla biter.

| Seçenek | Ne yapar |
|---|---|
| `--json` | Sonucu tek satırlık tek bir JSON dokümanı olarak yazdırır. Bkz. [JSON çıktısı](#json-çıktısı). |
| `-q`, `--quiet` | Yalnızca bir script'in ihtiyaç duyduğu kısmı yazdırır. Bkz. [sessiz çıktı](#sessiz-çıktı). |
| `-V`, `--version` | `version` komutu gibi sürümü yazdırır. |
| `-h`, `--help` | CLI'ın ya da tek bir komutun yardım metnini yazdırır. |

## Komutlar

### `nomux new`

Yeni bir Session açar ve session kimliğini yazdırır.

```text
Usage: nomux new [OPTIONS]

Options:
      --cwd <DIR>         The working directory of the command [default: the current directory]
      --json              Print the result as one JSON document
      --cmd <COMMAND>...  The command of the session and its arguments [default: the shell of the user]. All the arguments after --cmd belong to the command
  -q, --quiet             Print only the necessary part of the result
  -h, --help              Print help
```

| Seçenek | Varsayılan | Ne yapar |
|---|---|---|
| `--cwd <DIR>` | CLI'ın çalıştığı dizin | Komutun çalışma dizini. Göreli yol, CLI'ın çalıştığı dizine göre çözülür. Dizinin var olması gerekir. |
| `--cmd <COMMAND>...` | Kullanıcının shell'i: daemon'un `SHELL` değişkeni, yoksa `/bin/sh` | Session'ın komutu ve argümanları. |

`--cmd` son seçenek olmalıdır. Ondan sonra gelen her argüman komuta gider; `--json` ve `--quiet` de buna dahildir.
Örneğin `nomux new --cmd sh --json`, `sh --json` komutunu başlatır.

```console
$ nomux new --cmd sh
2uc2d5iq
$ nomux new --cwd project --cmd sleep 600
bzxw7xjk
```

Komut, daemon'un ortam değişkenlerini alır. Terminali 24 satır, 80 sütundur.

Komut başlatılamazsa çıkış kodu 1'dir:

```console
$ nomux new --cmd /nonexistent-binary
nomux: the session did not start: nomux-holder: cannot start the command: No such file or directory (os error 2)
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
2uc2d5iq  running  1057040
bzxw7xjk  running  1057045
```

Hiç Session yoksa komut `no sessions` yazdırır.

`PID`, Session'ın komutunun process ID'sidir. Daemon bunu bilmiyorsa `-` görünür.

| State | Anlamı |
|---|---|
| `running` | Session'ın komutu çalışıyor. |
| `unreachable` | Session'ın holder'ı çalışıyor ama daemon'un ona bağlantısı yok. Daemon yeniden bağlanmayı dener. |
| `unknown` | Daemon CLI'dan daha yeni ve CLI'ın tanımadığı bir state gönderdi. |

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
$ nomux kill 2uc2d5iq
session 2uc2d5iq ended
```

Verilen kimlikte bir Session yoksa çıkış kodu 2'dir. Aynı Session için ikinci `kill` de bu yüzden 2 ile biter:

```console
$ nomux kill 2uc2d5iq
nomux: no session has the identifier 2uc2d5iq
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
nomuxd 0.0.0 runs: process ID 1057038, 2 sessions
$ nomux daemon stop
nomuxd stopped
$ nomux daemon status
nomuxd does not run
```

### `nomux daemon stop`

Daemon'u durdurur. Session'lar çalışmaya devam eder. Bu komut daemon başlatmaz.

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
nomux 0.0.0
```

## Sessiz çıktı

`--quiet` ile komut yalnızca bir script'in ihtiyaç duyduğu kısmı yazdırır.

| Komut | Standart çıktı |
|---|---|
| `new` | Session kimliği |
| `ls` | Her satırda bir session kimliği |
| `version` | Sürüm numarası |
| `kill`, `daemon status`, `daemon stop` | Hiçbir şey. Sonuç, çıkış kodudur |

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

## JSON çıktısı

`--json` ile komut tek satırlık tek bir JSON dokümanı yazdırır.

- Başarılı sonuçta doküman standart çıktıya gider.
- Hatada standart çıktı boş kalır, doküman standart hataya gider ve `error` alanını taşır.
- Her dokümanda `schema_version` alanı bulunur. Şu anki değeri `1`'dir.

**Şema sürümü kuralı.** Bu değer; bir alan kaldırıldığında, adı değiştiğinde ya da anlamı değiştiğinde artar.
Yeni bir alan eklenmesi değeri artırmaz. Bu yüzden dokümanı okuyan kod, tanımadığı alanları yok saymalıdır.

### `new`

```json
{"schema_version":1,"session":{"id":"qvjpfeam","state":"running","pid":1046423}}
```

| Alan | Tür | Anlamı |
|---|---|---|
| `session.id` | string | Session kimliği |
| `session.state` | string | `running`, `unreachable` ya da `unknown` |
| `session.pid` | number ya da `null` | Komutun process ID'si. Daemon bilmiyorsa `null` |

### `ls`

```json
{"schema_version":1,"sessions":[{"id":"qvjpfeam","state":"running","pid":1046423}]}
```

`sessions`, `new`'un verdiği nesnelerden oluşan ve kimliğe göre sıralı bir dizidir. Hiç Session yoksa boştur:

```json
{"schema_version":1,"sessions":[]}
```

### `kill`

```json
{"schema_version":1,"killed":"qvjpfeam"}
```

`killed`, sonlanan Session'ın kimliğidir.

### `daemon status`

```json
{"schema_version":1,"daemon":{"running":true,"version":"0.0.0","pid":1045471,"sessions":1}}
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
{"schema_version":1,"version":"0.0.0"}
```

### Hata

```json
{"schema_version":1,"error":{"code":2,"kind":"not_found","message":"no session has the identifier qvjpfeam"}}
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

Bu sayfa `nomux-sh/nomux` reposunun `main` branch'indeki [`cb36104`](https://github.com/nomux-sh/nomux/commit/cb36104c465fd970497f5f505ac895dcd64fba16) commit'ini anlatır. O build sürüm olarak `0.0.0` yazdırır. Henüz etiketlenmiş bir sürüm yok.
Yardım metinleri ve örnekler o build'in gerçek çıktısıdır. 3, 4 ve 5 çıkış kodları ile `unreachable` ve `unknown` state'leri aynı commit'teki [`docs/cli.md`](https://github.com/nomux-sh/nomux/blob/main/docs/cli.md) dosyasından alınmıştır.
`attach` ve `detach` komutları o commit'te yoktur; bu yüzden bu sayfada da yer almazlar.
