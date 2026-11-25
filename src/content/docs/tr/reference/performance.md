---
title: Performans hedefleri
description: nomux'un performans hedefleri ve bugüne kadar ölçülen değerler; her biri nomux reposundaki kaynağıyla.
sidebar:
  label: Performans hedefleri
---

nomux'ta performans hedefleri özelliklerden önce gelir. Bir hedefi bozan değişiklik merge edilmez.
Bu sayfa hedefleri ve bugün ölçülmüş değerleri listeler. Her değerin kaynağı [`nomux`](https://github.com/nomux-sh/nomux) reposundadır; kaynak dokümanlar İngilizcedir.

## Hedefler

Bu tablonun kaynağı [`bench/README.md`](https://github.com/nomux-sh/nomux/blob/main/bench/README.md#targets) dosyasıdır.
"Sahibi" sütunu, hedefi projenin hangi parçasının ölçtüğünü gösterir.

| Ölçüm | Hedef | Sahibi | Ölçüldü mü |
|---|---|---|---|
| Local tuş basımından ekrana | < 10 ms | çekirdek + desktop | Çekirdek kısmı, CLI ile: [evet](#attach). Desktop kısmı: hayır |
| Uzak tuş basımının görünmesi (predictive echo) | < 10 ms; gerçek onay RTT + 5 ms içinde | çekirdek + desktop | Hayır |
| 10 MB/s çıktı seli | Arayüz 60 fps ya da üstü; girdi gecikmesi değişmez | çekirdek + desktop | Girdi gecikmesi, CLI ile: [evet](#attach). Arayüz: hayır |
| Yeni Session'ın başlaması (warm pool) | < 10 ms | çekirdek | Hayır |
| Ağ değişimi | Bağlantı açık kalır | çekirdek | Hayır |
| Kopmadan sonra yeniden bağlanma | < 1 s, veri kaybı yok | çekirdek | Hayır |
| Daemon güncellemesi ya da çökmesi | Hiçbir Session durmaz | çekirdek | Çökme: test ediliyor. Güncelleme: hayır |
| Yeniden başlatmadan sonra ilk ekran | < 1 s (lazy restore) | çekirdek | Hayır |
| Boşta bekleyen `nomuxd`'nin RAM'i | < 10 MB | çekirdek | [Evet](#daemon) |
| Session başına bir holder'ın RAM'i | < 3 MB (scrollback diskte) | çekirdek | [Evet](#holder) |
| `nomux-holder` binary'sinin boyutu | < 1 MB | çekirdek | [Evet](#holder) |
| `nomuxd` binary'sinin boyutu | < 10 MB | çekirdek | [Evet](#daemon) |
| Desktop'ın soğuk açılışı | < 300 ms | desktop | Hayır |
| Desktop'ın boştaki RAM'i | < 80 MB; arka planda < 40 MB | desktop | Hayır |
| Desktop'ın boştaki CPU'su | Yaklaşık % 0 (CI'da bütçe) | desktop | Hayır |

"Hayır", hedefin ilgilendirdiği parçanın henüz var olmadığı ya da kayıtlı bir ölçümün bulunmadığı anlamına gelir.
İşlerin sırasını [yol haritası](/docs/tr/project/roadmap/) gösterir.

[`tests/session_lifecycle.rs`](https://github.com/nomux-sh/nomux/blob/main/tests/session_lifecycle.rs) dosyasındaki uçtan uca testler daemon'u ve process group'unu `SIGKILL` ile öldürür ve Session'ın yaşamaya devam ettiğini doğrular.
[`tests/attach.rs`](https://github.com/nomux-sh/nomux/blob/main/tests/attach.rs) ise daemon'u attach sırasında öldürür ve yeni attach'in aynı ekranı gösterdiğini doğrular.

## Ölçülen değerler

Değerler, kaynak dokümanların [`v0.1.0`](https://github.com/nomux-sh/nomux/tree/v0.1.0) etiketindeki değerleridir.
Hepsi Linux x86-64 üzerinde, release profiliyle ölçülmüştür. macOS'te ve aarch64'te yapılmış bir ölçüm yoktur.
"glibc", makinenin C kütüphanesine dinamik bağlanan build'dir. "musl" ise sürüm arşivlerine giren statik build'dir.

### Attach

Kaynak: [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/main/docs/daemon.md#measurements) dosyasının "Measurements" bölümü.

"Tuştan ekoya" süresi, tek bir tuşun `nomux attach` terminaline yazılmasından o tuşun ekosunun aynı terminale gelmesine kadar geçen süredir. Session `cat` çalıştırır; tuşun ekosunu Session'ın terminali verir.
Bu yolda CLI, daemon, holder ve Session'ın terminali vardır; her biri iki kez. Ağ ve desktop istemcisi yoktur; yani bu ölçüm "local tuş basımından ekrana" hedefinin çekirdek kısmıdır.

| Ölçüm | Medyan | 99. yüzdelik | Hedef |
|---|---|---|---|
| Tuştan ekoya, local Session | 0,2 ms – 0,5 ms | 0,5 ms – 5,4 ms | < 10 ms |
| Tuştan ekoya, attach olunmuş ikinci bir Session'da 10 MB/s çıktı seli varken | 0,2 ms – 0,5 ms | 1,4 ms – 4,7 ms | Kayda değer değişim yok |
| Tuştan ekoya, attach olunmuş ikinci bir Session'da sınırsız çıktı seli varken (istemcisine 19 MB/s – 36 MB/s) | 0,2 ms – 0,8 ms | 3,1 ms – 5,3 ms | Kayda değer değişim yok |

[`tests/measurements/attach.rs`](https://github.com/nomux-sh/nomux/blob/main/tests/measurements/attach.rs) programı aralarında 2 ms bırakarak 2000 tuş yazar. Her aralık 3 çalıştırmanın sonucudur.
Bir çalıştırmadaki en büyük değer 3 ms ile 58 ms arasındadır: başka iş de yapan bir bilgisayarda birkaç tuş scheduler'ı bekler. Yani en büyük değer bazı çalıştırmalarda hedefin üstündedir.
Programın nasıl çalıştırılacağı [`tests/README.md`](https://github.com/nomux-sh/nomux/blob/main/tests/README.md#measurements) dosyasında yazar.

| Ölçüm | Sonuç | Hedef |
|---|---|---|
| Hiç çıktı almayan bir istemciye 32 MiB'lık çıktı seli giderken daemon'un resident belleğindeki artış | 8 MiB'ın altında; bu, testin sınırıdır | Bellek, çıktının uzunluğuyla büyümez |

### Holder

Kaynak: [`docs/holder.md`](https://github.com/nomux-sh/nomux/blob/main/docs/holder.md#measurements) dosyasının "Measurements" bölümü.

| Ölçüm | Sonuç | Hedef |
|---|---|---|
| `nomux-holder` boyutu (glibc) | 560 KB | < 1 MB |
| `nomux-holder` boyutu (musl) | 652 KB | < 1 MB |
| Resident bellek, `/bin/sh` çalıştıran boştaki holder (glibc) | 2,6 MB | < 3 MB |
| Resident bellek, ring buffer dolu (glibc) | 2,9 MB | < 3 MB |
| Resident bellek, ring buffer ve program raporları dolu (glibc) | 3,2 MB | < 3 MB: tutmuyor |
| Resident bellek, `/bin/sh` çalıştıran boştaki holder (musl) | 0,7 MB | < 3 MB |
| Resident bellek, ring buffer dolu (musl) | 1,0 MB | < 3 MB |
| Resident bellek, ring buffer ve program raporları dolu (musl) | 1,3 MB | < 3 MB |
| Boştayken 10 saniyedeki CPU süresi ve context switch sayısı | 0 ve 0 | 0 |
| 128 MiB'lık dosyanın `cat` çıktısının holder'dan geçişi, düz metin | 71 MiB/s | Hedef yok |
| 128 MiB'lık dosyanın `cat` çıktısının holder'dan geçişi, renkli kelimeler | 84 MiB/s | Hedef yok |
| 32 MiB'lık dosyanın `cat` çıktısının holder'dan geçişi, her satırda bir program durumu raporu | 54 MiB/s | Hedef yok |

Ring buffer, holder'ın bir Session'ın en son çıktısını tuttuğu bellektir.
"Program raporları dolu", bir programın oluşturabileceği en büyük durumdur: 64 program durumu kaydı ve 16 bildirim, hepsi en uzun metinlerle. Hedefini tutturamayan tek değer budur: ring buffer'ı ve program raporları dolu glibc build'i. Sürüm arşivlerinde musl build'i bulunur.
Aynı doküman, ekran state'inin 80 x 24 hücrelik bir pencerede resident belleğe yaklaşık 0,2 MB eklediğini söyler.

Üç çıktı hızı, o sırada başka iş de yapan bir makinedeki 11 çalıştırmanın en iyisidir. Aynı dokümana göre medyan % 10 – % 15 daha düşüktür.

### Daemon

Kaynak: [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/main/docs/daemon.md#measurements) dosyasının "Measurements" bölümü. Ölçüm komutları da aynı bölümdedir.

| Ölçüm | Sonuç | Hedef |
|---|---|---|
| `nomuxd` boyutu (glibc) | 878 KiB (899504 bayt) | < 10 MB |
| `nomuxd` boyutu (musl) | 974 KiB (996952 bayt) | < 10 MB |
| Resident bellek, Session'sız boştaki daemon (glibc) | 2,9 MB | < 10 MB |
| Resident bellek, 2 Session'lı boştaki daemon (glibc) | 3,1 MB | < 10 MB |
| Resident bellek, 1 Session'lı ve 1 istemcinin attach olduğu boştaki daemon (glibc) | 3,1 MB | < 10 MB |
| Resident bellek, 1 Session'lı boştaki daemon (musl) | 1,1 MB | < 10 MB |
| 2 Session'lı boştaki daemon'un 30 saniyedeki CPU süresi ve context switch sayısı | 0 ve 0 | 0 |
| 1 istemcinin attach olduğu boştaki daemon'un 30 saniyedeki CPU süresi ve context switch sayısı | 0 ve 0 | 0 |

### CLI

CLI için bir hedef yoktur. Boyutu glibc ile 943 KiB (966104 bayt), musl ile 1045 KiB'tır (1069952 bayt); kaynağı yine [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/main/docs/daemon.md#measurements) dosyasının aynı bölümüdür.

### 0.1.0 arşivindeki binary'ler

Bu boyutlar bir dokümandan alınmadı. [0.1.0 sürümünün](https://github.com/nomux-sh/nomux/releases/tag/v0.1.0) `nomux-0.1.0-x86_64-unknown-linux-musl.tar.gz` arşivindeki üç dosyanın boyutlarıdır; bu sayfa için `ls -l` ile okundu.

| Binary | Boyut | Hedef |
|---|---|---|
| `nomux-holder` | 660144 bayt (645 KiB) | < 1 MB |
| `nomuxd` | 997016 bayt (974 KiB) | < 10 MB |
| `nomux` | 1074120 bayt (1049 KiB) | Hedef yok |

## Bu değerlerin sınırları

- Bu değerleri bir kişi tek bir makinede ölçtü. Onları ölçen bir CI job'ı yoktur; hedefin gerisine düşen bir build'i durduran bir CI job'ı da yoktur. [`bench/README.md`](https://github.com/nomux-sh/nomux/blob/main/bench/README.md), bu job'ın holder ve daemon benchmark'larıyla birlikte geleceğini söyler.
- "Tuştan ekoya" süresi, "local tuş basımından ekrana" hedefinin tamamı değildir. Bir terminal emülatörünün ya da desktop istemcisinin tuşu çizmesi için geçen süreyi içermez.
- Holder'ın bellek hedefi scrollback'in diskte durduğunu varsayar. Holder bugün scrollback tutmuyor.
- Değerler kodla birlikte değişir. Güncel değerler iki kaynak dokümanın `main` branch'indeki hâlindedir.

VT kütüphanesinin seçiminde kullanılan ölçümler [ADR-0003](https://github.com/nomux-sh/docs/blob/main/adr/0003-vt-library.md)'te yer alır.
