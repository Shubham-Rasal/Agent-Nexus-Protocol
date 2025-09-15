import { createLibp2p } from "libp2p";
import { webSockets } from "@libp2p/websockets";
import { noise } from "@chainsafe/libp2p-noise";
import { yamux } from "@chainsafe/libp2p-yamux";
import { identify } from "@libp2p/identify";
import { circuitRelayServer } from "@libp2p/circuit-relay-v2";
import { gossipsub } from "@chainsafe/libp2p-gossipsub";
import { ping } from "@libp2p/ping";

async function startRelay() {
  const relayNode = await createLibp2p({
    addresses: {
      listen: [
        "/ip4/0.0.0.0/tcp/15000/ws", // WebSocket listener
        "/ip4/0.0.0.0/tcp/15001", // optional, plain TCP for Node agents
      ],
    },
    transports: [
      webSockets(),
      // you can add TCP etc if needed
    ],
     connectionEncrypters: [noise()],
    streamMuxers: [yamux()],
    services: {
      identify: identify(),
      ping: ping(),
      relay: circuitRelayServer({
        // enable hop relay capability
        hop: {
          enabled: true,
          active: true,
        },
      }),
      pubsub: gossipsub(),
    },
  });

  await relayNode.start();
  console.log("Relay node started");
  console.log("Peer ID:", relayNode.peerId.toString());
  console.log("Addresses:");
  relayNode.getMultiaddrs().forEach((addr) => console.log(addr.toString()));

  relayNode.addEventListener("peer:discovery", (evt) => {
    console.log("Discovered %s", evt.detail.id.toString()); // Log discovered peer
  });

  relayNode.addEventListener("peer:connect", (evt) => {
    console.log("Connected to %s", evt.detail.toString()); // Log connected peer
  });
}

startRelay();
