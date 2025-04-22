
import { useCallback, useEffect, useState } from 'react';

interface ConnectionQualityMetrics {
  rtt?: number;
  packetLoss?: number;
  bandwidth?: number;
  candidateType?: string;
  localCandidates: number;
  remoteCandidates: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor' | 'unknown';
}

export function useConnectionQuality(peerRef: React.MutableRefObject<any>) {
  const [metrics, setMetrics] = useState<ConnectionQualityMetrics>({
    localCandidates: 0,
    remoteCandidates: 0,
    quality: 'unknown'
  });

  const updateMetrics = useCallback(async () => {
    if (!peerRef.current?._pc) return;

    try {
      const stats = await peerRef.current._pc.getStats();
      let currentMetrics: Partial<ConnectionQualityMetrics> = {};
      let activeCandidatePair: any = null;

      stats.forEach((report: any) => {
        if (report.type === 'candidate-pair' && report.state === 'succeeded') {
          activeCandidatePair = report;
          currentMetrics.rtt = report.currentRoundTripTime;
        } else if (report.type === 'local-candidate') {
          currentMetrics.localCandidates = (currentMetrics.localCandidates || 0) + 1;
        } else if (report.type === 'remote-candidate') {
          currentMetrics.remoteCandidates = (currentMetrics.remoteCandidates || 0) + 1;
        }
      });

      // Determine connection quality
      if (activeCandidatePair) {
        if (currentMetrics.rtt && currentMetrics.rtt < 0.1) {
          currentMetrics.quality = 'excellent';
        } else if (currentMetrics.rtt && currentMetrics.rtt < 0.3) {
          currentMetrics.quality = 'good';
        } else if (currentMetrics.rtt && currentMetrics.rtt < 0.5) {
          currentMetrics.quality = 'fair';
        } else {
          currentMetrics.quality = 'poor';
        }
      }

      setMetrics(prev => ({
        ...prev,
        ...currentMetrics,
        localCandidates: currentMetrics.localCandidates || prev.localCandidates,
        remoteCandidates: currentMetrics.remoteCandidates || prev.remoteCandidates,
        quality: currentMetrics.quality || prev.quality
      }));
    } catch (error) {
      console.error('[WebRTC] Error getting connection stats:', error);
    }
  }, [peerRef]);

  useEffect(() => {
    const intervalId = setInterval(updateMetrics, 2000);
    return () => clearInterval(intervalId);
  }, [updateMetrics]);

  return metrics;
}
