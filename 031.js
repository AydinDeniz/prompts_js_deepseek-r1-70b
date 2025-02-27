// Package.json dependencies
{
  "dependencies": {
    "@ethersjs/contracts": "^5.7.0",
    "@ethersjs/providers": "^5.7.0",
    "@uport/s": "^3.2.0",
    "ethr-did-registry": "^1.6.0",
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "solidity-compiler": "^1.4.1",
    "web3": "^1.7.4"
  }
}

// Smart contract (IdentityContract.sol)
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@uport/schemas/contracts/ERC725.sol";

contract IdentityContract is ERC725, Ownable {
    mapping(address => string) public identities;

    function createIdentity(string memory did) public onlyOwner {
        identities[msg.sender] = did;
    }

    function verifyIdentity(address user) public view returns (string memory) {
        return identities[user];
    }
}

// DID Registry setup (didRegistry.js)
const { EthrDidRegistry } = require('ethr-did-registry');
const { ethers } = require('ethers');

const provider = new ethers.providers.JsonRpcProvider('your_rpc_provider');
const registry = new EthrDidRegistry(provider);

async function createDID() {
  const wallet = new ethers.Wallet('your_private_key', provider);
  const did = await registry.createDid(wallet);
  return did;
}

// Verifiable credentials issuance (credentials.js)
const { VC } = require('@uport/schemas');

async function issueCredential(sub, claim) {
  const issuer = new VC.Issuer({
    issuer: 'did:ethr:0x1234',
    expiration: new Date().getTime() + 3600000
  });
  
  const credential = issuer.createVerificationCredential({
    sub,
    vc: {
      type: ['Credential'],
      claim
    }
  });
  
  return credential;
}

// React frontend (App.js)
import React, { useState } from 'react';
import { ethers } from 'ethers';

function App() {
  const [did, setDID] = useState('');
  const [credentials, setCredentials] = useState({});

  const connectWallet = async () => {
    if (typeof window !== 'undefined' && typeof window.ethereum !== 'undefined') {
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      setDID(account);
    }
  };

  const requestCredential = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(
        'your_contract_address',
        IdentityContract.abi,
        provider.getSigner()
      );
      
      const tx = await contract.createIdentity(did);
      await tx.wait();
      
      const issuedCredential = await issueCredential(did, { type: 'Identity' });
      setCredentials(issuedCredential);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      <h1>Decentralized Identity Management</h1>
      <button onClick={connectWallet}>Connect Wallet</button>
      <button onClick={requestCredential}>Request Credential</button>
      <div>
        <h2>Your Credentials</h2>
        <pre>{JSON.stringify(credentials, null, 2)}</pre>
      </div>
    </div>
  );
}

export default App;

// IdentityContract.abi
[
  {
    "inputs": [],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "string",
        "name": "did",
        "type": "string"
      }
    ],
    "name": "IdentityCreated",
    "type": "event"
  },
  {
    "inputs": [
      {
        "internalType": "string",
        "name": "did",
        "type": "string"
      }
    ],
    "name": "createIdentity",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      }
    ],
    "name": "verifyIdentity",
    "outputs": [
      {
        "internalType": "string",
        "name": "",
        "type": "string"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  }
]