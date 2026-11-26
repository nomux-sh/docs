---
title: Performans hedefleri
description: nomux'un performans hedefleri ve bugüne kadar ölçülen değerler; her biri nomux reposundaki kaynağıyla.
sidebar:
  label: Performans hedefleri
---

nomux'ta performans hedefleri özelliklerden önce gelir. Bir hedefi bozan değişiklik merge edilmez.
Bu sayfa hedefleri ve bugün ölçülmüş değerleri listeler. Her değerin kaynağı [`nomux`](https://github.com/nomux-sh/nomux) reposundadır; kaynak dokümanlar İngilizcedir.

## Hedefler

Bu tablonun kaynağı [`bench/README.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/bench/README.md#targets) dosyasıdır.
"Sahibi" sütunu, hedefi projenin hangi parçasının ölçtüğünü gösterir.

| Ölçüm | Hedef | Sahibi | Ölçüldü mü |
|---|---|---|---|
| Local tuş basımından ekrana | < 10 ms | çekirdek + desktop | Çekirdek kısmı, CLI ile: [evet](#attach). Desktop kısmı: hayır |
| Uzak tuş basımının görünmesi (predictive echo) | < 10 ms; gerçek onay RTT + 5 ms içinde | çekirdek + desktop | SSH üzerinden onay: [evet](#uzak-hostlar). Predictive echo: yok |
| 10 MB/s çıktı seli | Arayüz 60 fps ya da üstü; girdi gecikmesi değişmez | çekirdek + desktop | Girdi gecikmesi, CLI ile: [evet](#attach). Arayüz: hayır |
| Yeni Session'ın başlaması (warm pool) | < 10 ms | çekirdek | Hayır |
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

[`tests/session_lifecycle.rs`](https://github.com/nomux-sh/nomux/blob/v0.3.0/tests/session_lifecycle.rs) dosyasındaki uçtan uca testler daemon'u ve process group'unu `SIGKILL` ile öldürür ve Session'ın yaşamaya devam ettiğini doğrular.
[`tests/attach.rs`](https://github.com/nomux-sh/nomux/blob/v0.3.0/tests/attach.rs) ise daemon'u attach sırasında öldürür ve yeni attach'in aynı ekranı gösterdiğini doğrular.

## Ölçülen değerler

Değerler, kaynak dokümanların [`v0.3.0`](https://github.com/nomux-sh/nomux/tree/v0.3.0) etiketindeki değerleridir.
Hepsi Linux x86-64 üzerinde, release profiliyle ölçülmüştür. macOS'te ve aarch64'te yapılmış bir ölçüm yoktur.
"glibc", makinenin C kütüphanesine dinamik bağlanan build'dir. "musl" ise sürüm arşivlerine giren statik build'dir.

### Attach

Kaynak: [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/docs/daemon.md#measurements) dosyasının "Measurements" bölümü.

"Tuştan ekoya" süresi, tek bir tuşun `nomux attach` terminaline yazılmasından o tuşun ekosunun aynı terminale gelmesine kadar geçen süredir. Session `cat` çalıştırır; tuşun ekosunu Session'ın terminali verir.
Bu yolda CLI, daemon, holder ve Session'ın terminali vardır; her biri iki kez. Ağ ve desktop istemcisi yoktur; yani bu ölçüm "local tuş basımından ekrana" hedefinin çekirdek kısmıdır.

| Ölçüm | Medyan | 99. yüzdelik | Hedef |
|---|---|---|---|
| Tuştan ekoya, local Session | 0,2 ms – 0,5 ms | 0,5 ms – 5,4 ms | < 10 ms |
| Tuştan ekoya, attach olunmuş ikinci bir Session'da 10 MB/s çıktı seli varken | 0,2 ms – 0,5 ms | 1,4 ms – 4,7 ms | Kayda değer değişim yok |
| Tuştan ekoya, attach olunmuş ikinci bir Session'da sınırsız çıktı seli varken (istemcisine 19 MB/s – 36 MB/s) | 0,2 ms – 0,8 ms | 3,1 ms – 5,3 ms | Kayda değer değişim yok |

[`tests/measurements/attach.rs`](https://github.com/nomux-sh/nomux/blob/v0.3.0/tests/measurements/attach.rs) programı aralarında 2 ms bırakarak 2000 tuş yazar. Her aralık 3 çalıştırmanın sonucudur.
Bir çalıştırmadaki en büyük değer 3 ms ile 58 ms arasındadır: başka iş de yapan bir bilgisayarda birkaç tuş scheduler'ı bekler. Yani en büyük değer bazı çalıştırmalarda hedefin üstündedir.
Programın nasıl çalıştırılacağı [`tests/README.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/tests/README.md#measurements) dosyasında yazar.

| Ölçüm | Sonuç | Hedef |
|---|---|---|
| Hiç çıktı almayan bir istemciye 32 MiB'lık çıktı seli giderken daemon'un resident belleğindeki artış | 8 MiB'ın altında; bu, testin sınırıdır | Bellek, çıktının uzunluğuyla büyümez |

### Uzak Host'lar

Kaynak: [`docs/remote.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/docs/remote.md#measurements) dosyasının "Measurements" bölümü.
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

Kaynak: [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/docs/daemon.md#measurements) dosyasının "Measurements" bölümü.

| Ölçüm | Medyan | 11 çalıştırmanın en yavaşı | Hedef |
|---|---|---|---|
| Daemon'un başlamasından eksiksiz bir `nomux ls --json`'a kadar; her biri 32 MiB journal'lı 50 uykudaki Session | 25,3 ms | 31,4 ms | İlk ekran için < 1 s |

- Bu ölçüm Session listesidir, bir Session'ın ilk ekranı değildir. Bir Session'ı geri yükleyip ekranını göstermenin süresi ölçülmedi.
- Dosyalar bir `tmpfs` dosya sistemindeydi; yani değerde disk maliyeti yoktur. Aynı doküman, boş page cache ile okumanın ölçülmediğini söyler.

| Ölçüm | Sonuç | Hedef |
|---|---|---|
| Resident bellek, 3 uykudaki ve 1 biten Session'lı boştaki daemon (glibc) | 4,3 MB | < 10 MB |
| 3 uykudaki ve 1 biten Session'lı boştaki daemon'un 30 saniyedeki CPU süresi ve context switch sayısı | 0 ve 0 | 0 |

### Holder

Kaynak: [`docs/holder.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/docs/holder.md#measurements) dosyasının "Measurements" bölümü. Bu değerlerdeki holder journal'ı yazar.

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

Ring buffer, holder'ın bir Session'ın en son çıktısını tuttuğu bellektir.
"Program raporları dolu", bir programın oluşturabileceği en büyük durumdur: 64 program durumu kaydı ve 16 bildirim, hepsi en uzun metinlerle.
İki değer hedefini tutturmuyor: ring buffer'ı dolu glibc build'i, program raporları dolu da olsa olmasa da. **Sürüm arşivlerinde musl build'i bulunur** ve o hedefi tutturur.

Çıktı hızları, o sırada başka iş de yapan bir makinedeki 11 çalıştırmanın en iyisidir. Aynı doküman, journal'ın çıktı selini % 15 – % 30 yavaşlattığını, holder'ın yine de 10 MB/s hedefinden 7 kat hızlı olduğunu söyler.

### Daemon

Kaynak: [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/docs/daemon.md#measurements) dosyasının "Measurements" bölümü. Ölçüm komutları da aynı bölümdedir.

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

Aynı dokümanda extension host'tan önceki build'lere ait eski satırlar da vardır. "Extension host ile" yazmayan satırlar daha eski bir ölçümden ve daha eski bir build'den gelir.

### CLI

CLI için bir hedef yoktur. SSH istemcisi onu büyüttü. Kaynak: [`docs/remote.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/docs/remote.md#measurements) dosyasının "Measurements" bölümü:

| `nomux` build'i (glibc) | Boyut |
|---|---|
| SSH istemcisi olmadan | 943 KiB (966104 bayt) |
| SSH istemcisiyle | 3822 KiB (3913456 bayt) |

`nomux` reposundaki [#47](https://github.com/nomux-sh/nomux/issues/47) numaralı issue bu boyutla ilgilidir.

### 0.3.0 arşivindeki binary'ler

Bu boyutlar bir dokümandan alınmadı. [0.3.0 sürümünün](https://github.com/nomux-sh/nomux/releases/tag/v0.3.0) `nomux-0.3.0-x86_64-unknown-linux-musl.tar.gz` arşivindeki üç dosyanın boyutlarıdır; bu sayfa için `tar -tvzf` ile okundu.

| Binary | Boyut | Hedef |
|---|---|---|
| `nomux-holder` | 725680 bayt (709 KiB) | < 1 MB |
| `nomuxd` | 1890216 bayt (1846 KiB) | < 10 MB |
| `nomux` | 4389032 bayt (4286 KiB) | Hedef yok |

## Bu değerlerin sınırları

- Bu değerleri bir kişi tek bir makinede ölçtü. Onları ölçen bir CI job'ı yoktur; hedefin gerisine düşen bir build'i durduran bir CI job'ı da yoktur. [`bench/README.md`](https://github.com/nomux-sh/nomux/blob/v0.3.0/bench/README.md), bu job'ın holder ve daemon benchmark'larıyla birlikte geleceğini söyler. [#14](https://github.com/nomux-sh/nomux/issues/14) numaralı issue bu job'la ilgilidir.
- "Tuştan ekoya" süresi, "local tuş basımından ekrana" hedefinin tamamı değildir. Bir terminal emülatörünün ya da desktop istemcisinin tuşu çizmesi için geçen süreyi içermez.
- Değerler kodla birlikte değişir. Güncel değerler kaynak dokümanların `main` branch'indeki hâlindedir.

VT kütüphanesinin seçiminde kullanılan ölçümler [ADR-0003](https://github.com/nomux-sh/docs/blob/main/adr/0003-vt-library.md)'te yer alır. Disk ve bellek bütçeleri [ADR-0009](https://github.com/nomux-sh/docs/blob/main/adr/0009-resource-budgets-for-disk-and-memory.md)'da yer alır.
