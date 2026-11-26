---
title: Extension'lar
description: nomux CLI ile bir extension'ı onayladığınız izinlerle kurun, listeleyin, çağırın, devre dışı bırakın ve kaldırın.
---

Extension nomux'a bir özellik ekler. Daemon parçası, Host'taki daemon'un ilk çağrıda başlattığı ve boşta kalınca durdurduğu bir programdır.
Bu sayfa bir extension'ı CLI ile nasıl kullanacağınızı gösterir. Extension yazmak için [Extension yazmak](/docs/tr/guides/write-an-extension/) sayfasını ve [extension SDK](https://github.com/nomux-sh/extension-api#write-an-extension)'yı okuyun. Modeli [Extension'lar](/docs/tr/concepts/extensions/) kavram sayfası anlatır.

Bu sayfadaki çıktılar, nomux 0.4.0'ın Linux'ta geçici bir home dizininde (`/tmp/nomux-demo`) verdiği gerçek çıktılardır.

## Hangi extension'lar var

Resmi extension'lar `git` ve `agent-claude` 0.1.0 sürümüyle yayında; arşivleri [sürümler sayfasında](https://github.com/nomux-sh/extensions/releases). Registry yok: arşivi açın, `nomux ext install` dizinden kurar.
Bu sayfada iki extension kullanılıyor; ikisi de bu çalıştırma için kaynağından derlendi. Üçüncüsünün yalnızca manifest'i kontrol ediliyor:

| Extension | Kimlik | Kaynak | Manifest'teki izinler |
|---|---|---|---|
| Echo | `nomux.echo` | SDK'nın örneği: `v0.1.1` etiketindeki [`extension-api/examples/echo`](https://github.com/nomux-sh/extension-api/tree/v0.1.1/examples/echo) | Yok |
| Git | `nomux.git` | `extensions` reposunun `main` branch'indeki [`git`](https://github.com/nomux-sh/extensions/tree/main/git) dizini. 0.1.0 sürümü [sürümler sayfasında](https://github.com/nomux-sh/extensions/releases) | `fs=${worktree}`, `process=git` |
| Claude Code adapter'ı | `nomux.agent-claude` | `extensions` reposunun `main` branch'indeki [`agent-claude`](https://github.com/nomux-sh/extensions/tree/main/agent-claude) dizini. 0.1.0 sürümü [sürümler sayfasında](https://github.com/nomux-sh/extensions/releases) | `scope=hooks:read`, `scope=agent:report` |

Claude Code adapter'ı Claude Code'un durumunu bildirir. Bu sayfa yalnızca manifest'ini kontrol eder. Onu derlemeyi, kurmayı ve kullanmayı [Claude Code adapter'ı](/docs/tr/guides/claude-code/) rehberi anlatır.

Echo örneğini `v0.1.1` etiketinden derleyin. nomux 0.4.0 bir extension'a extension API'nin 0.1.1 sürümünü sunar. SDK'nın `main` branch'indeki örnek 0.1.2 sürümü için derlenmiştir: host onu `the extension API version is not compatible` mesajıyla reddeder.

Paket, `extension.toml` manifest'ini ve manifest'in `[daemon]` tablosunda adı geçen programı içeren bir dizindir. Git extension'ının derleme adımları [extension'ın README'sinde](https://github.com/nomux-sh/extensions/tree/main/git#readme):

```sh
cargo build --release -p nomux-git
mkdir -p package/bin
cp git/extension.toml package/
cp target/release/nomux-git package/bin/
```

Echo örneğinin adımları `extension-api` reposunda aynıdır:

```sh
cargo build --release -p nomux-echo
mkdir -p package/bin
cp examples/echo/extension.toml package/
cp target/release/nomux-echo package/bin/
```

## Paketi kontrol etmek

`nomux ext validate` bu bilgisayardaki bir dizinin manifest'ini kontrol eder. Daemon gerekmez:

```console
$ nomux ext validate ./nomux-echo
extension.toml is valid: nomux.echo 0.1.0 (Echo) asks for no permissions
$ nomux ext validate ./nomux-git
extension.toml is valid: nomux.git 0.1.0 (Git) asks for the permissions: fs=${worktree} process=git
$ nomux ext validate ./nomux-agent-claude
extension.toml is valid: nomux.agent-claude 0.1.0 (Claude Code adapter) asks for the permissions: scope=hooks:read scope=agent:report
```

Geçersiz bir manifest'te her sorun, alanın yoluyla birlikte ayrı bir satırda yazar ve çıkış kodu 1 olur:

```console
$ nomux ext validate ./broken
extension.toml is not valid:
  `extension.id` must have two or more parts with `.` between them, in 64 characters at most. A part starts with a lower-case letter and has only lower-case letters, digits and `-`
```

`validate` paketin diğer dosyalarına bakmaz. `install` ayrıca paketin daemon parçasının programını içerdiğinden emin olur.

## İzinlerle kurmak

Extension yalnızca sizin onayladığınız izinleri alır. Hiçbir komut soru sormadığından onayı komut satırında verirsiniz.
Onay yoksa `install` extension'ın ne istediğini yazdırır, hiçbir şey kurmaz ve 4 çıkış koduyla biter:

```console
$ nomux ext install ./nomux-git
nomux: the extension nomux.git 0.1.0 asks for these permissions:
  fs=${worktree}
  process=git
Nothing was installed. To install the extension, approve its permissions: add --grant-all, or --grant <permission> for each permission that you approve. For a directory that starts with ${worktree}, give a directory: --grant fs=<directory>
```

| Komut satırı | Sonuç |
|---|---|
| Bir ya da daha fazla `--grant <izin>` | Extension bu izinleri alır, istediği diğer izinleri almaz |
| `--grant-all` | Extension istediği her izni alır; yalnızca `${worktree}` ile başlayan dizini almaz |
| `--grant-all --grant fs=<dizin>` | Aynısı, artı `${worktree}` için verilen dizin |
| Seçenek yok ve manifest hiç izin istemiyor | Extension kurulur |

Bir izin şu biçimlerden birindedir: `fs=<dizin>`, `process=<program>`, `network` ya da `scope=<kapsam>`. `${worktree}` ile başlayan bir öğe için mutlak bir yol verin.

Yalnızca `--grant-all` ile git extension'ı `process=git` alır, dizin almaz. Aynı extension'ı ikinci kez kurmak 1 çıkış koduyla hata verir:

```console
$ nomux ext install ./nomux-git --grant-all
extension nomux.git 0.1.0 installed with the permissions: process=git
$ nomux ext install ./nomux-git --grant-all --grant fs=/tmp/nomux-demo/project
nomux: the extension `nomux.git` is already installed
```

İzinleri değiştirmek ya da yeni bir sürüm kurmak için extension'ı kaldırıp yeniden kurun. Manifest'in istemediği bir izin için `--grant` 1 çıkış koduyla hata verir ve hiçbir şey kurulmaz:

```console
$ nomux ext rm nomux.git
extension nomux.git removed
$ nomux ext install ./nomux-git --grant network
nomux: the manifest does not ask for the permission `network`
$ nomux ext install ./nomux-git --grant-all --grant fs=/tmp/nomux-demo/project
extension nomux.git 0.1.0 installed with the permissions: fs=/tmp/nomux-demo/project process=git
$ nomux ext install ./nomux-echo
extension nomux.echo 0.1.0 installed with no permissions
```

Daemon paketi kopyalar; kurulumdan sonra kaynak dizinde yaptığınız bir değişiklik hiçbir şeyi değiştirmez. Pakette yalnızca normal dosyalar ve dizinler olabilir: daemon sembolik link'i reddeder.
`install` hiçbir process başlatmaz; bunu ilk çağrı yapar.

Bir kapsam, bir host servisine ya da daemon'un olaylarına erişim verir. nomux 0.4.0'ın üç kapsamı var:

| Kapsam | Verdiği |
|---|---|
| `sessions:read` | `sessions.list` host servisi: Host'taki Session'lar |
| `agent:report` | `agent.report` ve `agent.child` host servisleri: bir Agent çalışmasının ve Alt işlerinin durumu |
| `hooks:read` | Manifest'teki `[adapter]` tablosunda adı geçen araçların hook olayları |

`[adapter]` tablosu bir extension'ı bir agent aracının [adapter'ı](/docs/tr/guides/agent-adapters/) yapar. Extension API'nin `^0.1.1` sürümünü ister; `nomux.agent-claude` manifest'inde de böyledir.

:::caution
nomux 0.4.0'da daemon yalnızca kapsamları (`sessions:read`, `agent:report` ve `hooks:read`) uygular. Onaylanan diğer izinleri (`fs`, `process` ve `network`) extension'a iletir; bunlara uymak extension'ın işidir. Extension'ın process'i daemon'la aynı dosya erişimine sahiptir.
Git extension'ı izinlerini her istekte kendisi uygular; kuralları [README'sinde](https://github.com/nomux-sh/extensions/tree/main/git#permissions).
Yalnızca kaynağına güvendiğiniz extension'ları kurun.
:::

## Listelemek

```console
$ nomux ext ls
ID          NAME  VERSION  STATE    PERMISSIONS                             REASON
nomux.echo  Echo  0.1.0    stopped  -
nomux.git   Git   0.1.0    stopped  fs=/tmp/nomux-demo/project,process=git
```

| Durum | Anlamı |
|---|---|
| `stopped` | Extension etkin ama process'i çalışmıyor. Sonraki çağrı onu başlatır |
| `starting` | Process başladı ama henüz hazır değil |
| `running` | Process çalışıyor. 60 saniye çağrı gelmezse durur |
| `failed` | Process çöktü. Bir süre bekledikten sonra gelen çağrı onu yeniden başlatır. `REASON` hatayı söyler |
| `disabled` | Daemon extension'ı başlatmaz. `REASON` nedenini söyler: siz devre dışı bıraktınız ya da art arda 5 kez çöktü |

Kurulu ama hiç çağrılmayan bir extension'ın process'i yoktur; daemon'a maliyeti bir listedeki tek bir kayıttır.

## Çağırmak

`nomux ext call` bir extension'ın tek bir metodunu çağırır ve sonucun payload'ını standart çıktıya, başka hiçbir bayt eklemeden yazar. Komut script'ler ve testler içindir.
Payload'lar bayttır; kodlamalarını metot belirler. Bu sayfadaki iki extension'ın metotları protobuf mesajları kullanır.

Bu, git extension'ının `status` metodunu `/tmp/nomux-demo/project` içindeki Git reposu için çağırıyor. `status-request.bin` dosyasında `repository` alanı bu dizin olan bir `StatusRequest` mesajı var. Mesajların şemaları extension'ın [`proto`](https://github.com/nomux-sh/extensions/tree/main/git/proto/nomux/git/v1) dizininde.

```console
$ nomux ext call nomux.git status --payload @status-request.bin > status-response.bin
$ wc -c status-response.bin
23 status-response.bin
$ nomux ext ls
ID          NAME  VERSION  STATE    PERMISSIONS                             REASON
nomux.echo  Echo  0.1.0    stopped  -
nomux.git   Git   0.1.0    running  fs=/tmp/nomux-demo/project,process=git
```

Çağrı extension'ın process'ini başlattı. Bu çalıştırmadaki repo, `main` branch'inde yeni bir repodur ve git'in izlemediği tek bir dosyası var. Sonuç 23 baytlık bir `StatusResponse` mesajı.

Örnekteki `echo` metodu aldığı mesajı geri verir. Payload'ı `hi` metnini taşıyan bir protobuf mesajı:

```console
$ printf '\n\002hi' > request.bin
$ nomux ext call nomux.echo echo --payload @request.bin > response.bin
$ od -c response.bin
0000000  \n 002   h   i
0000004
```

`--payload <metin>` bir metnin baytlarını, `--payload @<dosya>` bir dosyanın içeriğini gönderir. Seçenek yoksa payload boştur.

| Sonuç | Çıkış kodu |
|---|---|
| Metot bir sonuç verdi | 0 |
| Bu kimlikte extension yok ya da extension'da bu metot yok | 2 |
| Extension 30 saniye içinde cevap vermedi | 3 |
| Extension gerekli izni olmadığını söyledi | 4 |
| Extension devre dışı, process'i başlayamıyor ya da çöktü, veya başka bir hatayla cevap verdi | 1 |

```console
$ nomux ext call nomux.echo nothing
nomux: the extension answered with an error: the extension has no method `nothing`
$ nomux ext call nomux.echo echo
nomux: the extension answered with an error: the text is empty
```

Bir extension'ın çökmesi kendi process'inde kalır. Daemon, Session'lar ve diğer extension'lar çalışmaya devam eder.

## Olaylar

Bir extension olay gönderebilir. Daemon olayı olay günlüğüne yazar, bir istemci de günlüğü `nomux events --follow` ile okur. Örnekteki `echo` metodu her çağrıda metninin uzunluğunu taşıyan `echoed` olayını gönderir.

`--filter extension-event` yalnızca extension olaylarını yazdırır. Bu komutu bir terminalde başlatın, ikinci terminalde `nomux ext call nomux.echo echo --payload @request.bin` çalıştırın:

```console
$ nomux events --follow --filter extension-event
2 extension nomux.echo: echoed (2 bytes)
```

Bir satırda olayın günlükteki sırası (daemon yeniden başlayınca numara yeniden başlar), extension'ın kimliği, olayın adı ve payload'ının boyutu bulunur. `--json` ile her olay tek satırlık bir JSON belgesidir. Payload base64'tür, çünkü kodlamayı extension seçer. Buradaki `CAI=`, uzunluğu 2 olan bir protobuf mesajıdır:

```console
$ nomux --json events --follow --filter extension-event
{"schema_version":1,"event":{"seq":3,"at_ms":1795691297643,"type":"extension_event","extension":{"id":"nomux.echo","name":"echoed","payload_base64":"CAI="}}}
```

Komut yalnızca başladıktan sonraki olayları yazdırır; `Ctrl-C` ile 0 çıkış koduyla biter. Daemon son 1024 olayı bellekte tutar ve payload'ı 64 KiB'tan büyük olayı atar. [Agent durumu](/docs/tr/guides/agent-status/) sayfası aynı komutu durum olayları için kullanır.

## Devre dışı bırakmak, etkinleştirmek ve kaldırmak

```console
$ nomux ext disable nomux.echo
extension nomux.echo disabled
$ nomux ext call nomux.echo echo --payload @request.bin
nomux: the extension nomux.echo: the extension is disabled: the user disabled the extension
$ nomux ext enable nomux.echo
extension nomux.echo enabled
```

`disable` extension'ın process'ini durdurur. Ardından `nomux ext ls` durumu `disabled`, nedeni `the user disabled the extension` olarak gösterir. `enable`, daemon'un art arda 5 çökmeden sonra devre dışı bıraktığı bir extension'ı da yeniden etkinleştirir.

`rm` process'i durdurur; paketi, onaylanan izinleri ve extension'ın çalışma dizinini siler:

```console
$ nomux ext rm nomux.echo
extension nomux.echo removed
$ nomux ext rm nomux.echo
nomux: no extension has the identifier nomux.echo
$ nomux ext ls
ID         NAME  VERSION  STATE    PERMISSIONS                             REASON
nomux.git  Git   0.1.0    running  fs=/tmp/nomux-demo/project,process=git
$ nomux ext rm nomux.git
extension nomux.git removed
$ nomux ext ls
no extensions
```

Bu kimlikte extension yoksa `enable`, `disable` ve `rm` 2 çıkış koduyla biter.

## Extension'lar nerede durur

| Bilgisayar | Dizin |
|---|---|
| Linux | `~/.local/share/nomux/extensions` |
| macOS | `~/Library/Application Support/nomux/extensions` |

Dizinin modu 0700'dür. İçinde paketler, her extension'ın onaylanan izinleri ve çalışma dizini bulunur. Kurulu bir extension Host yeniden başladıktan sonra da yerinde durur.

Extension'lar bir Host'a aittir. `--host <ad>` ile `ext` komutları bir [uzak Host'un](/docs/tr/guides/remote-hosts/) daemon'unu kullanır; `install`'a verilen dizin de o Host'taki mutlak bir yoldur. `ext validate` her zaman sizin bilgisayarınızdaki bir dizini okur.

## Bu sürümün sınırları

Bu maddeler nomux 0.4.0'ın [`docs/extensions.md`](https://github.com/nomux-sh/nomux/blob/v0.4.0/docs/extensions.md#not-done-yet) dosyasından:

- Daemon bir extension'ın dosyalarını, programlarını ve ağ erişimini kısıtlamaz.
- Daemon'un üç host servisi var: `sessions.list` (`sessions:read` kapsamı) ile adapter'lar için `agent.report` ve `agent.child` (`agent:report` kapsamı).
- Registry'den kurulum, imza kontrolü ve güncelleme komutu yok.
- Daemon bir extension'a olayı yalnızca bir adapter'ın `hook` metodunun çağrısı olarak gönderir. Hiçbir istemci bir extension'ın arayüz parçasını göstermez.
- Daemon bir extension'ın process'ini durdurduğunda, extension'ın başlattığı process'ler çalışmaya devam eder.

Her `ext` komutu JSON belgesiyle birlikte [CLI başvurusunda](/docs/tr/reference/cli/). Bu sayfadaki terimler [Sözlük](/docs/tr/reference/glossary/)'ten gelir.
