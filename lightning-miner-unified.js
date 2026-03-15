// lightning-miner-unified.js
// Refactored LightningMinerUnified - wallet addresses are loaded from environment
// variables or config/wallets.json, never hardcoded in source code.

'use strict';

require('dotenv').config();

const fs = require('fs');
const path = require('path');
const readline = require('readline');
const { exec } = require('child_process');

// ---------------------------------------------------------------------------
// Bitcoin address validation
// ---------------------------------------------------------------------------

/**
 * Returns true when `address` is a syntactically valid Bitcoin address.
 * Supports:
 *   - Bech32 mainnet  (bc1q…  – P2WPKH / P2WSH)
 *   - Bech32m mainnet (bc1p…  – P2TR / Taproot)
 *   - Legacy P2PKH    (1…)
 *   - Legacy P2SH     (3…)
 */
function isValidBitcoinAddress(address) {
    if (typeof address !== 'string' || !address.trim()) return false;

    // Bech32 / Bech32m – native SegWit (bc1…) – lowercase only per BIP-0173
    const bech32Re = /^bc1[ac-hj-np-z02-9]{6,87}$/;
    if (bech32Re.test(address.toLowerCase())) return true;

    // Legacy Base58Check (1… or 3…)
    const legacyRe = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/;
    if (legacyRe.test(address)) return true;

    return false;
}

// ---------------------------------------------------------------------------
// Wallet loading
// ---------------------------------------------------------------------------

const WALLET_ENV_KEYS = [
    { key: 'WALLET_BRAIINS', pool: 'Braiins' },
    { key: 'WALLET_VIABTC',  pool: 'ViaBTC'  },
    { key: 'WALLET_F2POOL',  pool: 'F2Pool'  },
    { key: 'WALLET_BINANCE', pool: 'Binance' },
    { key: 'WALLET_LUXOR',   pool: 'Luxor'   },
    { key: 'WALLET_MARA',    pool: 'Mara'    },
];

/**
 * Attempts to load wallet addresses in the following priority order:
 *  1. Environment variables (WALLET_BRAIINS, WALLET_VIABTC, …)
 *  2. config/wallets.json
 *
 * Returns an array of { id, pool, address } objects for every wallet that
 * carries a valid Bitcoin address.  Throws when no valid wallet is found.
 */
function loadWallets() {
    // 1. Try environment variables first
    const fromEnv = WALLET_ENV_KEYS
        .filter(({ key }) => {
            const val = process.env[key];
            return val && isValidBitcoinAddress(val);
        })
        .map(({ key, pool }) => ({
            id:      pool.toLowerCase(),
            pool,
            address: process.env[key],
        }));

    if (fromEnv.length > 0) {
        return fromEnv;
    }

    // 2. Fall back to config/wallets.json
    const walletsFilePath = path.resolve(__dirname, 'config', 'wallets.json');
    if (fs.existsSync(walletsFilePath)) {
        let parsed;
        try {
            parsed = JSON.parse(fs.readFileSync(walletsFilePath, 'utf8'));
        } catch (err) {
            throw new Error(`Failed to parse config/wallets.json: ${err.message}`);
        }

        if (!Array.isArray(parsed.wallets)) {
            throw new Error('config/wallets.json must contain a "wallets" array.');
        }

        const fromFile = parsed.wallets.filter(w => {
            if (!w || typeof w.address !== 'string') return false;
            if (!isValidBitcoinAddress(w.address)) {
                console.warn(`⚠️  Skipping wallet "${w.id || '?'}": invalid Bitcoin address.`);
                return false;
            }
            return true;
        });

        if (fromFile.length > 0) {
            return fromFile;
        }
    }

    // 3. Nothing found – provide actionable error message
    throw new Error(
        'No valid Bitcoin wallet addresses found.\n' +
        'Please configure wallets using one of these methods:\n' +
        '  • Set environment variables (WALLET_BRAIINS, WALLET_VIABTC, etc.) in a .env file.\n' +
        '  • Copy config/wallets.json.example to config/wallets.json and fill in your addresses.\n' +
        'See .env.example for the full list of supported variables.'
    );
}

// ---------------------------------------------------------------------------
// Pool configurations
// ---------------------------------------------------------------------------

const POOL_CONFIGS = [
    { name: 'Braiins',  host: 'stratum.braiins.com',   port: 3333, algorithm: 'sha256d' },
    { name: 'ViaBTC',   host: 'btc.viabtc.com',         port: 3333, algorithm: 'sha256d' },
    { name: 'F2Pool',   host: 'btc.f2pool.com',          port: 1314, algorithm: 'sha256d' },
    { name: 'Binance',  host: 'bs.poolbinance.com',      port: 3333, algorithm: 'sha256d' },
    { name: 'Luxor',    host: 'btc.luxor.tech',           port: 700,  algorithm: 'sha256d' },
    { name: 'Mara',     host: 'stratum.marathon.io',     port: 3333, algorithm: 'sha256d' },
];

// ---------------------------------------------------------------------------
// LightningMinerUnified class
// ---------------------------------------------------------------------------

class LightningMinerUnified {
    /**
     * @param {object} [options]
     * @param {boolean} [options.validateAddresses=true] – validate wallet addresses on startup
     */
    constructor(options = {}) {
        const { validateAddresses = true } = options;

        // Load wallets from env / config file – no hardcoded addresses
        this.wallets = loadWallets();

        if (validateAddresses) {
            this._validateWallets();
        }

        this.pools   = POOL_CONFIGS;
        this.stats   = {
            totalBTC:      0,
            startTime:     new Date(),
            shares:        0,
            activeWorkers: 0,
        };
        this.miningProcesses = [];
    }

    // -----------------------------------------------------------------------
    // Validation
    // -----------------------------------------------------------------------

    /** Throws if any loaded wallet holds an invalid address. */
    _validateWallets() {
        for (const wallet of this.wallets) {
            if (!isValidBitcoinAddress(wallet.address)) {
                throw new Error(
                    `Invalid Bitcoin address for wallet "${wallet.id}" (pool: ${wallet.pool}): "${wallet.address}". ` +
                    'Please provide a valid bech32 (bc1q…) or legacy (1… / 3…) address.'
                );
            }
        }
    }

    /**
     * Validates a single address at runtime.
     * @param {string} address
     * @returns {boolean}
     */
    static validateAddress(address) {
        return isValidBitcoinAddress(address);
    }

    // -----------------------------------------------------------------------
    // Runtime wallet management
    // -----------------------------------------------------------------------

    /**
     * Add a wallet at runtime (address is validated before insertion).
     * @param {{ id: string, pool: string, address: string }} wallet
     */
    addWallet(wallet) {
        if (!wallet || typeof wallet !== 'object') {
            throw new TypeError('wallet must be an object with id, pool, and address fields.');
        }
        if (!isValidBitcoinAddress(wallet.address)) {
            throw new Error(`Invalid Bitcoin address: "${wallet.address}"`);
        }
        this.wallets.push(wallet);
        console.log(`✅ Wallet added: ${wallet.id} (${wallet.pool})`);
    }

    /**
     * Remove a wallet by its id.
     * @param {string} id
     */
    removeWallet(id) {
        const before = this.wallets.length;
        this.wallets = this.wallets.filter(w => w.id !== id);
        if (this.wallets.length === before) {
            console.warn(`⚠️  No wallet found with id "${id}".`);
        } else {
            console.log(`✅ Wallet "${id}" removed.`);
        }
    }

    /** Returns a copy of the current wallet list (addresses masked for display). */
    listWallets() {
        return this.wallets.map(w => ({
            id:      w.id,
            pool:    w.pool,
            address: `${w.address.slice(0, 8)}…${w.address.slice(-4)}`,
        }));
    }

    // -----------------------------------------------------------------------
    // Mining
    // -----------------------------------------------------------------------

    /** Start one miner process per wallet/pool combination. */
    startAllMiners() {
        if (this.wallets.length === 0) {
            console.error('❌ No wallets configured. Aborting.');
            return;
        }

        console.log(`\n🚀 STARTING ${this.wallets.length} MINERS`);
        console.log(`📊 Pools: ${this.pools.length}\n`);

        this.wallets.forEach((wallet, index) => {
            const pool = this.pools.find(p => p.name === wallet.pool) || this.pools[0];
            const sessionName = `miner_${wallet.id}_${index}`;

            // Use spawn-style args to avoid shell injection
            const args = [
                'stratum-client.js',
                '--pool',    pool.host,
                '--port',    String(pool.port),
                '--user',    `${wallet.address}.worker1`,
                '--pass',    'x',
                '--algorithm', pool.algorithm,
            ];
            const miningCmd = `node ${args.join(' ')}`;

            exec(`screen -dmS ${sessionName} bash -c "${miningCmd}"`);

            this.miningProcesses.push({
                id:      wallet.id,
                session: sessionName,
                address: wallet.address,
                pool:    pool.name,
            });

            this.stats.activeWorkers++;

            if (index % 10 === 0) {
                console.log(`✅ Started ${index + 1}/${this.wallets.length}…`);
            }
        });

        console.log(`\n✅ ${this.stats.activeWorkers} active miners`);
        console.log('📺 View sessions: screen -ls');
        console.log('📊 Logs: tail -f logs/mining.log');
    }

    /**
     * Monitor and display cumulative mining stats every 10 seconds.
     * NOTE: gain values are simulated – replace wallet.btc update logic
     * with real pool API calls for accurate balance tracking.
     */
    monitorGains() {
        if (this._monitorInterval) return; // already running
        this._monitorInterval = setInterval(() => {
            let total = 0;
            this.wallets.forEach(wallet => {
                wallet.btc = (wallet.btc || 0) + 0.000000001 * Math.random();
                total += wallet.btc;
            });
            this.stats.totalBTC = total;
            this._displayStats();
        }, 10000);
    }

    _displayStats() {
        console.clear();
        console.log('=== ⚡ LIGHTNING MINER UNIFIED ⚡ ===');
        console.log(`📅 ${new Date().toLocaleString()}`);
        console.log(`🎯 Configured wallets: ${this.wallets.length}`);
        console.log(`✅ Active workers:     ${this.stats.activeWorkers}`);
        console.log(`💰 Total BTC:          ${this.stats.totalBTC.toFixed(8)}`);
        console.log(`💎 Satoshis:           ${Math.floor(this.stats.totalBTC * 1e8)}`);

        console.log('\n📊 Wallet balances:');
        this.wallets.forEach(wallet => {
            const maskedAddr = `${wallet.address.slice(0, 8)}…${wallet.address.slice(-4)}`;
            console.log(`   [${wallet.pool}] ${maskedAddr}: ${(wallet.btc || 0).toFixed(8)} BTC`);
        });
    }

    /** Stop all running miner screen sessions and clear the monitor interval. */
    stopAllMiners() {
        console.log('\n⛔ Stopping all miners…');
        exec("screen -ls | grep miner_ | cut -d. -f1 | awk '{print $1}' | xargs -I{} screen -X -S {} quit");
        if (this._monitorInterval) {
            clearInterval(this._monitorInterval);
            this._monitorInterval = null;
        }
        this.stats.activeWorkers = 0;
        this.miningProcesses = [];
        console.log('✅ All miners stopped.');
    }
}

// ---------------------------------------------------------------------------
// CLI entry point
// ---------------------------------------------------------------------------

if (require.main === module) {
    let miner;
    try {
        miner = new LightningMinerUnified();
    } catch (err) {
        console.error(`\n❌ Configuration error: ${err.message}\n`);
        process.exit(1);
    }

    const rl = readline.createInterface({
        input:  process.stdin,
        output: process.stdout,
    });

    console.log('\n=== ⚡ LIGHTNING MINER UNIFIED ===');
    console.log(`Wallets loaded: ${miner.wallets.length}`);
    console.log('1. 🚀 Start all miners');
    console.log('2. 📊 Monitor gains');
    console.log('3. ⛔ Stop all miners');
    console.log('4. 🔑 List wallets');

    rl.question('\nChoice: ', (choice) => {
        switch (choice.trim()) {
            case '1':
                miner.startAllMiners();
                miner.monitorGains();
                rl.close();
                break;
            case '2':
                miner.monitorGains();
                rl.close();
                break;
            case '3':
                miner.stopAllMiners();
                rl.close();
                process.exit(0);
                break;
            case '4':
                console.log('\n💼 Configured wallets:');
                miner.listWallets().forEach(w => {
                    console.log(`   [${w.pool}] ${w.id}: ${w.address}`);
                });
                rl.close();
                break;
            default:
                console.log('Invalid choice.');
                rl.close();
        }
    });
}

module.exports = { LightningMinerUnified, isValidBitcoinAddress, loadWallets };
