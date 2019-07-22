## Change Log

### 5.0.1 (2019/07/22 09:57 +00:00)
- [#107](https://github.com/oncletom/crx/pull/107) fix: loading relative path (@ahwayakchih)

### v5.0.0 (2019/04/17 08:00 +00:00)
- [#106](https://github.com/oncletom/crx/pull/106) chore: update CHANGELOG (@ahwayakchih)
- [#105](https://github.com/oncletom/crx/pull/105) Update dependencies and prepare for new release (v5.0.0) (@ahwayakchih)
- [#104](https://github.com/oncletom/crx/pull/104) fix: create private key file outside extension directory by default (@ahwayakchih)
- [#103](https://github.com/oncletom/crx/pull/103) Move CLI script to src folder (@arkon)
- [#100](https://github.com/oncletom/crx/pull/100) Move CRX2 logic to separate file (@arkon)
- [#102](https://github.com/oncletom/crx/pull/102) feat: use `manifest.minimum_chrome_version` as XML's `prodversionmin` (@ahwayakchih)
- [#99](https://github.com/oncletom/crx/pull/99) docs: add `--crx-format` to README (@ahwayakchih)
- [#98](https://github.com/oncletom/crx/pull/98) feat: add support for CRXv3 (@ahwayakchih)
- [#97](https://github.com/oncletom/crx/pull/97) chore: update dependencies (#97) (@ahwayakchih)
- [#78](https://github.com/oncletom/crx/pull/78) Add generateAppId sample (#78) (@NN---)

### v4.0.1 (2019/02/03 16:17 +00:00)
- [#96](https://github.com/oncletom/crx/pull/96) Remove deprecated crx.writeFile() (@oncletom)

### v4.0.0 (2019/02/03 15:57 +00:00)
- [#95](https://github.com/oncletom/crx/pull/95) Release crx@4 (@oncletom)
- [#93](https://github.com/oncletom/crx/pull/93) fix demo code (@g8up)
- [#88](https://github.com/oncletom/crx/pull/88) Bump Node.js version requirement (@oncletom)
- [#90](https://github.com/oncletom/crx/pull/90) Fix syntax in module usage (@blimmer)
- [#83](https://github.com/oncletom/crx/pull/83) Update dependencies (@oncletom)
- [#81](https://github.com/oncletom/crx/pull/81) Fix extension ID calculation from path (@oncletom, @conioh)
- [#76](https://github.com/oncletom/crx/pull/76) Add Appveyor configuration to test build on Windows (@oncletom)
- [#71](https://github.com/oncletom/crx/pull/71) Remove the manifest data from cache on crx.load() (@binhqx)
- [#75](https://github.com/oncletom/crx/pull/75) [Snyk Update] New fixes for 1 vulnerable dependency path (@snyk-bot)

### v3.2.1 (2016/10/13 13:13 +00:00)
- [#67](https://github.com/oncletom/crx/pull/67) Drop iojs from package.engines (@dsblv)

### v3.2.0 (2016/09/22 23:25 +00:00)
- [#66](https://github.com/oncletom/crx/pull/66) Add the ability to load a list of files in addition to a path. (@oncletom)

### v3.1.0 (2016/09/22 14:06 +00:00)
- [#62](https://github.com/oncletom/crx/pull/62) Remove intermediate copy and use of temporary files (@oncletom)
- [#63](https://github.com/oncletom/crx/pull/63) Add code coverage and add additional tests (@oncletom)

### v3.0.4 (2016/09/21 13:00 +00:00)
- [#58](https://github.com/oncletom/crx/pull/58) [security fix] Updated archiver dependency; drops support for node 0.8.x (@PavelVanecek)
- [#56](https://github.com/oncletom/crx/pull/56) Update CLI documentation with -o instead of deprecated -f (@nhoizey)
- [#52](https://github.com/oncletom/crx/pull/52) Generate 2048-bit keys at the keygen CLI (@ngyikp)
- [#50](https://github.com/oncletom/crx/pull/50) test crx on node 4.1 and 5 (@joscha)

### v3.0.3 (2015/07/22 16:10 +00:00)
- [#47](https://github.com/oncletom/crx/pull/47) added .npmignore file (@PavelVanecek)

### v3.0.2 (2015/02/06 11:28 +00:00)
- [#39](https://github.com/oncletom/crx/pull/39) Do not concatenate a possible null buffer. (@oncletom)
- [#37](https://github.com/oncletom/crx/pull/37) fix pack instruction in Module example (@qbarlas)

### v2.0.1 (2015/01/15 18:28 +00:00)
- [#34](https://github.com/oncletom/crx/pull/34) Fix various issues with CLI and creating .pem and .crx files (@Batterii)
- [#35](https://github.com/oncletom/crx/pull/35) destroy() is not used (@okuryu)
- [#26](https://github.com/oncletom/crx/pull/26) fixes minor code problems, such as missing semicolons, etc. (@joscha)
- [#29](https://github.com/oncletom/crx/pull/29) generatePublicKey promise and generateAppId state (@joscha)
- [#30](https://github.com/oncletom/crx/pull/30) use temp module (@joscha)
- [#27](https://github.com/oncletom/crx/pull/27) throw error if public key is not set, yet (@joscha)

### v2.0.0 (2014/11/29 16:39 +00:00)
- [#24](https://github.com/oncletom/crx/pull/24) Unsigned archives (@oncletom)

### v1.1.0 (2014/11/29 15:55 +00:00)
- [#25](https://github.com/oncletom/crx/pull/25) Pure JavaScript public key (@oncletom)

### v1.0.0 (2014/11/25 11:45 +00:00)
- [#22](https://github.com/oncletom/crx/pull/22) Remove system ssh-keygen dependency (@oncletom)
- [#20](https://github.com/oncletom/crx/pull/20) Promise-based interface (@oncletom)
- [#19](https://github.com/oncletom/crx/pull/19) Event 'finished' no longer valid #18 (@yuryoparin)
- [#17](https://github.com/oncletom/crx/pull/17) Fix deleting remaining ./tmp directory (@jokesterfr)
- [#16](https://github.com/oncletom/crx/pull/16) removed bufferstream dependency (@christian-bromann)
- [#14](https://github.com/oncletom/crx/pull/14) Support long private keys in latest Chrome 32 (@vitalets)
- [#10](https://github.com/oncletom/crx/pull/10) Windows Compatibility (@adotout)
- [#8](https://github.com/oncletom/crx/pull/8) Use proper stdin options in child_process.spawn() instead of passing a file child.stdin.end() (@nkakuev)
- [#3](https://github.com/oncletom/crx/pull/3) Added support for maxBuffer (@oncletom)
- [#2](https://github.com/oncletom/crx/pull/2) Updated the README example upon `crx` API (@oncletom)