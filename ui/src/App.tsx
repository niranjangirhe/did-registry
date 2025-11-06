import { useCallback, useRef, useState } from 'react'
import './App.css'

// Minimal ABI for DIDRegistry
const DID_REGISTRY_ABI = [
  { type: 'function', name: 'setMapping', stateMutability: 'nonpayable', inputs: [{ name: 'did', type: 'string' }, { name: 'didname', type: 'string' }], outputs: [] },
  { type: 'function', name: 'getAlias', stateMutability: 'view', inputs: [{ name: 'did', type: 'string' }], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'getDid', stateMutability: 'view', inputs: [{ name: 'didname', type: 'string' }], outputs: [{ type: 'string' }] },
  { type: 'function', name: 'checkMapping', stateMutability: 'view', inputs: [{ name: 'didname', type: 'string' }, { name: 'did', type: 'string' }], outputs: [{ name: 'aliasTaken', type: 'bool' }, { name: 'didMapped', type: 'bool' }] },
  { type: 'event', name: 'MappingSet', inputs: [{ name: 'did', type: 'string', indexed: true }, { name: 'didname', type: 'string', indexed: true }] },
]

function App() {
  const [account, setAccount] = useState<string>('')
  const [chain, setChain] = useState<string>('Not connected')
  const [status, setStatus] = useState<string>('')
  const [txInfo, setTxInfo] = useState<string>('')

  const [contractAddress, setContractAddress] = useState<string>('')
  const [did, setDid] = useState<string>('')
  const [aliasName, setAliasName] = useState<string>('')
  const [checkResult, setCheckResult] = useState<string>('')

  const providerRef = useRef<any>(null)
  const signerRef = useRef<any>(null)
  const contractRef = useRef<any>(null)

  const isValidAddress = useCallback(async (addr: string) => {
    try {
      const { ethers } = await import('ethers')
      return ethers.isAddress(addr)
    } catch {
      return false
    }
  }, [])

  const connect = useCallback(async () => {
    try {
      const { ethers } = await import('ethers')
      if (!(window as any).ethereum) {
        alert('MetaMask not found')
        return
      }
      const provider = new ethers.BrowserProvider((window as any).ethereum)
      await provider.send('eth_requestAccounts', [])
      const signer = await provider.getSigner()
      providerRef.current = provider
      signerRef.current = signer

      setAccount(await signer.getAddress())
      const net = await provider.getNetwork()
      setChain(`chainId=${Number(net.chainId)} (hex ${net.chainId.toString(16)})`)
    } catch (e: any) {
      setStatus(e?.message || String(e))
    }
  }, [])

  const loadContract = useCallback(async () => {
    try {
      const addr = contractAddress.trim()
      if (!(await isValidAddress(addr))) {
        setStatus('Invalid contract address')
        return
      }
      const { ethers } = await import('ethers')
      const provider = providerRef.current ?? new ethers.BrowserProvider((window as any).ethereum)
      providerRef.current = provider
      const code = await provider.getCode(addr)
      if (!code || code === '0x') {
        contractRef.current = null
        setStatus('No contract code at this address on current network. Check chain and address.')
        return
      }
      contractRef.current = new ethers.Contract(addr, DID_REGISTRY_ABI as any, provider)
      setStatus(`Loaded contract ${addr}`)
    } catch (e: any) {
      setStatus(e?.message || String(e))
    }
  }, [contractAddress, isValidAddress])

  const checkDidMapped = useCallback(async () => {
    try {
      if (!contractRef.current) {
        setStatus('Load contract first')
        return
      }
      const alias = await contractRef.current.getAlias(did.trim())
      const mapped = alias && alias.length > 0
      setCheckResult(mapped ? `DID is mapped to alias: ${alias}` : 'DID not mapped')
    } catch (e: any) {
      setCheckResult(`Error: ${e?.message || String(e)}`)
    }
  }, [did])

  const checkAliasTaken = useCallback(async () => {
    try {
      if (!contractRef.current) {
        setStatus('Load contract first')
        return
      }
      const res = await contractRef.current.checkMapping(aliasName.trim(), did.trim())
      const [aliasTaken, didMapped] = res as [boolean, boolean]
      setCheckResult(`aliasTaken=${aliasTaken}, didMapped=${didMapped}`)
    } catch (e: any) {
      setCheckResult(`Error: ${e?.message || String(e)}`)
    }
  }, [aliasName, did])

  const getDidForAlias = useCallback(async () => {
    try {
      if (!contractRef.current) {
        setStatus('Load contract first')
        return
      }
      const didForAlias = await contractRef.current.getDid(aliasName.trim())
      const exists = didForAlias && didForAlias.length > 0
      setCheckResult(exists ? `Alias maps to DID: ${didForAlias}` : 'Alias not mapped')
    } catch (e: any) {
      setCheckResult(`Error: ${e?.message || String(e)}`)
    }
  }, [aliasName])

  const setMapping = useCallback(async () => {
    try {
      if (!contractRef.current) {
        setStatus('Load contract first')
        return
      }
      if (!signerRef.current) {
        const { ethers } = await import('ethers')
        signerRef.current = await (providerRef.current as any).getSigner()
      }
      const write = contractRef.current.connect(signerRef.current)
      const tx = await write.setMapping(did.trim(), aliasName.trim())
      setTxInfo(`Submitting tx: ${tx.hash}`)
      const receipt = await tx.wait()
      setTxInfo(`Confirmed in block ${receipt.blockNumber} (tx ${tx.hash})`)
    } catch (e: any) {
      setTxInfo(`Error: ${e?.shortMessage || e?.message || String(e)}`)
    }
  }, [did, aliasName])

  return (
    <div className="card" style={{ maxWidth: 840, margin: '0 auto' }}>
      <h1 style={{ fontSize: 20, margin: '0 0 16px' }}>DIDRegistry On-chain Tester</h1>

      <div className="row" style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '10px 0', flexWrap: 'wrap' }}>
        <button onClick={connect}>Connect Wallet</button>
        <div className="mono muted">{account}</div>
      </div>

      <div className="row" style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '10px 0', flexWrap: 'wrap' }}>
        <label style={{ minWidth: 160, fontWeight: 600 }}>Chain</label>
        <div className="mono muted">{chain}</div>
      </div>

      <div className="hr" style={{ borderTop: '1px solid #ddd', margin: '16px 0' }} />

      <div className="row" style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '10px 0', flexWrap: 'wrap' }}>
        <label htmlFor="address" style={{ minWidth: 160, fontWeight: 600 }}>Contract address</label>
        <input id="address" placeholder="0x..." value={contractAddress} onChange={(e) => setContractAddress(e.target.value)} />
        <button onClick={loadContract}>Load</button>
      </div>
      <div className="hint" style={{ fontSize: 12, color: '#666' }}>Tip: Watr Testnet chainId 92870</div>
      <div className="muted" style={{ color: '#777', fontSize: 13 }}>{status}</div>

      <div className="hr" style={{ borderTop: '1px solid #ddd', margin: '16px 0' }} />

      <div className="stack" style={{ display: 'grid', gap: 8 }}>
        <div className="row" style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '10px 0', flexWrap: 'wrap' }}>
          <label htmlFor="did" style={{ minWidth: 160, fontWeight: 600 }}>DID</label>
          <input id="did" placeholder="did:example:123" value={did} onChange={(e) => setDid(e.target.value)} />
          <button onClick={checkDidMapped}>Check DID mapped?</button>
        </div>
        <div className="row" style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '10px 0', flexWrap: 'wrap' }}>
          <label htmlFor="alias" style={{ minWidth: 160, fontWeight: 600 }}>Alias</label>
          <input id="alias" placeholder="alice" value={aliasName} onChange={(e) => setAliasName(e.target.value)} />
          <button onClick={checkAliasTaken}>Check alias taken?</button>
          <button onClick={getDidForAlias}>Get DID for alias</button>
        </div>
        <div className="mono" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>
          {checkResult}
        </div>
      </div>

      <div className="hr" style={{ borderTop: '1px solid #ddd', margin: '16px 0' }} />

      <div className="row" style={{ display: 'flex', gap: 12, alignItems: 'center', margin: '10px 0', flexWrap: 'wrap' }}>
        <label style={{ minWidth: 160, fontWeight: 600 }}>Set mapping</label>
        <button onClick={setMapping}>Set mapping (did → alias)</button>
      </div>
      <div className="mono" style={{ fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' }}>{txInfo}</div>
    </div>
  )
}

export default App
