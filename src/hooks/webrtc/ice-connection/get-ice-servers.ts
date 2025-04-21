
export function getIceServers() {
  return [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    {
      urls: 'turn:global.turn.twilio.com:3478?transport=udp',
      username: 'f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334a1dffbe739e0a4',
      credential: 'w1WpNFQTkjWFX26gXEXmuPxx/LhKNiC8vci8jQhzBvY='
    },
    {
      urls: 'turn:global.turn.twilio.com:3478?transport=tcp',
      username: 'f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334a1dffbe739e0a4',
      credential: 'w1WpNFQTkjWFX26gXEXmuPxx/LhKNiC8vci8jQhzBvY='
    },
    {
      urls: 'turn:global.turn.twilio.com:443?transport=tcp',
      username: 'f4b4035eaa76f4a55de5f4351567653ee4ff6fa97b50b6b334a1dffbe739e0a4',
      credential: 'w1WpNFQTkjWFX26gXEXmuPxx/LhKNiC8vci8jQhzBvY='
    }
  ];
}
