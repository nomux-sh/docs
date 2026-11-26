---
title: Performans hedefleri
description: nomux'un performans hedefleri ve bugüne kadar ölçülen değerler; her biri nomux reposundaki kaynağıyla.
sidebar:
  label: Performans hedefleri
---

nomux'ta performans hedefleri özelliklerden önce gelir. Bir hedefi bozan değişiklik merge edilmez.
Bu sayfa hedefleri ve bugün ölçülmüş değerleri listeler. Her değerin kaynağı [`nomux`](https://github.com/nomux-sh/nomux) reposundadır; kaynak dokümanlar İngilizcedir.

## Hedefler

Bu tablonun kaynağı [`bench/README.md`](https://github.com/nomux-sh/nomux/blob/v0.4.0/bench/README.md#targets) dosyasıdır.
"Sahibi" sütunu, hedefi projenin hangi parçasının ölçtüğünü gösterir.

| Ölçüm | Hedef | Sahibi | Ölçüldü mü |
|---|---|---|---|
| Local tuş basımından ekrana | < 10 ms | çekirdek + desktop | Çekirdek kısmı, CLI ile: [evet](#attach). Desktop kısmı: hayır |
| Uzak tuş basımının görünmesi (predictive echo) | < 10 ms; gerçek onay RTT + 5 ms içinde | çekirdek + desktop | SSH üzerinden onay: [evet](#uzak-hostlar). Predictive echo: yok |
| 10 MB/s çıktı seli | Arayüz 60 fps ya da üstü; girdi gecikmesi değişmez | çekirdek + desktop | Girdi gecikmesi, CLI ile: [evet](#attach). Arayüz: hayır |
| Yeni Session'ın başlaması (warm pool) | < 10 ms | çekirdek | Havuzdan: [evet](#yeni-session). Havuz olmadan, başlangıç dosyaları yavaş bir shell hedefi tutturamaz |
| Ağ değişimi | Bağlantı açık kalır | çekirdek | Hayır |
| Kopmadan sonra yeniden bağlanma | < 1 s, veri kaybı yok | çekirdek | Veri kaybı yok: [test edildi](#uzak-hostlar). Süre: hayır |
| Daemon güncellemesi ya da çökmesi | Hiçbir Session durmaz | çekirdek | Çökme: test ediliyor. Güncelleme: hayır |
| Yeniden başlatmadan sonra ilk ekran | < 1 s (lazy restore) | çekirdek | Session listesi: [evet](#geri-yükleme). İlk ekran: hayır |
| Boşta bekleyen `nomuxd`'nin RAM'i | < 10 MB | çekirdek | [Evet](#daemon) |
| Session başına bir holder'ın RAM'i | < 3 MB (scrollback diskte) | çekirdek | [Evet](#holder) |
| `nomux-holder` binary'sinin boyutu | < 1 MB | çekirdek | [Evet](#holder) |
| `nomuxd` binary'sinin boyutu | < 10 MB | çekirdek | [Evet](#daemon) |
| Desktop'ın soğuk açılışı | < 300 ms | desktop | Hayır |
| Desktop'ın boştaki RAM'i | < 80 MB; arka planda < 40 MB | desktop | Hayır |
| Desktop'ın boştaki CPU'su | Yaklaşık % 0 (CI'da bütçe) | desktop | Hayır |

"Hayır", hedefin ilgilendirdiği parçanın henüz var olmadığı ya da kayıtlı bir ölçümün bulunmadığı anlamına gelir.
İşlerin sırasını [yol haritası](/docs/tr/project/roadmap/) gösterir.

[`tests/session_lifecycle.rs`](https://github.com/nomux-sh/nomux/blob/v0.4.0/tests/session_lifecycle.rs) dosyasındaki uçtan uca testler daemon'u ve process group'unu `SIGKILL` ile öldürür ve Session'ın yaşamaya devam ettiğini doğrular.
[`tests/attach.rs`](https://github.com/nomux-sh/nomux/blob/v0.4.0/tests/attach.rs) ise daemon'u attach sırasında öldürür ve yeni attach'in aynı ekranı gösterdiğini doğrular.

## Ölçülen değerler

Değerler, kaynak dokümanların [`v0.4.0`](https://github.com/nomux-sh/nomux/tree/v0.4.0) etiketindeki değerleridir.
Hepsi Linux x86-64 üzerinde, release profiliyle ölçülmüştür; yalnızca "debug build" yazan satır hariç. macOS'te ve aarch64'te yapılmış bir ölçüm yoktur.
"Attach", "Uzak Host'lar" ve "Geri yükleme" bölümlerinin değerleri 0.3.0'dakilerle aynıdır: 0.4.0 dokümanları bu parçaları yeniden ölçmedi. "Yeni Session", "Session belleği" ve "Hook'lar" bölümleri yenidir; "Holder" ve "Daemon" bölümlerinde yeni satırlar var.
"glibc", makinenin C kütüphanesine dinamik bağlanan build'dir. "musl" ise sürüm arşivlerine giren statik build'dir.

### Attach

Kaynak: [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/v0.4.0/docs/daemon.md#measurements) dosyasının "Measurements" bölümü.

"Tuştan ekoya" süresi, tek bir tuşun `nomux attach` terminaline yazılmasından o tuşun ekosunun aynı terminale gelmesine kadar geçen süredir. Session `cat` çalıştırır; tuşun ekosunu Session'ın terminali verir.
Bu yolda CLI, daemon, holder ve Session'ın terminali vardır; her biri iki kez. Ağ ve desktop istemcisi yoktur; yani bu ölçüm "local tuş basımından ekrana" hedefinin çekirdek kısmıdır.

| Ölçüm | Medyan | 99. yüzdelik | Hedef |
|---|---|---|---|
| Tuştan ekoya, local Session | 0,2 ms – 0,5 ms | 0,5 ms – 5,4 ms | < 10 ms |
| Tuştan ekoya, attach olunmuş ikinci bir Session'da 10 MB/s çıktı seli varken | 0,2 ms – 0,5 ms | 1,4 ms – 4,7 ms | Kayda değer değişim yok |
| Tuştan ekoya, attach olunmuş ikinci bir Session'da sınırsız çıktı seli varken (istemcisine 19 MB/s – 36 MB/s) | 0,2 ms – 0,8 ms | 3,1 ms – 5,3 ms | Kayda değer değişim yok |

[`tests/measurements/attach.rs`](https://github.com/nomux-sh/nomux/blob/v0.4.0/tests/measurements/attach.rs) programı aralarında 2 ms bırakarak 2000 tuş yazar. Her aralık 3 çalıştırmanın sonucudur.
Bir çalıştırmadaki en büyük değer 3 ms ile 58 ms arasındadır: başka iş de yapan bir bilgisayarda birkaç tuş scheduler'ı bekler. Yani en büyük değer bazı çalıştırmalarda hedefin üstündedir.
Programın nasıl çalıştırılacağı [`tests/README.md`](https://github.com/nomux-sh/nomux/blob/v0.4.0/tests/README.md#measurements) dosyasında yazar.

| Ölçüm | Sonuç | Hedef |
|---|---|---|
| Hiç çıktı almayan bir istemciye 32 MiB'lık çıktı seli giderken daemon'un resident belleğindeki artış | 8 MiB'ın altında; bu, testin sınırıdır | Bellek, çıktının uzunluğuyla büyümez |

### Uzak Host'lar

Kaynak: [`docs/remote.md`](https://github.com/nomux-sh/nomux/blob/v0.4.0/docs/remote.md#measurements) dosyasının "Measurements" bölümü.
SSH sunucusu aynı bilgisayardaki OpenSSH 10.2 `sshd`'sidir. İstemci ona, gecikme ekleyebilen bir relay programı üzerinden bağlanır. Her aralık 2 çalıştırmanın sonucudur.

| Ölçüm | Medyan | 99. yüzdelik | Hedef |
|---|---|---|---|
| Tuştan ekoya, aynı bilgisayara SSH | 0,3 ms – 3,2 ms | 1,1 ms – 11,6 ms | Hedef yok |
| Aynısı, attach olunmuş ikinci bir Session'da çıktı seli varken | 0,3 ms – 1,3 ms | 2,6 ms – 10,5 ms | Kayda değer değişim yok |
| Tuştan ekoya, 100 ms round trip ile | 100,9 ms | 103,3 ms | Onay RTT + 5 ms içinde |
| Aynısı, attach olunmuş ikinci bir Session'da çıktı seli varken | 100,7 ms | 107,4 ms | Onay RTT + 5 ms içinde |
| Tuştan ekoya, 100 ms round trip ve kayıp modeliyle | 100,8 ms | 300,9 ms | Kayıp için hedef yok |
| Aynısı, attach olunmuş ikinci bir Session'da çıktı seli varken | 101,0 ms | 302,2 ms | Kayıp için hedef yok |

| Ölçüm | Sonuç |
|---|---|
| İlk `nomux host add`: bağlantı, arşiv, 5,3 MB yükleme, checksum'lar, daemon'un başlaması | 0,3 s – 0,7 s |
| Sonraki `nomux --host vps ls` komutu, 20 çalıştırmanın medyanı | 31 ms – 104 ms |
| Aynı komut local Host'ta | 1 ms – 12 ms |
| Bu ölçümlerde ve testlerde kesilen bağlantıdan sonra kaybolan ya da iki kez gelen çıktı | Yok |

- **Gecikme.** Relay her byte parçasını her yönde 50 ms bekletir.
- **Kayıp modeli.** Relay parçaların % 2'sini, TCP'nin kaybolan bir paketten sonra yaptığı gibi 200 ms daha bekletir. Aynı doküman, gerçek paket kaybıyla bir ölçüm yapılmadığını söyler.
- **Predictive echo yok.** Tuş, Host ekosunu gönderdiğinde görünür; yani her tuş bir round trip bekler. Uzak bir Host için "< 10 ms'de görünür" hedefi tutmuyor.
- Yeniden bağlanmanın süresi ölçülmedi.

### Geri yükleme

Kaynak: [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/v0.4.0/docs/daemon.md#measurements) dosyasının "Measurements" bölümü.

| Ölçüm | Medyan | 11 çalıştırmanın en yavaşı | Hedef |
|---|---|---|---|
| Daemon'un başlamasından eksiksiz bir `nomux ls --json`'a kadar; her biri 32 MiB journal'lı 50 uykudaki Session | 25,3 ms | 31,4 ms | İlk ekran için < 1 s |

- Bu ölçüm Session listesidir, bir Session'ın ilk ekranı değildir. Bir Session'ı geri yükleyip ekranını göstermenin süresi ölçülmedi.
- Dosyalar bir `tmpfs` dosya sistemindeydi; yani değerde disk maliyeti yoktur. Aynı doküman, boş page cache ile okumanın ölçülmediğini söyler.

| Ölçüm | Sonuç | Hedef |
|---|---|---|
| Resident bellek, 3 uykudaki ve 1 biten Session'lı boştaki daemon (glibc) | 4,3 MB | < 10 MB |
| 3 uykudaki ve 1 biten Session'lı boştaki daemon'un 30 saniyedeki CPU süresi ve context switch sayısı | 0 ve 0 | 0 |

### Yeni Session

Kaynak: [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/v0.4.0/docs/daemon.md#measurements) dosyasının "Measurements" bölümü. Daemon, her birinde kullanıcının shell'i önceden başlatılmış birkaç holder'ı hazır tutar: holder havuzunu [Nasıl çalışır](/docs/tr/concepts/how-it-works/#holder-havuzu) sayfası anlatır.

| Ölçüm | Havuz olmadan | Havuzdan | Hedef |
|---|---|---|---|
| İsteğin shell'in ilk komutuna kadar geçen süresi, başlangıç dosyaları 200 ms süren `bash`: 50 çalıştırmanın medyanı | 205,8 ms | 2,8 ms | < 10 ms |
| `nomux new`, başlangıç dosyasız `sh`: 50 çalıştırmanın medyanı | 3,2 ms | 3,1 ms | < 10 ms |

| Ölçüm | Sonuç | Hedef |
|---|---|---|
| Havuzdan `Session.Create`, bağlı istemci, debug build: 11 çalıştırmanın medyanı | 1,2 ms – 2,0 ms | < 10 ms |
| Havuz olmadan `Session.Create`, bağlı istemci: medyan, 50 çalıştırmanın en yavaşı | 2,31 ms, 2,43 ms | Hedef yok |
| Aynısı, daemon'daki kısım: holder process'inin başlaması, `ready` beklemesi, lease, cevap | 0,12 ms – 0,19 ms, 2,2 ms, 0,08 ms, 0,03 ms | Hedef yok |

- **Hedef havuzdan açılışta tutuyor; yavaş bir shell için havuz olmadan tutmuyor.** Başlangıç dosyaları 200 ms süren bir `bash`, havuz olmadan 205,8 ms alır; bu hedefin yaklaşık 20 katıdır. Havuzdan aynı Session 2,8 ms alır.
- **Başlangıç dosyası olmayan bir shell için havuz gerekmez.** `sh` ile `nomux new`, havuzla da havuzsuz da aynı sürede biter: CLI'ın başlaması ve bağlantısı sürenin büyük kısmıdır, shell ise kısa sürede başlar.
- **Havuzda holder hazır olduğunda var olur; shell'inin başlangıç dosyaları bittiğinde değil.** Holder'ı o sırada alan Session'ın prompt'u daha geç görünür.
- **Komutlu bir Session her zaman yeni bir holder alır.** Havuz yalnızca kullanıcının shell'ini verir ve daemon'un tanımadığı bir shell için kapalıdır.
- Satırlar, [`tests/measurements/new_session.rs`](https://github.com/nomux-sh/nomux/blob/v0.4.0/tests/measurements/new_session.rs) programından alındı: release build, başlangıç dosyası olmayan bir home dizini ve `SHELL=/bin/sh` ile; bir satır başka bir şey söylemiyorsa. Daemon'daki kısım, kodda bulunmayan log satırlarıyla ölçüldü. "debug build" satırı `a_session_from_the_pool_opens_in_less_than_10_ms` testidir.
- Karşılaştırma için aynı doküman, gerçek bir kullanıcının başlangıç dosyalarıyla `bash -i`'nin aynı bilgisayarda ilk prompt'a 232 ms'de ulaştığını söyler.
- Havuz beklerken bellek kullanır: "Holder" ve "Daemon" bölümlerindeki havuz satırlarına bakın.

### Holder

Kaynak: [`docs/holder.md`](https://github.com/nomux-sh/nomux/blob/v0.4.0/docs/holder.md#measurements) dosyasının "Measurements" bölümü. Bu değerlerdeki holder journal'ı yazar.

| Ölçüm | Sonuç | Hedef |
|---|---|---|
| `nomux-holder` boyutu (glibc) | 624 KB | < 1 MB |
| `nomux-holder` boyutu (musl) | 722 KB | < 1 MB |
| Resident bellek, `/bin/sh` çalıştıran boştaki holder (musl) | 0,8 MB | < 3 MB |
| Resident bellek, 8 MB çıktıdan sonra ring buffer dolu (musl) | 1,2 MB | < 3 MB |
| Resident bellek, ring buffer ve program raporları dolu (musl) | 1,5 MB | < 3 MB |
| Resident bellek, `/bin/sh` çalıştıran boştaki holder (glibc) | 2,6 MB | < 3 MB |
| Resident bellek, 8 MB çıktıdan sonra ring buffer dolu (glibc) | 3,1 MB | < 3 MB: tutmuyor |
| Resident bellek, ring buffer ve program raporları dolu (glibc) | 3,3 MB | < 3 MB: tutmuyor |
| Boştayken 10 saniyedeki CPU süresi ve context switch sayısı | 0 ve 0 | 0 |
| 128 MiB'lık dosyanın `cat` çıktısının holder'dan geçişi, düz metin | 82 MiB/s | Hedef yok |
| 128 MiB'lık dosyanın `cat` çıktısının holder'dan geçişi, renkli kelimeler | 69 MiB/s | Hedef yok |
| 32 MiB'lık dosyanın `cat` çıktısının holder'dan geçişi, her satırda bir program durumu raporu | 30 MiB/s | Hedef yok |
| 1 MiB çıktı için diskteki journal: düz kelimeler, renkli kelimeler, renkli `git log -p` | 618 KiB, 464 KiB, 366 KiB | Hedef yok |
| Bir konumun ekranını önceki checkpoint'ten oluşturma, renkli kelimeler | 3 ms – 12 ms | Hedef yok |
| `nomux-holder` boyutu (musl); havuzdaki holder ile | 737968 bayt: öncekinden 4128 bayt fazla | < 1 MB |
| Resident bellek, `/bin/sh` çalıştıran boştaki havuz holder'ı (musl) | 0,8 MB – 0,9 MB | < 3 MB |
| Holder'ın başlamasından `ready` dosyasına kadar, `/bin/sh` ile: 50 çalıştırmanın medyanı | 1,07 ms | Hedef yok |

Ring buffer, holder'ın bir Session'ın en son çıktısını tuttuğu bellektir.
"Program raporları dolu", bir programın oluşturabileceği en büyük durumdur: 64 program durumu kaydı ve 16 bildirim, hepsi en uzun metinlerle.
İki değer hedefini tutturmuyor: ring buffer'ı dolu glibc build'i, program raporları dolu da olsa olmasa da. **Sürüm arşivlerinde musl build'i bulunur** ve o hedefi tutturur.

Çıktı hızları, o sırada başka iş de yapan bir makinedeki 11 çalıştırmanın en iyisidir. Aynı doküman, journal'ın çıktı selini % 15 – % 30 yavaşlattığını, holder'ın yine de 10 MB/s hedefinden 7 kat hızlı olduğunu söyler.

### Daemon

Kaynak: [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/v0.4.0/docs/daemon.md#measurements) dosyasının "Measurements" bölümü. Ölçüm komutları da aynı bölümdedir.

| Ölçüm | Sonuç | Hedef |
|---|---|---|
| `nomuxd` boyutu (glibc); extension host, journal ve geri yükleme ile | 1737 KiB (1778864 bayt) | < 10 MB |
| Resident bellek, Session'sız boştaki daemon (glibc) | 2,9 MB | < 10 MB |
| Resident bellek, 2 Session'lı boştaki daemon (glibc) | 3,1 MB | < 10 MB |
| Resident bellek, 1 Session'lı boştaki daemon (musl) | 1,1 MB | < 10 MB |
| Resident bellek, extension host ile, 2 Session'lı boştaki daemon (glibc) | 4,0 MB | < 10 MB |
| Resident bellek, kullanılmayan 1 kurulu extension'lı boştaki daemon (glibc) | 4,1 MB | < 10 MB |
| Aynı daemon'un, extension çalışıp boşta kalma süresinden sonra durduktan sonraki resident belleği | 4,2 MB | < 10 MB |
| 2 Session'lı boştaki daemon'un 30 saniyedeki CPU süresi ve context switch sayısı | 0 ve 0 | 0 |
| 1 istemcinin attach olduğu boştaki daemon'un 30 saniyedeki CPU süresi ve context switch sayısı | 0 ve 0 | 0 |
| Kullanılmayan 1 kurulu extension'lı boştaki daemon'un 30 saniyedeki CPU süresi ve context switch sayısı | 0 ve 0 | 0 |
| Resident bellek, durum motoruyla, Session'sız boştaki daemon (glibc) | 4,4 MB | < 10 MB |
| Resident bellek, durum motoruyla, her biri bir durum task'ına sahip 20 Session'lı boştaki daemon (glibc) | 7,1 MB – 7,2 MB | < 10 MB |
| Her biri bir durum task'ına sahip 20 Session'lı boştaki daemon'un 60 saniyedeki CPU süresi ve context switch sayısı | 0 ve 0 | 0 |
| Aynısı; Session'lardan 10'u 60 saniyeden önce bir Alt işli durum bildirdi | 0 ve 0 | 0 |
| 2 holder'lık dolu havuzlu boştaki daemon'un resident belleği (glibc) | 4,4 MB | < 10 MB |
| Havuzdaki 2 holder'ın resident belleği (glibc) | 5,5 MB; yani holder başına 2,75 MB | Holder başına < 3 MB |
| Havuzdaki 2 shell'in resident belleği (başlangıç dosyasız `bash` 5.3) | 8,9 MB | Hedef yok |
| Dolu havuzlu, havuzdaki holder'ları ve shell'leriyle boştaki daemon'un 30 saniyedeki CPU süresi | 0 | 0 |

Aynı dokümanda extension host'tan ve durum motorundan önceki build'lere ait eski satırlar da vardır. "Extension host ile" ya da "durum motoruyla" yazmayan satırlar daha eski bir ölçümden ve daha eski bir build'den gelir.
20 Session'lı daemon 7,1 MB – 7,2 MB kullanır; Session'sız daemon 4,4 MB. Fark Session başına yaklaşık 0,14 MB eder. Bu, iki satırdan yapılan bir hesaptır; ayrı bir ölçüm değildir.
Havuz, daemon satırlarının saymadığı bellek ekler. Havuzdaki 2 holder 5,5 MB, 2 shell'i 8,9 MB kullanır; ikisi de kendi process'lerindedir. `pool.size = 0` ayarı havuzu kapatır.

### Session belleği

Kaynak: [`docs/memory.md`](https://github.com/nomux-sh/nomux/blob/v0.4.0/docs/memory.md#measurements) dosyasının "Measurements" bölümü. Daemon her Session'ın process'lerinin belleğini yalnızca bir istemci isteyince ölçer (`nomux ls --memory`).

| Ölçüm | Sonuç |
|---|---|
| `Session.Memory` isteği; komutlarının 150 process'i olan 50 Session, Host'ta 614 process: medyan, 21 isteğin en yavaşı | 9,9 ms, 11,2 ms |
| Aynısı ikinci bir çalıştırmada | 9,6 ms, 13,0 ms |
| Bu Session'larla `nomux ls --memory --json` komutu: medyan, 21 çalıştırmanın en yavaşı | 10,9 ms, 12,0 ms |
| Bu Session'larla `nomux ls --json` komutu: medyan, 21 çalıştırmanın en yavaşı | 1,1 ms, 1,4 ms |
| `Session.Memory` isteği; komutlarının 600 process'i olan 200 Session, Host'ta 1214 process: medyan, en yavaşı | 28,1 ms, 32,8 ms |
| `nomux ls --memory --json` komutu; komutları 32 MiB kullanan 50 Session (1,5 GiB): medyan, 21 çalıştırmanın en yavaşı | 17,2 ms, 23,7 ms |
| İki bellek isteğinden sonraki 42 saniyede, 2 Session ile daemon'un CPU süresi | 0 clock tick |
| Aynı 42 saniyede daemon'un context switch sayısı | 0 |
| Daemon'un thread sayısı: istekten önce, isteğin hemen sonrasında, istekten 12 saniye sonra | 1, 2, 1 |
| Bellek isteğiyle `nomuxd` boyutu (glibc) | 1771 KiB (1813264 bayt) |

Bu isteğin süresi için bir hedef yoktur. CPU süresi, context switch ve thread satırları, daemon'un iki istek arasında bellek için hiçbir şey yapmadığını gösterir. Bu kuralı [ADR-0009](https://github.com/nomux-sh/docs/blob/main/adr/0009-resource-budgets-for-disk-and-memory.md) kaydeder.

- Sürenin iki parçası vardır: Host'taki process tablosunun okunması (Host'taki process sayısıyla artar) ve her process'in belleğinin okunması (Session'ların process sayısıyla ve belleğiyle artar).
- Aynı 50 Session için `nomux ls --memory --json`, `nomux ls --json`'dan yaklaşık 10 kat yavaştır (10,9 ms ve 1,1 ms). `--memory` olmadan hiçbir şey ölçülmez.
- Daemon istek sürerken diğer istemcilere cevap verir: iş onun thread'inde değildir.
- İlk satırları [`tests/measurements/memory.rs`](https://github.com/nomux-sh/nomux/blob/v0.4.0/tests/measurements/memory.rs) programı ölçer. CPU süresi, context switch ve thread sayıları, daemon process'ine verilen komutlardan alındı.
- Bellek isteğinin macOS kodu yalnızca CI'ın macOS runner'ında derlendi ve test edildi. Gerçek Session'larla bir Mac'te incelenmedi.

### Hook'lar

Kaynak: [`docs/adapters.md`](https://github.com/nomux-sh/nomux/blob/v0.4.0/docs/adapters.md#measurements) dosyasının "Measurements" bölümü. [`tests/measurements/hooks.rs`](https://github.com/nomux-sh/nomux/blob/v0.4.0/tests/measurements/hooks.rs) programı, `nomux hook` komutunun süresini process'in başlamasından bitişine kadar, bir agent aracının çalıştırdığı gibi ölçer. Release build, her biri 100 çalıştırma, test adapter'ı kurulu.

| `nomux hook` | Medyan | En hızlı | En yavaş |
|---|---|---|---|
| Daemon çalışıyor, adapter kurulu | 1,0 ms | 0,9 ms | 2,6 ms |
| Daemon durmuş | 0,9 ms | 0,8 ms | 1,4 ms |

- Hedef yoktur. Hook aracın içinde çalışır; bu yüzden komut aracı yavaşlatmamalıdır: daemon'u en fazla 80 ms bekler ve çıkış kodu her zaman 0'dır.
- Daemon, adapter olayı almadan önce hook'a cevap verir; bu yüzden süre adapter'ın işini içermez.
- Adapter, uydurma bir aracın test adapter'ıdır; gerçek bir aracın adapter'ı değildir.

### CLI

CLI için bir hedef yoktur. SSH istemcisi onu büyüttü. Kaynak: [`docs/remote.md`](https://github.com/nomux-sh/nomux/blob/v0.4.0/docs/remote.md#measurements) dosyasının "Measurements" bölümü:

| `nomux` build'i (glibc) | Boyut |
|---|---|
| SSH istemcisi olmadan | 943 KiB (966104 bayt) |
| SSH istemcisiyle | 3822 KiB (3913456 bayt) |

`nomux` reposundaki [#47](https://github.com/nomux-sh/nomux/issues/47) numaralı issue bu boyutla ilgilidir.

### 0.4.0 arşivindeki binary'ler

Bu boyutlar bir dokümandan alınmadı. [0.4.0 sürümünün](https://github.com/nomux-sh/nomux/releases/tag/v0.4.0) `nomux-0.4.0-x86_64-unknown-linux-musl.tar.gz` arşivindeki üç dosyanın boyutlarıdır; bu sayfa için `tar -tvzf` ile okundu. Son sütun 0.3.0 arşivindeki boyuttur.

| Binary | Boyut | Hedef | 0.3.0 |
|---|---|---|---|
| `nomux-holder` | 746224 bayt (729 KiB) | < 1 MB | 725680 bayt (709 KiB) |
| `nomuxd` | 2222280 bayt (2170 KiB) | < 10 MB | 1890216 bayt (1846 KiB) |
| `nomux` | 5253320 bayt (5130 KiB) | Hedef yok | 4389032 bayt (4286 KiB) |

Her binary hedefini tutturuyor. Üç binary da 0.3.0'dan büyüdü: `nomux-holder` 20544 bayt (% 2,8), `nomuxd` 332064 bayt (% 17,6) ve `nomux` 864288 bayt (% 19,7). Bu tablodaki `nomux-holder` boyutu, "Holder" tablosundaki 737968 baytlık değerden 8256 bayt farklıdır: ikisi farklı build'lerdir.

### Hedefi tutturmayan değerler

- **glibc build'li holder.** Ring buffer doluyken resident bellek 3,1 MB, program raporları da doluyken 3,3 MB; hedef < 3 MB. Sürüm arşivindeki musl build'i hedefi tutturuyor.
- **Havuzsuz yeni Session.** Başlangıç dosyaları 200 ms süren bir `bash` 205,8 ms alır; hedef < 10 ms. Havuz, kullanıcının shell'iyle açılan Session için hedefi tutturur; komutlu Session için tutturmaz.
- **Uzak tuş basımı.** Predictive echo olmadığı için tuş bir round trip bekler. Uzak bir Host için "< 10 ms'de görünür" hedefi tutmuyor.
- **Tuştan ekoya en büyük değer.** Bir çalıştırmadaki en büyük değer 3 ms ile 58 ms arasındadır; bazı çalıştırmalarda 10 ms'nin üstündedir. 99. yüzdelik hedefi tutturuyor.
- **Ölçülmeyenler.** Yeniden bağlanma süresi, daemon güncellemesi, yeniden başlatmadan sonraki ilk ekran, ağ değişimi ve desktop istemcisinin bütün hedefleri.

## Bu değerlerin sınırları

- Bu değerleri bir kişi tek bir makinede ölçtü. Onları ölçen bir CI job'ı yoktur; hedefin gerisine düşen bir build'i durduran bir CI job'ı da yoktur. [`bench/README.md`](https://github.com/nomux-sh/nomux/blob/v0.4.0/bench/README.md), bu job'ın holder ve daemon benchmark'larıyla birlikte geleceğini söyler. [#14](https://github.com/nomux-sh/nomux/issues/14) numaralı issue bu job'la ilgilidir ve nomux 0.4.0'da açıktır.
- "Tuştan ekoya" süresi, "local tuş basımından ekrana" hedefinin tamamı değildir. Bir terminal emülatörünün ya da desktop istemcisinin tuşu çizmesi için geçen süreyi içermez.
- Değerler kodla birlikte değişir. Güncel değerler kaynak dokümanların `main` branch'indeki hâlindedir.

VT kütüphanesinin seçiminde kullanılan ölçümler [ADR-0003](https://github.com/nomux-sh/docs/blob/main/adr/0003-vt-library.md)'te yer alır. Disk ve bellek bütçeleri [ADR-0009](https://github.com/nomux-sh/docs/blob/main/adr/0009-resource-budgets-for-disk-and-memory.md)'da yer alır.
