
// Types for the Vonage hooks

export interface VonageError {
  type: 'INITIALIZATION_ERROR' | 'CONNECTION_ERROR' | 'PUBLISH_ERROR' | 'SUBSCRIBE_ERROR' | 'SESSION_ERROR' | 'MEDIA_ACCESS_ERROR';
  message: string;
  originalError?: any;
}

export interface VonageSessionOptions {
  conversationId?: string;
  recipientId: string;
}

export interface VonageSessionData {
  sessionId: string;
  token: string;
  apiKey: string;
}

export interface VonagePublisherOptions {
  publisherRef: React.RefObject<HTMLDivElement>;
  onError: (error: VonageError) => void;
}

export interface VonageSubscriberOptions {
  subscriberRef: React.RefObject<HTMLDivElement>;
}

export interface VonageCallOptions {
  publisherRef: React.RefObject<HTMLDivElement>;
  subscriberRef: React.RefObject<HTMLDivElement>;
  recipientId: string;
  conversationId?: string;
}
