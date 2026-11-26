---
title: Agent durumu
description: Her Session'da, her Projede ve her Grupta neyin çalıştığını, neyin bittiğini ve neyin sizi beklediğini görün; bir Session'ın neden sizi beklediğini ve her durumun nereden geldiğini öğrenin.
---

nomux her Session'daki işin durumunu gösterir: çalışan bir agent, sizi bekleyen bir komut, görmediğiniz bir sonuç.
Her durumun bir kaynağı vardır. nomux bir tahmini asla gerçek gibi göstermez.

Bu sayfadaki çıktılar, nomux 0.5.0'ın Linux'ta verdiği gerçek çıktılardır. Çalıştırmanın home dizini `/home/user` olarak gösterilir. Sizdeki session kimlikleri farklı olacaktır.
Örneklerin çoğundaki programlar küçük shell script'leridir, çünkü hiçbir agent aracı çalışmadı. `fix-tests` örnekleri, adapter reposundaki Claude Code hook verisini kullanır: neyin çalıştığını ve neyin çalışmadığını [Claude Code adapter'ı](/docs/tr/guides/claude-code/) sayfası söyler.

## Beş durum

| Durum | Anlamı |
|---|---|
| `idle` | Hiçbir iş çalışmıyor, hiçbir şey beklemiyor. |
| `working` | İş çalışıyor. |
| `done` | İş tamamlandı, sonuç sizi bekliyor. |
| `needs you` | İş sizsiz devam edemez. Bir türü olabilir: `permission`, `question`, `auth` veya `prompt`. |
| `error` | İş bir hatayla durdu. |

Agent çalışması, bir Session'daki iştir. Alt işleri olabilir: subagent'lar, takım arkadaşları ve arka plan görevleri. Her Alt işin kendi durumu vardır.

## Her Session'ın durumunu görmek

`nomux status` her Session için bir satır yazdırır:

```console
$ nomux status
  SESSION   COMMAND                                       STATE                  FOR  MESSAGE
x 2vjh4l3j  ./report.sh error the build failed            error                  2s   the build failed
* 6llcmruq  ./report.sh working reading the source files  working                2s   reading the source files
+ egywe7xg  ./report.sh done all tests pass               done                   2s   all tests pass
! g55wwygt  ./osc.sh                                      needs you: permission  3s   may I install the linter?
  kbyhsoqx  /bin/bash                                     idle                   2s
! xaddp4zj  ./report.sh blocked run the tests?            needs you              1s   run the tests?
```

- İlk sütun bir işarettir: `!` needs you, `x` error, `+` done, `*` working. `idle` olan bir Session'ın işareti yoktur.
- `FOR`, durumda geçen süredir. Yeni bir mesaj onu sıfırlamaz.
- Satırlar session kimliği sırasındadır. Adı olan bir Session, kimliği yerine adını gösterir.
- Biten bir Session'ın satırı son sonucunu gösterir: bkz. [Biten Session'lar](#biten-sessionlar).

Bir Session'ın satırı, onun en acil durumunu gösterir. Sizi bekleyen bir Alt iş, Session'ı da sizi bekler yapar.
Aciliyet sırası şöyledir: `needs you`, sonra görmediğiniz `error`, sonra görmediğiniz `done`, sonra `working`, sonra diğerleri. Aciliyet eşitse en uzun bekleyen durum öne geçer.

### Alt işler, Projeler ve Gruplar

`--tree`, her Alt iş için Session'ının altına bir satır ekler; her seviye iki boşlukla girintilenir. Ayrıca Host'un [Gruplarını ve Projelerini](/docs/tr/guides/projects-and-groups/) da ekler:

```console
$ nomux status --tree
  NAME          COMMAND                                       STATE                  FOR  MESSAGE
x 2vjh4l3j      ./report.sh error the build failed            error                  2s   the build failed
+ egywe7xg      ./report.sh done all tests pass               done                   2s   all tests pass
  kbyhsoqx      /bin/bash                                     idle                   2s
! xaddp4zj      ./report.sh blocked run the tests?            needs you              2s   run the tests?
! Client work/                                                needs you: permission  3s   may I install the linter?
!   acme-web                                                  needs you: permission  3s   may I install the linter?
*     6llcmruq  ./report.sh working reading the source files  working                2s   reading the source files
!     g55wwygt  ./osc.sh                                      needs you: permission  3s   may I install the linter?
!       lint                                                  needs you: permission  3s   may I install the linter?
*       tests                                                 working                3s   running 120 tests
```

- Hiçbir Projeye ait olmayan Session'lar başta gelir. Sonra her Grup (adı `/` ile biter) ve her Proje, workspace ağacının sırasıyla gelir; bir Projenin Session'ları onun altındadır.
- `g55wwygt` Session'ı çalışıyor, Alt işi `lint` ise bir izin bekliyor. Bu yüzden Session'ın satırı `needs you: permission` gösterir.
- Bir Proje, Session'larının en acil durumunu gösterir. Bir Grup, Projelerinin ve Gruplarının en acil durumunu gösterir. Kural bir Session'daki kuralla aynıdır: önce `needs you`, sonra görmediğiniz `error` ve böyle devam eder. İki öğenin aciliyeti eşitse en eski bekleme öne geçer.
- Session'ı olmayan bir Grubun ya da Projenin durumu `-` olur. Hiçbir kaynağın bildirmediği bir Alt iş de `-` gösterir.
- Bir Grubun ya da Projenin durumu saklanmaz. İstemci onu, altındaki Session'lardan hesaplar.

`6llcmruq` ve `g55wwygt` Session'ları `acme-web` Projesindedir, çünkü çalışma dizinleri Projenin dizinidir. Bir Session'ın Projesini bulan kuralı ve Grup oluşturan komutları [Projeler ve Gruplar](/docs/tr/guides/projects-and-groups/) sayfası anlatır.

### Gördüğünüz sonuçlar

Bir `done` ya da `error` sonucu, siz görene kadar listede durur. Session'a attach olmak sonuçlarını görüldü olarak işaretler ve satırda `(seen)` yazar:

```console
$ nomux status
  SESSION   COMMAND                                       STATE                  FOR  MESSAGE
x 2vjh4l3j  ./report.sh error the build failed            error                  21s  the build failed
* 6llcmruq  ./report.sh working reading the source files  working                21s  reading the source files
+ egywe7xg  ./report.sh done all tests pass               done (seen)            21s  all tests pass
! g55wwygt  ./osc.sh                                      needs you: permission  22s  may I install the linter?
  kbyhsoqx  /bin/bash                                     idle                   22s
! xaddp4zj  ./report.sh blocked run the tests?            needs you              21s  run the tests?
```

Burada `nomux attach egywe7xg` çalıştırıldı, ardından detach tuşlarına basıldı. Bir sonucu yalnızca attach görüldü olarak işaretler.

## Bir Session neden sizi bekliyor

`needs you`'dan sonraki tür nedeni söyler:

| Tür | Anlamı |
|---|---|
| `permission` | Agent bir aracı çalıştırmak için izin ister. |
| `question` | Agent bir cevap bekler. |
| `auth` | Agent bir girişi bekler. |
| `prompt` | Agent, giriş prompt'unda bekler. İstediği hiçbir şey beklemiyor; bu yüzden Session'ın [hazırda bekletilmesi](/docs/tr/guides/hibernation/) hiçbir şeyi kaybettirmez. |

Mesaj, agent'ın ne sorduğunu söyler. Tür vermeyen bir program yalnızca `needs you` gösterir; yukarıdaki `xaddp4zj` gibi.
`prompt` türünü yalnızca bir [adapter](/docs/tr/guides/agent-adapters/) bildirir. `kind=prompt` olan bir program durumu kaydı, türsüz bir `needs you` gösterir. 0.1.0 sürümündeki Claude Code adapter'ı henüz `prompt` bildirmez: onun yerine neyi bildirdiğini [Claude Code adapter'ı](/docs/tr/guides/claude-code/#bu-sürümün-sınırları) sayfası söyler.

`nomux agent explain` bir durumun nereden geldiğini söyler. Session'ın durumunu kaynağıyla yazdırır, sonra her kaynağı karar verdikleri sırayla listeler:

```console
$ nomux agent explain g55wwygt
session g55wwygt: working for 22s, from program status; message from program status: fixing the failing test
most urgent with its Child work: needs you: permission for 22s, from program status; message from program status: may I install the linter?

sources, in the sequence in which they decide:
  adapter             nothing: no adapter extension reported a status
  program status      working: fixing the failing test (3 program status records in the terminal stream)
  self-report         nothing: no program of the session reported a status with `nomux status set`
  session restore     nothing: the session did not lose a process with work that ran or waited
  prompt marks        nothing: the shell of the session sent no prompt mark
  foreground program  nothing: the command of the session is in the foreground of its terminal

child work:
  lint: needs you: permission for 22s, from program status; message from program status: may I install the linter?
  tests: working for 22s, from program status; message from program status: running 120 tests
```

Bir öğeyi bildiren ilk kaynak, o öğenin durumunu verir. Hiçbir şey bildirmeyen bir kaynak da nedeniyle birlikte listede yer alır.

## Durum nereden gelir

| Sıra | Kaynak | Ne olduğu |
|---|---|---|
| 1 | adapter | Bir [adapter extension'ı](/docs/tr/guides/agent-adapters/) durumu agent aracının olaylarından bildirir. |
| 2 | program durumu (`program status`) | Bir program durumunu terminal çıktısına Program Status Protocol (OSC 7501) ile yazar. Claude Code, Codex ve Qwen Code bunu gönderir. |
| 3 | öz bildirim (`self-report`) | Session'daki bir program `nomux status set` çalıştırır. |
| 4 | session geri yükleme (`session restore`) | Session process'ini kaybetti. Durum, Session'ın o andaki durumudur. |
| 5 | prompt işaretleri (`prompt marks`) | Shell bir komutun başını ve sonunu işaretler (OSC 133). Tahmin. |
| 6 | ön plandaki program (`foreground program`) | Session'ın komutu olmayan bir program terminali tutuyor. Tahmin. |

İlk dördü bir programın ya da Host'un bildirimidir. Son ikisi tahmindir ve CLI onları `(guess)` ile işaretler.
[ADR-0007](https://github.com/nomux-sh/docs/blob/main/adr/0007-status-source-order.md) sırayı ve nedenini kaydeder.

Burada biri, `kbyhsoqx` Session'ının shell'ine `sleep 30` yazdı. Shell hiçbir prompt işareti göndermedi; bu yüzden tek kaynak ön plandaki programdır:

```console
$ nomux status | grep kbyhsoqx
* kbyhsoqx  /bin/bash                                     working (guess)        0s
$ nomux agent explain kbyhsoqx
session kbyhsoqx: working (guess) for 0s, from foreground program

sources, in the sequence in which they decide:
  adapter             nothing: no adapter extension reported a status
  program status      nothing: no program of the session reported a status
  self-report         nothing: no program of the session reported a status with `nomux status set`
  session restore     nothing: the session did not lose a process with work that ran or waited
  prompt marks        nothing: the shell of the session sent no prompt mark
  foreground program  working (the program sleep is in the foreground of the terminal)
```

Daemon, ön plandaki programın değiştiğini göremez: işletim sistemi ona haber vermez. Ön planı siz durumu istediğinizde okur. Yalnızca bu kaynağın gördüğü bir değişiklik olay üretmez.

## Hazırda bekleyen Session'lar

[Hazırda bekleyen bir Session](/docs/tr/guides/hibernation/)'ın process'i yoktur: daemon agent'ını durdurdu ve Session'ı saklıyor. Satırı `hibernated:` ve hazırda bekletmenin nedenini gösterir: `request`, `count`, `session-memory`, `total-memory` ya da `memory-pressure`. Bu sayfa yalnızca `request` nedenini, `nomux hibernate` ile yaptı. Her nedenin ne anlama geldiğini [Hazırda bekletme](/docs/tr/guides/hibernation/) rehberi anlatır.

`fix-tests` Session'ı, bir Claude Code çalışmasının hook olaylarını aldı: bir prompt, bir izin isteği ve turn'ün sonu. Adapter, çalışmanın devam komutunu bildirdi. Sonra `nomux hibernate fix-tests` Session'ın shell'ini durdurdu:

```console
$ nomux hibernate fix-tests
session mitrhfd6 hibernated: 762.0 KiB given back (pss)
$ nomux status | grep -E 'SESSION|fix-tests'
  SESSION    COMMAND                                       STATE                  FOR  MESSAGE
+ fix-tests  /bin/bash                                     hibernated: request    0s
$ nomux agent explain fix-tests
session mitrhfd6: done for 0s, from session restore

sources, in the sequence in which they decide:
  adapter             nothing: no adapter extension reported a status
  program status      nothing: the session has no process
  self-report         nothing: no program of the session reported a status with `nomux status set`
  session restore     done (the session lost its process: the status is what the session had then, and work that ran or waited is shown as complete)
  prompt marks        nothing: the session has no process
  foreground program  nothing: the session has no process

from the adapter:
  tool session: 00000000-0000-4000-8000-000000000006
  resume: claude --resume 00000000-0000-4000-8000-000000000006
```

Hazırda bekleyen bir Session'ın durumu, process'i olmayan bir Session'ın kuralına uyar: çalışan ya da bekleyen iş `done` olur ve bir sonuç kalır. `nomux wake fix-tests` ve `nomux attach fix-tests` devam komutunu başlatır. Uyandırmadan sonra durum, yeni process'in kaynaklarından gelir:

```console
$ nomux wake fix-tests
session fix-tests (mitrhfd6) woke: claude --resume 00000000-0000-4000-8000-000000000006
$ nomux status | grep -E 'SESSION|fix-tests'
  SESSION    COMMAND                                               STATE                  FOR  MESSAGE
  fix-tests  claude --resume 00000000-0000-4000-8000-000000000006  idle                   1s
```

Bu çalıştırmada `claude` programı, Claude Code'un yerine geçen küçük bir script'ti. Aldığı argümanları yazdırır ve bekler. Daemon'un adapter'ın bildirdiği devam komutunu çalıştırdığını, başka hiçbir şey çalıştırmadığını gösterdi.

## Kendi programınızdan durum bildirmek

Adapter'ı olmayan bir script ya da araç, durumunu kendisi bildirebilir. Programı bir Session çalıştırmalıdır.

```sh
nomux status set working "reading the source files"
nomux status set blocked "run the tests?"
nomux status set done "all tests pass"
```

- Durum `working`, `done`, `blocked`, `error` veya `idle` olur. `blocked`, `needs you` durumudur. `idle` bildirimi geri alır.
- Mesaj, en fazla 512 baytlık tek bir satırdır.
- Komut `NOMUX_SESSION_ID`, `NOMUX_SOCK` ve `NOMUX_TOKEN` değişkenlerini okur; holder bunları bir Session'ın her process'ine verir ([Session'ın ortamı](/docs/tr/guides/session-environment/)). Session'ın dışında komut başarısız olur:

  ```console
  $ nomux status set working "x"
  nomux: NOMUX_SESSION_ID is not set: `nomux status set` works only inside a nomux session
  ```

  Çıkış kodu 4'tür.
- Bir bildirim, bir sonrakine kadar durur.

Yukarıdaki örnekler, bir Session'ın komutu olan şu script'ten geldi:

```sh
#!/bin/sh
sleep 1
nomux status set "$1" "$2"
sleep 3600
```

`xaddp4zj` Session'ının kaynağı öz bildirimdir:

```console
$ nomux agent explain xaddp4zj
session xaddp4zj: needs you for 22s, from self-report; message from self-report: run the tests?

sources, in the sequence in which they decide:
  adapter             nothing: no adapter extension reported a status
  program status      nothing: no program of the session reported a status
  self-report         needs you: run the tests? (a program of the session reported it with `nomux status set`)
  session restore     nothing: the session did not lose a process with work that ran or waited
  prompt marks        nothing: the shell of the session sent no prompt mark
  foreground program  nothing: the command of the session is in the foreground of its terminal
```

### Bir Session'ın ilk anlarında bildirim başarısız olabilir

İlk adımı olarak `nomux status set` çağıran bir program, daemon'un Session'ını henüz tanımadığını görebilir. Komut o zaman 2 ya da 4 çıkış koduyla başarısız olur:

```text
nomux: no session that is not ended has the identifier 7d7td7kv
nomux: the status of session fvnphjvk did not change: the session has no process that the daemon knows
```

Bu, nomux'un açık bir sorunudur: [issue 83](https://github.com/nomux-sh/nomux/issues/83) onu 0.4.0'da buldu. 0.5.0'da hâlâ var. Bu sayfa için dört çalıştırma, her biri 12 Session başlattı. Her Session'ın ilk komutu `nomux status set working "first thing"` idi. Dört çalıştırmada 12 bildirimin sırasıyla 1'i, 0'ı, 8'i ve 9'u çalıştı. Yukarıdaki script'te `sleep 1` var ve onu kullanan Session'ların bildirimlerinin hepsi bu çalıştırmada çalıştı. Bu bir garanti değildir. Bildirmesi gereken bir program çıkış kodunu kontrol etmeli ve bir an sonra yeniden denemelidir.

### Terminal çıktısından bildirim

Terminaline OSC 7501 yazan bir program için komut gerekmez. Alt işi de bildirebilir; `id` bir yoldur (`tests`, Agent çalışmasının altındadır). `g55wwygt` Session'ının script'i bunu yaptı:

```sh
#!/bin/sh
text() { printf %s "$1" | base64 -w0; }
report() { printf '\033]7501;%s\033\\' "$1"; }
report "state=working:msg=$(text 'fixing the failing test')"
report "id=tests:state=working:msg=$(text 'running 120 tests')"
report "id=lint:state=blocked:kind=permission:msg=$(text 'may I install the linter?')"
sleep 3600
```

[Program Status Protocol](https://control-codes.page/proposals/osc-7501/) tam biçimi anlatır.

## Olaylar

`nomux events --follow` (ya da `-f`), her değişikliği olduğu anda yazdırır. Ctrl-C ile biter. `--follow` seçeneği zorunludur: şimdilik tek kip budur. Aşağıdaki listeyi, daemon'un aynı çalışmasında art arda çalışan iki `nomux events --follow` komutu topladı: olay numaraları birinci komuttan ikinciye devam eder.

```console
$ nomux events --follow
1 workspace revision 1: added t7vkaxsrnvpz "Client work" at position 0
2 workspace revision 2: added e2lrmktphjab "acme-web" at position 0
3 g55wwygt working fixing the failing test
4 g55wwygt working fixing the failing test
5 g55wwygt needs you: permission may I install the linter?
6 6llcmruq working reading the source files
7 egywe7xg done all tests pass
8 2vjh4l3j error the build failed
9 xaddp4zj needs you run the tests?
10 egywe7xg done (seen) all tests pass
11 xaddp4zj done
12 mitrhfd6 idle
13 mitrhfd6 working
14 mitrhfd6 working
15 mitrhfd6 needs you: permission touch b.txt
16 mitrhfd6 working
17 mitrhfd6 done
18 mitrhfd6 done
19 mitrhfd6 hibernated (request): 762.0 KiB given back
20 mitrhfd6 woke: claude --resume 00000000-0000-4000-8000-000000000006
21 mitrhfd6 idle
```

Bir satır olay numarasıyla başlar. Satırın geri kalanı olayın türüne bağlıdır:

| Satır | Tür | Anlamı |
|---|---|---|
| `<session> <durum> <mesaj>` | `agent-run-changed` | Bir Session'ın ya da Alt işinin durumu değişti. `10` numaralı satır, bir sonucu görüldü olarak işaretleyen attach'tir. `11` numaralı satır, `nomux kill` Session'ı bitirirken Session'ın sakladığı durumdur. |
| `<session> removed` | `agent-run-removed` | Bir Session saklanacak bir şey olmadan bitti ya da daemon onu sildi. Başka bir çalıştırmada, boştaki bir shell Session'ına `nomux kill` uygulamak `13 swxvcokt removed` satırını verdi. |
| `extension <id>: <ad> (<n> bytes)` | `extension-event` | Bir extension'ın daemon parçası bir olay gönderdi: [Extension'lar](/docs/tr/guides/extensions/#olaylar). |
| `workspace revision <revision>: <değişiklik>` | `workspace-changed` | Bir Grup ya da Proje değişti. |
| `<session> hibernated (<neden>): <boyut> given back` | `session-hibernated` | Daemon bir Session'ı hazırda bekletti. |
| `<session> woke: <devam komutu>` | `session-woken` | Bir uyandırma devam komutunu başlattı. |

`session-wake-failed` ve `session-memory-limit-reached` türleri de vardır. Bu sayfa bu olaylardan birini üretmedi; bu yüzden onlar için satır göstermiyor.

`--filter <tür>` yalnızca o türdeki olayları yazdırır. Daha fazla tür için seçeneği birden çok kez verin. `--json` ile her satır bir JSON belgesi olur. Bunlar, yukarıdaki listenin `19` ve `20` numaralı satırlarıdır:

```console
$ nomux --json events --follow --filter session-hibernated --filter session-woken
{"schema_version":1,"event":{"seq":19,"at_ms":1795706152174,"type":"session_hibernated","session":"mitrhfd6","hibernation":{"reason":"request","freed_bytes":780288,"measure":"pss"}}}
{"schema_version":1,"event":{"seq":20,"at_ms":1795706152182,"type":"session_woken","session":"mitrhfd6","hibernation":{"resume_command":"claude --resume 00000000-0000-4000-8000-000000000006"}}}
```

Daemon son olayları bellekte tutar: daemon yeniden başlayınca numaralar baştan başlar. Çok geride kalan bir istemci, önce mevcut durumun bir snapshot'ını alır. Alanları [CLI başvurusunda](/docs/tr/reference/cli/) bulabilirsiniz.

## Biten Session'lar

Bir Session'ın komutu bitince nomux onun son Agent çalışmasını saklar: çalışan ya da bekleyen iş `done` olur ve bir sonuç kalır. Sizi bekleyen bir Session'a `nomux kill xaddp4zj` uygulandıktan sonra:

```console
$ nomux kill xaddp4zj
session xaddp4zj ended
$ nomux status
  SESSION   COMMAND                                       STATE                  FOR  MESSAGE
x 2vjh4l3j  ./report.sh error the build failed            error                  22s  the build failed
* 6llcmruq  ./report.sh working reading the source files  working                22s  reading the source files
+ egywe7xg  ./report.sh done all tests pass               done (seen)            22s  all tests pass
! g55wwygt  ./osc.sh                                      needs you: permission  23s  may I install the linter?
* kbyhsoqx  /bin/bash                                     working (guess)        0s
+ xaddp4zj  ./report.sh blocked run the tests?            done                   0s
$ nomux agent explain xaddp4zj
session xaddp4zj: done for 0s, from session restore

sources, in the sequence in which they decide:
  adapter             nothing: no adapter extension reported a status
  program status      nothing: the session has no process
  self-report         nothing: no program of the session reported a status with `nomux status set`
  session restore     done (the session lost its process: the status is what the session had then, and work that ran or waited is shown as complete)
  prompt marks        nothing: the session has no process
  foreground program  nothing: the session has no process
```

Uykudaki Session için de aynı kural geçerlidir. İşin mesajı gösterilmez, çünkü o mesaj çalışmış bir işi anlatıyordu.
Saklanan çalışma, daemon Session'ı silene kadar, yani [saklama süresi](/docs/tr/reference/glossary/) sonunda, durur. Bir adapter verdiyse agent aracının devam komutunu gösterir. Daemon en fazla 64 böyle çalışma tutar.

## Bu sürümün sınırları

- Daemon durumu diske yazmaz. Daemon yeniden başladıktan sonra process'i olmayan bir Session kaynaksız `idle` gösterir ve biten Session'ların saklanan çalışmaları gider.
- Process'i olan bir Session de yalnızca daemon'un tuttuğu bildirimleri kaybeder. `nomux daemon stop`'tan sonra, öz bildirimi olan `2vjh4l3j` ve `egywe7xg` Session'ları `idle` gösterdi. `g55wwygt` Session'ı hâlâ `needs you: permission` gösterdi, çünkü holder terminal akışındaki OSC 7501 kayıtlarını tutar:

  ```console
  $ nomux status | grep -E 'SESSION|2vjh4l3j|g55wwygt'
    SESSION    COMMAND                                               STATE                  FOR  MESSAGE
    2vjh4l3j   ./report.sh error the build failed                    idle                   0s
  ! g55wwygt   ./osc.sh                                              needs you: permission  0s   may I install the linter?
  ```

  `nomux status set` kullanan bir program, daemon yeniden başladıktan sonra yeniden bildirim yapmalıdır.
- Komutunun ilk anlarında ilk kez bildirim yapan bir program başarısız olabilir: bkz. [Bir Session'ın ilk anlarında bildirim başarısız olabilir](#bir-sessionın-ilk-anlarında-bildirim-başarısız-olabilir).
- Sizi bekleyen bir Session'a girdi vermek onun işaretini kaldırmaz. Durum, program yeniden bildirim yaptığında değişir.
- Bir sonucu yalnızca attach görüldü olarak işaretler. Biten bir Session'ın sonucu, daemon Session'ı silene kadar görülmemiş kalır.
- Alt işin öz bildirimi yoktur. `nomux status set` Session'ın Agent çalışmasını bildirir.
- Bir Session'da birden fazla Agent çalışması desteklenmez.

Hiçbir kaynağın bildirmediği iş, kaynağı `none` olan `idle` durumundadır. nomux durum için terminalin başlığını ya da ekranını okumaz.
