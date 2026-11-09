# iPhone用ipaのビルドとインストール

1. GitHub の Actions タブで「Build unsigned IPA」を Run workflow。
2. 完了後、Artifacts の `GH-300-unsigned-ipa` をダウンロード（ZIPを展開すると `GH-300-unsigned.ipa`）。
3. PC（Windows/Mac）の AltStore または Sideloadly にipaを渡し、自分のApple IDで署名してiPhoneへ入れる。
   - 無料Apple IDだと7日で失効するので、期限前に再インストール（AltStoreは自動更新可）。
   - 有料Developer Program（年額）なら1年有効。
4. 問題データはipaに含めない。アプリ内で問題JSONを読み込む。
