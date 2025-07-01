
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { GoogleGenerativeAI } from "https://esm.sh/@google/generative-ai@0.1.0";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { 
      headers: corsHeaders,
      status: 204
    });
  }

  try {
    const { headers } = req;
    const upgradeHeader = headers.get("upgrade") || "";
    console.log("Request headers:", headers);
    console.log("Processing request with upgrade header:", upgradeHeader);

    // Check for WebSocket upgrade
    if (upgradeHeader.toLowerCase() !== "websocket") {
      const host = headers.get("host") || "";
      const wsProtocol = host.includes("localhost") ? "ws" : "wss";
      const wsUrl = `${wsProtocol}://${host}/functions/v1/initialize-daily-bot`;
      
      console.log("Returning WebSocket URL:", wsUrl);
      return new Response(
        JSON.stringify({
          success: true,
          websocket_url: wsUrl
        }),
        {
          headers: {
            ...corsHeaders,
            'Content-Type': 'application/json'
          }
        }
      );
    }

    // Initialize Gemini client
    const GEMINI_API_KEY = Deno.env.get('GEMINI_API_KEY');
    if (!GEMINI_API_KEY) {
      throw new Error("Missing GEMINI_API_KEY");
    }

    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    
    // Upgrade to WebSocket
    const { socket, response } = Deno.upgradeWebSocket(req);
    let session: any = null;

    socket.onopen = () => {
      console.log("WebSocket connected");
      socket.send(JSON.stringify({text: "WebSocket connection established"}));
    };

    socket.onmessage = async (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log("Received message:", data);

        if (data.setup) {
          try {
            session = await genAI.startChat({
              model: "gemini-2.5-flash",
              generationConfig: data.setup
            });
            console.log("Gemini API Connected");
            socket.send(JSON.stringify({text: "Gemini API connected"}));
          } catch (e) {
            console.error("Failed to connect to Gemini:", e);
            socket.send(JSON.stringify({error: "Failed to connect to Gemini"}));
            return;
          }
          return;
        }

        if (!session) {
          console.error("No active Gemini session");
          socket.send(JSON.stringify({error: "No active Gemini session"}));
          return;
        }

        if (data.realtime_input && session) {
          const { media_chunks } = data.realtime_input;
          
          for (const chunk of media_chunks) {
            try {
              await session.sendMessage(chunk);
              console.log("Sent chunk:", chunk.mime_type);
            } catch (e) {
              console.error("Error sending chunk:", e);
              socket.send(JSON.stringify({error: `Error sending ${chunk.mime_type} chunk`}));
            }
          }

          try {
            const response = await session.getResponse();
            socket.send(JSON.stringify({text: response.text()}));
          } catch (e) {
            console.error("Error receiving from Gemini:", e);
            socket.send(JSON.stringify({error: "Error receiving from Gemini"}));
          }
        }
      } catch (error) {
        console.error("Error processing message:", error);
        socket.send(JSON.stringify({error: "Failed to process message"}));
      }
    };

    socket.onerror = (error) => {
      console.error("WebSocket error:", error);
    };

    socket.onclose = () => {
      console.log("WebSocket closed");
      if (session) {
        session = null;
      }
    };

    return response;

  } catch (error) {
    console.error('Error in initialize-daily-bot:', error);
    return new Response(
      JSON.stringify({
        error: 'Failed to initialize interview assistant',
        details: error.message
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json'
        }
      }
    );
  }
});
