import { functionBridge } from "@/lib/function-bridge";

export const MeetingTokenManager = () => {
  const createMeetingToken = async () => {
    try {
      const { secret: dailyApiKey } = await functionBridge.getDailyKey();
      
      const response = await fetch('https://api.daily.co/v1/meeting-tokens', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${dailyApiKey}`
        },
        body: JSON.stringify({
          properties: {
            room_name: 'lovable',
            enable_recording: 'cloud',
            start_cloud_recording: true
          }
        })
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Failed to create meeting token: ${errorData}`);
      }

      const data = await response.json();
      return data.token;
    } catch (error) {
      console.error('Error creating meeting token:', error);
      throw error;
    }
  };

  return { createMeetingToken };
};
