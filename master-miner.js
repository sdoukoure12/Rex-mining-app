// master-miner.js - Gère les 614 adresses simultanément
const fs = require('fs');
const { exec, spawn } = require('child_process');
const readline = require('readline');

class MassiveMiner614 {
    constructor(configPath = './config/addresses.json') {
        this.config = JSON.parse(fs.readFileSync(configPath));
        this.miningProcesses = [];
        this.stats = {
            totalBTC: 0,
            startTime: new Date(),
            shares: 0,
            activeWorkers: 0
        };
    }

    // Lancer tous les mineurs avec screen [citation:4]
    startAllMiners() {
        console.log(`\n🚀 DÉMARRAGE DE ${this.config.totalAddresses} MINEURS`);
        console.log(`📊 Pools: ${this.config.totalPools}\n`);

        this.config.addresses.forEach((addr, index) => {
            if (addr.active) {
                const sessionName = `miner_${addr.id}`;
                const pool = this.config.pools.find(p => p.name === addr.pool);
                
                // Commande Stratum adaptée [citation:1][citation:7]
                const miningCmd = `node stratum-client.js ` +
                    `--pool ${pool.name} ` +
                    `--port ${pool.port || 3333} ` +
                    `--user ${addr.address}.${addr.worker} ` +
                    `--pass x ` +
                    `--algorithm ${addr.algorithm}`;

                // Lancer dans une session screen détachée [citation:4]
                exec(`screen -dmS ${sessionName} bash -c "${miningCmd}"`);
                
                this.miningProcesses.push({
                    id: addr.id,
                    session: sessionName,
                    address: addr.address,
                    pool: pool.name
                });

                this.stats.activeWorkers++;
                
                if (index % 50 === 0) {
                    console.log(`✅ Lancé ${index}/${this.config.totalAddresses}...`);
                }
            }
        });

        console.log(`\n✅ ${this.stats.activeWorkers} mineurs actifs sur 614`);
        console.log('📺 Voir les sessions: screen -ls');
        console.log('📊 Logs: tail -f logs/mining.log');
    }

    // Surveiller les gains
    monitorGains() {
        setInterval(() => {
            let total = 0;
            this.config.addresses.forEach(addr => {
                // Simulation gains (à remplacer par API réelle)
                if (addr.active) {
                    addr.btc += 0.000000001 * (addr.multiplier || 1) * Math.random();
                    total += addr.btc;
                }
            });
            this.stats.totalBTC = total;
            this.displayStats();
        }, 10000);
    }

    displayStats() {
        console.clear();
        console.log('=== ⚡ MASSIVE MINER 614 ⚡ ===');
        console.log(`📅 ${new Date().toLocaleString()}`);
        console.log(`🎯 Adresses totales: ${this.config.totalAddresses}`);
        console.log(`✅ Actives: ${this.stats.activeWorkers}`);
        console.log(`💰 BTC total: ${this.stats.totalBTC.toFixed(8)}`);
        console.log(`💎 Satoshis: ${Math.floor(this.stats.totalBTC * 1e8)}`);
        
        // Top 5 pools
        console.log('\n🏆 Top 5 pools (hashrate) [citation:2]:');
        this.config.pools.slice(0, 5).forEach(p => {
            console.log(`   ${p.name}: ${p.hashrate}`);
        });

        // Derniers gains
        console.log('\n📊 Derniers blocs:');
        this.config.addresses.slice(0, 5).forEach(addr => {
            if (addr.btc > 0.000001) {
                console.log(`   ${addr.address.substring(0, 20)}...: ${addr.btc.toFixed(8)} BTC`);
            }
        });
    }

    // Arrêt propre
    stopAllMiners() {
        console.log('\n⛔ Arrêt de tous les mineurs...');
        exec("screen -ls | grep miner_ | cut -d. -f1 | awk '{print $1}' | xargs -I{} screen -X -S {} quit");
        console.log('✅ Tous les mineurs arrêtés');
    }
}

// Interface CLI
const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const miner = new MassiveMiner614();

console.log('\n=== MASSIVE MINER 614 ===');
console.log('1. 🚀 Démarrer tous les mineurs');
console.log('2. 📊 Surveiller les gains');
console.log('3. ⛔ Arrêter tout');
console.log('4. 🔧 Configuration SSH GitHub');
console.log('5. 📤 Sauvegarder sur GitHub');

rl.question('\nChoix: ', (choice) => {
    switch(choice) {
        case '1':
            miner.startAllMiners();
            miner.monitorGains();
            break;
        case '2':
            miner.monitorGains();
            break;
        case '3':
            miner.stopAllMiners();
            process.exit();
        case '4':
            setupGitHubSSH();
            break;
        case '5':
            backupToGitHub();
            break;
    }
    rl.close();
});

// Configuration SSH pour GitHub [citation:3][citation:6][citation:9]
function setupGitHubSSH() {
    console.log('\n🔑 CONFIGURATION SSH GITHUB');
    console.log('===========================');
    
    const commands = [
        'ssh-keygen -t ed25519 -C "sdoukoure12@gmail.com" -f ~/.ssh/github_614',
        'eval "$(ssh-agent -s)"',
        'ssh-add ~/.ssh/github_614',
        'cat ~/.ssh/github_614.pub',
        'echo "Copie cette clé et ajoute-la sur GitHub: Settings > SSH keys"'
    ];
    
    commands.forEach(cmd => {
        console.log(`\n$ ${cmd}`);
        try {
            const result = require('child_process').execSync(cmd, { encoding: 'utf8' });
            console.log(result);
        } catch (e) {
            console.log('⚠️  Exécute manuellement cette commande');
        }
    });
    
    // Configuration multiple [citation:6]
    const sshConfig = `
Host github.com-614
    Hostname github.com
    User git
    IdentityFile ~/.ssh/github_614
    IdentitiesOnly yes
    `;
    
    fs.appendFileSync('/home/africain3x21/.ssh/config', sshConfig);
    console.log('\n✅ Configuration SSH ajoutée');
}

function backupToGitHub() {
    console.log('\n📤 SAUVEGARDE VERS GITHUB');
    console.log('=========================');
    
    const commands = [
        'git init',
        'git remote add origin git@github.com:sdoukoure12/mining-614.git',
        'git add .',
        'git commit -m "614 addresses mining project"',
        'git branch -M main',
        'git push -u origin main'
    ];
    
    commands.forEach(cmd => {
        console.log(`\n$ ${cmd}`);
        try {
            const result = require('child_process').execSync(cmd, { encoding: 'utf8' });
            console.log(result);
        } catch (e) {
            console.log('⚠️  Exécution:', e.message);
        }
    });
}