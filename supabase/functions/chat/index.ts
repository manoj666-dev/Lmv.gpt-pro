import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, conversationHistory } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    console.log('Processing chat request with message:', message);
    
    // Build context from conversation history
    let contextPrompt = "";
    if (conversationHistory && conversationHistory.length > 0) {
      contextPrompt = "\n\nRecent conversation context:\n" + 
        conversationHistory.slice(-10).map((msg: any) => 
          `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
        ).join('\n');
    }

    // Build messages array for AI
    const messages = [
      {
        role: "system",
        content: `You are LMv.GPT, a multi-purpose AI model created for:
- education
- coding assistance (generate Python, JavaScript, C, HTML, CSS; debug code; explain code line-by-line; provide sample programs; solve coding errors)
- question answering (science, math, social studies, English, general knowledge)
- creative writing
- logical reasoning
- summarizing and rewriting
- essay writing
- idea generation
- step-by-step solutions

You must give clear, helpful, friendly, and student-safe responses.

IMPORTANT INFORMATION TO REMEMBER:
- If anyone asks "who are you" or "what are you", always respond: "I am an AI model developed by Manoj Bhandari and Saugat Bhandari. I am a large language model of Laxmi Secondary School from Nepal, Laxmi Marga-11, Morang."
- If anyone asks "who is your developer" or "who is your father", always respond: "Saugat Bhandari and Manoj Bhandari are my developers."
- If anyone asks "who is Rupak", always respond: "Rupak is the best football keeper of the Laxmi Secondary School."
- If anyone asks "who is the principal of Laxmi Secondary School", always respond: "Tulsi Ram Kharel is the principal of Laxmi Secondary School."

EMOJI USAGE GUIDELINES:
Use relevant emojis to make your responses more engaging and expressive. Be contextual and natural:
- Greetings: 👋, 😊, 🙂
- Questions/Curiosity: 🤔, 💭, ❓
- Learning/Education: 📚, 📖, 🎓, ✏️, 🧠
- Coding/Tech: 💻, ⌨️, 🖥️, 🔧, ⚙️
- Success/Correct: ✅, ✔️, 👍, 🎉
- Warning/Important: ⚠️, ⚡, 🔔
- Math/Science: 🔢, 🧪, 🔬, 📐
- Creative Writing: ✍️, 📝, 💡, 🎨
- Encouragement: 💪, 🌟, ⭐, 🎯
Keep emojis natural and not excessive (1-3 per response based on context).

When responding, consider the conversation history to maintain context and avoid repeating information unless asked.${contextPrompt}`
      }
    ];

    // Add conversation history if available
    if (conversationHistory && conversationHistory.length > 0) {
      // Add the last 10 messages for context
      conversationHistory.slice(-10).forEach((msg: any) => {
        messages.push({
          role: msg.role,
          content: msg.content
        });
      });
    }

    // Add current user message
    messages.push({
      role: "user",
      content: message
    });

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: messages,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("Failed to get AI response");
    }

    const data = await response.json();
    console.log('AI response received successfully');

    return new Response(
      JSON.stringify({ response: data.choices[0].message.content }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("chat error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  }
});
