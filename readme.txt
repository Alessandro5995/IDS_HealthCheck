Per avviare il tutto:
1)andare nella cartella del Backend, scrivere "npm rebuild" tramite compilatore, avviare quindi app.js con "node app.js" (su Linux o mac OS)
2)andare nella cartella del Frontend, scrivere sempre "npm rebuild" ed avviare l'app React con "npm run start"

Note aggiuntive: 
in caso di errore su "npm rebuild" sul backend effettuare le seguenti operazioni:
"npm install --global node-gyp"
"npm cache clean --force"
"npm install"

1)per avviare come amministratore il Backend fare "node app.js" dopo aver fatto "sudo npm rebuild"
2)per avviare come amministratore il Frontend fare "npm run start" dopo aver fatto "sudo npm rebuild"