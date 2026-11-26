---
title: Extension yazmak
description: Bir nomux extension'ının daemon parçasını Rust, TypeScript ya da Go ile yazın, manifest'ini ve SDK'yı uyumluluk paketiyle kontrol edin ve kurun. Kod SDK README'lerindedir.
---

Bir extension'ın daemon parçası bir programdır. Host'taki daemon, bir istemci ona ihtiyaç duyduğunda programı başlatır, boşta kalınca durdurur.
Host ve program, programın standart girdisinde ve standart çıktısında mesaj alışverişi yapar. Bu yüzden bayt okuyup yazabilen her dilde bir extension yazabilirsiniz.
Bir SDK protokolü sizin için yapar: çerçeveleme, el sıkışma, metotlarınız, host servis çağrıları, olaylar, iptal ve kapanış.

Bu sayfa bilerek kısadır. Hangi SDK'yı alacağınızı ve sonucuyla ne yapacağınızı söyler. Kod her SDK'nın README'sinde ve her SDK'nın `echo` örneğindedir; bu sayfa onu kopyalamaz.
Bu sayfadaki çıktılar, nomux 0.5.0'ın Linux'ta verdiği gerçek çıktılardır. Üç `echo` örneği, [`extension-api`](https://github.com/nomux-sh/extension-api) reposunun `v0.1.3` etiketinden derlendi ve nomux 0.5.0 daemon'una kuruldu.

## Bir SDK seçmek

Üç SDK da [`extension-api`](https://github.com/nomux-sh/extension-api) reposundandır. Aynı parçalara sahiptirler ve aynı uyumluluk paketi her birini kendi `echo` örneğiyle kontrol eder. 1.0.0'dan önceki sürümler pre-release'tir: arayüzler minor sürümler arasında değişebilir.

| Dil | SDK | Sürüm | Gerekenler | Rehber |
|---|---|---|---|---|
| Rust | [`nomux-extension`](https://crates.io/crates/nomux-extension) crate'i | 0.1.3 | Bir Rust toolchain'i | Reponun README'sindeki [Write an extension](https://github.com/nomux-sh/extension-api#write-an-extension) ve [docs.rs](https://docs.rs/nomux-extension) |
| TypeScript | [`@nomux-sh/extension`](https://www.npmjs.com/package/@nomux-sh/extension) paketi | 0.1.3 | Extension'ı çalıştıran Host'ta Node.js 22 ya da üstü | [TypeScript SDK'nın README'si](https://github.com/nomux-sh/extension-api/blob/main/sdk/typescript/README.md) |
| Go | `github.com/nomux-sh/extension-api/sdk/go` modülü | v0.1.3 | Derlemek için Go 1.26 ya da üstü | [Go SDK'nın README'si](https://github.com/nomux-sh/extension-api/blob/main/sdk/go/README.md) |

Bir Python SDK'sı planlanıyor ([issue #5](https://github.com/nomux-sh/extension-api/issues/5), açık). Henüz yok.

Her SDK'nın en yeni sürümü bu sayfa için kayıt sunucusundan okundu: crates.io, npm ve Go modül proxy'si. Üçünde de 0.1.3 var. nomux 0.5.0, `nomux-extension` 0.1.3 ile derlenir. Extension API sürümü SDK sürümünden ayrıdır: 0.1.3 sürümündeki SDK'lar extension API 0.1.1'i uygular ve nomux 0.5.0 API 0.1.1'i sunar. Bir extension varsayılan olarak host'tan, SDK'sının kullandığı her özelliği içeren en düşük sürümü ister: `^0.1.0`. Daha sonraki bir özelliği kullanan extension, sürümü `api` alanında aynı minimumla yazar. Bir adapter `^0.1.1` gerektirir. `^0.1.2` ya da daha yenisini isteyen bir manifest nomux 0.5.0'da kurulmaz: host `the extension needs the extension API version ^0.1.2, but the host supplies 0.1.1` der. Tam kural için README'deki [sürümleme kuralları](https://github.com/nomux-sh/extension-api#versioning-rules) ve protokoldeki [sürüm kuralı](https://github.com/nomux-sh/extension-api/blob/main/spec/extension-protocol.md#version-rule) bölümüne bakın.

Her SDK, programınız için aynı kurallara sahiptir:

- Standart çıktı protokolü taşır. Günlüklerinizi standart hataya yazın.
- Host metotlarınızı tek tek çağırır. Bir metot beklerken extension yine de sağlık isteklerini cevaplar ve iptalleri kaydeder.
- Extension'ınız hızlı başlayan küçük bir programdır. Reponun README'sinde, her SDK'nın `echo` örneğinin başlangıç süresi, program boyutu ve boştaki belleği bir tabloda ve nasıl ölçüldüğüyle birlikte var. Bu sayfa onları yeniden ölçmedi.

## Örnekten başlamak

Her SDK'nın bir örneği var: `echo` extension'ı; bir metot ve bir olay. SDK'nın uyumluluk extension'ıdır ve SDK için en kısa çalışan koddur. Kendi dilinizin örneğinden başlayın:

| Dil | Örnek | Derleme |
|---|---|---|
| Rust | [`examples/echo`](https://github.com/nomux-sh/extension-api/tree/v0.1.3/examples/echo) | `cargo build --release -p nomux-echo` |
| TypeScript | [`examples/echo-typescript`](https://github.com/nomux-sh/extension-api/tree/v0.1.3/examples/echo-typescript) | Reponun kökünde `npm ci` ve `npm run build --workspaces` |
| Go | [`examples/echo-go`](https://github.com/nomux-sh/extension-api/tree/v0.1.3/examples/echo-go) | `CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o bin/nomux-echo .` |

Rust toolchain sürümü repoda sabitlidir, rustup onu kurar. Bu çalıştırmada üç derleme de bu komutlarla çalıştı. TypeScript örneği `dist/main.js` dosyasını (80 KB) üretir ve `exec node "$(dirname "$0")/../dist/main.js"` çalıştıran bir `bin/nomux-echo` başlatıcısı vardır.

## Manifest'i yazmak

Programın yanına `extension.toml` manifest'ini yazarsınız. Bu, Go'daki `echo` örneğinin manifest'idir. Rust ve TypeScript örneklerinin manifest'leri buna yakındır:

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

`command`, paketteki bir yoldur. TypeScript örneğinin paketinde, `node`'u tek bir bundle dosyasıyla çalıştıran bir başlatıcı script'i vardır; Go ve Rust örnekleri ise binary'dir.
Extension bir dosyaya, bir programa, ağa ya da host'un bir servisine ihtiyaç duyuyorsa manifest'te bir `[permissions]` tablosu bulunur ve kullanıcı extension'ı kurarken her izni onaylar: kullanıcının ne gördüğünü [Extension'lar](/docs/tr/guides/extensions/) sayfası gösterir. Bir agent aracının hook olaylarını okuyan extension bir [adapter](/docs/tr/guides/agent-adapters/)'dır.
Repoda manifest'in [JSON Schema](https://github.com/nomux-sh/extension-api/blob/main/schema/extension.schema.json) dosyası da var.

`nomux ext validate` bir manifest'i daemon olmadan kontrol eder. Bunlar üç `echo` örneğinin paketleridir:

```console
$ nomux ext validate ./nomux-echo
extension.toml is valid: nomux.echo 0.1.0 (Echo) asks for no permissions
$ nomux ext validate ./nomux-echo-typescript
extension.toml is valid: nomux.echo-typescript 0.1.0 (Echo (TypeScript)) asks for no permissions
$ nomux ext validate ./nomux-echo-go
extension.toml is valid: nomux.echo-go 0.1.0 (Echo (Go)) asks for no permissions
```

Komut yalnızca manifest'i kontrol eder. `nomux ext install` ayrıca paketin daemon parçasının programını içerdiğini kontrol eder.

## SDK'yı uyumluluk paketiyle kontrol etmek

[Uyumluluk paketi](https://github.com/nomux-sh/extension-api/tree/v0.1.3/conformance), `nomux-conformance` adlı bir Rust programıdır. Bir extension programını daemon'un yaptığı gibi başlatır ve ona karşı 20 durum çalıştırır: el sıkışma, sürüm kuralı, çağrılar, hatalar, host servisleri, olaylar, iptal, sağlık istekleri, bozuk çerçeveler, kapanış ve art arda 1000 çağrı. Bir SDK, `echo` extension'ı her durumu geçtiğinde doğrudur. Paketin README'sinde komutlar var:

```sh
cargo build -p nomux-conformance
target/debug/nomux-conformance --manifest examples/echo-go/extension.toml -- examples/echo-go/bin/nomux-echo
```

Bu çalıştırmada üç SDK'nın `echo` extension'ının her biri `all cases passed` ile bitti. `nomux-conformance --list` durumları ve her birinin neyi incelediğini yazdırır.

## Kurmak ve çağırmak

Paket, `extension.toml` ve programı içeren bir dizindir. Programınızı derleyin, dosyaları bir dizine koyun ve kurun. `nomux ext install`, `ext ls`, `ext call` ve `ext rm` komutlarını gerçek çıktıyla [Extension'lar](/docs/tr/guides/extensions/) sayfası gösterir. Bu, Go örneğidir:

```console
$ nomux ext install ./nomux-echo-go
extension nomux.echo-go 0.1.0 installed with no permissions
$ nomux ext call nomux.echo-go echo --payload @request.bin | od -c
0000000  \n 002   h   i
0000004
$ nomux ext rm nomux.echo-go
extension nomux.echo-go removed
```

`request.bin` dosyası, `hi` metnini içeren `Text` protobuf mesajını taşır. Üç örnek de aynı sonucu verdi.

## Host bir extension'a ne verir

- Olaylar: bir extension olay gönderebilir. `nomux events --follow --filter extension-event` onu yazdırır.
- Host servisleri: daemon `sessions.list` (`sessions:read` kapsamı) ve adapter'lar için `agent.report` ile `agent.child` (`agent:report` kapsamı) servislerini sunar. Daemon yeni bir servisi, ona ihtiyaç duyan resmi extension ile birlikte alır.
- Daemon yalnızca host servislerinin kapsamlarını uygular. Bir extension'ın dosyalarını, programlarını ve ağını henüz kısıtlamaz. İstediği izinlere uyan bir extension yazın.

## Henüz olmayanlar

- Bir extension'ın UI parçası (bir WASM bileşeni) SDK'larda yok ve hiçbir istemci onu yüklemiyor. Desktop istemcisi henüz yok.
- Bir proje şablonu (`cargo-generate`) repoda yok. Reponun README'si, ilk resmi extension SDK'nın biçimini kanıtladıktan sonra geleceğini söyler.
- Extension'ları listeleyen bir registry yok ve `nomux ext install` yalnızca bir dizin okur. İki resmi extension'ın birer release arşivi var: nasıl kullanılacağını [Extension'lar](/docs/tr/guides/extensions/) sayfası söyler.
