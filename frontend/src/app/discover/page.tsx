'use client';

import { useEffect, useState } from 'react';
import { createLibp2p } from 'libp2p';
import { webSockets } from '@libp2p/websockets';
import { yamux } from '@chainsafe/libp2p-yamux';
import { ping } from '@libp2p/ping';
import { multiaddr } from '@multiformats/multiaddr';
import { identify } from '@libp2p/identify';
import { gossipsub } from '@chainsafe/libp2p-gossipsub';
import { noise } from '@chainsafe/libp2p-noise';

export default function DiscoveryPage() {
  const [node, setNode] = useState<any>(null);
  const [pingResult, setPingResult] = useState<string>('');
  const [isConnected, setIsConnected] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);

  const initNode = async () => {
    if (isConnected) return;

    try {
      const node = await createLibp2p({
        transports: [webSockets()],
        streamMuxers: [yamux()],
        connectionEncrypters: [noise()],
        services: {
          ping: ping(),
          identify: identify(),
          pubsub: gossipsub() // Match relay's services
        }
      });

      await node.start();
      setNode(node);
      setIsConnected(true);
      console.log('Node started with ID:', node.peerId.toString());
    } catch (err) {
      console.error('Failed to start node:', err);
      setPingResult('Failed to start node');
    }
  };

  const pingRelay = async () => {
    if (!node) {
      setPingResult('Node not initialized');
      return;
    }

    try {
      setPingResult('Connecting to relay...');
      
      // Connect to relay server
      const relayAddr = '/ip4/127.0.0.1/tcp/15000/ws/p2p/12D3KooWEUqF38ZFi2b3KiA9UqRHNTRX54dt7MQ6991W56gUSoQt';
      const ma = multiaddr(relayAddr);
      
      // First ensure we're connected
      let connection;
      try {
        connection = await node.dial(ma);
        console.log('Connected to relay:', connection.remotePeer.toString());
        setPingResult('Connected to relay, sending ping...');
      } catch (err) {
        console.error('Connection error:', err);
        setPingResult('Failed to connect to relay');
        return;
      }

      // Try to ping multiple times
      let successfulPings = 0;
      let totalLatency = 0;
      const numPings = 3;

      for (let i = 0; i < numPings; i++) {
        try {
          const start = Date.now();
          await node.services.ping.ping(connection.remotePeer);
          const pingLatency = Date.now() - start;
          totalLatency += pingLatency;
          successfulPings++;
          setPingResult(`Ping ${i + 1}/${numPings} successful`);
        } catch (err) {
          console.error(`Ping ${i + 1} failed:`, err);
        }
        // Wait between pings
        if (i < numPings - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }

      if (successfulPings > 0) {
        const avgLatency = Math.round(totalLatency / successfulPings);
        setLatency(avgLatency);
        setPingResult(`Successfully pinged relay! ${successfulPings}/${numPings} pings succeeded. Peer ID: ${connection.remotePeer.toString()}`);
      } else {
        setPingResult('All pings failed');
        setLatency(null);
      }
    } catch (err) {
      console.error('Failed to ping relay:', err);
      setPingResult(`Failed to ping relay: ${err instanceof Error ? err.message : String(err)}`);
      setLatency(null);
    }
  };

  const handleDisconnect = async () => {
    if (node) {
      await node.stop();
      setNode(null);
      setPingResult('');
      setLatency(null);
      setIsConnected(false);
    }
  };

  useEffect(() => {
    return () => {
      if (node) {
        node.stop();
        setIsConnected(false);
      }
    };
  }, [node]);

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Relay Ping Test</h1>
      
      <div className="space-y-4">
        <div>
          <button
            onClick={isConnected ? handleDisconnect : initNode}
            className={`px-4 py-2 rounded font-semibold mr-2 ${
              isConnected 
                ? 'bg-red-500 hover:bg-red-600 text-white' 
                : 'bg-blue-500 hover:bg-blue-600 text-white'
            }`}
          >
            {isConnected ? 'Disconnect' : 'Connect'}
          </button>

          {isConnected && (
            <button
              onClick={pingRelay}
              className="px-4 py-2 rounded font-semibold bg-green-500 hover:bg-green-600 text-white"
            >
              Ping Relay
            </button>
          )}
        </div>

        {pingResult && (
          <div className="bg-gray-100 p-4 rounded">
            <h2 className="text-lg font-semibold mb-2">Ping Result</h2>
            <p>{pingResult}</p>
            {latency !== null && (
              <p className="mt-2">Latency: {latency}ms</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
