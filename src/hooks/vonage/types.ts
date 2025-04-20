
export type VonageErrorType = 
  | 'INITIALIZATION_ERROR'
  | 'CONNECTION_ERROR'
  | 'PUBLISH_ERROR'
  | 'SUBSCRIBE_ERROR'
  | 'MEDIA_ACCESS_ERROR'
  | 'SESSION_ERROR';

export interface VonageError {
  type: VonageErrorType;
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
  publisherElement: string;
  onError: (error: VonageError) => void;
}

export interface VonageSubscriberOptions {
  subscriberElement: string;
}

export interface VonageCallOptions extends VonageSessionOptions {
  publisherElement: string;
  subscriberElement: string;
}
