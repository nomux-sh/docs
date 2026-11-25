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
| Local tuş basımından ekrana | < 10 ms | çekirdek + desktop | Hayır |
| Uzak tuş basımının görünmesi (predictive echo) | < 10 ms; gerçek onay RTT + 5 ms içinde | çekirdek + desktop | Hayır |
| 10 MB/s çıktı seli | Arayüz 60 fps ya da üstü; girdi gecikmesi değişmez | çekirdek + desktop | Hayır |
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

## Ölçülen değerler

Bütün değerler Linux x86-64 üzerinde, release profiliyle ölçülmüştür. macOS'te ve aarch64'te yapılmış bir ölçüm yoktur.
"glibc", makinenin C kütüphanesine dinamik bağlanan build'dir. "musl" ise sürüm arşivlerine giren statik build'dir.

### Holder

Kaynak: [`docs/holder.md`](https://github.com/nomux-sh/nomux/blob/main/docs/holder.md#measurements) dosyasının "Measurements" bölümü.

| Ölçüm | Sonuç | Hedef |
|---|---|---|
| `nomux-holder` boyutu (glibc) | 538 KB | < 1 MB |
| `nomux-holder` boyutu (musl) | 636 KB | < 1 MB |
| Resident bellek, `/bin/sh` çalıştıran boştaki holder (glibc) | 2,6 MB | < 3 MB |
| Resident bellek, ring buffer dolu (glibc) | 2,8 MB | < 3 MB |
| Resident bellek, `/bin/sh` çalıştıran boştaki holder (musl) | 0,7 MB | < 3 MB |
| Resident bellek, ring buffer dolu (musl) | 0,9 MB | < 3 MB |
| Boştayken 10 saniyedeki CPU süresi ve context switch sayısı | 0 ve 0 | 0 |
| 128 MiB'lık dosyanın `cat` çıktısının holder'dan geçişi, düz metin | 82 MiB/s | Hedef yok |
| 128 MiB'lık dosyanın `cat` çıktısının holder'dan geçişi, renkli kelimeler | 110 MiB/s | Hedef yok |

Ring buffer, holder'ın bir Session'ın en son çıktısını tuttuğu bellektir.
İki çıktı hızı 5 çalıştırmanın medyanıdır. Aynı doküman, tek bir binary'nin iki ölçüm seti arasında % 10 fark verdiğini de söyler.

### Daemon

Kaynak: [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/main/docs/daemon.md#measurements) dosyasının "Measurements" bölümü. Ölçüm komutları da aynı bölümdedir.

| Ölçüm | Sonuç | Hedef |
|---|---|---|
| `nomuxd` boyutu (glibc) | 772 KiB (790272 bayt) | < 10 MB |
| `nomuxd` boyutu (musl) | 866 KiB (886264 bayt) | < 10 MB |
| Resident bellek, Session'sız boştaki daemon (glibc) | 2,8 MB | < 10 MB |
| Resident bellek, 2 Session'lı boştaki daemon (glibc) | 2,9 MB | < 10 MB |
| Resident bellek, 1 Session'lı boştaki daemon (musl) | 1,0 MB | < 10 MB |
| 2 Session'lı boştaki daemon'un 30 saniyedeki CPU süresi ve context switch sayısı | 0 ve 0 | 0 |

### CLI

CLI için bir hedef yoktur. Boyutu glibc ile 819 KiB'tır (838936 bayt); kaynağı yine [`docs/daemon.md`](https://github.com/nomux-sh/nomux/blob/main/docs/daemon.md#measurements) dosyasının aynı bölümüdür.

## Bu değerlerin sınırları

- Bu değerleri bir kişi tek bir makinede ölçtü. Onları ölçen bir CI job'ı yoktur; hedefin gerisine düşen bir build'i durduran bir CI job'ı da yoktur. [`bench/README.md`](https://github.com/nomux-sh/nomux/blob/main/bench/README.md), bu job'ın holder ve daemon benchmark'larıyla birlikte geleceğini söyler.
- Holder'ın bellek hedefi scrollback'in diskte durduğunu varsayar. Holder bugün scrollback tutmuyor.
- Değerler kodla birlikte değişir. Güncel değerler iki kaynak dokümandadır.

VT kütüphanesinin seçiminde kullanılan ölçümler [ADR-0003](https://github.com/nomux-sh/docs/blob/main/adr/0003-vt-library.md)'te yer alır.
