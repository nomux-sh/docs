---
title: Uzak Host'lar
description: Bir sunucuyu SSH ile uzak Host olarak ekleyin, Session'larını --host ile kullanın; nomux'un neyi okuduğunu, neye güvendiğini ve nereye ne yazdığını öğrenin.
---

Uzak Host, SSH ile bağlandığınız bir bilgisayardır: bir sunucu ya da ikinci bir iş istasyonu gibi.
Session'ları o bilgisayarda yaşar: laptop'unuz uykuya geçse de bağlantı kopsa da devam ederler.

nomux'u yalnızca klavyesini kullandığınız bilgisayara kurarsınız. Binary'leri uzak Host'a `nomux host add` koyar.

:::note
**Bu sayfa için ne çalıştırıldı.** Örneklerdeki Host, aynı Linux bilgisayardaki ikinci bir OpenSSH `sshd`'dir. Kendi portunu, kendi host anahtarını ve kendi kullanıcı anahtarını kullandı; Session'larına ayrı bir home dizini verdi. nomux 0.5.0 ona SSH ile, `~/.ssh/config` içindeki `vps` adlı bir `Host` girdisiyle bağlandı. Çıktılarda gerçek değerlerin yerine `deploy@vps.example.com`, 22 numaralı port ve `/home/deploy` home dizini görünür.
Şu komutlar çalıştı: `host add` (release arşivinin indirilmesiyle), `host ls`, `host rm`, `host doctor`, `new`, `ls`, `status`, `send`, `capture`, `kill`, `daemon status`, `daemon stop` ve `ext` ile `--host`, Host'un daemon'u değiştirilirken bir attach, kanalı reddeden bir sunucu ve `--host` kullanamayan komutlar.
Şunlar çalışmadı: ikinci bir bilgisayardaki Host, macOS ya da ARM64 Host, yavaş bir bağlantı, parolalı bir anahtar, `ProxyJump`, değişmiş bir host anahtarı, `~/.ssh/config` içinde komutu durduran seçenekler ve istemciyle ortak protokol sürümü olmayan bir daemon'un değiştirilmesi. Bunların satırları nomux 0.5.0'ın [`docs/remote.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/remote.md), [`docs/cli.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/cli.md) ve [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/daemon.md) dosyalarından gelir.
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

Çalıştırmadaki ilk `host add` bu oldu. Host anahtarı bilinmiyordu; bu yüzden komut durdu ve ne yapılacağını söyledi. Parmak izi, çalıştırmadaki SSH sunucusunun parmak izidir:

```console
$ nomux host add vps
nomux: the host key of vps.example.com is not known. The host sent the ssh-ed25519 key with the fingerprint SHA256:UYdsWSeDf9G83x/lrT1v7m38J3MLhsKDlru4dLpczN0. If the fingerprint is correct, run `ssh -o HostKeyAlgorithms=ssh-ed25519 'vps' exit` and answer `yes`, then run nomux again
$ ssh -o HostKeyAlgorithms=ssh-ed25519 vps exit
Warning: Permanently added 'vps.example.com' (ED25519) to the list of known hosts.
$ nomux host add vps
nomux: downloading https://github.com/nomux-sh/nomux/releases/download/v0.5.0/nomux-0.5.0-x86_64-unknown-linux-musl.tar.gz
nomux: installing nomux 0.5.0 for x86_64-unknown-linux-musl on the host (8761 KiB)
host vps added: Linux x86_64, nomux in ~/.nomux/bin/0.5.0 (installed), nomuxd 0.5.0 runs: process ID 4161064, 0 sessions
memory limit: the operating system applies no limit (the daemon cannot reach the systemd user manager: it has no DBUS_SESSION_BUS_ADDRESS and no $XDG_RUNTIME_DIR/bus); a limit is a threshold for the hibernation of an idle agent session
```

İkinci komutta gösterilen satır, çalıştırmada `ssh`'in yazdığı gerçek satırdır. Çalıştırmada `host add`'in tamamı yaklaşık 1,5 saniye sürdü. İkinci bir `host add vps` hiçbir şey kurmaz: `(installed)` yerine `(already there)` der.

Son satır nomux 0.5.0'da yenidir. Host'taki daemon, işletim sisteminin Session'lara bir [bellek limiti](/docs/tr/guides/session-memory/) uygulayıp uygulayamayacağını söyler. Çalıştırmadaki SSH oturumunda systemd kullanıcı yöneticisi yoktu (`DBUS_SESSION_BUS_ADDRESS` ve `$XDG_RUNTIME_DIR/bus` eksikti); bu yüzden limit yalnızca boştaki bir agent Session'ının [hazırda bekletilmesi](/docs/tr/guides/hibernation/) için bir eşiktir. SSH girişiniz için bir kullanıcı yöneticisi olan bir Host'ta satır `the kernel ends the processes of a session at its limit: a systemd user scope with MemoryMax` der.

### Sonrasında Host'ta ne olur

| Yol | İçerik | Mod |
|---|---|---|
| `~/.nomux/bin/<sürüm>/` | Bir sürümün `nomux`, `nomuxd` ve `nomux-holder` binary'leri | 0700 |
| `~/.nomux/run/` | Daemon'un socket'i, kilidi ve log'u; her Session için bir dizin. `.pool` uzantılı dizin havuzdaki bir holder'dır | 0700, socket 0600 |

Çalıştırmadan sonra `~/.nomux` altında şu yollar vardı: üç binary'li `bin/0.5.0/` ve `run/`; içinde `nomuxd.sock`, `nomuxd.lock`, `nomuxd.log`, `pool` dizini ve havuzdaki her holder için bir `<id>.pool` dizini.

Host'taki holder'lar da, sizin bilgisayarınızda olduğu gibi, her Session'ın state'ini Host'un state dizinine yazar. Bunu [Yeniden başlatmadan sonra](/docs/tr/guides/after-a-restart/) sayfası anlatıyor.
nomux Host'ta hiçbir shell başlangıç dosyasına, `PATH`'e ya da servise dokunmaz.
Host'taki daemon yalnızca kendi Unix socket'ini dinler; ağ portu yoktur.
Host'taki daemon, bilgisayarınızdaki daemon'un aynısıdır. [Holder havuzunu](/docs/tr/guides/holder-pool/) ilk istekte başlatır; havuzdaki bir holder, Host'ta kullanıcınıza ait bir process'tir.
Host'un home dizini uzunsa `~/.nomux/run` altındaki socket yolu çok uzun olabilir. O zaman daemon ve istemci dizine giden `/tmp/nomux-<hash>` kısa bağlantısını kullanır; istemci onu yoklamanın öğrendiği home dizininden hesaplar: [Uzun home yolları](/docs/tr/guides/long-home-paths/).

## Host'u kullanmak

Komutun önüne `--host <ad>` yazın:

```sh
nomux --host vps new --attach
nomux --host vps ls
nomux --host vps attach k3xq2abc
nomux --host vps daemon status
```

Çalıştırmadaki Host'la kısa bir oturum:

```console
$ nomux --host vps daemon status
nomuxd 0.5.0 runs: process ID 4161064, 0 sessions
memory limit: the operating system applies no limit (the daemon cannot reach the systemd user manager: it has no DBUS_SESSION_BUS_ADDRESS and no $XDG_RUNTIME_DIR/bus); a limit is a threshold for the hibernation of an idle agent session
$ nomux --host vps new -n web
gfo7fn3d
$ nomux --host vps ls
ID        NAME  STATE    PID      COMMAND
gfo7fn3d  web   running  4161066  /bin/bash
$ nomux --host vps status
  SESSION  COMMAND    STATE  FOR  MESSAGE
  web      /bin/bash  idle   1s
```

[Session'lar](/docs/tr/guides/sessions/) sayfası Session komutlarını anlatır; [Agent durumu](/docs/tr/guides/agent-status/) bir Host'taki Session'ların durumunu gösterir. [Hazırda bekleyen bir Session](/docs/tr/guides/hibernation/) de Host'ta yaşar.

- Her komut önce Host'ta CLI'ınızın sürümüne ait binary'lerin olduğundan emin olur. Yoksa `host add` gibi kurar ve bununla ilgili tek satırı standart hataya yazar.
- `new --cwd <dizin>` Host'ta mutlak bir yol ister. `--cwd` verilmezse komut Host'taki home dizininizde başlar.
- `ext install <dizin>` Host'ta mutlak bir yol ister. Dizin Host'tadır, sizin bilgisayarınızda değil. Çalıştırmada `nomux --host vps ext install /path/to/package` bir extension kurdu; `ext ls` ve `ext rm` çalıştı. `ext validate` her zaman kendi bilgisayarınızdaki bir dizini okur.
- `ls --memory` Host'taki process'lerin belleğini gösterir, çünkü onları Host'taki daemon ölçer.
- `--host`, `host` komutlarıyla, `daemon install-service` ile `daemon uninstall-service` ile, `status set` ile ve `hooks` komutlarıyla kullanılamaz. `version` CLI'ın sürümünü yazdırır.

Ad yapılandırma dosyasında olmalıdır:

```console
$ nomux --host vps ls
nomux: no host has the name vps. `nomux host ls` shows the hosts, and `nomux host add` adds one
$ nomux --host vps daemon install-service --dry-run
nomux: the --host option cannot be used with this command: run it on the host
```

İlk komut 2, ikincisi 1 çıkış koduyla biter. Kendi bilgisayarınızda iş gören iki komut da aynı şekilde, 1 çıkış koduyla hata verir:

```console
$ nomux --host vps status set working
nomux: the --host option cannot be used with `status set`: the session is on the host of this process
$ nomux --host vps hooks status
nomux: the --host option cannot be used with a `hooks` command: the settings file of a tool is on its own computer, thus run the command there
```

### Attach sırasında bağlantı koparsa

Attach yeniden bağlanır ve elinde olmayan çıktıyı alır; böylece hiçbir çıktı eksik kalmaz, hiçbiri iki kez gelmez.
Daemon bu baytları artık tutmuyorsa, yani kesinti sırasında 256 KiB'tan fazla çıktı olduysa, güncel ekranı alırsınız.

- Denemeler arasındaki bekleme 0,25, 0,5, 1, 2, 4 ve sonra 8 saniyedir; toplam 10 deneme, yaklaşık 48 saniye. Ardından attach, nasıl yeniden bağlanacağınızı söyleyen bir hatayla biter.
- Kesinti boyunca terminal penceresinin başlığı `nomux: connection lost, connecting again` olur. nomux Session'ın ekranına bir şey yazmaz.
- Kesinti sırasında bastığınız tuşlar atılır: nomux göremediğiniz bir Session'a yazı yazmaz. Detach tuşları çalışır.

Attach olmayan bir komut tek bir kez bağlanmayı dener. Bağlanamazsa nedenini söyleyerek hata verir.

### Host'un daemon'u değiştirilirse

Daemon ile istemcinin ortak bir protokol sürümü olmadığında istemci Host'un daemon'unu değiştirir (`nomuxd --replace`). İlk daemon başlattığı istekleri cevaplar, socket'ini siler ve biter. Hiçbir Session bitmez: bir holder asla değiştirilmez.

nomux 0.5.0 bu adıma bir kural ekler: ilk daemon'un cevaplamadığı bir bağlantı kapanır ve istemci, yeni daemon cevap verene kadar yeniden bağlanır. Bu sayfa bu kuralı çalıştırmadı, çünkü istemciyle ortak protokol sürümü olmayan bir daemon gerekir.

Bir attach, değiştirilmeye dayanmaz. Çalıştırmada CLI `web` Session'ına attach olmuşken Host'ta `nomuxd --detach --replace` çalıştı. Terminal penceresinin başlığı `nomux: connection lost, connecting again` oldu, sonra attach şu mesajla ve 1 çıkış koduyla bitti:

```text
nomux: the daemon stopped. The session continues: run `nomux --host vps attach web` to attach again
```

Session devam etti ve önceki çıktısı yerindeydi. Yeniden attach olun, yeni daemon'a bağlanırsınız.

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

`AllowTcpForwarding no` bunu etkilemez. Böyle bir sunucuda nomux bu seçenekleri sayan bir mesajla hata verir. nomux 0.5.0'da bu sunucular için ikinci bir yol yok. Çalıştırmada ikinci bir `sshd`'de `AllowStreamLocalForwarding no` vardı. `host add` bu mesajla durdu ve `host doctor` aynı metni başarısız `daemon` kontrolü olarak gösterdi:

```console
$ nomux host add locked
nomux: the SSH server refuses connections to Unix sockets. nomux needs them to reach its daemon. On the host, `AllowStreamLocalForwarding` must permit `local` (the default is `yes`) and `DisableForwarding` must be `no` in `sshd_config`, and the key in `authorized_keys` must not have `restrict` or `no-port-forwarding`
```

Kanal Host'taki `~/.nomux/run/nomuxd.sock` socket'ine ya da uzun bir home dizininin kısa bağlantısındaki socket'e gider.

## Uzak Host'ta Session ortamı

Uzak Host'taki bir Session, o Host'un daemon'unun hazırladığı ortamı alır. Klavyesini kullandığınız bilgisayardan hiçbir şey gelmez.

- Host'taki daemon ortamını `sshd`'den almıştır: bir komutun ortamı; login shell'in başlangıç dosyaları yoktur.
- nomux `TERM=xterm-256color` ve `COLORTERM=truecolor` ekler; daemon'da locale yoksa UTF-8 karakter kümesini ekler; ayrıca `NOMUX_SESSION_ID`, `NOMUX_SOCK` ve `NOMUX_TOKEN` değişkenlerini ekler.
- Çalıştırmada Host'taki bir Session'ın shell'inde şu değişkenler vardı: `COLORTERM`, `HOME`, `LC_CTYPE`, `LOGNAME`, `MAIL`, `NOMUX_SESSION_ID`, `NOMUX_SOCK`, `NOMUX_TOKEN`, `PATH`, `PWD`, `SHELL`, `SHLVL`, `SSH_CLIENT`, `SSH_CONNECTION`, `TERM` ve `USER`. `SSH_CLIENT` ve `SSH_CONNECTION` `sshd`'den gelir; `LC_CTYPE`, nomux'un eklediği UTF-8 karakter kümesidir.
- Bilgisayarınızdaki değişkenler, örneğin `LANG`, `DISPLAY` ve `SSH_AUTH_SOCK`, geçmez. Bu eksik [75 numaralı issue'da](https://github.com/nomux-sh/nomux/issues/75) duruyor.

Kuralın tamamı [Session'ın ortamı](/docs/tr/guides/session-environment/) sayfasında.

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
| `memory-limit` | Her zaman geçer. Host'un işletim sisteminin Session'lara bellek limiti uygulayıp uygulamadığını söyler: bkz. [Session'ların belleği](/docs/tr/guides/session-memory/) |

Bir hatadan sonra çalışamayan kontrol çıktıda yer almaz. Her kontrol geçerse çıkış kodu 0, biri geçmezse 1'dir. Geçmeyen kontrolde `FAIL`, nedeni ve ne yapılacağı yazar.

Çalıştırmadaki Host için çıktı:

```console
$ nomux host doctor vps
vps
  ok    connection    deploy@vps.example.com port 22, host key ssh-ed25519 SHA256:UYdsWSeDf9G83x/lrT1v7m38J3MLhsKDlru4dLpczN0
  ok    platform      Linux x86_64: x86_64-unknown-linux-musl
  ok    binaries      nomux 0.5.0 is in ~/.nomux/bin/0.5.0
  ok    permissions   private to the user: ~/.nomux drwx------, ~/.nomux/bin drwx------, ~/.nomux/run drwx------, ~/.nomux/run/nomuxd.sock srw-------
  ok    daemon        nomuxd 0.5.0 runs: process ID 4161064, 0 sessions
  ok    versions      the client and the daemon have the version 0.5.0
  ok    memory-limit  the operating system applies no limit (the daemon cannot reach the systemd user manager: it has no DBUS_SESSION_BUS_ADDRESS and no $XDG_RUNTIME_DIR/bus); a limit is a threshold for the hibernation of an idle agent session
```

nomux 0.5.0'ın [CLI dokümanındaki](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/cli.md#host-doctor) kontrol listesinde `memory-limit` yok; ama komut onu yazdırır ve [bellek dokümanı](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/memory.md) onu anlatır.

Yapılandırma dosyasında Host yokken:

```console
$ nomux host doctor
no hosts
$ nomux host doctor vps
nomux: no host has the name vps. `nomux host ls` shows the hosts, and `nomux host add` adds one
```

## Yapılandırma dosyası

`host add` Host'u bilgisayarınıza kaydeder. Çalıştırmadaki Host `vps` adlı `Host` girdisiyle eklendi; bu yüzden dosya şu içeriğe sahip:

```toml
[hosts.vps]
ssh = "vps"
```

`nomux host add deploy@vps.example.com --name vps` ile satır `ssh = "deploy@vps.example.com"` olur.

| Bilgisayar | Yol |
|---|---|
| `XDG_CONFIG_HOME` mutlak bir yolsa | `$XDG_CONFIG_HOME/nomux/config.toml` |
| Linux | `~/.config/nomux/config.toml` |
| macOS | `~/Library/Application Support/nomux/config.toml` |

nomux dosyayı yazarken diğer her kısmını, yorumlar dahil, korur. Dosyayı 0600 moduyla yazar.

Daemon aynı dosyayı, başlarken bir kez okur. Başka bir yol okumaz. macOS'ta `XDG_CONFIG_HOME` ayarlı değilse `~/.config/nomux` altındaki bir dosyanın etkisi yoktur. Göreli bir `XDG_CONFIG_HOME` yok sayılır. `nomux daemon status` dosyanın yolunu gösterir. Linux'taki çalıştırmada `~/.config/nomux/config.toml` gösterdi; `XDG_CONFIG_HOME=/tmp/xdgtest` ile `/tmp/xdgtest/nomux/config.toml` gösterdi. macOS dosyasının yolu [daemon dokümanından](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/daemon.md#configuration) gelir: bu sayfa onu macOS'ta çalıştırmadı.

`host ls` ve `host rm` yalnızca bu dosyayı okur ve değiştirir; hiçbir Host'a bağlanmaz:

```console
$ nomux host ls
NAME  SSH
vps   vps
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

Bu maddeler nomux 0.5.0'ın [`docs/remote.md`](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/remote.md#open-points-for-the-next-versions) dosyasının açık noktalarından:

- Socket'e giden kanalı reddeden sunucular için ikinci bir yol yok.
- nomux'un SSH istemcisinin desteklemediği bir seçenek için `ssh` programına geri düşme yok.
- Host'un cevabından önce local echo yok: gidiş-dönüş süresi uzun bir bağlantıda tuş bir gidiş-dönüş sonra görünür.
- Host sertifikası ve kullanıcı sertifikası yok.
- `~/.nomux/bin` altındaki eski sürümler silinmez.
- Uzak Host'taki bir Session, o Host'taki daemon'un ortamını alır: bilgisayarınızdan hiçbir değişken geçmez ve login shell'in başlangıç dosyaları okunmaz. Kural için bkz. [Uzak Host'ta Session ortamı](#uzak-hostta-session-ortamı).
- `/etc/ssh/ssh_config` okunmaz.
- QUIC taşıması, port yönlendirme ve dosya aktarımı yok.
- Host'un daemon'u değiştirildiğinde ya da durduğunda bir attach biter. Session devam eder: [Host'un daemon'u değiştirilirse](#hostun-daemonu-değiştirilirse).
- SSH girişiniz için systemd kullanıcı yöneticisi olmayan bir Host, Session'lara [bellek limiti](/docs/tr/guides/session-memory/) uygulamaz. `host doctor` ve `daemon status` bunu söyler.

Host'ta `systemd-logind` yapılandırmasında `KillUserProcesses=yes` varsa oturumu kapatmak daemon'u ve Session'ları durdurur.

Her `host` komutu JSON belgesiyle birlikte [CLI başvurusunda](/docs/tr/reference/cli/). Bu sayfadaki terimler [Sözlük](/docs/tr/reference/glossary/)'ten gelir.
