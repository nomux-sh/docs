---
title: Session'ların belleği
description: nomux ls --memory ile her Session'ın process'lerinin ne kadar bellek kullandığını görün, sayıların neyi saydığını, nomux'un neyi ölçmediğini ve bellek limitinin nerede olduğunu öğrenin.
---

`nomux ls --memory`, her Session'ın process'lerinin şu an kullandığı belleği gösterir. Bellek azaldığında hangi Session'ın onu kullandığını görürsünüz.

Bu sayfadaki çıktılar, nomux 0.5.0'ın Linux'taki gerçek çıktısıdır. Çalıştırmanın home dizini `/home/user` olarak gösterilir.
Dört Session'ın komutları şunlardı: `python3 hog.py 200` (200 MiB ayıran bir program), iki böyle programı (50 MiB ve 30 MiB) başlatan bir `sh`, `sleep 3600` ve kullanıcının shell'i.

## Belleği göstermek

```console
$ nomux ls --memory
ID        STATE    MEMORY     PROCESSES  HOLDER     MEASURE  LIMIT  FREED  COMMAND
2e4zs63j  running  141.0 KiB  1          337.0 KiB  pss      -      -      sleep 3600
3qbpriwd  running  738.0 KiB  1          350.0 KiB  pss      -      -      /bin/bash
mh47dxf4  running  88.4 MiB   3          337.0 KiB  pss      -      -      sh -c python3 hog.py 50 & python3 hog.py 30 & wait
pdo3uuvt  running  204.0 MiB  1          336.0 KiB  pss      -      -      python3 hog.py 200
total: 293.3 MiB in 6 processes of 4 sessions, and 1.3 MiB in the holders (pss)
```

| Sütun | Anlamı |
|---|---|
| `MEMORY` | Komutun process ağacının belleği: komut ve ondan türeyen her process. |
| `PROCESSES` | Bu ağaçtaki process sayısı. |
| `HOLDER` | Session'ın holder'ının belleği. **Holder `MEMORY` içinde değildir.** nomux onu ayrı bir değer olarak gösterir. |
| `MEASURE` | nomux'un iki değeri nasıl saydığı: `pss` ya da `rss`. |
| `LIMIT` | İşletim sisteminin komutun process'lerine uyguladığı [bellek limiti](/docs/tr/guides/hibernation/#bellek-limiti). Uygulanan limit yoksa `-`. |
| `FREED` | [Hazırda bekleyen bir Session](/docs/tr/guides/hibernation/) için: hazırda bekletmenin geri verdiği bellek. Diğer her Session için `-`. |

`mh47dxf4` Session'ının 3 process'i var: `sh` ve iki child'ı. 88.4 MiB'ı, child'ların 50 MiB ve 30 MiB'ından ve shell ile interpreter'ların belleğinden oluşur.

Process'i olmayan bir Session'ın değeri yoktur ve toplama girmez. Burada `2e4zs63j` Session'ının holder'ı `kill -9` ile sonlandı; Host'un yeniden başlaması da onu böyle sonlandırırdı:

```console
$ nomux ls --memory
ID        STATE    MEMORY     PROCESSES  HOLDER     MEASURE  LIMIT  FREED  COMMAND
2e4zs63j  dormant  -          -          -          -        -      -      sleep 3600
3qbpriwd  running  742.0 KiB  1          376.0 KiB  pss      -      -      /bin/bash
mh47dxf4  running  88.4 MiB   3          358.0 KiB  pss      -      -      sh -c python3 hog.py 50 & python3 hog.py 30 & wait
pdo3uuvt  running  204.0 MiB  1          362.0 KiB  pss      -      -      python3 hog.py 200
total: 293.2 MiB in 5 processes of 3 sessions, and 1.0 MiB in the holders (pss)
```

[Hazırda bekleyen bir Session](/docs/tr/guides/hibernation/) de process'i olmayan bir Session'dır. İlk beş sütunda `-` vardır, `FREED` sütununda ise geri verdiği bellek. Çıktının son satırlarında toplam yer alır:

```console
$ nomux ls --memory
ID        STATE       MEMORY  PROCESSES  HOLDER  MEASURE  LIMIT  FREED      COMMAND
57anosge  hibernated  -       -          -       -        -      159.5 MiB  claude
total: no session has a process
hibernated: 159.5 MiB given back by 1 session
```

(Bu çalıştırma [hazırda bekletme rehberinden](/docs/tr/guides/hibernation/): Session bir agent aracının taklidini çalıştırdı.)

Değerler komutun çalıştığı andan alınır. İkinci bir komut yeniden ölçer. Canlı görünüm isteyen bir istemci isteği kendi aralığında yeniden gönderir. Böyle bir istemci henüz yok.

`--json` ile her Session'ın bir `memory` nesnesi olur. Process'i olmayan bir Session için `null`'dır. Uygulanan limit yoksa `limit_bytes` değeri `null`'dır:

```json
"memory":{"command_bytes":144384,"command_processes":1,"holder_bytes":345088,"measure":"pss","limit_bytes":null}
```

Dar bir terminalde tablo, her satır sığsın diye sütun bırakır. Önce `MEASURE`'ı, sonra `LIMIT`, `FREED`, `PROCESSES` ve `HOLDER`'ı bırakır. Toplam satırı ölçüyü söyler, son satır `FREED` toplamını verir. 60 sütunluk bir terminal şunu gösterdi (komutu o genişlikte bir sözde terminal çalıştırdı):

```console
$ nomux ls --memory
ID        STATE    MEMORY     PROCESSES  HOLDER     COMMAND
3gb2lalj  running  204.9 MiB  1          388.0 KiB  python3…
4oxnfuld  running  158.0 KiB  1          376.0 KiB  sleep 3…
total: 205.0 MiB in 2 processes of 2 sessions, and 764.0 KiB
in the holders (pss)
```

Tam doküman [CLI başvurusunda](/docs/tr/reference/cli/).

## `pss` ve `rss`

| Ölçü | Nerede | Anlamı |
|---|---|---|
| `pss` | Linux | Orantılı set boyutu (proportional set size). Birden fazla process'in kullandığı bir sayfa aralarında bölünür; bu yüzden bir toplam her sayfayı bir kez sayar. |
| `rss` | Linux'ta kernel'in `pss` vermediği process'ler için, ve macOS | Resident set boyutu. Birden fazla process'in kullandığı bir sayfa her birinin değerinde bulunur; bu yüzden bir toplam, kullanımdaki bellekten büyük olabilir. |

- Bir Session'ın `pss` değerine sahip olması için nomux'un bunu holder için ve komutun her process'i için alabilmesi gerekir. Tek bir process'te eksik olması, Session'ın her değerini `rss` yapar. nomux iki türü hiçbir zaman toplamaz.
- Session'ların ölçüleri farklı olan bir Host'ta toplam satırı `pss and rss` der.
- İki ölçü de şu an bellekte duran sayfaları sayar. Swap'i ve kernel'in process'ler için kullandığı belleği saymaz.
- macOS'ta orantılı set boyutu yoktur; bu yüzden orada ölçü her zaman `rss`'tir. macOS kodunun testleri yalnızca CI'da çalıştı. Gerçek Session'larla bir Mac'te denenmedi ve değer, Activity Monitor'ün gösterdiği değer değildir.

## nomux neyi sayar

Bir Session'ın komutu, holder'ının tek child'ıdır. Komutun process ağacı, holder'dan türeyen her process'tir. İşlerini kendi process group'unda başlatan bir shell ağacın içinde kalır.

Ağaçtan ayrılan bir process **sayılmaz**: bir process bittiğinde işletim sistemi onun child'larını process 1'e verir. Kendini daemon yapan bir program bunu bilerek yapar ve nomux onun Session'dan geldiğini bilemez.

nomux önce process tablosunu, sonra her process'in belleğini, sonra her process'in kimliğini yeniden okur. Bir process, iki okuma arasında değişmediyse sayılır. Bu yüzden bir değer hiçbir zaman başka bir programın process'inin belleği olmaz. Bedeli, ağacın bir kısmı biterken tek bir istek için fazla küçük çıkan bir değerdir.

## Maliyeti

- Daemon yalnızca bir istemci istediğinde ölçer. Zamanlayıcısı yoktur ve iki istek arasında hiçbir değer tutmaz.
- İş, isteğin 10 saniye sonra biten bir thread'de çalışır. Boştaki daemon CPU zamanı kullanmaz.
- [Performans sayfasında](/docs/tr/reference/performance/), `nomux` reposunun ölçümlerinden, 50 Session ve 200 Session için bir isteğin süresi var.

## Bellek limiti

Yapılandırma dosyasındaki `sessions.memory_limit`, bir Session'ın belleğini sınırlar. systemd kullanıcı yöneticisi olan Linux'ta limiti kernel uygular: limite ulaşan Session'ın process'lerini sonlandırır ve `ls --memory` limiti `LIMIT` sütununda gösterir. macOS'te ve kullanıcı yöneticisi olmayan Linux'ta limit yalnızca, boştaki agent Session'larının [hazırda bekletilmesi](/docs/tr/guides/hibernation/) için bir eşiktir ve `LIMIT` `-` gösterir.

`nomux daemon status` iki durumdan hangisinin Host'unuz için geçerli olduğunu söyleyen bir satır yazdırır:

```console
$ nomux daemon status
nomuxd 0.5.0 runs: process ID 4034392, 3 sessions
memory limit: the kernel ends the processes of a session at its limit: a systemd user scope with MemoryMax
configuration file: /home/user/.config/nomux/config.toml
```

Limit, `ls --memory`'nin saymadığı belleği de sayar (kernel'in process'ler için kullandığı bellek ve page cache); bu yüzden bir Session, tablo daha azını gösterirken limitine ulaşabilir. [Hazırda bekletme ve bellek limiti](/docs/tr/guides/hibernation/) rehberinde ayarlar, platform farkları, hazırda bekletmenin tetikleyicileri ve kernel'in sonlandırdığı bir Session'ın gerçek çıktısı var.

Disk ve bellek bütçeleri hakkındaki karar [ADR-0009](https://github.com/nomux-sh/docs/blob/main/adr/0009-resource-budgets-for-disk-and-memory.md)'da kayıtlı.
