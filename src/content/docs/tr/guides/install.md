---
title: Kurulum
description: Üç nomux binary'sini Linux ya da macOS bir makineye nasıl kurarsınız, nomux dosyalarını nerede tutar ve nasıl kaldırılır.
---

nomux üç binary'den oluşur: `nomux` (CLI), `nomuxd` (daemon) ve `nomux-holder` (holder).
Hangisinin ne iş yaptığını [Nasıl çalışır](/docs/tr/concepts/how-it-works/) sayfası anlatır.

## Sürüm durumu

Güncel sürüm [nomux 0.4.0](https://github.com/nomux-sh/nomux/releases/tag/v0.4.0).
`1.0.0` öncesindeki her sürüm gibi bu da bir ön sürümdür: minor sürümler arasında API, CLI ve protokol değişebilir.
İşin ne durumda olduğunu [yol haritasından](/docs/tr/project/roadmap/) takip edebilirsiniz.

Binary'leri edinmenin dört yolu var. Size uyan ilkini kullanın:

1. Kullanıyorsanız [Homebrew](#homebrew).
2. [Kurulum script'i](#kurulum-scripti).
3. Checksum'ı kendiniz doğruladığınız [elle indirme](#elle-indirme).
4. [Kaynaktan derleme](#kaynaktan-derleme).

nomux'u yalnızca klavyesinde yazdığınız bilgisayara kurarsınız. Uzak bir Host'a kurulum gerekmez: binary'leri oraya `nomux host add` koyar. Ayrıntılar [Uzak Host'lar](/docs/tr/guides/remote-hosts/) sayfasında.

Bu sayfadaki çıktılar, 0.4.0 sürümünün Linux x86_64 üzerindeki gerçek çıktısıdır. O çalıştırmada home dizini geçici bir dizindi: `/tmp/nomux-demo`.
Tek istisna Homebrew: çalıştırmanın yapıldığı makinede Homebrew yoktu, bu yüzden `brew install` çalıştırılmadı. Onun yerine nelerin denetlendiği [Homebrew](#homebrew) bölümünde.

## Desteklenen makineler

| Makine | Sürüm arşivinin target'ı |
|---|---|
| Linux, x86_64 | `x86_64-unknown-linux-musl` |
| Linux, aarch64 | `aarch64-unknown-linux-musl` |
| macOS, Intel | `x86_64-apple-darwin` |
| macOS, Apple silicon | `aarch64-apple-darwin` |

Sürümlerdeki Linux binary'leri statiktir; makinedeki C kütüphanesini kullanmazlar.
Windows için build yoktur.

## Homebrew

[`nomux-sh/homebrew-tap`](https://github.com/nomux-sh/homebrew-tap) tap'inde macOS ve Linux için tek bir formula var:

```sh
brew install nomux-sh/tap/nomux
```

Komut tap'i ekler ve üç binary'yi kurar. Shell'in CLI'ı bulduğunu doğrulayın:

```sh
nomux --version
```

- Formula nomux'u derlemez. Homebrew, makinenizin release arşivindeki binary'leri içeren bir bottle kurar ve SHA-256 checksum'ını formula'daki değerle karşılaştırır: ikisi farklıysa Homebrew hiçbir şey kurmaz. Apple silicon'lu bir Mac'in Xcode'a ve Command Line Tools'a ihtiyacı yoktur; Intel bir Mac'in ise bunlardan bir sürüme ihtiyacı vardır, en yenisine değil.
- Homebrew 6.0.0 ve sonrası, Homebrew'a ait olmayan bir tap'in formula'sını ancak siz ona güvendikten sonra yükler. Tam adla (`nomux-sh/tap/nomux`) yapılan kurulum yalnızca bu formula'ya güvenir. Ayrıntılar Homebrew dokümantasyonundaki [Tap Trust](https://docs.brew.sh/Tap-Trust) sayfasında.
- Formula yeni sürüme nomux'un release'inden sonra geçer: tap'teki bir workflow günde bir kez yeni release olup olmadığına bakar, değişikliği bir maintainer merge eder.

Bu komutlar ve bilgiler [tap'in README'sinden](https://github.com/nomux-sh/homebrew-tap#readme) alındı. `brew install` bu sayfa için çalıştırılmadı. Denetlenenler:

- 0.4.0 sürümündeki formula dört arşiv adlandırır; yukarıdaki tablodaki her makine için bir tane. Formula'daki her arşivin SHA-256 değeri, URL'nin verdiği dosyanın SHA-256 değeriyle ve release'teki `SHA256SUMS` değeriyle aynıdır.
- Formula'nın `test` bloğu `nomux --version`, `nomuxd --version` ve `nomux-holder --version` komutlarını çalıştırır ve `<binary> 0.4.0` bekler. Linux arşivindeki üç binary tam olarak bunu yazdırır:

  ```console
  $ nomux --version
  nomux 0.4.0
  $ nomuxd --version
  nomuxd 0.4.0
  $ nomux-holder --version
  nomux-holder 0.4.0
  ```

## Kurulum script'i

Script sırasıyla şunları yapar:

1. `uname` çıktısından makinenin target'ını bulur.
2. GitHub release'inden o target'ın arşivini ve `SHA256SUMS` dosyasını indirir.
3. Arşivin SHA-256 checksum'ını doğrular. Checksum tutmazsa hiçbir şey kurmaz.
4. `nomux`, `nomuxd` ve `nomux-holder` binary'lerini `~/.local/bin` dizinine koyar.

Script `sudo` kullanmaz. `curl`, `tar` ve `sha256sum` ya da `shasum` komutlarına ihtiyaç duyar.

```console
$ curl -fsSL https://raw.githubusercontent.com/nomux-sh/nomux/main/install.sh | sh
Downloading nomux-0.4.0-x86_64-unknown-linux-musl.tar.gz
The SHA-256 checksum is correct.
Installed nomux 0.4.0 in /tmp/nomux-demo/.local/bin: nomux nomuxd nomux-holder
/tmp/nomux-demo/.local/bin is not in PATH. Add it to PATH to run nomux by name.
```

Son satır, bu çalıştırmada `~/.local/bin` `PATH`'te olmadığı için var. Dizin `PATH`'teyse script bu satırı yazdırmaz. Shell'inizin başlangıç dosyasına eklemeniz gereken satır [Dosyalar nerede durur](#dosyalar-nerede-durur) bölümünde.

| Seçenek | Varsayılan | Ne yapar |
|---|---|---|
| `--version <sürüm>` | Son eki olmayan en yeni sürüm | Kurulacak sürüm, örneğin `0.4.0` |
| `--dir <dizin>` | `~/.local/bin` | Binary'lerin konacağı dizin |

Seçenek vermek için `sh`'den sonra `-s --` ekleyin:

```console
$ curl -fsSL https://raw.githubusercontent.com/nomux-sh/nomux/main/install.sh | sh -s -- --version 0.4.0 --dir ~/bin
Downloading nomux-0.4.0-x86_64-unknown-linux-musl.tar.gz
The SHA-256 checksum is correct.
Installed nomux 0.4.0 in /tmp/nomux-demo/bin: nomux nomuxd nomux-holder
/tmp/nomux-demo/bin is not in PATH. Add it to PATH to run nomux by name.
```

Shell'in CLI'ı bulduğunu doğrulayın:

```console
$ nomux --version
nomux 0.4.0
```

## Elle indirme

Her sürümde target başına bir arşiv ve tek bir `SHA256SUMS` dosyası bulunur.
Arşivin içinde üç binary, README ve iki lisans dosyası vardır.

1. Sürümü ve makinenizin target'ını belirleyin:

   ```sh
   version=0.4.0
   target=x86_64-unknown-linux-musl
   ```

2. Arşivi ve checksum dosyasını [sürümler sayfasından](https://github.com/nomux-sh/nomux/releases) indirin:

   ```sh
   curl -fsSLO "https://github.com/nomux-sh/nomux/releases/download/v$version/nomux-$version-$target.tar.gz"
   curl -fsSLO "https://github.com/nomux-sh/nomux/releases/download/v$version/SHA256SUMS"
   ```

3. Checksum'ı doğrulayın. Komut arşivin adını ve `OK` yazdırmalı; yazdırmıyorsa devam etmeyin:

   ```console
   $ grep "nomux-$version-$target.tar.gz" SHA256SUMS | sha256sum --check
   nomux-0.4.0-x86_64-unknown-linux-musl.tar.gz: OK
   ```

   macOS'te `sha256sum --check` yerine `shasum -a 256 --check` kullanın.

4. Arşivi açın ve binary'leri kopyalayın:

   ```sh
   tar -xzf "nomux-$version-$target.tar.gz"
   mkdir -p ~/.local/bin
   cp "nomux-$version-$target/nomux" "nomux-$version-$target/nomuxd" "nomux-$version-$target/nomux-holder" ~/.local/bin/
   ```

Checksum, indirdiğiniz dosyanın eksiksiz olduğunu ve release'teki dosyayla aynı olduğunu gösterir; release'i kimin hazırladığını göstermez.
Binary'ler imzalı değildir, notarize da edilmemiştir. [`nomux` README'sine](https://github.com/nomux-sh/nomux#install) göre kod imzalama ve notarization ilk kararlı sürümle başlayacak.

## Kaynaktan derleme

`git` ve [rustup](https://rustup.rs) yeterli. Repo Rust sürümünü sabitler; rustup doğru sürümü kendisi kurar.

1. Sürümün kaynağını alın ve binary'leri derleyin:

   ```sh
   git clone --branch v0.4.0 https://github.com/nomux-sh/nomux.git
   cd nomux
   cargo build --release
   ```

   `--branch v0.4.0` vermezseniz `main` branch'ini derlersiniz; o da sürümden daha yeni olabilir.

2. Üç binary'yi `PATH`'inizdeki bir dizine kopyalayın. Üçü de aynı dizinde dursun:

   ```sh
   mkdir -p ~/.local/bin
   cp target/release/nomux target/release/nomuxd target/release/nomux-holder ~/.local/bin/
   ```

Linux'ta kendi derlediğiniz binary makinenin C kütüphanesini kullanır; sürüm arşivindeki statik binary ile aynı değildir.

## Dosyalar nerede durur

| Yol | İçerik |
|---|---|
| `~/.local/bin/nomux`, `nomuxd`, `nomux-holder` | Binary'ler. Homebrew ya da `--dir` kullandıysanız veya başka bir dizine kopyaladıysanız yol farklıdır. |
| `~/.nomux/run/` | Runtime dizini: daemon'un socket'i, kilidi ve log'u ile çalışan her Session için bir dizin. nomux bu dizini ilk komutta kendisi oluşturur. |
| Linux'ta `~/.local/state/nomux/`, macOS'te `~/Library/Application Support/nomux/` | State dizini: her Session'ın tanımı ve journal'ı. nomux'un bunlarla ne yaptığını [Yeniden başlatmadan sonra](/docs/tr/guides/after-a-restart/) sayfası anlatır. |
| Linux'ta `~/.local/share/nomux/extensions/`, macOS'te `~/Library/Application Support/nomux/extensions/` | Kurduğunuz extension'lar ve onayladığınız izinler. Ayrıntılar [Extension'lar](/docs/tr/guides/extensions/) sayfasında. |
| Linux'ta `~/.local/share/nomux/hooks/`, macOS'te `~/Library/Application Support/nomux/hooks/` | Her `nomux hooks install --apply` komutunun kaydı: kurulumdan önce ayar dosyasının baytları. Ayrıntılar [Agent adapter'ları ve hook'lar](/docs/tr/guides/agent-adapters/) sayfasında. |
| Linux'ta `~/.config/nomux/config.toml`, macOS'te `~/Library/Application Support/nomux/config.toml` | Ayar dosyası. `XDG_CONFIG_HOME` mutlak bir yolsa dosya `$XDG_CONFIG_HOME/nomux/config.toml` olur. nomux bu dosyayı uzak bir Host eklediğinizde oluşturur. Dosyada [havuz ayarları](/docs/tr/guides/holder-pool/#ayarlar) da bulunur. |
| Linux'ta `~/.config/systemd/user/nomuxd.service`, macOS'te `~/Library/LaunchAgents/sh.nomux.nomuxd.plist` | Servis dosyası. Yalnızca `nomux daemon install-service` çalıştırıldıktan sonra vardır. |

macOS yolları `nomux` reposundaki dokümanlardan alındı. Bu sayfadaki çıktıların hepsi Linux'tan.
73 bayttan uzun bir home dizini, nomux'un `/tmp` içinde kısa bir bağlantı kullanmasına yol açar: [Uzun home dizinleri](/docs/tr/guides/long-home-paths/).

CLI `nomuxd`'yi, daemon da `nomux-holder`'ı başlatır. Her biri aradığı binary'ye önce kendi dizininde, sonra `PATH`'te bakar.
Bu yüzden üç binary ya aynı dizinde durmalı ya da üçü de `PATH`'te olmalıdır.

`~/.local/bin` `PATH`'inizde değilse shell'inizin başlangıç dosyasına şu satırı ekleyin:

```sh
export PATH="$HOME/.local/bin:$PATH"
```

## Güncelleme

Yeni sürümü aynı dizine kurun. Homebrew kullanıyorsanız şu komutlar yeterli:

```sh
brew update
brew upgrade nomux-sh/tap/nomux
```

Çalışmakta olan daemon ve holder'lar eski binary'lerle devam eder.
Yeni daemon'a geçmek için eskisini durdurun. Eski daemon'un havuzdaki holder'ları onunla birlikte sona erer; nedenini [Holder havuzu](/docs/tr/guides/holder-pool/) sayfası anlatır:

```sh
nomux daemon stop
```

Bir sonraki komut yeni daemon'u başlatır; o da çalışan Session'ları bulur. Çalışan bir holder ise değiştirilmez: Session, komutu bitene kadar kendi holder'ıyla kalır.

Servis dosyasını kurduysanız ve binary'lerin yolu değiştiyse `nomux daemon install-service` komutunu yeniden çalıştırın; dosyada `nomuxd`'nin yolu yazılıdır.

## Kaldırma

1. Bütün Session'ları sonlandırın ve daemon'u durdurun. `nomux kill` uykudaki bir Session'ı da çıktısıyla birlikte siler:

   ```sh
   for id in $(nomux ls --quiet); do nomux kill "$id"; done
   nomux daemon uninstall-service
   nomux daemon stop
   ```

2. Binary'leri silin. Homebrew ile:

   ```sh
   brew uninstall nomux-sh/tap/nomux
   brew untap nomux-sh/tap
   ```

   Homebrew olmadan:

   ```sh
   rm ~/.local/bin/nomux ~/.local/bin/nomuxd ~/.local/bin/nomux-holder
   ```

3. nomux'un dizinlerini silin. Linux'taki yollar şunlar:

   ```sh
   rm -r ~/.nomux ~/.local/state/nomux ~/.local/share/nomux ~/.config/nomux
   ```

   nomux'un oluşturmadığı bir dizin zaten yoktur; onu komuttan çıkarın.

`~/.local/bin`'i `PATH`'e yalnızca nomux için eklediyseniz o satırı da shell'inizin başlangıç dosyasından çıkarın.
nomux'u uzak bir Host'tan kaldırmanın yolu [Uzak Host'lar](/docs/tr/guides/remote-hosts/) sayfasında.

## Sıradaki adım

[Hızlı başlangıç](/docs/tr/guides/quick-start/) sayfasıyla devam edin.
