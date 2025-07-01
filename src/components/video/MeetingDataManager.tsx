import { supabase } from "@/integrations/supabase/client";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { toast } from "sonner";

interface MeetingData {
  startTime: Date;
  endTime: Date;
  participants: any[];
  transcription: string;
}

export const MeetingDataManager = (projectId?: string | null) => {
  const generateMeetingSummary = async (transcriptText: string) => {
    try {
      const { data: { secret: geminiApiKey } } = await supabase.functions.invoke('get-gemini-key');
      if (!geminiApiKey) {
        throw new Error('GEMINI_API_KEY not found');
      }

      const genAI = new GoogleGenerativeAI(geminiApiKey);
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

      const prompt = `Please provide a concise summary of this meeting transcript, highlighting:
      - Key discussion points
      - Important decisions made
      - Action items or next steps
      - Overall meeting outcome
      
      Transcript: ${transcriptText}`;

      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error('Error generating meeting summary:', error);
      return null;
    }
  };

  const saveMeetingData = async ({ startTime, endTime, participants, transcription }: MeetingData) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error("User not authenticated");
        return;
      }

      const summary = await generateMeetingSummary(transcription);

      const { data, error } = await supabase
        .from('meetings')
        .insert({
          user_id: user.id,
          start_time: startTime.toISOString(),
          end_time: endTime.toISOString(),
          participants: participants,
          transcription: transcription,
          summary: summary,
          meeting_date: new Date().toISOString().split('T')[0],
          project_id: projectId
        })
        .select()
        .single();

      if (error) throw error;
      
      toast.success("Meeting data saved successfully");
      return data;
    } catch (error) {
      console.error('Error saving meeting data:', error);
      toast.error("Failed to save meeting data");
      throw error;
    }
  };

  return { saveMeetingData };
};