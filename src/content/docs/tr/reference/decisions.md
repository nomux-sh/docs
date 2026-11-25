---
title: Mimari kararlar
description: nomux'ta mimari karar kaydı (ADR) nedir, kayıtlar nerede durur ve bir karar nasıl değişir.
---

Mimari karar kaydı (ADR) tek bir tasarım kararını anlatır: bağlam, karar, sonuçları ve değerlendirilen alternatifler.
nomux mimarisinde yapılacak her değişiklik bir ADR ile başlar.

## Kayıtlar nerede

ADR'ler, `nomux-sh/docs` reposunun [`adr/` klasöründe](https://github.com/nomux-sh/docs/tree/main/adr) düz Markdown dosyaları olarak durur.
Yalnızca İngilizce yazılırlar.

[ADR dizini](https://github.com/nomux-sh/docs/blob/main/adr/README.md) her kaydı başlığı ve durumuyla listeler.
Bu listenin tek kaynağı o dizindir; site ayrıca bir kopyasını tutmaz.

## Bir karar nasıl değişir

- Yeni kayıt `Proposed` (önerildi) durumuyla açılır. Tartışma, kaydın pull request'inde yürür.
- Maintainer'lar anlaşınca durum `Accepted` (kabul edildi) ya da `Rejected` (reddedildi) olur.
- Kabul edilmiş bir kaydın kararı sonradan değiştirilmez. Karar değişecekse eskisinin yerine yeni bir kayıt yazılır ve eski kayıt yenisine işaret eder.
- Kabul edilmiş bir kayıt baştan yazılmaz. Karar aynı kalıyor ama yeni bilgiler uygulanışını değiştiriyorsa kayda tarihli bir ek (amendment) bölümü eklenir.

Sürecin tamamı ve durum değerlerinin anlamı [ADR dizininde](https://github.com/nomux-sh/docs/blob/main/adr/README.md#process) yazar.
