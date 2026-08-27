import React, { useState, useEffect, useRef } from 'react';
import YouTube, { YouTubeEvent, YouTubeProps } from 'react-youtube';
import { db, auth } from '../firebase.ts';
import { doc, getDoc, setDoc, collection, getDocs, query, where } from 'firebase/firestore';

interface AdvancedVideoPlayerProps {
  videoUrl: string;
  courseId: string;
  lessonId: string;
  userEmail?: string;
  isLiveSeminar?: boolean;
  onProgressUpdate?: (percent: number) => void;
  onComplete?: () => void;
}

export default function AdvancedVideoPlayer({
  videoUrl,
  courseId,
  lessonId,
  userEmail,
  isLiveSeminar,
  onProgressUpdate,
  onComplete
}: AdvancedVideoPlayerProps) {
  const [effectiveVideoUrl, setEffectiveVideoUrl] = useState(videoUrl || 'https://youtu.be/tHM6m177Xds?si=nUHVNt3rFs0BxxR-');
  const progressIntervalRef = useRef<any>(null);
  const ytPlayerRef = useRef<any>(null);

  useEffect(() => {
    let active = true;
    const fetchActiveLink = async () => {
      try {
        const q = query(collection(db, "video_links"), where("isActive", "==", true));
        const querySnapshot = await getDocs(q);
        if (!active) return;
        
        let foundUrl = '';
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data && data.url) {
            foundUrl = data.url;
          }
        });
        if (foundUrl) {
          setEffectiveVideoUrl(foundUrl);
        } else {
          setEffectiveVideoUrl(videoUrl || 'https://youtu.be/tHM6m177Xds?si=nUHVNt3rFs0BxxR-');
        }
      } catch (err) {
        console.warn("Could not fetch active video link from Firestore in AdvancedVideoPlayer:", err);
        setEffectiveVideoUrl(videoUrl || 'https://youtu.be/tHM6m177Xds?si=nUHVNt3rFs0BxxR-');
      }
    };
    fetchActiveLink();
    return () => {
      active = false;
    };
  }, [lessonId, videoUrl]);

  const getYouTubeId = (url: string): string | null => {
    if (!url) return null;
    const trimmed = url.trim();
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/;
    const match = trimmed.match(regExp);
    if (match && match[2].length === 11) {
      return match[2];
    }
    return null;
  };

  const ytId = getYouTubeId(effectiveVideoUrl);

  const saveProgressToFirestore = async (cur: number, dur: number, percent: number) => {
    const user = auth.currentUser;
    if (!user) return;

    const progressId = `${user.uid}_${lessonId}`.replace(/[^a-zA-Z0-9_]/g, '_');
    try {
      await setDoc(doc(db, "user_progress", progressId), {
        userId: user.uid,
        courseId: courseId,
        lessonId: lessonId,
        lastTimestamp: cur,
        isCompleted: percent > 95,
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      console.error("Firestore progress sync failed:", error);
    }
  };

  const startPolling = (player: any) => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
    }
    progressIntervalRef.current = setInterval(() => {
      try {
        const cur = player.getCurrentTime();
        const dur = player.getDuration() || 1;
        const percent = (cur / dur) * 100;
        
        localStorage.setItem(
          `video-progress-${courseId}-${lessonId}`,
          JSON.stringify({ currentTime: cur, duration: dur, watchedPercent: percent })
        );
        saveProgressToFirestore(cur, dur, percent);

        if (onProgressUpdate) onProgressUpdate(percent);
        if (percent > 95 && onComplete) onComplete();
      } catch (e) {}
    }, 5000);
  };

  const stopPolling = () => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopPolling();
    };
  }, []);

  const onReady: YouTubeProps['onReady'] = async (event: YouTubeEvent) => {
    ytPlayerRef.current = event.target;
    const dur = event.target.getDuration() || 0;
    
    let restoredTime = 0;
    const user = auth.currentUser;
    if (user) {
      const progressId = `${user.uid}_${lessonId}`.replace(/[^a-zA-Z0-9_]/g, '_');
      try {
        const docSnap = await getDoc(doc(db, "user_progress", progressId));
        if (docSnap.exists()) {
          const data = docSnap.data();
          if (data.lastTimestamp && data.lastTimestamp < dur - 2) {
            restoredTime = data.lastTimestamp;
          }
        }
      } catch (e) {}
    }

    if (restoredTime === 0) {
      const savedProgress = localStorage.getItem(`video-progress-${courseId}-${lessonId}`);
      if (savedProgress) {
        try {
          const data = JSON.parse(savedProgress);
          if (data.currentTime && data.currentTime < dur - 2) {
            restoredTime = data.currentTime;
          }
        } catch (e) {}
      }
    }

    if (restoredTime > 0) {
      event.target.seekTo(restoredTime, true);
    }
  };

  const onStateChange: YouTubeProps['onStateChange'] = (event: YouTubeEvent) => {
    // PlayerState.PLAYING = 1
    // PlayerState.ENDED = 0
    if (event.data === 1) {
      startPolling(event.target);
    } else {
      stopPolling();
    }

    if (event.data === 0) {
      if (onComplete) onComplete();
    }
  };

  const opts: YouTubeProps['opts'] = {
    height: '100%',
    width: '100%',
    playerVars: {
      playsinline: 1,
      controls: 1,
      rel: 0,
      modestbranding: 1
    },
  };

  return (
    <div className="relative aspect-video rounded-2xl overflow-hidden bg-black border border-primary/20 shadow-2xl w-full h-full flex items-center justify-center">
      {ytId ? (
        <YouTube
          videoId={ytId}
          opts={opts}
          onReady={onReady}
          onStateChange={onStateChange}
          className="absolute inset-0 w-full h-full pointer-events-auto"
          iframeClassName="w-full h-full border-0"
        />
      ) : (
        <video
          src={effectiveVideoUrl}
          className="w-full h-full object-cover"
          controls
          playsInline
        />
      )}
    </div>
  );
}
