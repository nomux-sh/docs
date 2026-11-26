---
title: Extension yazmak
description: Bir nomux extension'ının daemon parçasını Rust, TypeScript ya da Go ile yazın, manifest'ini kontrol edin ve kurun. Kod, SDK README'lerinde.
---

Bir extension'ın daemon parçası bir programdır. Host'taki daemon onu bir istemci ihtiyaç duyduğunda başlatır, boşta kalınca durdurur.
Host ve program, programın standart girdisi ile standart çıktısında mesajlaşır. Bu yüzden bayt okuyup yazabilen her dilde extension yazabilirsiniz.
Bir SDK protokolü sizin yerinize halleder: framing'i, handshake'i, metotlarınızı, host servislerinin çağrılarını, olayları, iptali ve kapanışı.

Bu sayfa bilerek kısa tutuldu. Hangi SDK'yı alacağınızı ve sonucu ne yapacağınızı söyler. Kod her SDK'nın README'sinde; bu sayfa onu kopyalamaz.
Bu sayfadaki çıktılar, nomux 0.4.0'ın Linux'taki gerçek çıktısıdır.

## Bir SDK seçmek

Üç SDK de [`extension-api`](https://github.com/nomux-sh/extension-api) reposundandır. Aynı parçalara sahiptirler ve aynı conformance suite her birini kendi `echo` örneğiyle kontrol eder. 1.0.0'dan önceki sürümler pre-release'tir: arayüzler minor sürümler arasında değişebilir.

| Dil | SDK | Sürüm | Gerekenler | Rehber |
|---|---|---|---|---|
| Rust | crate [`nomux-extension`](https://crates.io/crates/nomux-extension) | 0.1.3 | Bir Rust toolchain'i | Reponun README'sindeki [Write an extension](https://github.com/nomux-sh/extension-api#write-an-extension) bölümü ve [docs.rs](https://docs.rs/nomux-extension) |
| TypeScript | paket [`@nomux-sh/extension`](https://www.npmjs.com/package/@nomux-sh/extension) | 0.1.3 | Extension'ı çalıştıran Host'ta Node.js 22 ya da üstü | [TypeScript SDK'nın README'si](https://github.com/nomux-sh/extension-api/blob/main/sdk/typescript/README.md) |
| Go | modül `github.com/nomux-sh/extension-api/sdk/go` | v0.1.3 | Derlemek için Go 1.26 ya da üstü | [Go SDK'nın README'si](https://github.com/nomux-sh/extension-api/blob/main/sdk/go/README.md) |

Bir Python SDK'sı planlanıyor ([issue #5](https://github.com/nomux-sh/extension-api/issues/5)). Henüz yok.

SDK sürümleri bu sayfa için registry'lerden okundu: crates.io, npm ve Go module proxy.
nomux 0.4.0, `nomux-extension` 0.1.1'e karşı derlenir; yani extension API'si 0.1.1'dir. Extension API sürümü SDK paketinin sürümünden ayrıdır: 0.1.3 sürümündeki SDK'lar extension API 0.1.1'i uygular. Varsayılan olarak bir extension, kullandığı her özelliği taşıyan en düşük sürümü ister: `^0.1.0`. Sonraki bir özelliği kullanan extension, aynı minimumla sürümü `api` alanında belirtir. Bir adapter `^0.1.1` ister. Kuralın tam hâli, README'deki [sürümleme kuralları](https://github.com/nomux-sh/extension-api#versioning-rules) ile protokolün spesifikasyonundaki [version rule](https://github.com/nomux-sh/extension-api/blob/main/spec/extension-protocol.md#version-rule) bölümündedir.

Her SDK programınız için aynı kuralları getirir:

- Standart çıktı protokolü taşır. Log'larınızı standart hataya yazın.
- Host metotlarınızı birer birer çağırır. Bir metot beklerken extension health isteklerine cevap vermeye ve iptalleri kaydetmeye devam eder.
- Extension'ınız hızlı başlayan küçük bir programdır. Her SDK'nın `echo` örneği 30 ms'den kısa sürede başlar; program 0.6 MB (Rust) ile 3.7 MB (Go) arasındadır. TypeScript bundle'ı 77 KB'tır ve Node.js ister. Tablo ve ölçüm yöntemi reponun README'sinde.

## Manifest'i yazmak

Programın yanına `extension.toml` manifest'ini yazarsınız. Bu, Go'daki `echo` örneğinin manifest'idir. Rust ve TypeScript örneklerinin manifest'leri buna çok yakındır:

```toml
[extension]
id = "nomux.echo-go"
name = "Echo (Go)"
version = "0.1.0"
api = "^0.1"

[daemon]
command = "bin/nomux-echo"
lazy = true
```

`command`, paketteki bir yoldur. TypeScript örneğinin daemon parçasında, tek bir bundle dosyasıyla `node` çalıştıran bir launcher script'i vardır; Go ve Rust örnekleri binary'dir.
Extension bir dosyaya, bir programa, ağa ya da host'un bir servisine ihtiyaç duyuyorsa manifest'te bir `[permissions]` tablosu bulunur ve kullanıcı extension'ı kurarken her izni onaylar: kullanıcının ne gördüğünü [Extension'lar](/docs/tr/guides/extensions/) sayfası gösterir. Bir agent aracının hook olaylarını okuyan extension bir [adapter](/docs/tr/guides/agent-adapters/)'dır.

`nomux ext validate` bir manifest'i daemon olmadan kontrol eder. Bunlar, reponun `main` branch'inden okunan üç `echo` örneğinin manifest'leridir:

```console
$ nomux ext validate echo
extension.toml is valid: nomux.echo 0.1.0 (Echo) asks for no permissions
$ nomux ext validate echo-typescript
extension.toml is valid: nomux.echo-typescript 0.1.0 (Echo (TypeScript)) asks for no permissions
$ nomux ext validate echo-go
extension.toml is valid: nomux.echo-go 0.1.0 (Echo (Go)) asks for no permissions
```

Komut yalnızca manifest'i kontrol eder. `nomux ext install` ayrıca paketin daemon parçasının programını içerdiğinden emin olur.

## Kurmak ve çağırmak

Paket, `extension.toml` ve programı içeren bir dizindir. Programınızı derleyin, dosyaları bir dizine koyun ve kurun. `nomux ext install`, `ext ls`, `ext call` ve `ext rm` komutlarını gerçek çıktılarıyla [Extension'lar](/docs/tr/guides/extensions/) sayfası gösterir.

## Host extension'a ne verir

- Olaylar: bir extension olay gönderebilir. `nomux events --follow --filter extension-event` onu yazdırır.
- Host servisleri: daemon `sessions.list` (kapsam `sessions:read`) ve adapter'lar için `agent.report` ile `agent.child` (kapsam `agent:report`) sağlar. Daemon yeni bir servisi, ona ihtiyaç duyan resmi extension'la birlikte alır.
- Daemon yalnızca host servislerinin kapsamlarını uygular. Bir extension'ın dosyalarını, programlarını ve ağ erişimini henüz kısıtlamaz. İstediği izinlere uyan bir extension yazın.

## Henüz olmayanlar

- Extension'ın arayüz parçası (bir WASM component'i) SDK'larda yok ve hiçbir istemci onu yüklemiyor. Desktop istemcisi henüz yok.
- Bir proje şablonu (`cargo-generate`) yok. Resmi bir extension SDK'nın biçimini kanıtladıktan sonra gelecek.
- Extension'ları listeleyen bir registry yok ve hiçbir resmi extension'ın release'i yok. İki resmi extension'ı kaynağından nasıl derleyeceğinizi [Extension'lar](/docs/tr/guides/extensions/) sayfası anlatır.
