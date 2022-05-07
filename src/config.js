import {keyStores} from 'near-api-js';
import {env} from "./env.js";
import store from "./store/discordInfo";
const key = new keyStores.BrowserLocalStorageKeyStore();

export function getConfig() {
    const network = env;
    switch (network) {
      case 'production':
      case 'mainnet':
        return {
          networkId: 'mainnet',
          keyStore: key,
          nodeUrl: 'https://rpc.mainnet.near.org',
          walletUrl: 'https://wallet.near.org',
          helperUrl: 'https://helper.mainnet.near.org',
          RULE_CONTRACT: 'app.nepbot.near',
          OCT_CONTRACT: 'octopus-registry.near',
          APPLICATION_ID: '958997413803196476'
        }
      case 'development':
      case 'testnet':
        return {
          networkId: 'testnet',
          keyStore: key,
          nodeUrl: 'https://rpc.testnet.near.org',
          walletUrl: 'https://wallet.testnet.near.org',
          helperUrl: 'https://helper.testnet.near.org',
          RULE_CONTRACT: 'app.nepbot.testnet',
          OCT_CONTRACT: 'registry.test_oct.testnet',
          LINKDROP: 'linkdrop6.bhc8521.testnet',
          APPLICATION_ID: '928559137179172874'
        }
      case 'dev-testnet':
        return {
          networkId: 'testnet',
          keyStore: key,
          nodeUrl: 'https://rpc.testnet.near.org',
          walletUrl: 'https://wallet.testnet.near.org',
          helperUrl: 'https://helper.testnet.near.org',
          RULE_CONTRACT: 'app.dev-nepbot.testnet',
          OCT_CONTRACT: 'registry.test_oct.testnet',
          LINKDROP: 'linkdrop6.bhc8521.testnet',
          APPLICATION_ID: '967009211823304744'
        }
      case 'betanet':
        return {
          networkId: 'betanet',
          keyStore: key,
          nodeUrl: 'https://rpc.betanet.near.org',
          walletUrl: 'https://wallet.betanet.near.org',
          helperUrl: 'https://helper.betanet.near.org'
        }
      case 'local':
        return {
          networkId: 'local',
          keyStore: key,
          nodeUrl: 'http://localhost:3030',
          //keyPath: `.near/validator_key.json`,
          walletUrl: 'http://localhost:4000/wallet',
        }
      case 'test':
      case 'ci':
        return {
          networkId: 'shared-test',
          keyStore: key,
          nodeUrl: 'https://rpc.ci-testnet.near.org',
          masterAccount: 'test.near'
        }
      case 'ci-betanet':
        return {
          networkId: 'shared-test-staging',
          keyStore: key,
          nodeUrl: 'https://rpc.ci-betanet.near.org',
          masterAccount: 'test.near'
        }
      default:
        throw Error(`Unconfigured environment '${env}'. Can be configured in src/config.js.`)
    }
}