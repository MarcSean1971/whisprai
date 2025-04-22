
/**
 * This function provides fallback ICE servers when the dynamic TURN credential
 * generation fails. This is less reliable than the dynamic approach but ensures
 * some level of connectivity as a last resort.
 */
export function getIceServers() {
  console.warn("[WebRTC] Using fallback ICE servers - this may affect connection quality");
  
  const servers = [
    // Public STUN servers (these don't require credentials)
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    
    // Twilio's TURN servers with default credentials that may work for limited time
    // Note: These are fallback credentials and may expire
    {
      urls: [
        'turn:global.turn.twilio.com:3478?transport=udp',
        'turn:global.turn.twilio.com:3478?transport=tcp',
        'turn:global.turn.twilio.com:443?transport=tcp'
      ],
      username: 'f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334a1dffbe739e0a4',
      credential: 'w1WpNFQTkjWFX26gXEXmuPxx/LhKNiC8vci8jQhzBvY='
    }
  ];
  
  // Log the fallback servers for debugging
  console.log("[WebRTC] Fallback servers configured:", {
    stunCount: servers.filter(s => s.urls.toString().includes('stun:')).length,
    turnCount: servers.filter(s => s.urls.toString().includes('turn:')).length
  });
  
  return servers;
}
