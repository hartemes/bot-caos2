// index.js - Bot Caos 3.1 😈🔥 (+120 comandos)
const { default: makeWASocket, DisconnectReason, useMultiFileAuthState, fetchLatestBaileysVersion } = require("@adiwajshing/baileys");
const P = require('pino');
const fs = require('fs');
const axios = require('axios');
const { exec } = require("child_process");
const express = require('express');

// --- CONFIGURAÇÃO DE FLOOD LIMITADO ---
const floodControl = {};
const FLOOD_LIMIT = 5;
const FLOOD_RESET = 60 * 1000; // 1 minuto

async function startBot() {
    const { state, saveCreds } = await useMultiFileAuthState('auth_info');
    const { version } = await fetchLatestBaileysVersion();

    const sock = makeWASocket({
        logger: P({ level: 'silent' }),
        printQRInTerminal: true,
        auth: state,
        version
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
        const { connection, lastDisconnect } = update;
        if(connection === 'close') {
            if((lastDisconnect.error)?.output?.statusCode !== DisconnectReason.loggedOut) startBot();
            else console.log('Desconectado, precisa escanear QR novamente');
        } else if(connection === 'open') {
            console.log('Bot Caos 3.1 ONLINE 😈🔥');
        }
    });

    const sendText = async (jid, text) => await sock.sendMessage(jid, { text });
    const sendImage = async (jid, url, caption='') => {
        const img = await axios.get(url, { responseType: 'arraybuffer' });
        await sock.sendMessage(jid, { image: Buffer.from(img.data), caption });
    };
    const sendGif = async (jid, url, caption='') => {
        const gif = await axios.get(url, { responseType: 'arraybuffer' });
        await sock.sendMessage(jid, { video: Buffer.from(gif.data), caption, gifPlayback: true });
    };

    const canSendFlood = (jid) => {
        const now = Date.now();
        if(!floodControl[jid]) floodControl[jid] = { count:0, lastReset: now };
        if(now - floodControl[jid].lastReset > FLOOD_RESET) {
            floodControl[jid].count = 0;
            floodControl[jid].lastReset = now;
        }
        if(floodControl[jid].count < FLOOD_LIMIT) {
            floodControl[jid].count++;
            return true;
        }
        return false;
    };

    sock.ev.on('messages.upsert', async (m) => {
        try {
            const msg = m.messages[0];
            if(!msg.message || msg.key.fromMe) return;

            const jid = msg.key.remoteJid;
            const text = msg.message.conversation || msg.message.extendedTextMessage?.text;
            if(!text) return;
            const cmd = text.toLowerCase();

            if(!canSendFlood(jid)) return;

            // ---------------- ZOEIRA BÁSICA ----------------
            if(cmd.startsWith('/zoeira')) return sendText(jid, ["😈 O caos chegou!", "💥 Prepare-se para a confusão!", "🔥 Aqui só tem zoeira!"][Math.floor(Math.random()*3)]);
            if(cmd.startsWith('/meme')) {
                const memes = [
                    "https://i.imgflip.com/4/4t0m5.jpg","https://i.imgflip.com/30b1gx.jpg","https://i.imgflip.com/1bij.jpg",
                    "https://i.imgflip.com/26am.jpg","https://i.imgflip.com/3vzej.jpg","https://i.imgflip.com/2/1ur9b0.jpg"
                ];
                return sendImage(jid, memes[Math.floor(Math.random()*memes.length)], "🤣 Meme do caos");
            }
            if(cmd.startsWith('/piada')) return sendText(jid, ["Por que o JavaScript foi ao médico? Porque não parava de dar erros!","O que o zero disse para o oito? Belo cinto!","Por que a galinha atravessou a estrada? Para chegar do outro lado!"][Math.floor(Math.random()*3)]);
            if(cmd.startsWith('/reverso ')) return sendText(jid, cmd.replace('/reverso ','').split('').reverse().join(''));
            if(cmd.startsWith('/piadaapi')) { const res = await axios.get('https://v2.jokeapi.dev/joke/Any?type=single'); return sendText(jid,res.data.joke||"Não consegui pegar a piada 😅"); }
            if(cmd.startsWith('/zoeiraaudio')) return sock.sendMessage(jid, { audio:{url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'}, mimetype:'audio/mpeg' });
            if(cmd.startsWith('/caostotal')) return sendText(jid,"⚡ Tudo ativado! Memes, piadas, sons, GIFs, mini-jogos, troll total 😈🔥");

            // ---------------- HACKERMAN / PYTHON ----------------
            if(cmd.startsWith('/hackerman')) return sendText(jid,"💻 Hack imaginário iniciado... Tudo seguro 😎");
            if(cmd.startsWith('/python ')) { const code = cmd.replace('/python ',''); exec(`python -c "${code}"`,(err,stdout,stderr)=>{ if(err) return sendText(jid,`Erro: ${stderr||err.message}`); sendText(jid,`Resultado:\n${stdout||"Sem saída"}`); }); }

            // ---------------- MINI-GAMES ----------------
            if(cmd.startsWith('/adivinhe')) { const numero=Math.floor(Math.random()*10)+1; return sendText(jid,`🕹️ Adivinhe o número entre 1 e 10 usando /chute <numero>`); }
            if(cmd.startsWith('/chute ')) { const chute=parseInt(cmd.replace('/chute ','')); const numero=Math.floor(Math.random()*10)+1; return sendText(jid,chute===numero?`🎉 Acertou! O número era ${numero}`:`❌ Errou! O número era ${numero}`); }
            if(cmd.startsWith('/quiz')) { const q=["Qual é a capital do Brasil?;Brasília","2+2=?;4","Qual animal mia?;Gato"]; const escolha=q[Math.floor(Math.random()*q.length)].split(';'); return sendText(jid,`❓ Pergunta: ${escolha[0]}\nResposta: ${escolha[1]}`); }
            if(cmd.startsWith('/desafio')) { const d=["Dance 5 segundos","Envie um emoji 😂","Tente não rir 10s"]; return sendText(jid,d[Math.floor(Math.random()*d.length)]); }

            // ---------------- GIFS ----------------
            if(cmd.startsWith('/gif')) { const gifs=["https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif","https://media.giphy.com/media/l0HlSNOxJB956qwfK/giphy.gif","https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif"]; return sendGif(jid,gifs[Math.floor(Math.random()*gifs.length)],"🔥 GIF do caos"); }

            // ---------------- TROLLS ----------------
            if(cmd.startsWith('/troll ')) return sendText(jid,`😂 O alvo da zoeira será ${cmd.replace('/troll ','')}!`);
            if(cmd.startsWith('/pegadinha')) return sendText(jid,"😎 Você caiu na pegadinha do Caos Total 3.1!");
            if(cmd.startsWith('/banfake ')) return sendText(jid,`🚫 ${cmd.replace('/banfake ','')} foi banido (fake)`); 
            if(cmd.startsWith('/roleta')) { const n=Math.floor(Math.random()*6)+1; return sendText(jid,n===6?"💥 BANG! Perdeu na roleta":"✅ Passou na roleta"); }
            if(cmd.startsWith('/spamtexto ')) { const args=cmd.replace('/spamtexto ','').split(' '); const n=Math.min(parseInt(args[0]),5); const txt=args.slice(1).join(' '); for(let i=0;i<n;i++) await sendText(jid,txt); }

            // ---------------- RESPOSTAS AUTOMÁTICAS ----------------
            if(cmd.includes('bom dia')) return sendText(jid,"Bom diaaaaa! 😈 Prepare-se para o caos!");
            if(cmd.includes('boa noite')) return sendText(jid,"Boa noite 😴 Mas a zoeira não para 😎");

            // ---------------- COMANDOS SECRETOS ----------------
            if(cmd.startsWith('/zoeiamax')) { await sendText(jid,"⚡ ATIVANDO TODOS OS COMANDOS!"); for(let i=0;i<3;i++){ await sock.sendMessage(jid,{audio:{url:'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3'},mimetype:'audio/mpeg'}); } }
            if(cmd.startsWith('/gifcaos')) { const g=["https://media.giphy.com/media/3o7aD2saalBwwftBIY/giphy.gif","https://media.giphy.com/media/l0HlSNOxJB956qwfK/giphy.gif"]; for(let gi of g) await sendGif(jid,gi,"GIF do caos"); }
            if(cmd.startsWith('/piadasecreta')) return sendText(jid,"😎 Piada secreta: Por que o bot foi para a balada? Porque queria zoeira!"); 

        } catch(e) { console.log('Erro no listener: ', e); }
    });

    // --- SERVIDOR EXPRESS PARA RENDER ---
    const app = express();
    app.get('/', (req,res)=>res.send('Bot Caos 3.1 ONLINE 😈'));
    app.listen(process.env.PORT || 3000, () => console.log('Servidor ativo na porta ' + (process.env.PORT||3000)));
}

startBot();