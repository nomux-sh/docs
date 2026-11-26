---
title: Yeniden başlatmadan sonra
description: Host yeniden başladığında Session'lara ne olur, uykudaki bir Session nasıl yeniden başlar, geri yükleme politikaları, servis dosyası ve neyin geri gelip neyin gelmediği.
---

Host yeniden başladığında her process durur; her holder ve her Session'ın komutu da buna dahil.
nomux her Session'ın tanımını ve çıktısını diskte tutar. Bu yüzden yeniden başlatmadan sonra `nomux ls` her Session'ı **dormant** (uykuda) olarak gösterir ve tek bir komut onu yeniden başlatır.

Bu sayfadaki çıktılar, nomux 0.3.0'ın Linux'taki tek bir çalıştırmasının gerçek çıktısıdır. Bu çalıştırmada bilgisayar yeniden başlatılmadı: geçici bir home dizinindeki her nomux process'i `kill -9` ile durduruldu. Yeniden başlatma da bu process'lere tam olarak bunu yapar. Sizin session kimlikleriniz ve process ID'leriniz farklı olacaktır.

## Ne geri gelir, ne gelmez

| Yeniden başlatmadan sonra | Geri gelir mi |
|---|---|
| Session, kimliği ve `nomux ls`'teki yeri | Evet |
| Komut, argümanları, çalışma dizini ve pencere boyutu | Evet: geri yükleme aynı komutu aynı yerde başlatır |
| Yeniden başlatmadan önceki çıktı | Evet: diskteki journal'da durur. Attach sonunu gösterir, `nomux capture` tamamını yazdırır |
| Session'ın geri yükleme politikası | Evet |
| Session'ın process'leri: shell, içinde çalışan programlar, onların belleği | **Hayır.** Yeni komut sıfırdan başlar |
| Komutun ortam değişkenleri | **Hayır.** Yeni komut, geri yükleme anındaki daemon'un ortamını alır. Ortamda secret olabileceği için nomux onu saklamaz |
| Durmadan önceki son saniyenin çıktısı | Belki gelmez. Holder çıktıyı en geç 1 saniye içinde diske yazar. Elektrik kesilirse kernel'in henüz diske yazmadığı veri de kaybolabilir |

Kendi işine devam edebilen bir program, örneğin resume komutu olan bir agent, bunu geri yüklemeden sonra kendisi yapmalıdır.

## Yeniden başlatmadan önce

Bu çalıştırmada üç Session var: bir shell, bir sunucu ve kendiliğinden yeniden başlamaması gereken bir komut.

```console
$ nomux new --cwd project -- sh
4actd3we
$ nomux attach 4actd3we
sh-5.3$ echo written before the restart
written before the restart
sh-5.3$
detached from session 4actd3we
$ nomux new -- sh -c 'echo server started; exec sleep 600'
sqkjxrqa
$ nomux new -- sleep 700
wjzdelno
```

Her Session'ın bir [geri yükleme politikası](#geri-yükleme-politikaları) vardır; varsayılanı `on-focus`'tur. Burada sunucuya `auto`, son komuta `manual` veriliyor:

```console
$ nomux restore-policy sqkjxrqa auto
session sqkjxrqa has the restore policy auto
$ nomux restore-policy wjzdelno manual
session wjzdelno has the restore policy manual
$ nomux ls
ID        STATE    PID      COMMAND
4actd3we  running  2624341  sh
sqkjxrqa  running  2624364  sh -c echo server started; exec sleep 600
wjzdelno  running  2624370  sleep 700
```

## Yeniden başlatmadan sonra

Şu an hiçbir nomux process'i çalışmıyor. İlk komut daemon'u başlatır, daemon da state dizinini okur:

```console
$ nomux ls
ID        STATE    PID      COMMAND
4actd3we  dormant  -        sh
sqkjxrqa  running  2624402  sh -c echo server started; exec sleep 600
wjzdelno  dormant  -        sleep 700
```

- `4actd3we` ve `wjzdelno` uykuda. Hiçbir process'leri çalışmıyor, `PID` sütunu `-`.
- `sqkjxrqa`'nın politikası `auto` olduğu için daemon kendi açılışında onun komutunu yeniden başlattı. Yeni bir process ID'si var.

Uykudaki bir Session'ın çıktısı diskte durur. `nomux capture` onu geri yükleme yapmadan yazdırır:

```console
$ nomux capture 4actd3we --lines 2
written before the restart
sh-5.3$
```

Gerçek çıktıda shell prompt'unun escape sequence'leri de var. Bunları [hızlı başlangıç](/docs/tr/guides/quick-start/) sayfası açıklıyor.

## Uykudaki bir Session'ı yeniden başlatmak

**Attach ile.** `nomux attach` komutu yeniden başlatır ve Session'a bağlanır. Komut terminalinizin pencere boyutunu alır. Terminal önce eski çıktının sonunu, sonra nomux'un bir satırını, ardından yeni komutu gösterir:

```console
$ nomux attach 4actd3we
sh-5.3$ echo written before the restart
written before the restart
sh-5.3$
--- nomux: the session started again. The output before this line is from the command that stopped ---

sh-5.3$ echo typed after the restart
typed after the restart
sh-5.3$
detached from session 4actd3we
```

Gerçek çalıştırmada nomux'un satırıyla yeni prompt arasında boş satırlar vardı: eski çıktı ve o satır terminalinizin scrollback'ine kayar, yeni shell ekranını onların altına çizer. Örnekte tek boş satır gösteriliyor.
Yeni shell yeni bir process'tir; yeniden başlatmadan önce yazdığınız komutlardan haberi yoktur.

**Attach olmadan.** `nomux start` komutu Session'ın son pencere boyutuyla yeniden başlatır. Politikası `manual` olan bir Session yalnızca bu yolla başlar:

```console
$ nomux attach wjzdelno
nomux: session wjzdelno is dormant and its restore policy is manual: run `nomux start wjzdelno`
$ nomux start wjzdelno
session wjzdelno runs
$ nomux ls
ID        STATE    PID      COMMAND
4actd3we  running  2624414  sh
sqkjxrqa  running  2624402  sh -c echo server started; exec sleep 600
wjzdelno  running  2624410  sleep 700
```

`manual` bir Session'a `attach` 1 çıkış koduyla biter. Komutu zaten çalışan bir Session için `nomux start` başarılı olur ve hiçbir şeyi değiştirmez.

Komut başlayamazsa, örneğin çalışma dizini silinmişse, komut 1 çıkış koduyla hata verir ve Session uykuda kalır.

`capture` artık komutun iki çalışmasının, eskisinin ve yenisinin, çıktısını birlikte yazdırır:

```console
$ nomux capture 4actd3we
sh-5.3$ echo written before the restart
written before the restart
sh-5.3$ sh-5.3$ echo typed after the restart
typed after the restart
sh-5.3$
```

## Geri yükleme politikaları

| Politika | Daemon komutu ne zaman yeniden başlatır |
|---|---|
| `auto` | Daemon başlarken, örneğin oturum açılışında. Dev server ya da watcher için kullanın |
| `on-focus` | İlk `nomux attach` ya da `nomux start` ile. Varsayılan budur |
| `manual` | Yalnızca `nomux start` ile. `nomux attach` 1 çıkış koduyla hata verir |

- `nomux restore-policy <id> <politika>` tek bir Session'ın politikasını ayarlar. Hem çalışan hem uykudaki Session'da çalışır.
- `auto` yalnızca daemon başlarken uygulanır. Daemon çalışırken uykuya geçen bir Session bir istemcinin gelmesini bekler.
- `nomux ls --json` her Session'ın politikasını `restore_policy` alanında gösterir.

Kendi politikası olmayan Session'ların varsayılanı yapılandırma dosyasındadır; Linux'ta `~/.config/nomux/config.toml`:

```toml
[restore]
default_policy = "on-focus"   # auto | on-focus | manual

[sessions]
ended_retention = "24h"       # a number with the unit s, m, h or d
```

Daemon dosyayı yalnızca açılışta bir kez okur. Geçersiz bir dosya daemon'u durdurmaz: daemon sorunu log'una yazar ve varsayılanları kullanır. Bu iki anahtar [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/docs/daemon.md#configuration) dosyasından alındı; bu sayfa için değiştirilip denenmedi.

## Uykudaki bir Session'ı silmek

Uykudaki bir Session'ın bitirilecek komutu yoktur. `nomux kill` onu çıktısıyla birlikte siler:

```console
$ nomux kill wjzdelno
session wjzdelno ended
$ nomux capture wjzdelno
nomux: no session has the identifier wjzdelno
```

Uykudaki bir Session'ı başka hiçbir şey silmez. Journal'ı en fazla 32 MiB dosya tutar.

Komutu bitmiş bir Session ise farklıdır: daemon onu saklama süresi boyunca, varsayılan olarak 24 saat, tutar ve sonra siler. Bunu [hızlı başlangıç](/docs/tr/guides/quick-start/) sayfası gösteriyor.

## Daemon'u oturum açılışında başlatmak

Servis yoksa, yeniden başlatmadan sonraki ilk `nomux` komutu daemon'u başlatır. Yani politikası `auto` olan bir Session oturum açılışında değil, o anda başlar.
Daemon'u oturum açılışında başlatmak için servis dosyasını yazın:

```console
$ nomux daemon install-service --dry-run
# /tmp/nomux-demo/.config/systemd/user/nomuxd.service
[Unit]
Description=nomux daemon
Documentation=https://nomux.sh

[Service]
ExecStart="/tmp/nomux-demo/.local/bin/nomuxd" --replace
KillMode=process
Restart=on-failure

[Install]
WantedBy=default.target
$ nomux daemon install-service
wrote /tmp/nomux-demo/.config/systemd/user/nomuxd.service
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

Dosyayı kaldırmak için:

```console
$ nomux daemon uninstall-service
removed /tmp/nomux-demo/.config/systemd/user/nomuxd.service
The daemon that runs continues. To make the service manager forget the file, run: systemctl --user daemon-reload
```

`uninstall-service` dosya yoksa da 0 çıkış koduyla biter.

**Oturumu kapatmak.** systemd, son oturum kapandığında kullanıcı yöneticisini durdurur; onunla birlikte unit'lerinin her process'ini de, yani daemon'u ve holder'ları. `loginctl enable-linger` kullanıcı yöneticisini, dolayısıyla Session'ları, oturum kapandıktan sonra da ayakta tutar. Bu davranış systemd dokümantasyonundan geliyor; nomux dokümanlarına göre test edilmedi.

## Bu sürümün sınırları

- Session'ın process'leri geri gelmez; yalnızca komut yeniden başlar.
- Geri yükleme komuta ilk komutun değil, daemon'un ortamını verir.
- Session'ı yeniden başlatan bir attach eski çıktının en fazla 1 MiB'ını gösterir. Journal'ın geri kalanını `nomux capture` yazdırır.
- Biten bir Session'ın komutunu yeniden başlatan bir komut yok; biten bir Session'ı saklama süresi dolmadan silen bir komut da yok.

`start`, `restore-policy`, `capture` ve servis komutları JSON belgeleriyle birlikte [CLI başvurusunda](/docs/tr/reference/cli/). Diskteki dosyaları [Nasıl çalışır](/docs/tr/concepts/how-it-works/) sayfası gösteriyor. Bu sayfadaki terimler [Sözlük](/docs/tr/reference/glossary/)'ten gelir.
