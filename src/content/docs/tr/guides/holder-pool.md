---
title: Holder havuzu
description: Holder havuzu nedir, yeni bir Session neden hızlı açılır, havuzdaki shell Session'ın dizinini nasıl alır, pool.size, pool.idle_time ve pool.shell_start_files ayarları ve havuzun sınırları.
---

Yeni bir Session 10 ms'den kısa sürede açılmalıdır. Bir holder'ın başlaması yaklaşık 1 ms sürer. Bir shell'in başlangıç dosyalarıyla birlikte başlaması 2 ms ile 200 ms'den fazla arasında sürer.
Bu yüzden daemon az sayıda holder'ı hazır tutar; her birinde kullanıcının shell'i önceden başlatılmıştır: **holder havuzu**. Shell ile açılan yeni bir Session bunlardan birini alır.

Bu sayfadaki çıktılar, nomux 0.5.0'ın Linux'taki gerçek çıktısıdır. Çalıştırmaların home dizini `/home/user` olarak gösterilir. Çalıştırmalardaki shell `bash` 5.3'tür.

## Ne görürsünüz

Bir istemcinin ilk isteğinden önce hiçbir şey çalışmaz. İlk istekten sonra daemon havuzu doldurur. Havuzdaki her holder'ın runtime dizininde `.pool` son ekli bir dizini vardır. `pool` dizininde havuz başlangıç dosyaları ve havuzdaki her holder için bir named pipe bulunur:

```console
$ nomux ls
no sessions
$ ls ~/.nomux/run
3wn4mzd5.pool
g2oryjis.pool
nomuxd.lock
nomuxd.log
nomuxd.sock
pool
$ stat -c '%A %n' ~/.nomux/run/pool/*
prw------- ~/.nomux/run/pool/3wn4mzd5.directory
-rw------- ~/.nomux/run/pool/bashrc
prw------- ~/.nomux/run/pool/g2oryjis.directory
drwx------ ~/.nomux/run/pool/zsh
```

- Havuzdaki holder bir Session değildir. `nomux ls` onu listelemez, `nomux daemon status` saymaz.
- State dizini ve journal'ı yoktur.
- Havuzdaki holder'ın standart girdisi daemon'dan gelen bir pipe'tır. Daemon sonlandığında, `kill -9` ile sonlandığında da, havuzdaki her holder shell'iyle birlikte sonlanır. Session'ı olan bir holder ise, her Session holder'ı gibi, devam eder.
- Yeni bir daemon, önceki daemon'un havuzdaki holder'larını almaz. Onlar kendiliğinden sonlanır ve yeni daemon kendi havuzunu ilk isteğinde başlatır. Önceki daemon'un `pool` dizinini de siler.

Komutsuz `nomux new` en eski havuzdaki holder'ı alır, daemon da cevap verdikten sonra bir sonrakini başlatır. `3wn4mzd5` Session'ı havuzdan geldi. Alındıktan sonra havuzda yeni bir `.pool` dizini olur, Session'ın holder'ında ise Session kimliğinin dizini:

```console
$ nomux new --cwd ~/project
3wn4mzd5
$ ls ~/.nomux/run
3wn4mzd5
c3ktwchc.pool
g2oryjis.pool
nomuxd.lock
nomuxd.log
nomuxd.sock
pool
```

## Havuzdaki shell dizinini nasıl alır

Havuzdaki shell, Session henüz yokken home dizininde başlar. Session'ın çalışma dizini başka olabilir. Dizini değiştirmek için terminale hiçbir şey yazılmaz. Session'ın ekranı ve journal'ı yalnızca prompt'u gösterir, `pwd` ise Session'ın dizinini gösterir:

```console
$ nomux capture 3wn4mzd5 | cat -v
^[[?2004hbash-5.3$ 
$ nomux send 3wn4mzd5 pwd
$ nomux capture 3wn4mzd5 --lines 2 | cat -v
^[[?2004l^M/home/user/project^M
^[[?2004hbash-5.3$ 
```

`bash`, `zsh` ve `fish` için daemon, havuzdaki shell'i **havuz başlangıç dosyasıyla** başlatır. Shell, havuzda beklerken sizin başlangıç dosyalarınızı çalıştırır. Sonra havuz başlangıç dosyası, ilk prompt'tan önce Session'ın dizinini holder'ın bir named pipe'ından okur ve o dizine geçer. Okuma, bir Session holder'ı alana kadar bekler.

- Havuz başlangıç dosyaları runtime dizinindeki `pool` dizinindedir; o dizini yalnızca siz açabilirsiniz. İçerikleri sabittir: içlerinde yol ve kullanıcı verisi yoktur.
- Dizin, named pipe üzerinden veri olarak gelir; bu yüzden her yol çalışır: tırnak, `$`, satır sonu ya da başta `-` içeren yol da.
- `bash`, `--rcfile` ile başlar. Dosya, seçenek olmadan `bash`'in yaptığı gibi `~/.bashrc` dosyasını okur, sonra dizini değiştirir.
- `zsh`, `ZDOTDIR` değeri `pool/zsh` dizinine ayarlı olarak başlar. Oradaki `.zshenv`, `ZDOTDIR`'a kendi değerini geri verir, sizin `.zshenv` dosyanızı okur ve `precmd_functions` dizisinin başına bir `precmd` fonksiyonu koyar. Fonksiyon, ilk prompt'tan önce `cd -q` ile dizini değiştirir ve kendini kaldırır.

nomux 0.4.0'da daemon bunun yerine shell'e bir `cd` satırı yazıyordu ve satır ekranda ve journal'da görünüyordu. nomux 0.5.0'da böyle olmuyor.

**Çalıştırılan:** yalnızca `bash`. Çalıştırmaların yapıldığı bilgisayarda `zsh` ve `fish` yok; bu yüzden onların başlangıç dosyaları çalıştırılmadı. Anlatımları [nomux dokümanlarından](https://github.com/nomux-sh/nomux/blob/v0.5.0/docs/daemon.md#holder-pool) geliyor.

## Ayarlar

Daemon yapılandırma dosyasını açılışında bir kez okur. Bir değişiklik daemon'un sonraki açılışından sonra geçerli olur. Dosya Linux'ta `~/.config/nomux/config.toml`, macOS'te `~/Library/Application Support/nomux/config.toml` dosyasıdır. `nomux daemon status` yolu yazdırır.

```toml
[pool]
size = 2                  # 0 to 8; 0 turns the pool off
idle_time = "10m"         # a number with the unit s, m, h or d
shell_start_files = true  # false: the pool takes only Sessions in the home directory
```

| Anahtar | Varsayılan | İşlevi |
|---|---|---|
| `pool.size` | `2` | Daemon'un hazır tuttuğu holder sayısı. |
| `pool.idle_time` | `10m` | Hiçbir Session başlamadığında havuzun ne kadar durduğu. Sonra havuz boşalır ve sonraki yeni Session onu yeniden doldurur. |
| `pool.shell_start_files` | `true` | Havuzdaki `bash`, `zsh` ya da `fish`, havuz başlangıç dosyasıyla başlar. `false` ile havuz yalnızca home dizinindeki Session'ları alır. |

`size = 0` ile daemon havuzda hiçbir holder başlatmaz ve `pool` dizini de olmaz:

```console
$ cat ~/.config/nomux/config.toml
[pool]
size = 0
$ nomux ls
no sessions
$ ls ~/.nomux/run
nomuxd.lock
nomuxd.log
nomuxd.sock
```

`idle_time = "30s"` ile havuz, yeni bir Session olmadan 30 saniye geçince boşalır. `pool` dizini kalır:

```console
$ cat ~/.config/nomux/config.toml
[pool]
size = 2
idle_time = "30s"
$ nomux ls
no sessions
$ ls ~/.nomux/run
dfjk2ur7.pool
nomuxd.lock
nomuxd.log
nomuxd.sock
pool
tmo5n2cg.pool
```

Yeni bir Session olmadan 33 saniye sonra `ls ~/.nomux/run` `nomuxd.lock`, `nomuxd.log`, `nomuxd.sock` ve `pool` gösterdi. Daemon yoklama yapmaz: boşta kalma süresinin sonu için kurulan tek bir zamanlayıcı havuzun görevini uyandırır.

Havuzdaki bir shell bellek kullanır: statik build'li holder için yaklaşık 1 MB ve shell'in belleği. Varsayılan 2, art arda başlayan iki Session'a hazır bir holder verir. Daha büyük bir sayı, çoğu Host'un ihtiyaç duymadığı kadar bellek kullanır.
Geçersiz bir dosya daemon'u durdurmaz: daemon sorunu log'una yazar ve varsayılanları kullanır.

`shell_start_files = false` ile havuzda havuz başlangıç dosyası olmaz. Home dizinindeki bir Session havuzdan holder alır, başka bir dizindeki Session ise yeni bir holder alır. Burada ilk `nomux new` komutunda `--cwd ~/project` vardı, ikincisinde dizin yoktu. Havuz ilkinde holder kaybetmedi; ikincisinde `kejednu6` havuzdan geldi:

```console
$ nomux new --cwd ~/project
sg7bs2pw
$ ls ~/.nomux/run
iejfzqu2.pool
kejednu6.pool
nomuxd.lock
nomuxd.log
nomuxd.sock
sg7bs2pw
$ nomux new
kejednu6
$ ls ~/.nomux/run
4zi2v353.pool
iejfzqu2.pool
kejednu6
nomuxd.lock
nomuxd.log
nomuxd.sock
sg7bs2pw
```

## Sınırlar

- **Shell'inizin başlangıç dosyaları home dizininde çalıştı.** Shell havuzda beklerken, bir Session onu almadan önce çalışırlar. Çalışma dizinini okuyan bir başlangıç dosyası home dizinini okur. Burada `~/.bashrc` bir dosyaya `$PWD` ekledi. Havuzla birlikte dosyaya, havuzdaki iki shell'den ve alma işleminden sonra daemon'un başlattığı shell'den, home dizinli üç satır yazıldı. `pool.size = 0` ile `~/project` dizinindeki bir Session tek satır verdi:

  ```console
  $ cat ~/start-dirs.log
  /home/user
  /home/user
  /home/user
  ```

  ```console
  $ cat ~/start-dirs.log
  /home/user/project
  ```

  İlk liste havuzlu çalıştırmadan, ikincisi `size = 0` ile yapılan çalıştırmadan. Home dizinindeki bir Session'da ve yeni bir holder'dan açılan Session'da bu fark yoktur.
- **Home dizininde olmayan bir Session'ın dizinini yalnızca `bash`, `zsh` ve `fish` alır.** Başka bir shell için havuz yalnızca home dizinindeki Session'ları alır; başka dizindeki bir Session yeni bir holder alır. `shell_start_files = false` ile de aynısı olur. `SHELL=/bin/sh` ile yapılan bir çalıştırmada `nomux new --cwd ~/project`, havuzdaki iki holder'a dokunmadı ve yeni bir holder başlattı (`brz64p2p`); `nomux new` ise havuzdan bir holder aldı (`h4amg2cj`):

  ```console
  $ nomux new --cwd ~/project
  brz64p2p
  $ ls ~/.nomux/run
  brz64p2p
  etpu45w5.pool
  h4amg2cj.pool
  nomuxd.lock
  nomuxd.log
  nomuxd.sock
  $ nomux new
  h4amg2cj
  ```
- **`zsh`, nomux'un fonksiyonunu kaybedebilir.** `precmd_functions` dizisine ekleme yapmayıp ona yeni bir değer atayan bir başlangıç dosyanız fonksiyonu siler: shell o zaman home dizininde kalır. `ZDOTDIR` ayarlayan bir sistem başlangıç dosyası da aynı sonucu verir, çünkü `zsh` o zaman `pool/zsh/.zshenv` dosyasını okumaz. Bu bilgi nomux dokümanlarından gelir. Çalıştırılmadı.
- **Komutlu bir Session yeni bir holder alır.** Havuzdaki bir holder yalnızca shell'ini verebilir. `nomux new -- <komut>` her zaman yeni bir holder başlatır.
- **`sessions.memory_limit` varken havuz kapalıdır.** Havuzdaki shell, Session'ından önce başlar; yani limitsiz başlar. `memory_limit = "2G"` ile yapılan bir çalıştırmada, ilk istekten sonra `~/.nomux/run` içinde `.pool` dizini de `pool` dizini de yoktu. Limit için [Hazırda bekletme ve bellek limiti](/docs/tr/guides/hibernation/#bellek-limiti) sayfasına bakın.
- **Havuzda bir holder, holder hazır olduğunda bulunur; shell'i başlangıç dosyalarını bitirdiğinde değil.** O sırada holder'ı alan bir Session prompt'unu daha geç gösterir: shell başlangıç dosyalarını bitirir, sonra dizini okur.
- **Havuzdaki bir shell, [Session'ın ortamını](/docs/tr/guides/session-environment/) alır.** Soruyu soran istemcinin ortamını almaz. Bu eksiklik yalnızca havuz için değil, her Session için [#75](https://github.com/nomux-sh/nomux/issues/75) numaralı issue'dadır.
