---
title: Katkıda bulunma
description: nomux'un katkı kuralları nerede yazar ve projenin hangi parçası hangi repoda durur.
---

Katkı kuralları [nomux-sh](https://github.com/nomux-sh) organizasyonunun bütün repolarında aynıdır.
Bu sayfa rehberlere bağlantı verir; içeriklerini tekrarlamaz. Rehberlerin hepsi İngilizcedir.

## Organizasyonun rehberleri

| Rehber | İçerik |
|---|---|
| [Katkı rehberi](https://github.com/nomux-sh/.github/blob/main/CONTRIBUTING.md) | Nereden başlanır, her commit'in sign-off'u (DCO), commit mesajlarının ve pull request'lerin biçimi, Rust kuralları ve lisans kuralları. |
| [Davranış kuralları](https://github.com/nomux-sh/.github/blob/main/CODE_OF_CONDUCT.md) | Bütün katılımcılar için geçerli davranış kuralları. |
| [Güvenlik politikası](https://github.com/nomux-sh/.github/blob/main/SECURITY.md) | Bir güvenlik açığı nasıl bildirilir. Açığı herkese açık bir issue'da bildirmeyin. |
| [Destek](https://github.com/nomux-sh/.github/blob/main/SUPPORT.md) | Hata nereye bildirilir, özellik isteği nereye yazılır. |
| [Sürüm rehberi](https://github.com/nomux-sh/.github/blob/main/RELEASING.md) | Sürüm numarası kuralları, changelog ve yayın adımları. |

Her repoda ayrıca o repoya özel kuralları içeren bir `AGENTS.md` dosyası vardır. Bu kurallar hem insanlar hem de coding agent'lar için geçerlidir.

## Repo haritası

- [`nomux`](https://github.com/nomux-sh/nomux): Rust ile yazılan çekirdek. Holder, daemon, istemci kütüphanesi ve CLI buradadır.
- [`proto`](https://github.com/nomux-sh/proto): istemci ile daemon arasındaki protokol. Şemalar, spesifikasyonlar ve `nomux-proto` crate'i buradadır.
- [`extension-api`](https://github.com/nomux-sh/extension-api): extension SDK'sı. Daemon ile bir extension'ın daemon parçası arasındaki protokol, `nomux-extension` crate'i ve `extension.toml` formatı buradadır.
- [`docs`](https://github.com/nomux-sh/docs): bu site, sözlük, yol haritası, mimari karar kayıtları ve araştırma notları.
- [`.github`](https://github.com/nomux-sh/.github): yukarıdaki tablodaki rehberler, organizasyon profili ve repoların ortak kullandığı CI workflow'ları.
- Henüz açılmamış repolar, iş onlara ihtiyaç duyduğunda açılır. Hangileri olduğunu [yol haritası](/docs/tr/project/roadmap/) söyler.

## Nereden başlamalı

- Bir hata ya da küçük bir değişiklik için, kodun bulunduğu repoda issue ya da pull request açın.
- Büyük bir değişiklik için önce issue açın ve tasarım üzerinde anlaşın.
- Mimariyi değiştiren iş bir mimari karar kaydıyla başlar. Bkz. [mimari kararlar](/docs/tr/reference/decisions/).
- Kodda, CLI'da ya da bir sayfada yeni bir ad kullanmadan önce onu [Sözlük](/docs/tr/reference/glossary/) sayfasına ekleyin.

Çekirdeği derlemek ve kontrol etmek için [`nomux` README'sindeki](https://github.com/nomux-sh/nomux#build) komutları, bu siteyi derlemek için de [`docs` README'sindeki](https://github.com/nomux-sh/docs#readme) komutları kullanın.

## Lisanslar

Kod `MIT OR Apache-2.0` ile, dokümantasyon [CC BY 4.0](https://creativecommons.org/licenses/by/4.0/deed.tr) ile lisanslıdır.
