
export interface VonageSessionOptions {
  conversationId?: string;
  recipientId: string;
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

export interface VonageSessionData {
  sessionId: string;
  token: string;
  apiKey: string;
}

export interface VonageError {
  type: string;
  message: string;
  originalError?: any;
}
