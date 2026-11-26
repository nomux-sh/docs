---
title: Uzak Host'lar
description: Bir sunucuyu SSH ile uzak Host olarak ekleyin, Session'larını --host ile kullanın; nomux'un neyi okuduğunu, neye güvendiğini ve nereye ne yazdığını öğrenin.
---

Uzak Host, SSH ile bağlandığınız bir bilgisayardır: bir sunucu ya da ikinci bir iş istasyonu gibi.
Session'ları o bilgisayarda yaşar: laptop'unuz uykuya geçse de bağlantı kopsa da devam ederler.

nomux'u yalnızca klavyesini kullandığınız bilgisayara kurarsınız. Binary'leri uzak Host'a `nomux host add` koyar.

:::note
Bir sunucuya bağlanan komutlar (`host add`, bir Host'la `host doctor` ve `--host` ile çalışan her komut) bu sayfa için çalıştırılmadı. Adımları ve mesajları nomux 0.3.0'ın [`docs/remote.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/docs/remote.md) ve [`docs/cli.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/docs/cli.md) dosyalarından alındı.
Bağlanmayan komutların çıktısı ise nomux 0.3.0'ın Linux'taki gerçek çıktısıdır: `host ls`, `host rm`, Host'suz `host doctor` ve var olmayan bir adın hataları.
:::

## Uzak Host'ta ne gerekir

- Unix socket'e yönlendirmeye izin veren bir SSH sunucusu. OpenSSH'ın varsayılanları buna izin verir. Bkz. [Sunucu kanalı reddederse](#sunucu-kanalı-reddederse).
- Bir POSIX shell (`sh`) ve standart programları: `uname`, `cat`, `mkdir`, `chmod`, `mv`, `rm`, `ls` ve `id`. Varsa `sha256sum` ya da `shasum` da kullanılır.
- x86_64 ya da aarch64 üzerinde Linux veya macOS.

Host'ta nomux paketi, internet erişimi, `scp` ya da `sftp` gerekmez. Host'taki login shell'iniz başka bir shell olabilir: nomux'un her komutu `sh -c '<script>'` biçimindedir.

## Host eklemek

```sh
nomux host add deploy@vps.example.com --name vps
```

SSH hedefi `[user@]host`, `ssh://[user@]host[:port]` ya da `~/.ssh/config` içindeki bir `Host` adıdır.
`--name` verilmezse ad, hedefin host kısmıdır: `deploy@vps.example.com` için `vps.example.com`. Adda yalnızca `a`-`z`, `A`-`Z`, `0`-`9`, `.`, `_` ve `-` bulunabilir.

`host add` şu adımları izler ve Host'u yalnızca hepsi başarılı olursa kaydeder:

1. **Bağlanır.** Kendi SSH istemcisiyle bağlanır; `ssh` programını çalıştırmaz.
2. **Yoklar.** Tek bir komutla `uname -s` ve `uname -m` çıktısını, home dizininizi ve `~/.nomux/bin/<sürüm>` altında üç binary'nin olup olmadığını öğrenir.
3. **Yalnızca binary'ler yoksa kurar.**
   1. Kendi sürümünün release'inden Host'a uygun arşivi ve `SHA256SUMS` dosyasını sizin bilgisayarınızda indirir ve SHA-256 checksum'ını doğrular. Bunun için bilgisayarınızdaki `curl` ve `tar` komutlarını kullanır.
   2. Her binary'yi `cat > file` ile Host'ta `~/.nomux/bin/` altındaki geçici bir dizine gönderir.
   3. Host'taki her dosyanın SHA-256 checksum'ını kendisindekiyle karşılaştırır.
   4. Host'ta `nomuxd --version` çalıştırır. Başka bir işlemciye ait binary burada hata verir.
   5. Dizinin adını `~/.nomux/bin/<sürüm>` olarak değiştirir. Bu adımdan önceki bir hata geride kurulum bırakmaz.
4. Host'ta daemon çalışmıyorsa **daemon'u başlatır** ve sürümünü sorar.
5. Host'u bilgisayarınızdaki yapılandırma dosyasına **kaydeder**.

Komutu aynı ad ve aynı hedefle yeniden çalıştırabilirsiniz: Host'ta zaten olan hiçbir şeyi kurmaz. Var olan bir adı farklı bir hedefle eklemek hatadır.

| `uname -s` | `uname -m` | Release target'ı |
|---|---|---|
| `Linux` | `x86_64`, `amd64` | `x86_64-unknown-linux-musl` |
| `Linux` | `aarch64`, `arm64` | `aarch64-unknown-linux-musl` |
| `Darwin` | `x86_64` | `x86_64-apple-darwin` |
| `Darwin` | `arm64` | `aarch64-apple-darwin` |

Başka bir sistem hatadır.

### Sonrasında Host'ta ne olur

| Yol | İçerik | Mod |
|---|---|---|
| `~/.nomux/bin/<sürüm>/` | Bir sürümün `nomux`, `nomuxd` ve `nomux-holder` binary'leri | 0700 |
| `~/.nomux/run/` | Daemon'un socket'i, kilidi ve log'u; her Session için bir dizin | 0700, socket 0600 |

Host'taki holder'lar da, sizin bilgisayarınızda olduğu gibi, her Session'ın state'ini Host'un state dizinine yazar. Bunu [Yeniden başlatmadan sonra](/docs/tr/guides/after-a-restart/) sayfası anlatıyor.
nomux Host'ta hiçbir shell başlangıç dosyasına, `PATH`'e ya da servise dokunmaz.
Host'taki daemon yalnızca kendi Unix socket'ini dinler; ağ portu yoktur.

## Host'u kullanmak

Komutun önüne `--host <ad>` yazın:

```sh
nomux --host vps new --attach
nomux --host vps ls
nomux --host vps attach k3xq2abc
nomux --host vps daemon status
```

- Her komut önce Host'ta CLI'ınızın sürümüne ait binary'lerin olduğundan emin olur. Yoksa `host add` gibi kurar ve bununla ilgili tek satırı standart hataya yazar.
- `new --cwd <dizin>` Host'ta mutlak bir yol ister. `--cwd` verilmezse komut Host'taki home dizininizde başlar.
- `ext install <dizin>` Host'ta mutlak bir yol ister.
- `--host`, `host` komutlarıyla ve `daemon install-service` ile `daemon uninstall-service` ile kullanılamaz. `version` CLI'ın sürümünü yazdırır.

Ad yapılandırma dosyasında olmalıdır:

```console
$ nomux --host vps ls
nomux: no host has the name vps. `nomux host ls` shows the hosts, and `nomux host add` adds one
$ nomux --host vps daemon install-service --dry-run
nomux: the --host option cannot be used with this command: run it on the host
```

İlk komut 2, ikincisi 1 çıkış koduyla biter.

### Attach sırasında bağlantı koparsa

Attach yeniden bağlanır ve elinde olmayan çıktıyı alır; böylece hiçbir çıktı eksik kalmaz, hiçbiri iki kez gelmez.
Daemon bu baytları artık tutmuyorsa, yani kesinti sırasında 256 KiB'tan fazla çıktı olduysa, güncel ekranı alırsınız.

- Denemeler arasındaki bekleme 0,25, 0,5, 1, 2, 4 ve sonra 8 saniyedir; toplam 10 deneme, yaklaşık 48 saniye. Ardından attach, nasıl yeniden bağlanacağınızı söyleyen bir hatayla biter.
- Kesinti boyunca terminal penceresinin başlığı `nomux: connection lost, connecting again` olur. nomux Session'ın ekranına bir şey yazmaz.
- Kesinti sırasında bastığınız tuşlar atılır: nomux göremediğiniz bir Session'a yazı yazmaz. Detach tuşları çalışır.

Attach olmayan bir komut tek bir kez bağlanmayı dener. Bağlanamazsa nedenini söyleyerek hata verir.

## nomux `~/.ssh/config` dosyasından neyi okur

nomux `~/.ssh/config` dosyasını OpenSSH'ın kurallarıyla okur: bir seçeneğin ilk değeri geçerlidir, `Host` ve `Match` satırları seçer, `Include` bulunduğu yerde okunur. `/etc/ssh/ssh_config` okunmaz.

| Desteklenen seçenek | Notlar |
|---|---|
| `Host` | `*`, `?` ve `!` içeren desenler |
| `Match` | `all`, `host`, `originalhost`, `user` ve `localuser`; `!` ile de |
| `Include` | Göreli yol `~/.ssh`'a göredir. Yolun son kısmında `*` ve `?` olabilir |
| `HostName` | `%h` ve `%%` ile |
| `User`, `Port` | SSH hedefindeki kullanıcı ve port önce gelir |
| `IdentityFile` | Birden fazla olabilir. `none` hepsini kaldırır |
| `IdentitiesOnly`, `IdentityAgent` | |
| `ProxyJump` | Jump host listesi ya da `none`. Her jump host kendi yapılandırmasını kullanır |
| `UserKnownHostsFile`, `GlobalKnownHostsFile` | Birden fazla dosya olabilir. `none` dosya yok demektir |
| `StrictHostKeyChecking` | Bkz. [Güven kuralları](#güven-kuralları) |
| `HostKeyAlias` | |
| `ConnectTimeout` | Varsayılanı 30 saniye |
| `ServerAliveInterval`, `ServerAliveCountMax` | nomux'un varsayılanları 5 saniye ve 3. OpenSSH varsayılan olarak keepalive göndermez; nomux gönderir, böylece attach bağlantının öldüğünü çabuk anlar |

**Bu seçenekler komutu durdurur.** Host'a bunlardan biri uygulanıyorsa nomux bağlanmaz; mesaj seçeneği, dosyayı ve satırı söyler:

- `none` dışında bir değerle `ProxyCommand`, `CertificateFile`, `PKCS11Provider`, `SecurityKeyProvider` ya da `KnownHostsCommand`.
- `no` ya da `none` dışında bir değerle `CanonicalizeHostname`.
- `BindAddress` ve `BindInterface`.
- `exec`, `canonical`, `final`, `tagged` ya da `localnetwork` içeren `Match`.
- Dizin adında wildcard olan bir `Include` ve `%C` gibi bir token.

Böyle bir Host için nomux'un `ssh` programına geri düşen bir yolu yok.

**Diğer her seçeneği nomux yok sayar.** Örnekler: nomux'un hiç istemediği yönlendirme ve terminal seçenekleri (`ForwardAgent`, `ForwardX11`, `LocalForward`, `RequestTTY`, `RemoteCommand`, `SendEnv`), `ssh` programının seçenekleri (`ControlMaster`, `ControlPath`, `ControlPersist`) ve algoritma listeleri (`Ciphers`, `KexAlgorithms`, `MACs`, `HostKeyAlgorithms`). nomux kendi SSH kütüphanesinin algoritmalarını kullanır; eski bir algoritma isteyen sunucu bağlantıyı reddedebilir.

## Anahtarlar: nomux parola sormaz

nomux'ta parola sorusu yoktur; hiçbir secret saklamaz, hiçbir soru sormaz. Anahtarları şu sırayla dener:

1. ssh-agent'taki her anahtar: `IdentityAgent`'ın ya da `SSH_AUTH_SOCK`'un socket'i. `IdentitiesOnly yes` ile yalnızca bir `IdentityFile`'ın gösterdiği anahtarlar.
2. `IdentityFile`'daki her anahtar dosyası. `IdentityFile` yoksa, varsa `~/.ssh/id_rsa`, `id_ecdsa`, `id_ecdsa_sk`, `id_ed25519` ve `id_ed25519_sk`.

nomux passphrase'li bir anahtar dosyasını okumaz. Böyle bir anahtarı `ssh-add` ile ssh-agent'a ekleyin.
Host hiçbir anahtarı kabul etmezse komut 4 çıkış koduyla biter; mesaj kullanılamayan her anahtarı sayar.

nomux Host'tan hiçbir zaman agent forwarding, SSH bağlantısı için terminal, X11 forwarding ya da TCP port yönlendirmesi istemez. Hiçbir anahtarı ve Session içeriğini log'a yazmaz.

## Güven kuralları

nomux Host'un anahtarını, OpenSSH gibi, known hosts dosyalarıyla karşılaştırır: `~/.ssh/known_hosts`, `~/.ssh/known_hosts2`, `/etc/ssh/ssh_known_hosts` ve `/etc/ssh/ssh_known_hosts2` ya da yapılandırmanın gösterdiği dosyalar.
Hash'lenmiş adlar, desenler ve `@revoked` satırları çalışır. nomux host sertifikası kullanmadığı için `@cert-authority` satırlarını yok sayar.

| Dosyalarda | `StrictHostKeyChecking yes` ya da `ask` (varsayılan) | `accept-new`, `no` ya da `off` |
|---|---|---|
| Host'un gönderdiği anahtar | Bağlan | Bağlan |
| Host için o türde anahtar yok | Hata | Anahtarı ilk dosyanıza ekle, sonra bağlan |
| Host için o türde başka bir anahtar | Hata | Hata |
| Anahtar bir `@revoked` satırında | Hata | Hata |

- nomux soru sormadığı için `ask`, `yes` ile aynıdır.
- Değişmiş bir anahtar her değerde hatadır.

**Bilinmeyen anahtar.** Mesajda parmak izi ve anahtarı ekleyen OpenSSH komutu vardır. Metin `docs/remote.md` dosyasından:

```text
nomux: the host key of vps.example.com is not known. The host sent the ssh-ed25519 key with the fingerprint SHA256:... If the fingerprint is correct, run `ssh -o HostKeyAlgorithms=ssh-ed25519 'deploy@vps.example.com' exit` and answer `yes`, then run nomux again
```

`ssh`'ın gösterdiği parmak izini Host'un yöneticisinin size verdiğiyle karşılaştırın, sonra nomux'u yeniden çalıştırın.

**Değişmiş anahtar.** nomux bağlanmaz. Mesaj eski anahtarın bulunduğu dosyayı ve satırı söyler, eski anahtarı silen `ssh-keygen -R` komutunu da verir. Bu komutu yalnızca Host'un gerçekten yeni bir anahtarı olduğunu biliyorsanız çalıştırın.

## Sunucu kanalı reddederse

nomux isteklerini daemon'un Unix socket'ine giden bir SSH kanalından (`direct-streamlocal`) gönderir. Sunucu bu kanalı şu durumlarda reddeder:

- `sshd_config` dosyasında `AllowStreamLocalForwarding no` ya da `remote`, veya `DisableForwarding yes` varsa,
- `authorized_keys` içindeki anahtarda `restrict` ya da `no-port-forwarding` varsa.

`AllowTcpForwarding no` bunu etkilemez. Böyle bir sunucuda nomux bu seçenekleri sayan bir mesajla hata verir. nomux 0.3.0'da bu sunucular için ikinci bir yol yok.

## Host'u kontrol etmek

`nomux host doctor <ad>` tek bir Host'u, `nomux host doctor` ise yapılandırma dosyasındaki her Host'u kontrol eder. Komut Host'ta hiçbir şeyi değiştirmez: bir şey kurmaz, daemon başlatmaz.

| Kontrol | Geçer, eğer |
|---|---|
| `connection` | SSH bağlantısı, host anahtarı ve kimlik doğrulama doğruysa |
| `platform` | nomux'un Host'un sistemi ve işlemcisi için binary'si varsa |
| `binaries` | Host'ta CLI'ın sürümüne ait binary'ler varsa |
| `permissions` | `~/.nomux`, `~/.nomux/bin`, `~/.nomux/run` ve socket size aitse, ilk ikisine başka kullanıcılar yazamıyorsa ve son ikisine başka kullanıcıların erişimi yoksa |
| `daemon` | Bir daemon cevap veriyorsa ya da hiç daemon çalışmıyorsa. SSH sunucusu socket'e giden kanalı reddederse geçmez |
| `versions` | CLI ile daemon'un ortak bir protokol sürümü varsa. Yalnızca bir daemon cevap verdiğinde |

Bir hatadan sonra çalışamayan kontrol çıktıda yer almaz. Her kontrol geçerse çıkış kodu 0, biri geçmezse 1'dir. Geçmeyen kontrolde `FAIL`, nedeni ve ne yapılacağı yazar.

Yapılandırma dosyasında Host yokken:

```console
$ nomux host doctor
no hosts
$ nomux host doctor vps
nomux: no host has the name vps. `nomux host ls` shows the hosts, and `nomux host add` adds one
```

## Yapılandırma dosyası

`host add` Host'u bilgisayarınıza kaydeder:

```toml
[hosts.vps]
ssh = "deploy@vps.example.com"
```

| Bilgisayar | Yol |
|---|---|
| `XDG_CONFIG_HOME` mutlak bir yolsa | `$XDG_CONFIG_HOME/nomux/config.toml` |
| Linux | `~/.config/nomux/config.toml` |
| macOS | `~/Library/Application Support/nomux/config.toml` |

nomux dosyayı yazarken diğer her kısmını, yorumlar dahil, korur. Dosyayı 0600 moduyla yazar.

`host ls` ve `host rm` yalnızca bu dosyayı okur ve değiştirir; hiçbir Host'a bağlanmaz. Bu çalıştırmada dosyada elle yazılmış yukarıdaki içerik vardı:

```console
$ nomux host ls
NAME  SSH
vps   deploy@vps.example.com
$ nomux host rm vps
host vps removed
$ nomux host ls
no hosts
$ nomux host rm vps
nomux: no host has the name vps
```

Son komut 2 çıkış koduyla biter.

## nomux'u bir Host'tan kaldırmak

```sh
nomux --host vps daemon stop      # the Sessions continue until they end
ssh deploy@vps.example.com 'rm -rf ~/.nomux ~/.local/state/nomux'   # after each Session ended
nomux host rm vps                 # on your computer
```

`~/.local/state/nomux`, Linux bir Host'taki state dizinidir. macOS bir Host'ta bu dizin `~/Library/Application Support/nomux`'tur ve o Host'un extension'ları da oradadır.
Eski bir sürüm siz silene kadar `~/.nomux/bin` altında kalır. Bir sürümü yalnızca onun holder'ını kullanan Session kalmadığında silin.

## Bu sürümün sınırları

Bu maddeler [`docs/remote.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/docs/remote.md#open-points-for-the-next-versions) dosyasının açık noktalarından:

- Socket'e giden kanalı reddeden sunucular için ikinci bir yol yok.
- nomux'un SSH istemcisinin desteklemediği bir seçenek için `ssh` programına geri düşme yok.
- Host'un cevabından önce local echo yok: gidiş-dönüş süresi uzun bir bağlantıda tuş bir gidiş-dönüş sonra görünür.
- Host sertifikası ve kullanıcı sertifikası yok.
- `~/.nomux/bin` altındaki eski sürümler silinmez.
- Uzak Host'taki bir Session, `sshd`'nin bir komuta verdiği ortamı alır: login shell'in başlangıç dosyaları okunmaz.
- `/etc/ssh/ssh_config` okunmaz.
- QUIC taşıması, port yönlendirme ve dosya aktarımı yok.

Host'ta `systemd-logind` yapılandırmasında `KillUserProcesses=yes` varsa oturumu kapatmak daemon'u ve Session'ları durdurur.

Her `host` komutu JSON belgesiyle birlikte [CLI başvurusunda](/docs/tr/reference/cli/). Bu sayfadaki terimler [Sözlük](/docs/tr/reference/glossary/)'ten gelir.
