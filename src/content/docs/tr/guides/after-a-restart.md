---
title: Yeniden başlatmadan sonra
description: Host yeniden başladığında Session'lara ne olur, uykudaki bir Session nasıl yeniden başlar, geri yükleme politikaları, yapılandırma dosyası, servis dosyası ve neyin geri gelip neyin gelmediği.
---

Host yeniden başladığında her process durur; her holder ve her Session'ın komutu da buna dahil.
nomux her Session'ın tanımını ve çıktısını diskte tutar. Bu yüzden yeniden başlatmadan sonra `nomux ls` her Session'ı **dormant** (uykuda) olarak gösterir ve tek bir komut onu yeniden başlatır.

Bu sayfadaki çıktılar, nomux 0.5.0'ın Linux'taki tek bir çalıştırmasının gerçek çıktısıdır. Çalıştırmanın home dizini `/home/user` olarak gösterilir. Bu çalıştırmada bilgisayar yeniden başlatılmadı: geçici bir home dizinindeki her nomux process'i (daemon, holder'lar ve Session'ların komutları) `kill -9` ile durduruldu. Yeniden başlatma da bu process'lere tam olarak bunu yapar. Sizin session kimlikleriniz ve process ID'leriniz farklı olacaktır.

## Ne geri gelir, ne gelmez

| Yeniden başlatmadan sonra | Geri gelir mi |
|---|---|
| Session, kimliği ve `nomux ls`'teki yeri | Evet |
| Komut, argümanları, çalışma dizini ve pencere boyutu | Evet: geri yükleme aynı komutu aynı yerde başlatır |
| Yeniden başlatmadan önceki çıktı | Evet: diskteki journal'da durur. Attach sonunu gösterir, `nomux capture` tamamını yazdırır |
| Session'ın geri yükleme politikası | Evet |
| [Hazırda bekleyen Session](/docs/tr/guides/hibernation/) | Evet: hazırda bekler durumda kalır. Daemon onu, politikası `auto` olsa bile, kendi açılışında hiçbir zaman başlatmaz |
| Session'ın process'leri: shell, içinde çalışan programlar, onların belleği | **Hayır.** Yeni komut sıfırdan başlar |
| Komutun ortam değişkenleri | **Hayır.** Yeni komut, daemon'un geri yükleme anında hazırladığı [Session ortamını](/docs/tr/guides/session-environment/) alır: daemon'un ortamı, ayrıca `TERM`, `COLORTERM`, UTF-8 karakter kümesi ve Session'ın üç `NOMUX_*` değişkeni. Ortamda secret olabileceği için nomux eski komutun ortamını saklamaz |
| Durmadan önceki son saniyenin çıktısı | Belki gelmez. Holder çıktıyı en geç 1 saniye içinde diske yazar. Elektrik kesilirse kernel'in henüz diske yazmadığı veri de kaybolabilir |

Kendi işine devam edebilen bir program, örneğin resume komutu olan bir agent, bunu geri yüklemeden sonra kendisi yapmalıdır.

## Yeniden başlatmadan önce

Bu çalıştırmada üç Session var: bir shell, bir sunucu ve kendiliğinden yeniden başlamaması gereken bir komut. Shell'e bir attach'te bir satır yazıldı (attach bir sözde terminalde çalıştı).

```console
$ nomux new --cwd project -- sh
ded2ph33
$ nomux attach ded2ph33
sh-5.3$ echo written before the restart
written before the restart
sh-5.3$
detached from session ded2ph33
$ nomux new -- sh -c 'echo server started; exec sleep 600'
o6kczknv
$ nomux new -- sleep 700
7e27dogj
```

Her Session'ın bir [geri yükleme politikası](#geri-yükleme-politikaları) vardır; varsayılanı `on-focus`'tur. Burada sunucuya `auto`, son komuta `manual` veriliyor:

```console
$ nomux restore-policy o6kczknv auto
session o6kczknv has the restore policy auto
$ nomux restore-policy 7e27dogj manual
session 7e27dogj has the restore policy manual
$ nomux ls
ID        STATE    PID      COMMAND
7e27dogj  running  4187180  sleep 700
ded2ph33  running  4187171  sh
o6kczknv  running  4187177  sh -c echo server started; exec sleep 600
```

## Yeniden başlatmadan sonra

Şu an hiçbir nomux process'i çalışmıyor. İlk komut daemon'u başlatır, daemon da state dizinini okur:

```console
$ nomux ls
ID        STATE    PID      COMMAND
7e27dogj  dormant  -        sleep 700
ded2ph33  dormant  -        sh
o6kczknv  running  4187842  sh -c echo server started; exec sleep 600
```

- `ded2ph33` ve `7e27dogj` uykuda. Hiçbir process'leri çalışmıyor, `PID` sütunu `-`.
- `o6kczknv`'nin politikası `auto` olduğu için daemon kendi açılışında onun komutunu yeniden başlattı. Yeni bir process ID'si var.

`nomux daemon status` yeni daemon'u, Session sayısını ve daemon'un okuduğu yapılandırma dosyasının yolunu gösterir:

```console
$ nomux daemon status
nomuxd 0.5.0 runs: process ID 4187840, 3 sessions
memory limit: the kernel ends the processes of a session at its limit: a systemd user scope with MemoryMax
configuration file: /home/user/.config/nomux/config.toml
```

İkinci satır, işletim sisteminin bir Session'a [bellek limiti](/docs/tr/guides/hibernation/#bellek-limiti) uygulayıp uygulamadığını söyler. Daemon'un belleğini geri vermek için bilerek durdurduğu **hazırda bekleyen** bir Session kazara uykuya geçmiş bir Session değildir: hazırda bekler durumda kalır ve `nomux ls` onu `hibernated` olarak gösterir. Çıktı [Hazırda bekletme ve bellek limiti](/docs/tr/guides/hibernation/#yeniden-başlatmadan-sonra) sayfasında.

Uykudaki bir Session'ın process'i yoktur. `nomux status` onu `idle` olarak, `nomux ls --memory` ise belleği için `-` gösterir. Kurallar [Session'ların belleği](/docs/tr/guides/session-memory/) sayfasında.

Havuzdaki bir holder Session değildir ve daemon'uyla birlikte biter; yeniden başlatma onu da bitirir. Yeni daemon kendi havuzunu bir istemcinin ilk isteğinde başlatır: [Holder havuzu](/docs/tr/guides/holder-pool/).

Uykudaki bir Session'ın çıktısı diskte durur. `nomux capture` onu geri yükleme yapmadan yazdırır:

```console
$ nomux capture ded2ph33 --lines 2
written before the restart
sh-5.3$
```

Gerçek çıktıda shell prompt'unun escape sequence'leri de var. Bunları [hızlı başlangıç](/docs/tr/guides/quick-start/) sayfası açıklıyor.

## Uykudaki bir Session'ı yeniden başlatmak

**Attach ile.** `nomux attach` komutu yeniden başlatır ve Session'a bağlanır. Komut terminalinizin pencere boyutunu alır. Terminal önce eski çıktının sonunu, sonra nomux'un bir satırını, ardından yeni komutu gösterir:

```console
$ nomux attach ded2ph33
sh-5.3$ echo written before the restart
written before the restart
sh-5.3$
--- nomux: the session started again. The output before this line is from the command that stopped ---

sh-5.3$ echo typed after the restart
typed after the restart
sh-5.3$
detached from session ded2ph33
```

Gerçek çalıştırmada nomux'un satırıyla yeni prompt arasında çok sayıda boş satır vardı: eski çıktı ve o satır terminalinizin scrollback'ine kayar, yeni shell ekranını onların altına çizer. Örnekte tek boş satır gösteriliyor.
Yeni shell yeni bir process'tir; yeniden başlatmadan önce yazdığınız komutlardan haberi yoktur.

**Attach olmadan.** `nomux start` komutu Session'ın son pencere boyutuyla yeniden başlatır. Politikası `manual` olan bir Session yalnızca bu yolla başlar:

```console
$ nomux attach 7e27dogj
nomux: session 7e27dogj is dormant and its restore policy is manual: run `nomux start 7e27dogj`
$ nomux start 7e27dogj
session 7e27dogj runs
$ nomux ls
ID        STATE    PID      COMMAND
7e27dogj  running  4188320  sleep 700
ded2ph33  running  4187852  sh
o6kczknv  running  4187842  sh -c echo server started; exec sleep 600
```

`manual` bir Session'a `attach` 1 çıkış koduyla biter. Komutu zaten çalışan bir Session için `nomux start` başarılı olur ve hiçbir şeyi değiştirmez. Hazırda bekleyen bir Session için `nomux start`, `nomux wake` gibi devam komutunu başlatır.

Komut başlayamazsa, örneğin çalışma dizini silinmişse, komut 1 çıkış koduyla hata verir ve Session uykuda kalır.

`capture` artık komutun iki çalışmasının, eskisinin ve yenisinin, çıktısını birlikte yazdırır (escape sequence'ler olmadan):

```console
$ nomux capture ded2ph33
sh-5.3$ echo written before the restart
written before the restart
sh-5.3$ sh-5.3$ echo typed after the restart
typed after the restart
sh-5.3$
```

## Geri yükleme politikaları

| Politika | Daemon komutu ne zaman yeniden başlatır |
|---|---|
| `auto` | Daemon başlarken, örneğin oturum açılışında. Dev server ya da watcher için kullanın. Hazırda bekleyen bir Session için hiçbir zaman |
| `on-focus` | İlk `nomux attach` ya da `nomux start` ile. Varsayılan budur |
| `manual` | Yalnızca `nomux start` ile. `nomux attach` 1 çıkış koduyla hata verir |

- `nomux restore-policy <id> <politika>` tek bir Session'ın politikasını ayarlar. Hem çalışan hem uykudaki Session'da çalışır.
- `auto` yalnızca daemon başlarken uygulanır. Daemon çalışırken uykuya geçen bir Session bir istemcinin gelmesini bekler.
- `nomux ls --json` her Session'ın politikasını `restore_policy` alanında gösterir.

Kendi politikası olmayan Session'ların varsayılanı daemon'un yapılandırma dosyasındadır:

| Host | Yol |
|---|---|
| Linux | `~/.config/nomux/config.toml` |
| macOS | `~/Library/Application Support/nomux/config.toml` |
| Her Host, `XDG_CONFIG_HOME` mutlak bir yolsa | `$XDG_CONFIG_HOME/nomux/config.toml` |

Daemon başka bir yol okumaz. macOS'te `XDG_CONFIG_HOME` ayarlı değilse `~/.config/nomux` içindeki bir dosyanın etkisi olmaz. `nomux daemon status` daemon'un okuduğu yolu yazdırır (yukarıdaki bloğun son satırı). Linux yolu bu çalıştırmanın yoludur; macOS yolu nomux dokümanlarından gelir, çünkü bu sayfa için bir Mac çalışmadı.

```toml
[restore]
default_policy = "on-focus"   # auto | on-focus | manual

[sessions]
ended_retention = "24h"       # a number with the unit s, m, h or d
```

Daemon dosyayı yalnızca açılışta bir kez okur. Geçersiz bir dosya daemon'u durdurmaz: daemon sorunu log'una yazar ve varsayılanları kullanır. Bu iki anahtar, nomux 0.5.0'ın [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/daemon.md#configuration) dosyasından alındı. Dosyanın başka tabloları da var: holder havuzunun `[pool]` tablosu ([Holder havuzu](/docs/tr/guides/holder-pool/)), bellek limitleri için `[sessions]` anahtarları ve hazırda bekletme için `[agents]` tablosu ([Hazırda bekletme ve bellek limiti](/docs/tr/guides/hibernation/#ayarlar)).

## Uykudaki bir Session'ı silmek

Uykudaki bir Session'ın bitirilecek komutu yoktur. `nomux kill` onu çıktısıyla birlikte siler. Bu komuttan önce, nomux process'lerinin ikinci kez durdurulması `ded2ph33` Session'ını yeniden uykuya geçirdi:

```console
$ nomux ls
ID        STATE    PID      COMMAND
7e27dogj  dormant  -        sleep 700
ded2ph33  dormant  -        sh
o6kczknv  running  4188967  sh -c echo server started; exec sleep 600
$ nomux kill ded2ph33
session ded2ph33 ended
$ nomux capture ded2ph33
nomux: no session has the identifier or the name ded2ph33, and no session has a name or an identifier that starts with it
```

Uykudaki bir Session'ı başka hiçbir şey silmez. Journal'ı en fazla 32 MiB dosya tutar.

Komutu bitmiş bir Session ise farklıdır: daemon onu saklama süresi boyunca, varsayılan olarak 24 saat, tutar ve sonra siler. Bunu [hızlı başlangıç](/docs/tr/guides/quick-start/) sayfası gösteriyor.

## Daemon'u oturum açılışında başlatmak

Servis yoksa, yeniden başlatmadan sonraki ilk `nomux` komutu daemon'u başlatır. Yani politikası `auto` olan bir Session oturum açılışında değil, o anda başlar.
Daemon'u oturum açılışında başlatmak için servis dosyasını yazın:

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

`--dry-run` yolu ve içeriği yazdırır, dosyaya bir şey yazmaz. Komut `sudo` istemez ve hiçbir program başlatmaz: dosyayı systemd'ye vermek için çıktısındaki komutu çalıştırın. `systemctl` komutu bu sayfa için çalıştırılmadı.

| Bilgisayar | Dosya | Ardından çalıştırın |
|---|---|---|
| Linux | `~/.config/systemd/user/nomuxd.service` ya da `$XDG_CONFIG_HOME/systemd/user/` altında | `systemctl --user daemon-reload && systemctl --user enable --now nomuxd.service` |
| macOS | `~/Library/LaunchAgents/sh.nomux.nomuxd.plist` | `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/sh.nomux.nomuxd.plist` |

macOS satırı `docs/daemon.md` dosyasından geliyor. nomux dokümanlarına göre launchd agent'ı bir Mac'te yüklenip denenmedi.

- **`KillMode=process`.** Unit durdurulduğunda yalnızca daemon durur, Session'lar devam eder. systemd'nin varsayılanıyla unit'i durdurmak her holder'ı da bitirir.
- **`--replace`.** Servisin daemon'u, daha önce bir komutun başlattığı daemon'un yerini alır. Hiçbir Session bitmez.
- **`Restart=on-failure`.** Çöken daemon yeniden başlar. `nomux daemon stop` ile durdurulan daemon ise durmuş kalır.
- **`nomuxd`'nin yolu** dosyanın içinde yazılıdır. Binary'leri taşırsanız `nomux daemon install-service` komutunu yeniden çalıştırın.
- **Ortam.** Servis yöneticisi daemon'a `TERM` vermez; launchd `LANG` de vermez. Yine de bir Session `TERM`'ü ve UTF-8 karakter kümesini nomux'tan alır. Bir dil vermek için dosyaya `LANG` ekleyin: unit'te `Environment=`, launchd agent'ında `EnvironmentVariables`. Kurallar [Session'ın ortamı](/docs/tr/guides/session-environment/) sayfasında.

Dosyayı kaldırmak için:

```console
$ nomux daemon uninstall-service
removed /home/user/.config/systemd/user/nomuxd.service
The daemon that runs continues. To make the service manager forget the file, run: systemctl --user daemon-reload
```

`uninstall-service` dosya yoksa da 0 çıkış koduyla biter:

```console
$ nomux daemon uninstall-service
no service file: /home/user/.config/systemd/user/nomuxd.service does not exist
```

**Oturumu kapatmak.** systemd, son oturum kapandığında kullanıcı yöneticisini durdurur; onunla birlikte unit'lerinin her process'ini de, yani daemon'u ve holder'ları. `loginctl enable-linger` kullanıcı yöneticisini, dolayısıyla Session'ları, oturum kapandıktan sonra da ayakta tutar. Bu davranış systemd dokümantasyonundan geliyor; nomux dokümanlarına göre test edilmedi.

## Bu sürümün sınırları

- Session'ın process'leri geri gelmez; yalnızca komut yeniden başlar.
- Geri yükleme komuta ilk komutun değil, daemon'un o anda hazırladığı ortamı verir. Attach olan istemci hiçbir değişken vermez: bu eksiği [Session'ın ortamı](/docs/tr/guides/session-environment/) sayfası anlatır.
- Session'ı yeniden başlatan bir attach eski çıktının en fazla 1 MiB'ını gösterir. Journal'ın geri kalanını `nomux capture` yazdırır.
- Biten bir Session'ın komutunu yeniden başlatan bir komut yok; biten bir Session'ı saklama süresi dolmadan silen bir komut da yok.

`start`, `restore-policy`, `capture` ve servis komutları JSON belgeleriyle birlikte [CLI başvurusunda](/docs/tr/reference/cli/). Diskteki dosyaları [Nasıl çalışır](/docs/tr/concepts/how-it-works/) sayfası gösteriyor. Bu sayfadaki terimler [Sözlük](/docs/tr/reference/glossary/)'ten gelir.
