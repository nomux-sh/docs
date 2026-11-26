---
title: "Session'lar: adlar, hedefler ve attach"
description: Bir Session'a ad verin, hedefle Session bulun, tek komutla açıp attach olun, hedefsiz attach edin ve attach sırasındaki prefix tuşlarını kullanın ya da değiştirin.
---

Bir Session'ın, daemon'un verdiği ve hiç değişmeyen bir session kimliği vardır. Ayrıca sizin verdiğiniz ve değiştirebileceğiniz bir session adı da olabilir.
Bu sayfa adları, bir komutun Session'ı nasıl bulduğunu (hedef), açıp attach olmanın kısa yollarını ve attach sırasındaki prefix tuşlarını anlatır.

Bu sayfadaki çıktılar, nomux 0.5.0'ın Linux'taki gerçek çıktısıdır. Sizdeki session kimlikleri ve process ID'leri farklı olacaktır.
İlk adımları [hızlı başlangıç](/docs/tr/guides/quick-start/) gösterir. Her seçenek [CLI başvurusunda](/docs/tr/reference/cli/) yer alır.

## Adlar

`nomux new -n <ad>` Session'a bir ad verir. `nomux ls` o zaman `NAME` sütununu da gösterir; adı olmayan Session için `-` yazar:

```console
$ nomux new -n api -- sleep 600
y747cduz
$ nomux new -n api-v2 -- sleep 600
y2mq6b3w
$ nomux new -- sleep 600
dct67ccd
$ nomux ls
ID        NAME    STATE    PID      COMMAND
dct67ccd  -       running  4056052  sleep 600
y2mq6b3w  api-v2  running  4056049  sleep 600
y747cduz  api     running  4056043  sleep 600
```

Adın kuralları:

- Ad 1 ile 64 karakter uzunluğundadır ve `A-Z`, `a-z`, `0-9`, `.`, `_` ile `-` karakterlerinden oluşur. İlk karakter harf ya da rakam olmalıdır. Büyük ve küçük harf farklıdır: `api` ile `API` iki ayrı addır.
- Ad, Host'ta bitmemiş Session'lar arasında benzersizdir.
- Ad, başka bir Session'ın session kimliği olamaz.
- Uykudaki (dormant) Session adını korur; Host yeniden başlasa da. Biten Session adını `nomux ls --all` çıktısında korur ve yeni bir Session o adı hemen alabilir.

Geçersiz bir ad ya da başka bir Session'ın kullandığı ad 1 çıkış koduyla biter ve Session açmaz. Kullanılan ad için verilen mesaj, o Session'a nasıl attach olunacağını söyler:

```console
$ nomux new -n api -- sleep 600
nomux: the name api is in use by session y747cduz. Run `nomux new -A -n api` to attach to it, or give a different name
$ nomux new -n "my api" -- sleep 600
nomux: the session name "my api" is not valid: a name has 1 to 64 characters from A-Z, a-z, 0-9, '.', '_' and '-', and starts with a letter or a digit
```

`nomux rename <hedef> <yeni-ad>` bir Session'ın adını değiştirir. Şu anki adın aynısını vermek başarılıdır ve bir şey değiştirmez. Başka bir Session'ın adını vermek 1 çıkış koduyla biter:

```console
$ nomux rename api-v2 web
session y2mq6b3w is now named web
$ nomux rename web api
nomux: the name api is in use by session y747cduz
```

Biten bir Session'ın adı değiştirilemez; çıkış kodu 2 olur.

## Hedefler

Bir Session alan her komut bir **hedef** alır. Hedef; session kimliği, session adı ya da ikisinden birinin başıdır. Komut şu adımları sırayla dener. Session bulan ilk adım kazanır:

| Adım | Hedef | Adımın taradığı Session'lar |
|---|---|---|
| 1 | Session kimliği | Her Session, biten de dahil |
| 2 | Session adı | Bitmemiş Session'lar |
| 3 | Tam olarak bir Session'ın kimliğinin ya da adının başı | Bitmemiş Session'lar |

Bu yüzden tam ad, aynı harflerle başlayan daha uzun bir adın önüne geçer. Yukarıdaki iki Session ile `api` birinci Session'dır; `api-v2`'nin başı sayılmaz.

3. adım birden fazla Session bulursa komut hiçbir şey yapmaz. Adayları yazdırır ve 1 çıkış koduyla biter:

```console
$ nomux capture ap
nomux: ap can be more than one session. Give more of the identifier or of the name of one of them:
  y2mq6b3w  api-v2  sleep 600
  y747cduz  api     sleep 600
```

`--json` ile hata dokümanında `candidates` alanı bulunur. Her adayın kimliğini, adını ve durumunu listeler:

```console
$ nomux --json capture ap
{"schema_version":1,"error":{"code":1,"kind":"error","message":"ap can be more than one session. Give more of the identifier or of the name of one of them:\n  y2mq6b3w  api-v2  sleep 600\n  y747cduz  api     sleep 600","candidates":[{"id":"y2mq6b3w","name":"api-v2","state":"running"},{"id":"y747cduz","name":"api","state":"running"}]}}
```

Hiçbir adım Session bulamazsa çıkış kodu 2 olur:

```console
$ nomux capture zzz
nomux: no session has the identifier or the name zzz, and no session has a name or an identifier that starts with it
```

`-t <hedef>`, tmux alışkanlığı için argümanla aynı işi yapar: `nomux attach -t api`. Yardım metni bunu göstermez.
Bir script adın başını değil, tam adı ya da kimliği kullanmalıdır: yeni bir Session bir başı belirsiz yapabilir. Ayrıntı için [Session'ları script'lemek](/docs/tr/guides/scripting-sessions/) sayfasına bakın.

## Tek komutla açmak ve attach olmak

`nomux new -a` (`--attach`) Session'ı açar ve terminalinizi ona bağlar. Bir adla birlikte:

```console
$ nomux new -n work -a -- sh
sh-5.3$ echo hi
hi
sh-5.3$
detached from session work (rwxrhrjw)
```

`nomux new -A -n <ad>` (`--attach-or-create`), o adı taşıyan Session'a attach olur; yoksa Session'ı açar ve attach olur. `-n` gerekir, `-a` ile birlikte kullanılamaz.
Session varsa komut ve `--cwd` kullanılmaz; standart hatadaki bir satır bunu söyler:

```console
$ nomux new -A -n work -- sleep 5
nomux: session work exists: the command and --cwd are not used
sh-5.3$ echo hi
hi
sh-5.3$ echo again
again
sh-5.3$
detached from session work (rwxrhrjw)
```

Kararı daemon tek adımda verir. Bu yüzden aynı anda çalışan iki `nomux new -A -n race` tek bir Session açar ve ikisi de ona attach olur.
Session uykudaysa `-A`, `attach` gibi komutunu yeniden başlatır: ayrıntıyı [Yeniden başlatmadan sonra](/docs/tr/guides/after-a-restart/) sayfasında bulursunuz.

İki seçenek de standart girdide bir terminal gerektirir. Terminal yoksa komut 1 çıkış koduyla başarısız olur ve Session açmaz.

## Attach

`nomux attach <hedef>`, siz detach olana ya da Session bitene kadar Session'ı terminalinizde gösterir. `nomux a` kısa biçimidir.

Hedef vermezseniz `nomux attach`, en son bir istemcinin attach olduğu Session'ı alır. Henüz hiçbir istemci attach olmadıysa en son açılan Session'ı alır. Daemon son attach zamanını belleğinde tutar; bu yüzden daemon yeniden başladıktan sonra en son açılan Session kazanır.

```console
$ nomux ls
ID        NAME   STATE    PID      COMMAND
fcmnpcb5  older  running  4061960  sh
tmrd3rsm  newer  running  4061968  sh
$ nomux attach
detached from session newer (tmrd3rsm)
$ nomux a older
detached from session older (fcmnpcb5)
$ nomux attach
detached from session older (fcmnpcb5)
```

İlk `attach`'in kullanacağı bir önceki attach yoktur; bu yüzden en son açılan `newer`'i alır. `nomux a older`'dan sonra son attach `older`'ındır.

Komutsuz, yalın `nomux` bir terminalde aynısını yapar: `nomux attach`'in seçtiği Session'a attach olur. Host'ta hiç Session yoksa shell'inizle bir Session açar ve ona attach olur.
Standart girdide ve standart çıktıda terminal yoksa yalın `nomux` yardımı standart hataya yazar ve 1 çıkış koduyla biter.

İki seçenek, attach'in Session'ın diğer istemcilerine yaptığını değiştirir:

- `-d` (`--detach-others`) önce Session'ın diğer istemcilerini, `nomux detach` gibi, detach eder. Diğer terminaller `detached from session <session>` yazar.
- `-r` (`--read-only`) Session'ı gösterir; ona hiçbir tuş ve pencere boyutu göndermez. Session boyutunu korur. Prefix tuşları yine çalışır; yani `Ctrl-a d` detach eder.

Salt okunur bir attach Session'ın çıktısını gösterir; başka bir istemcinin ya da `nomux send`'in yazdığı da buna dahildir. Siz oraya ne yazarsanız hiçbir yere gitmez.

## Prefix tuşları

Bir attach'te her tuş Session'a gider. **Prefix tuşu** bunun istisnasıdır: nomux'un kendine ayırdığı her tuştan önce gelir. Varsayılan prefix tuşları, GNU screen'in tuşu `Ctrl-a` ile nomux 0.4.0'ın tuşu `Ctrl-\`'dir. İkisi aynı anda geçerlidir.

| Tuşlar | Ne olur |
|---|---|
| Bir prefix tuşu, sonra `d` | Detach. Session yaşamaya devam eder |
| Bir prefix tuşu, sonra `Ctrl-d` | Aynısı; `Ctrl` tuşunu hâlâ basılı tutan kullanıcı için |
| Prefix tuşuna iki kez basmak | Session bir prefix tuşu alır |
| `Ctrl-a`, sonra `a` | Session, screen'deki gibi bir `Ctrl-a` alır. `Ctrl` ve harften oluşan başka bir prefix için o harf aynı işi yapar |
| Bir prefix tuşu, sonra `?` | Terminal penceresinin başlığı, sonraki tuşa kadar tuşları gösterir. Ekran değişmez |
| Bir prefix tuşu, sonra başka bir tuş | Session iki tuşu da alır |

Aldığı tuşları yazdıran bir test Session'ı (`cat -v`) bu tuşların etkisini gösterdi. `Ctrl-a Ctrl-a` ve `Ctrl-a a` için `^A`, `Ctrl-a x` için `^Ax`, `Ctrl-\ Ctrl-\` için `^\`, `Ctrl-a Ctrl-\` için `^A^\` aldı.

`Ctrl-a ?` varsayılan tuşlarla pencere başlığını şöyle ayarlar. `keys`, o çalıştırmadaki Session'ın adıdır:

```text
nomux keys: C-a d: detach, C-a C-a or C-a a: send C-a; C-\ d: detach, C-\ C-\: send C-\
```

Prefix tuşu sonraki tuşu bekler. Bu yüzden tek başına basılan bir `Ctrl-a` (shell'de satır başına gitme), sonraki tuşla birlikte ulaşır. `Ctrl-a`'dan sonra tabloda olmayan bir tuş, örneğin `Ctrl-a Ctrl-k`, prefix yokmuş gibi çalışır: Session iki tuşu da alır.

`nomux attach --help` aynı listeyi gösterir.

### Prefix tuşlarını değiştirmek

Aşağıdakilerden ayarlanmış ilki prefix tuşlarını belirler:

1. `nomux attach` ve `nomux new -a` komutlarının `--prefix <tuş>` seçeneği. İki tuş için iki kez verin.
2. `NOMUX_PREFIX` ortam değişkeni. İki tuşun arasına virgül koyun: `C-a,C-\`.
3. Yapılandırma dosyasındaki `[attach]` tablosunun `prefix` anahtarı.
4. Varsayılan: `Ctrl-a` ve `Ctrl-\`.

```console
$ nomux attach --prefix C-b api
$ NOMUX_PREFIX=C-b nomux attach api
```

Ayar, CLI'ı çalıştıran bilgisayarın yapılandırma dosyasındadır. Dosyanın yolu Linux'ta `~/.config/nomux/config.toml`, macOS'ta `~/Library/Application Support/nomux/config.toml` olur. `XDG_CONFIG_HOME` mutlak bir yolsa dosya `$XDG_CONFIG_HOME/nomux/config.toml` olur. [Kurulum sayfası](/docs/tr/guides/install/) bu dosyayı nomux'un diğer dosyalarıyla birlikte listeler.

```toml
[attach]
prefix = ["C-b"]
```

`prefix = "C-b"` da çalışır. Prefix `C-b` iken yardım `C-b d: detach, C-b C-b or C-b b: send C-b` yazar. Uzak Host ayarı değiştirmez: tuşları CLI, sizin bilgisayarınızda okur. Daemon `[attach]` tablosunu okumaz.

Bir tuşun biçimi `C-<x>` olur; `x` bir harf, `\`, `]`, `^`, `_`, `@` ya da `Space` olabilir. Bir listede en çok iki farklı tuş bulunur.
Programların ihtiyacı olduğu için bazı tuşlar prefix olamaz. Başka biçimdeki bir tuş geçersizdir:

```console
$ nomux attach --prefix C-c api
nomux: --prefix: the prefix key C-c cannot be used: programs need it (interrupt, end of input, backspace, tab, new line, Enter, flow control or suspend)
$ nomux attach --prefix 'C-[' api
nomux: --prefix: the prefix key "C-[" is not valid: give C-<x>, where x is a letter, \, ], ^, _, @ or Space, or give none
$ nomux attach --prefix C-a --prefix C-a api
nomux: --prefix: the prefix key C-a is two times in the list
```

`C-c`, `C-d`, `C-h`, `C-i`, `C-j`, `C-m`, `C-q`, `C-s` ve `C-z` birinci mesajı verir. `C-[` ile `c-a` ya da `x` gibi bir biçim ikinci mesajı verir. Bunların hepsi 1 çıkış koduyla biter.
`NOMUX_PREFIX` içindeki geçersiz bir tuş aynı hatayı, `--prefix` yerine `NOMUX_PREFIX` adıyla verir.
Yapılandırma dosyasında CLI dosyayı reddeder ve adını söyler:

```console
$ nomux attach api
nomux: the configuration file /home/user/.config/nomux/config.toml is not valid: the key `attach.prefix` the prefix key C-c cannot be used: programs need it (interrupt, end of input, backspace, tab, new line, Enter, flow control or suspend)
```

Geçersiz prefix ile `nomux new -a` Session açmaz.

### Prefix olmadan

`none` prefix'i kapatır: `--prefix none`, `NOMUX_PREFIX=none`, `prefix = "none"` ya da `prefix = []`. O zaman her tuş, `Ctrl-a` ve `Ctrl-\` dahil, Session'a gider ve hiçbir tuş detach etmez.
Başka bir terminalden `nomux detach <hedef>` ile detach edin ya da terminali kapatın.

### Session içinde Session

Bir Session'ın içinde `nomux attach` çalıştırırsanız prefix'i önce dıştaki istemci alır. Varsayılan tuşlarla `Ctrl-a a d` içteki istemciye bir `Ctrl-a` ve ardından `d` gönderir; yani içteki istemciyi detach eder:

```console
sh-5.3$ nomux attach inner
inner> echo in-inner
in-inner
inner>
detached from session inner (23lx2g57)
sh-5.3$
```

Ya da içteki istemciyi başka bir prefix ile başlatın: `nomux attach --prefix C-b inner`. O zaman `Ctrl-b d` içteki istemciyi, `Ctrl-a d` dıştaki istemciyi detach eder.

Terminal, tuşları kitty klavye protokolünün biçiminde gönderebilir; CLI prefix tuşlarını bu biçimde de bulur. Bu sayfa o durumu çalıştırmadı: kuralı [sürümün CLI dokümanı](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/cli.md) anlatır.

## Attach nasıl biter

| Olay | Mesaj | Çıkış kodu |
|---|---|---|
| Detach edersiniz, `nomux detach` istemciyi detach eder ya da terminal kapanır | `detached from session <session>` | 0 |
| Session'ın komutu biter | `session <session> ended with exit status <n>` | `<n>` |
| Bir sinyal komutu sonlandırır | `session <session> ended by signal <n>` | 128 + `<n>` |
| Daemon durur | Session'ın yaşadığını ve yeniden nasıl attach olunacağını söyleyen bir hata | 1 |
| Hiçbir Session eşleşmez ya da komut attach'ten önce bitmiştir | Bir hata | 2 |

`<session>`, adla birlikte kimliktir: `api (m4ab5ghi)`. Adı olmayan Session için yalnızca kimliktir.
`--json` ile attach bittikten sonra tek bir doküman yazdırır: alanları [Session'ları script'lemek](/docs/tr/guides/scripting-sessions/#json-ve-çıkış-kodları) sayfası gösterir.

## Sıradaki adımlar

- [Session'ları script'lemek](/docs/tr/guides/scripting-sessions/): `send`, `capture -f` ve `kill --all`.
- [tmux ve screen'den gelenler için](/docs/tr/guides/coming-from-tmux-and-screen/): alıştığınız komutlar ve tuşlar.
- [Yeniden başlatmadan sonra](/docs/tr/guides/after-a-restart/): uykudaki Session'lar adlarını korur.
